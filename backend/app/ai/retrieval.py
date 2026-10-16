"""
Legal knowledge retrieval for ODHIKAR.

This is the RAG (Retrieve-Augment-Generate) component. Instead of a
vector database (which needs persistent disk unavailable on free hosting),
we use keyword-based retrieval over our structured legal knowledge base.
This is a valid, reproducible approach that:
  1. Loads Bangladesh laws from a curated JSON file at startup
  2. For any query, scores each law section by keyword overlap
  3. Returns the top-N most relevant sections as context for the LLM

In production, this would be replaced by ChromaDB / pgvector embeddings
for semantic search. The LLM integration (llm_client.py) works identically
regardless of which retrieval method is used.
"""
import json
from pathlib import Path

KNOWLEDGE_PATH = Path(__file__).parent.parent / "knowledge" / "bangladesh_laws.json"

_laws = None


def _load_laws():
    global _laws
    if _laws is None:
        with open(KNOWLEDGE_PATH, "r", encoding="utf-8") as f:
            _laws = json.load(f)
    return _laws


def _tokenize(text: str) -> set[str]:
    """Simple whitespace + lowercase tokenizer."""
    return set(text.lower().split())


def retrieve_relevant_laws(query: str, top_n: int = 5, category: str | None = None) -> list[dict]:
    """
    Given a natural language query (in English or Bangla), returns the
    top-N most relevant law sections from the knowledge base.

    Each result is a dict with keys:
      law_id, law_title, law_title_bn, section, topic, topic_bn, summary, score
    """
    laws = _load_laws()
    query_tokens = _tokenize(query)

    scored = []
    for law in laws:
        if category and law["category"] != category:
            continue
        for sec in law["sections"]:
            # Score by counting how many query tokens appear in the
            # section's topic + summary + Bangla topic
            text = f"{sec['topic']} {sec.get('topic_bn', '')} {sec['summary']} {law['title']}"
            text_tokens = _tokenize(text)
            overlap = len(query_tokens & text_tokens)
            if overlap > 0:
                scored.append({
                    "law_id": law["id"],
                    "law_title": law["title"],
                    "law_title_bn": law["title_bn"],
                    "category": law["category"],
                    "section": sec["section"],
                    "topic": sec["topic"],
                    "topic_bn": sec.get("topic_bn", ""),
                    "summary": sec["summary"],
                    "score": overlap,
                })

    scored.sort(key=lambda x: -x["score"])
    return scored[:top_n]


def get_all_laws_summary() -> list[dict]:
    """Returns a brief list of all laws for reference."""
    laws = _load_laws()
    return [
        {"id": law["id"], "title": law["title"], "title_bn": law["title_bn"], "category": law["category"]}
        for law in laws
    ]
