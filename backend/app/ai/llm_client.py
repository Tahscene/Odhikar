"""
LLM integration for ODHIKAR.

Uses the Google Gemini API as the language model backend. All prompts
include safety guardrails defined in the whitepaper:
  - Never gives definitive legal advice (always suggests consulting a lawyer)
  - Auto-detects and flags sensitive cases (DV, sexual offenses, minors)
  - Responds in plain Bangla for citizen-facing features
  - Cites specific law sections from the RAG knowledge base
  - Includes confidence scoring
"""
import os
import json

from google import genai

from app.ai.retrieval import retrieve_relevant_laws

_client = None
_MODEL = "gemini-2.5-flash"


def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Get a free key from "
                "https://aistudio.google.com/apikey"
            )
        _client = genai.Client(api_key=api_key)
    return _client


SUMMARIZER_SYSTEM = """You are ODHIKAR Legal Summarizer, an AI assistant for Bangladesh's judiciary.

Your role: Given a legal case document, produce a structured summary for judges.

RULES:
1. Summarize in 2-3 paragraphs covering: facts, legal issues and key arguments
2. List applicable Bangladesh laws with specific sections
3. Suggest up to 5 similar precedents if you know them
4. If the case involves domestic violence, sexual offenses, or minors:
   - Add a "SENSITIVE CASE" flag
   - Redact names of survivors (replace with "Survivor A", "Survivor B")
   - Note applicable protection laws
5. Include a confidence score (High/Medium/Low) for your analysis
6. Always note: "This is an AI-generated summary. Judicial review required."

OUTPUT FORMAT (JSON only, no markdown fences, no extra text):
{
  "facts": "...",
  "legal_issues": ["..."],
  "applicable_laws": [{"law": "...", "section": "...", "relevance": "..."}],
  "similar_precedents": ["..."],
  "is_sensitive": true/false,
  "sensitive_type": "DV/sexual/minor/none",
  "confidence": "High/Medium/Low",
  "summary_bn": "... (Bangla summary for citizen view)"
}"""


NAGORIK_SYSTEM = """You are NagorikBot (নাগরিকবট), ODHIKAR's legal aid chatbot for citizens of Bangladesh.

RULES:
1. ALWAYS respond in plain Bangla (বাংলা). Use simple language that anyone can understand.
2. You help citizens with:
   - Legal rights questions (আইনি অধিকার)
   - Court form filling guidance (ফর্ম পূরণ)
   - Case status explanations (মামলার অবস্থা)
   - Finding legal aid offices (আইনি সহায়তা)
3. SAFETY GUARDRAILS:
   - NEVER give definitive legal advice. Always say "আইনজীবীর সাথে পরামর্শ করুন" (consult a lawyer)
   - For complex matters, recommend visiting the nearest legal aid office
   - If someone describes danger or violence, prioritize safety information
   - Never ask for or store personal identifying information
4. When citing laws, mention both the English name and Bangla name
5. Be empathetic and supportive, especially for DV and harassment cases
6. End every response with a helpful next step

CONTEXT: You have access to Bangladesh's key laws including:
- Penal Code 1860 (দণ্ডবিধি)
- Criminal Procedure Code 1898 (ফৌজদারি কার্যবিধি)
- Domestic Violence Act 2010 (পারিবারিক সহিংসতা আইন)
- Nari O Shishu Nirjatan Daman Ain 2000 (নারী ও শিশু নির্যাতন দমন আইন)
- Muslim Family Laws Ordinance 1961 (মুসলিম পারিবারিক আইন)
- Labour Act 2006 (শ্রম আইন)
- Transfer of Property Act 1882 (সম্পত্তি হস্তান্তর আইন)
- Land Acquisition Act 1894 (ভূমি অধিগ্রহণ আইন)"""


def summarize_case(case_text: str, case_type: str = "general") -> dict:
    """
    Takes raw case document text and returns a structured AI summary.
    Uses RAG to find relevant laws before generating.
    """
    # Step 1: Retrieve relevant laws
    relevant_laws = retrieve_relevant_laws(case_text, top_n=5, category=None)
    laws_context = "\n".join(
        f"- {r['law_title']} Section {r['section']}: {r['summary']}"
        for r in relevant_laws
    )

    # Step 2: Generate summary with LLM
    client = _get_client()
    prompt = f"""RELEVANT LAWS FROM KNOWLEDGE BASE:
{laws_context}

CASE TYPE: {case_type}

CASE DOCUMENT TEXT:
{case_text[:8000]}

Please provide a structured JSON summary."""

    response = client.models.generate_content(
        model=_MODEL,
        contents=prompt,
        config={
            "system_instruction": SUMMARIZER_SYSTEM,
            "max_output_tokens": 2000,
        },
    )

    response_text = response.text or ""

    # Try to parse JSON from response
    try:
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start >= 0 and end > start:
            result = json.loads(response_text[start:end])
        else:
            result = {"facts": response_text, "confidence": "Low"}
    except json.JSONDecodeError:
        result = {"facts": response_text, "confidence": "Low"}

    # Add the retrieved laws as citations
    result["cited_laws"] = relevant_laws
    return result


def chat_nagorik(user_message: str, history: list[dict] | None = None) -> dict:
    """
    NagorikBot chat. Takes a user message and optional conversation history,
    returns the bot's response with any relevant law references.

    history format: [{"role": "user"/"assistant", "content": "..."}]
    """
    # Step 1: Retrieve relevant laws for context
    relevant_laws = retrieve_relevant_laws(user_message, top_n=3)
    laws_context = ""
    if relevant_laws:
        laws_context = "\n\nRELEVANT LAWS FOR THIS QUERY:\n" + "\n".join(
            f"- {r['law_title_bn']} ({r['law_title']}) ধারা {r['section']}: {r['summary']}"
            for r in relevant_laws
        )

    # Step 2: Build conversation for Gemini's format
    # Gemini uses role "model" instead of "assistant", and "contents" instead of "messages"
    contents = []
    if history:
        for h in history[-10:]:
            gemini_role = "model" if h["role"] == "assistant" else "user"
            contents.append({"role": gemini_role, "parts": [{"text": h["content"]}]})

    contents.append({"role": "user", "parts": [{"text": user_message + laws_context}]})

    # Step 3: Generate response
    client = _get_client()
    response = client.models.generate_content(
        model=_MODEL,
        contents=contents,
        config={
            "system_instruction": NAGORIK_SYSTEM,
            "max_output_tokens": 1000,
        },
    )

    response_text = response.text or ""

    return {
        "response": response_text,
        "relevant_laws": relevant_laws,
    }
