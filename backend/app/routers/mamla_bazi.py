"""
মামলাবাজি (MamlaBazi) - Anonymous Police Accountability Tracker.

Inspired by ghush.site. Two report types:
  1. "refusal"    - Police refused to file FIR/GD
  2. "false_case" - False/fake case filed against the reporter

All reports are anonymous. No user_id, no IP stored.

POST /mamla-bazi/report        -> Public anonymous submit (no auth)
GET  /mamla-bazi/public-stats  -> Basic public numbers (no auth)
GET  /mamla-bazi/thanas        -> Division>District>Thana hierarchy (no auth)
GET  /mamla-bazi/summary       -> Judge-only detailed aggregated view
"""
import json
import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field

from app.database import get_db
from app import models
from app.auth_utils import get_current_user, require_role

router = APIRouter(prefix="/mamla-bazi", tags=["mamla-bazi"])

CASE_CATEGORIES = [
    "চুরি/ডাকাতি",
    "পারিবারিক সহিংসতা",
    "যৌন হয়রানি",
    "জমি বিরোধ",
    "মারামারি/শারীরিক আক্রমণ",
    "প্রতারণা/জালিয়াতি",
    "মজুরি/শ্রম বিরোধ",
    "পার্কিং/সড়ক বিরোধ",
    "ব্যবসায়িক বিরোধ",
    "রাজনৈতিক হয়রানি",
    "অন্যান্য",
]


class ReportRequest(BaseModel):
    report_type: str = Field(..., pattern="^(refusal|false_case)$")
    division: str
    district: str
    thana: str
    case_category: str
    incident_month: str = Field(..., pattern=r"^\d{4}-\d{2}$")
    description: str | None = Field(None, max_length=200)


class ReportResponse(BaseModel):
    status: str
    message: str


# ---- Thana data loader ----
_thana_data = None

def _load_thanas():
    global _thana_data
    if _thana_data is None:
        path = os.path.join(os.path.dirname(__file__), "..", "knowledge", "bangladesh_thanas.json")
        with open(path, "r", encoding="utf-8") as f:
            _thana_data = json.load(f)
    return _thana_data


# ---- Endpoints ----

@router.get("/thanas")
def get_thana_hierarchy():
    """Return full Division > District > Thana hierarchy."""
    return _load_thanas()


@router.get("/categories")
def get_categories():
    """Return available case categories."""
    return {"categories": CASE_CATEGORIES}


@router.post("/report", response_model=ReportResponse)
def submit_report(payload: ReportRequest, db: Session = Depends(get_db)):
    """Submit an anonymous report. No auth required."""
    # Validate against thana data
    thanas = _load_thanas()
    if payload.division not in thanas:
        raise HTTPException(400, "অবৈধ বিভাগ")
    if payload.district not in thanas[payload.division]:
        raise HTTPException(400, "অবৈধ জেলা")
    if payload.thana not in thanas[payload.division][payload.district]:
        raise HTTPException(400, "অবৈধ থানা")
    if payload.case_category not in CASE_CATEGORIES:
        raise HTTPException(400, "অবৈধ অভিযোগের ধরন")

    report = models.MamlaBaziReport(
        report_type=payload.report_type,
        division=payload.division,
        district=payload.district,
        thana=payload.thana,
        case_category=payload.case_category,
        incident_month=payload.incident_month,
        description=payload.description,
    )
    db.add(report)
    db.commit()

    return ReportResponse(
        status="success",
        message="আপনার রিপোর্ট নথিভুক্ত হয়েছে। এটি সম্পূর্ণ anonymous।",
    )


@router.get("/public-stats")
def public_stats(db: Session = Depends(get_db)):
    """Basic public numbers. No auth."""
    total = db.query(func.count(models.MamlaBaziReport.id)).scalar() or 0
    refusals = db.query(func.count(models.MamlaBaziReport.id)).filter(
        models.MamlaBaziReport.report_type == "refusal"
    ).scalar() or 0
    false_cases = db.query(func.count(models.MamlaBaziReport.id)).filter(
        models.MamlaBaziReport.report_type == "false_case"
    ).scalar() or 0

    # Top division
    top_div = db.query(
        models.MamlaBaziReport.division,
        func.count(models.MamlaBaziReport.id).label("cnt")
    ).group_by(models.MamlaBaziReport.division).order_by(
        func.count(models.MamlaBaziReport.id).desc()
    ).first()

    return {
        "total": total,
        "refusals": refusals,
        "false_cases": false_cases,
        "top_division": top_div[0] if top_div else None,
        "top_division_count": top_div[1] if top_div else 0,
    }


@router.get("/summary")
def judge_summary(
    division: str | None = None,
    district: str | None = None,
    report_type: str | None = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Detailed aggregated view. Judge-only."""
    require_role("judge", "admin")(user)

    query = db.query(models.MamlaBaziReport)
    if division:
        query = query.filter(models.MamlaBaziReport.division == division)
    if district:
        query = query.filter(models.MamlaBaziReport.district == district)
    if report_type:
        query = query.filter(models.MamlaBaziReport.report_type == report_type)

    # By thana
    by_thana = query.with_entities(
        models.MamlaBaziReport.thana,
        models.MamlaBaziReport.district,
        models.MamlaBaziReport.division,
        func.count(models.MamlaBaziReport.id).label("count"),
    ).group_by(
        models.MamlaBaziReport.thana,
        models.MamlaBaziReport.district,
        models.MamlaBaziReport.division,
    ).order_by(func.count(models.MamlaBaziReport.id).desc()).limit(20).all()

    # By category
    by_category = query.with_entities(
        models.MamlaBaziReport.case_category,
        func.count(models.MamlaBaziReport.id).label("count"),
    ).group_by(models.MamlaBaziReport.case_category).order_by(
        func.count(models.MamlaBaziReport.id).desc()
    ).all()

    # By month
    by_month = query.with_entities(
        models.MamlaBaziReport.incident_month,
        func.count(models.MamlaBaziReport.id).label("count"),
    ).group_by(models.MamlaBaziReport.incident_month).order_by(
        models.MamlaBaziReport.incident_month
    ).all()

    # By type
    by_type = query.with_entities(
        models.MamlaBaziReport.report_type,
        func.count(models.MamlaBaziReport.id).label("count"),
    ).group_by(models.MamlaBaziReport.report_type).all()

    return {
        "by_thana": [{"thana": r[0], "district": r[1], "division": r[2], "count": r[3]} for r in by_thana],
        "by_category": [{"category": r[0], "count": r[1]} for r in by_category],
        "by_month": [{"month": r[0], "count": r[1]} for r in by_month],
        "by_type": [{"type": r[0], "count": r[1]} for r in by_type],
    }
