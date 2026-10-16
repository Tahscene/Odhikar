"""
NagorikBot API.

POST /bot/chat           -> Chat with the legal aid bot
GET  /bot/legal-aid      -> Find nearest legal aid offices
GET  /bot/laws           -> Browse available laws
GET  /bot/health         -> Diagnose AI connectivity
"""
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models
from app.auth_utils import get_current_user
from app.ai.retrieval import retrieve_relevant_laws, get_all_laws_summary

router = APIRouter(prefix="/bot", tags=["nagorik-bot"])


@router.get("/health")
def health_check():
    """Diagnose AI setup. Open http://localhost:8000/bot/health in browser."""
    checks = {}

    # 1. API key check
    key = os.getenv("GEMINI_API_KEY", "")
    if not key:
        checks["api_key"] = "MISSING - set GEMINI_API_KEY in backend/.env"
    else:
        checks["api_key"] = f"SET (starts with {key[:10]}...)"

    # 2. Try actual API call
    try:
        from google import genai
        client = genai.Client(api_key=key)
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Say OK",
        )
        checks["api_call"] = f"SUCCESS - model responded: {(resp.text or '')[:50]}"
    except Exception as e:
        checks["api_call"] = f"FAILED - {type(e).__name__}: {str(e)}"

    # 3. RAG check
    try:
        laws = retrieve_relevant_laws("theft", top_n=1)
        checks["rag"] = f"OK - {len(laws)} laws found"
    except Exception as e:
        checks["rag"] = f"FAILED - {str(e)}"

    all_ok = "SUCCESS" in checks.get("api_call", "") and "SET" in checks.get("api_key", "")
    checks["status"] = "ALL GOOD" if all_ok else "FIX NEEDED"
    return checks


class ChatRequest(BaseModel):
    message: str
    history: list[dict] | None = None


class ChatResponse(BaseModel):
    response: str
    relevant_laws: list[dict] = []


# Legal aid offices by district (sample data)
LEGAL_AID_OFFICES = [
    {"district": "Dhaka", "name": "National Legal Aid Services Organization (NLASO)", "address": "Judges Court Compound, Dhaka", "phone": "02-9562904"},
    {"district": "Dhaka", "name": "Bangladesh Legal Aid and Services Trust (BLAST)", "address": "141/4 Green Road, Dhaka-1205", "phone": "02-9116379"},
    {"district": "Chittagong", "name": "District Legal Aid Office", "address": "Judges Court, Chittagong", "phone": "031-619044"},
    {"district": "Rajshahi", "name": "District Legal Aid Office", "address": "Court Building, Rajshahi", "phone": "0721-775544"},
    {"district": "Khulna", "name": "District Legal Aid Office", "address": "Court Building, Khulna", "phone": "041-723344"},
    {"district": "Sylhet", "name": "District Legal Aid Office", "address": "Court Building, Sylhet", "phone": "0821-715544"},
    {"district": "Rangpur", "name": "District Legal Aid Office", "address": "Court Building, Rangpur", "phone": "0521-63344"},
    {"district": "Mymensingh", "name": "District Legal Aid Office", "address": "Court Building, Mymensingh", "phone": "091-66544"},
    {"district": "Barisal", "name": "District Legal Aid Office", "address": "Court Building, Barisal", "phone": "0431-63344"},
    {"district": "Comilla", "name": "District Legal Aid Office", "address": "Court Building, Comilla", "phone": "081-76544"},
]


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Chat with NagorikBot. Supports conversation history."""
    from app.ai.llm_client import chat_nagorik

    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        result = chat_nagorik(payload.message, payload.history)
        return ChatResponse(
            response=result["response"],
            relevant_laws=result.get("relevant_laws", []),
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Always return a helpful fallback, never a 500 error
        relevant = retrieve_relevant_laws(payload.message, top_n=3)
        fallback = ""
        if relevant:
            fallback = "আপনার প্রশ্ন সম্পর্কিত আইন:\n"
            for r in relevant:
                fallback += f"- {r['law_title_bn']} ধারা {r['section']}: {r['topic_bn']}\n"
            fallback += "\nবিস্তারিত জানতে নিকটতম আইনি সহায়তা কেন্দ্রে যোগাযোগ করুন।"
        else:
            fallback = "দুঃখিত, এই মুহূর্তে AI সেবা পাওয়া যাচ্ছে না। নিকটতম আইনি সহায়তা কেন্দ্রে যোগাযোগ করুন।"
        return ChatResponse(response=fallback, relevant_laws=relevant)


@router.get("/legal-aid")
def find_legal_aid(district: str | None = None):
    """Find legal aid offices, optionally filtered by district."""
    if district:
        offices = [o for o in LEGAL_AID_OFFICES if o["district"].lower() == district.lower()]
    else:
        offices = LEGAL_AID_OFFICES
    return {"offices": offices}


@router.get("/laws")
def browse_laws(category: str | None = None, query: str | None = None):
    """Browse available laws or search for relevant sections."""
    if query:
        return {"results": retrieve_relevant_laws(query, top_n=10, category=category)}
    else:
        return {"laws": get_all_laws_summary()}
