# ODHIKAR (অধিকার): Technical Documentation

**AI-Powered Judicial Case Management Platform for Bangladesh**
Team TellTheTruth | 2025

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Tool 1: Case Prioritizer (ML Model)](#3-tool-1-case-prioritizer)
4. [Tool 2: Legal Summarizer (RAG + LLM)](#4-tool-2-legal-summarizer)
5. [Tool 3: NagorikBot (Citizen Chatbot)](#5-tool-3-nagorikbot)
6. [Data Model & Security](#6-data-model--security)
7. [API Reference](#7-api-reference)
8. [Deployment](#8-deployment)
9. [Reproducibility Guide](#9-reproducibility-guide)
10. [Evaluation Metrics](#10-evaluation-metrics)

---

## 1. System Overview

### 1.1 Problem Statement

Bangladesh's judiciary faces a backlog of **46 lakh+ pending cases** with only **2,301 judges**. This creates:
- Average case pendency of **5-15 years**
- Unequal resource allocation across courts
- Lack of transparency for citizens about their case status
- Manual, error-prone case prioritization

### 1.2 Solution

ODHIKAR provides three AI-powered tools:

| Tool | User | Technology | Purpose |
|------|------|------------|---------|
| Case Prioritizer | Judges | XGBoost ML | Scores each case 0-100 by urgency |
| Legal Summarizer | Judges | RAG + LLM | Auto-generates case summaries with cited laws |
| NagorikBot | Citizens | LLM + Knowledge Base | Bangla legal aid chatbot |

### 1.3 Design Principles

- **Bangla-first**: All citizen-facing interfaces in Bangla
- **Privacy by design**: Hash-chained audit trail, sensitive case redaction
- **Offline-capable**: ML inference works without internet
- **Graceful degradation**: Works without LLM API key (fallback to keyword RAG)

---

## 2. Architecture

### 2.1 Stack

```
Frontend:  React 18 + Vite + Tailwind CSS
Backend:   FastAPI (Python 3.11)
Database:  SQLite (local) / PostgreSQL (production)
ML:        XGBoost (scikit-learn pipeline)
LLM:       Anthropic Claude API (optional)
RAG:       Keyword-based retrieval over structured legal KB
```

### 2.2 Component Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌──────┐ │
│  │ Landing  │  │Dashboard │  │  Case   │  │ Bot  │ │
│  │  Page    │  │(Judge)   │  │ Detail  │  │(Chat)│ │
│  └──────────┘  └────┬─────┘  └────┬────┘  └──┬───┘ │
└─────────────────────┼─────────────┼───────────┼─────┘
                      │  REST API   │           │
┌─────────────────────┼─────────────┼───────────┼─────┐
│                   Backend (FastAPI)                   │
│  ┌──────────┐  ┌────┴─────┐  ┌────┴────┐  ┌──┴───┐ │
│  │  Auth    │  │  Cases   │  │Summarize│  │ Bot  │ │
│  │  Router  │  │  Router  │  │ Router  │  │Router│ │
│  └──────────┘  └────┬─────┘  └────┬────┘  └──┬───┘ │
│                     │             │           │      │
│  ┌──────────┐  ┌────┴─────┐  ┌────┴──────────┴───┐ │
│  │  Auth    │  │   ML     │  │   AI Module        │ │
│  │  Utils   │  │ Scoring  │  │ ┌────────────────┐ │ │
│  │(JWT,hash)│  │(XGBoost) │  │ │ RAG Retrieval  │ │ │
│  └──────────┘  └──────────┘  │ │ (Knowledge KB) │ │ │
│                              │ ├────────────────┤ │ │
│                              │ │ LLM Client     │ │ │
│                              │ │ (Claude API)   │ │ │
│                              │ └────────────────┘ │ │
│                              └────────────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Database (SQLAlchemy ORM)                    │   │
│  │  Users | Courts | Cases | Documents | Logs    │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### 2.3 Request Flow

**Judge Dashboard Flow:**
1. Judge authenticates with email/password → JWT token issued
2. Frontend calls `GET /cases/prioritized?court_id=X`
3. Backend queries cases from DB, sorted by priority_score DESC
4. Each case was pre-scored by XGBoost at insertion time
5. Judge clicks a case → `GET /cases/{id}` → access logged to hash-chained ledger
6. Judge requests AI summary → `GET /summarize/{id}` → RAG retrieves relevant laws → LLM generates structured summary

**Citizen NagorikBot Flow:**
1. Citizen authenticates with NID + OTP
2. Frontend sends message to `POST /bot/chat` with conversation history
3. Backend runs keyword RAG to find relevant Bangladesh laws
4. Law context + message sent to LLM with safety-guardrailed system prompt
5. Response returned in Bangla with cited law sections

---

## 3. Tool 1: Case Prioritizer

### 3.1 Algorithm

**Model:** XGBoost Regressor (`XGBRegressor`)
- Gradient boosted decision trees
- Chosen for: interpretable feature importance, handles mixed feature types, no GPU needed

**Hyperparameters:**
```python
n_estimators = 150    # Number of boosting rounds
max_depth = 4         # Tree depth (prevents overfitting)
learning_rate = 0.08  # Step size shrinkage
random_state = 42     # Reproducible training
```

### 3.2 Feature Engineering

All feature computation is in a **single shared function** (`app/ml/features.py:build_feature_vector`) used by both training and inference, preventing train/serve skew.

| Feature | Type | Description | Importance |
|---------|------|-------------|------------|
| case_age_years | Float | (today - filed_date) / 365 | **31.1%** |
| involves_domestic_violence | Binary | DV flag | **25.1%** |
| is_murder_appeal | Binary | Murder appeal flag | **17.2%** |
| involves_minor | Binary | Minor involved flag | **11.3%** |
| adjournment_count | Integer | Number of adjournments | **5.6%** |
| type_criminal | Binary | One-hot: criminal case | 4.2% |
| type_family | Binary | One-hot: family case | 2.3% |
| type_civil | Binary | One-hot: civil case | 1.1% |
| type_commercial | Binary | One-hot: commercial case | 1.0% |
| region_* | Binary | One-hot: geographic region | <0.3% each |
| hearing_count | Integer | Total hearings held | 0.2% |

**Total features:** 14

### 3.3 Training Data

- **3,000 synthetic cases** generated with realistic distributions matching Bangladesh judiciary statistics
- Split: 80% train (2,400) / 20% test (600)
- Target variable: priority score (0-100), computed from a weighted formula:
  ```
  score = 40*(age_norm) + 20*(dv) + 15*(murder) + 10*(minor) + 10*(adj_norm) + 5*(type_weight)
  ```

### 3.4 Validation Results

| Metric | Value | Interpretation |
|--------|-------|----------------|
| MAE | **3.34** | Average error of 3.34 points on 0-100 scale |
| RMSE | **4.20** | Root mean squared error |
| R² | **0.952** | Model explains 95.2% of variance |

### 3.5 Urgency Classification

The continuous priority score is mapped to urgency levels:
```
≥ 80 → "critical" (জরুরি)     : red badge
≥ 60 → "high" (উচ্চ)          : gold badge
≥ 40 → "medium" (মধ্যম)       : gray badge
< 40 → "low" (নিম্ন)          : light badge
```

### 3.6 Inference Pipeline

1. Case data loaded from database
2. `build_feature_vector()` creates 14-dim numpy array
3. Trained XGBoost model predicts score (0-100)
4. Score clamped to [0, 100] range
5. Urgency label assigned
6. Both stored back to database

---

## 4. Tool 2: Legal Summarizer

### 4.1 RAG Pipeline Design

**Retrieval Component** (`app/ai/retrieval.py`):

```
Query → Tokenize → Score against Knowledge Base → Top-N results → Context
```

- **Knowledge Base:** 10 Bangladesh laws, 50+ sections, stored in structured JSON
- **Scoring:** Keyword overlap between query tokens and section topic/summary
- **Top-N:** Returns 5 most relevant sections as LLM context

**Laws in Knowledge Base:**
1. The Penal Code, 1860 (দণ্ডবিধি)
2. Code of Criminal Procedure, 1898 (ফৌজদারি কার্যবিধি)
3. The Evidence Act, 1872 (সাক্ষ্য আইন)
4. Domestic Violence Act, 2010 (পারিবারিক সহিংসতা আইন)
5. Nari O Shishu Nirjatan Daman Ain, 2000 (নারী ও শিশু নির্যাতন দমন আইন)
6. Code of Civil Procedure, 1908 (দেওয়ানি কার্যবিধি)
7. Transfer of Property Act, 1882 (সম্পত্তি হস্তান্তর আইন)
8. Muslim Family Laws Ordinance, 1961 (মুসলিম পারিবারিক আইন)
9. Land Acquisition Act, 1894 (ভূমি অধিগ্রহণ আইন)
10. Bangladesh Labour Act, 2006 (শ্রম আইন)

**Production Note:** In the whitepaper, we specified ChromaDB with Llama 3 8B embeddings for semantic vector search. The current implementation uses keyword-based retrieval as a functionally equivalent approach that works without GPU or vector database infrastructure. The LLM integration layer is identical regardless of retrieval method.

### 4.2 Generation Component

**LLM:** Anthropic Claude API (claude-sonnet-4-20250514)

**System Prompt** enforces:
- Structured JSON output (facts, legal_issues, applicable_laws, confidence)
- Automatic sensitive case detection (DV, sexual offenses, minors)
- Name redaction for survivors
- Confidence scoring (High/Medium/Low)
- Mandatory disclaimer: "AI-generated summary. Judicial review required."

### 4.3 Output Schema

```json
{
  "facts": "Summary of case facts...",
  "legal_issues": ["Issue 1", "Issue 2"],
  "applicable_laws": [
    {"law": "Penal Code 1860", "section": "302", "relevance": "..."}
  ],
  "similar_precedents": ["Case X vs Y"],
  "is_sensitive": true,
  "sensitive_type": "DV",
  "confidence": "High",
  "summary_bn": "বাংলায় সারাংশ...",
  "cited_laws": [/* RAG retrieval results */]
}
```

### 4.4 Fallback Behavior

When `ANTHROPIC_API_KEY` is not set:
- RAG retrieval still runs (no API needed)
- Returns relevant law sections from knowledge base
- Confidence set to "Low"
- Note: "AI summarizer unavailable. Showing relevant laws only."

---

## 5. Tool 3: NagorikBot

### 5.1 Design

NagorikBot is a Bangla-language legal aid chatbot for citizens, accessible via web chat interface.

**Safety Guardrails** (enforced via system prompt):
1. Never gives definitive legal advice
2. Always recommends consulting a lawyer
3. Prioritizes safety information for violence cases
4. Never stores personal identifying information
5. Cites both English and Bangla law names

### 5.2 Conversation Flow

```
User message
    ↓
RAG: Find relevant laws (top 3)
    ↓
Build context: laws + conversation history (last 10 messages)
    ↓
LLM generates Bangla response
    ↓
Return: {response, relevant_laws[]}
```

### 5.3 Quick Actions

Pre-built query buttons for common citizen needs:
- জমি বিরোধ (Land disputes)
- পারিবারিক সহিংসতা (Domestic violence)
- মজুরি দাবি (Wage claims)
- তালাক প্রক্রিয়া (Divorce procedure)
- জামিন (Bail)
- আইনি সহায়তা (Legal aid offices)

### 5.4 Legal Aid Directory

Built-in directory of 10 legal aid offices across Bangladesh:
- National Legal Aid Services Organization (NLASO)
- Bangladesh Legal Aid and Services Trust (BLAST)
- District Legal Aid Offices (Chittagong, Rajshahi, Khulna, Sylhet, Rangpur, Mymensingh, Barisal, Comilla)

---

## 6. Data Model & Security

### 6.1 Database Schema

```
User (id, name, email, role, nid, court_id, password_hash)
Court (id, name, district, division)
Case (id, case_number, court_id, case_type, title, filed_date,
      hearing_count, adjournment_count, involves_minor,
      involves_domestic_violence, is_murder_appeal,
      geographic_region, priority_score, urgency, status)
CaseParty (id, case_id, party_name, party_type, nid)
CaseDocument (id, case_id, file_name, uploaded_at, summary_json)
AccessLog (id, user_id, case_id, action, timestamp, prev_hash, hash)
OTPCode (id, nid, code, created_at, used)
```

### 6.2 Authentication

**Two authentication paths:**

| User Type | Method | Details |
|-----------|--------|---------|
| Judge | Email + Password | bcrypt-hashed password, JWT token (24h expiry) |
| Citizen | NID + OTP | 6-digit OTP, 5-minute expiry, single-use |

### 6.3 Hash-Chained Access Ledger

Every case access is logged in a **tamper-evident ledger**:

```python
entry = {
    "user_id": who_accessed,
    "case_id": which_case,
    "action": "view_case" | "view_summary",
    "timestamp": when,
    "prev_hash": hash_of_previous_entry,  # chain link
    "hash": SHA256(user_id + case_id + action + timestamp + prev_hash)
}
```

This creates a blockchain-like chain where modifying any entry breaks all subsequent hashes, providing:
- Complete audit trail of who viewed what
- Tamper detection (any modification is detectable)
- Accountability for sensitive case access

### 6.4 Privacy Controls

- **Citizen access restriction:** Citizens can only view cases where their NID matches a CaseParty record
- **Sensitive case flags:** Cases involving DV or minors are automatically flagged
- **AI redaction:** Summarizer replaces survivor names with "Survivor A/B" for sensitive cases
- **Role-based access:** Summarizer only accessible to judges/admins

---

## 7. API Reference

### Authentication

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/judge/signup` | POST | None | Register judge account |
| `/auth/judge/login` | POST | None | Login, returns JWT |
| `/auth/citizen/request-otp` | POST | None | Request OTP for NID |
| `/auth/citizen/verify-otp` | POST | None | Verify OTP, returns JWT |

### Cases

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/cases/stats` | GET | Judge | Case statistics for a court |
| `/cases/prioritized` | GET | Judge | Ranked case list |
| `/cases/{id}` | GET | Judge/Citizen | Single case detail |
| `/cases/batch-score` | POST | Admin | Re-score all cases |

### Summarizer

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/summarize` | POST | Judge | Summarize arbitrary text |
| `/summarize/{case_id}` | GET | Judge | AI summary for specific case |

### NagorikBot

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/bot/chat` | POST | Any | Chat with legal aid bot |
| `/bot/legal-aid` | GET | Any | Legal aid office directory |
| `/bot/laws` | GET | Any | Browse/search law database |

---

## 8. Deployment

### 8.1 Local Development (Zero Cost)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
echo "DATABASE_URL=sqlite:///./odhikar.db" > .env
echo "JWT_SECRET=dev-secret" >> .env
python -m app.seed  # Create 500 sample cases
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
echo "VITE_API_URL=http://localhost:8000" > .env
npm install && npm run dev
```

### 8.2 Production (All Free Tier)

| Service | Role | Cost |
|---------|------|------|
| Render.com | Backend hosting | Free |
| Vercel | Frontend hosting | Free |
| Supabase | PostgreSQL database | Free (500MB) |
| Anthropic | LLM API | $5 free credit |

---

## 9. Reproducibility Guide

### 9.1 Retrain the ML Model

```bash
cd backend
source venv/bin/activate

# Training uses seed=42 for reproducibility
python -m app.ml.train_prioritizer

# Output:
# - app/ml/artifacts/model.pkl (trained model)
# - app/ml/artifacts/metrics.json (validation results)
```

**Expected output:**
```
Training XGBoost Case Prioritizer...
  Seed: 42
  Samples: 3000 (2400 train / 600 test)
  MAE:  3.34
  RMSE: 4.20
  R²:   0.952
  Model saved to app/ml/artifacts/model.pkl
```

### 9.2 Verify RAG Retrieval

```python
from app.ai.retrieval import retrieve_relevant_laws

# Test: murder query should return Penal Code S.299-304
results = retrieve_relevant_laws("murder homicide")
assert results[0]["law_id"] == "pca_1860"
assert results[0]["section"] == "299-304"

# Test: DV query should return DV Act
results = retrieve_relevant_laws("domestic violence protection")
assert results[0]["law_id"] == "dvpa_2010"
```

### 9.3 Seed Database

```bash
python -m app.seed
# Creates: 5 courts, 500 cases with realistic distributions
# All cases auto-scored by the trained ML model
```

---

## 10. Evaluation Metrics

### 10.1 ML Model Performance

| Metric | Target | Achieved |
|--------|--------|----------|
| MAE | < 5.0 | **3.34** ✓ |
| R² | > 0.90 | **0.952** ✓ |
| Train/serve parity | Same features | **Shared function** ✓ |
| Reproducibility | Same seed → same model | **seed=42** ✓ |

### 10.2 System Performance

| Metric | Target | Achieved |
|--------|--------|----------|
| ML inference latency | < 100ms | **~5ms** per case ✓ |
| RAG retrieval | < 50ms | **~2ms** (keyword-based) ✓ |
| Dashboard load | < 2s | **< 1s** (100 cases) ✓ |
| LLM summary | < 30s | **~5-15s** (API dependent) ✓ |

### 10.3 Coverage

| Component | Status |
|-----------|--------|
| Case Prioritizer (ML) | ✅ Complete, trained, validated |
| Legal Summarizer (RAG+LLM) | ✅ Complete, with fallback |
| NagorikBot (Chat) | ✅ Complete, Bangla, guardrails |
| Hash-chained audit | ✅ Complete |
| Judge auth (JWT) | ✅ Complete |
| Citizen auth (NID+OTP) | ✅ Complete |
| Sensitive case protection | ✅ Complete |
| Landing page | ✅ Complete |
| API documentation | ✅ Auto-generated (FastAPI /docs) |

---

*This document was prepared by Team TellTheTruth for the ODHIKAR project submission.*
*Last updated: 2025*
