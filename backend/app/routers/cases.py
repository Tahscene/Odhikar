"""
Case Prioritizer API.

GET  /cases/prioritized   -> ranked list, highest priority first (the judge's main dashboard view)
GET  /cases               -> filterable/paginated list (type, urgency, search)
GET  /cases/{id}          -> single case detail (logs access to the tamper-evident ledger)
POST /cases/batch-score   -> recompute + persist scores for every case in a court
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app import models
from app.auth_utils import require_role, get_current_user, write_access_log
from app.ml.score import predict_priority

router = APIRouter(prefix="/cases", tags=["cases"])


def _case_to_dict(case: models.Case) -> dict:
    return {
        "id": case.id,
        "case_number": case.case_number,
        "court_id": case.court_id,
        "case_type": case.case_type.value,
        "title": case.title,
        "filed_date": case.filed_date.isoformat(),
        "hearing_count": case.hearing_count,
        "adjournment_count": case.adjournment_count,
        "involves_minor": case.involves_minor,
        "involves_domestic_violence": case.involves_domestic_violence,
        "is_murder_appeal": case.is_murder_appeal,
        "geographic_region": case.geographic_region,
        "priority_score": case.priority_score,
        "urgency": case.urgency.value if case.urgency else None,
        "status": case.status,
    }


@router.get("/stats")
def get_stats(
    court_id: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("judge", "admin")),
):
    q = db.query(models.Case).filter(models.Case.status == "pending")
    if court_id:
        q = q.filter(models.Case.court_id == court_id)
    cases = q.all()

    if not cases:
        return {"total": 0, "critical": 0, "high": 0, "medium": 0, "low": 0, "avg_age_years": 0, "oldest_case_years": 0}

    from datetime import datetime
    ages = [(datetime.utcnow() - c.filed_date).days / 365 for c in cases]
    urgencies = [c.urgency.value if c.urgency else "unscored" for c in cases]

    return {
        "total": len(cases),
        "critical": urgencies.count("critical"),
        "high": urgencies.count("high"),
        "medium": urgencies.count("medium"),
        "low": urgencies.count("low"),
        "avg_age_years": round(sum(ages) / len(ages), 1),
        "oldest_case_years": round(max(ages), 1),
    }


@router.get("/prioritized")
def get_prioritized_cases(
    court_id: Optional[str] = None,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("judge", "admin")),
):
    q = db.query(models.Case).filter(models.Case.status == "pending")
    if court_id:
        q = q.filter(models.Case.court_id == court_id)

    cases = q.all()

    # Score any case that doesn't have a cached score yet, then sort by score.
    changed = False
    for case in cases:
        if case.priority_score is None:
            score, urgency = predict_priority(case)
            case.priority_score = score
            case.urgency = models.Urgency(urgency)
            changed = True
    if changed:
        db.commit()

    cases.sort(key=lambda c: c.priority_score or 0, reverse=True)
    ranked = cases[:limit]

    return [
        {"rank": i + 1, **_case_to_dict(c)}
        for i, c in enumerate(ranked)
    ]


@router.get("")
def list_cases(
    court_id: Optional[str] = None,
    case_type: Optional[str] = None,
    urgency: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = Query(20, le=100),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("judge", "admin")),
):
    q = db.query(models.Case)
    if court_id:
        q = q.filter(models.Case.court_id == court_id)
    if case_type:
        q = q.filter(models.Case.case_type == case_type)
    if urgency:
        q = q.filter(models.Case.urgency == urgency)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(models.Case.case_number.ilike(like), models.Case.title.ilike(like)))

    total = q.count()
    cases = q.order_by(models.Case.filed_date.asc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "results": [_case_to_dict(c) for c in cases],
    }


@router.get("/{case_id}")
def get_case_detail(
    case_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Privacy check: citizens may only view cases they are a registered party to.
    if user.role == models.UserRole.citizen:
        is_party = (
            db.query(models.CaseParty)
            .filter(models.CaseParty.case_id == case_id, models.CaseParty.nid == user.nid)
            .first()
        )
        if not is_party:
            raise HTTPException(status_code=403, detail="You are not a registered party to this case")

    write_access_log(db, user.id, case_id, "view_case")

    if case.priority_score is None:
        score, urgency = predict_priority(case)
        case.priority_score = score
        case.urgency = models.Urgency(urgency)
        db.commit()

    return _case_to_dict(case)


@router.post("/batch-score")
def batch_score(
    court_id: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("judge", "admin")),
):
    q = db.query(models.Case).filter(models.Case.status == "pending")
    if court_id:
        q = q.filter(models.Case.court_id == court_id)
    cases = q.all()

    for case in cases:
        score, urgency = predict_priority(case)
        case.priority_score = score
        case.urgency = models.Urgency(urgency)
    db.commit()

    return {"rescored": len(cases)}
