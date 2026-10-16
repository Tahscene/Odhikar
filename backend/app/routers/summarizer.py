"""
Legal Summarizer API.

POST /summarize          -> Summarize case text with AI
POST /summarize/upload   -> Upload a case file and summarize
GET  /summarize/{case_id} -> Get or generate summary for a specific case
"""
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models
from app.auth_utils import get_current_user, require_role, write_access_log

router = APIRouter(prefix="/summarize", tags=["summarize"])


class SummarizeRequest(BaseModel):
    text: str
    case_type: str = "general"


@router.post("")
def summarize_text(
    payload: SummarizeRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("judge", "admin")),
):
    """Summarize arbitrary case text using AI + RAG."""
    from app.ai.llm_client import summarize_case
    try:
        result = summarize_case(payload.text, payload.case_type)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@router.get("/{case_id}")
def get_case_summary(
    case_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("judge", "admin")),
):
    """Get or generate AI summary for a specific case."""
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    write_access_log(db, user.id, case_id, "view_summary")

    # Check if any documents have existing summaries
    docs = db.query(models.CaseDocument).filter(
        models.CaseDocument.case_id == case_id
    ).all()

    summaries = []
    for doc in docs:
        if doc.summary_json:
            try:
                summaries.append({
                    "document": doc.file_name,
                    "summary": json.loads(doc.summary_json),
                })
            except json.JSONDecodeError:
                summaries.append({
                    "document": doc.file_name,
                    "summary": {"facts": doc.summary_json},
                })

    if not summaries and not docs:
        # No documents uploaded yet, generate a basic summary from case metadata
        from app.ai.llm_client import summarize_case
        from app.ai.retrieval import retrieve_relevant_laws

        case_text = f"""
Case Number: {case.case_number}
Type: {case.case_type.value if hasattr(case.case_type, 'value') else case.case_type}
Title: {case.title}
Filed: {case.filed_date}
Hearings: {case.hearing_count}
Adjournments: {case.adjournment_count}
Involves Minor: {case.involves_minor}
Involves DV: {case.involves_domestic_violence}
Murder Appeal: {case.is_murder_appeal}
"""
        try:
            result = summarize_case(case_text, case.case_type.value if hasattr(case.case_type, 'value') else str(case.case_type))
            summaries.append({"document": "Case Metadata", "summary": result})
        except Exception:
            # If AI is unavailable, return basic info with relevant laws
            relevant = retrieve_relevant_laws(case.title, top_n=3)
            summaries.append({
                "document": "Case Metadata",
                "summary": {
                    "facts": f"Case {case.case_number}: {case.title}",
                    "applicable_laws": [
                        {"law": r["law_title"], "section": r["section"], "relevance": r["summary"]}
                        for r in relevant
                    ],
                    "confidence": "Low",
                    "note": "AI summarizer unavailable. Showing relevant laws only.",
                },
            })

    return {
        "case_id": case_id,
        "case_number": case.case_number,
        "is_sensitive": case.involves_domestic_violence or case.involves_minor,
        "summaries": summaries,
    }
