# অধিকার ODHIKAR

**AI-Powered Judicial Case Management Platform for Bangladesh**

> সবার জন্য আইন, সবার জন্য ন্যায়
> *Justice for all, Law for all*

[![Team](https://img.shields.io/badge/Team-TellTheTruth-006A4E)]()
[![Python](https://img.shields.io/badge/Python-3.11+-blue)]()
[![React](https://img.shields.io/badge/React-18-61DAFB)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()

---

## Problem

Bangladesh has **46 lakh+ pending cases** and only **2,301 judges**. Cases take 5-15 years to resolve. Citizens lack transparency about their case status. Manual prioritization leads to inefficient resource allocation.

## Solution

ODHIKAR provides **3 AI tools** for Bangladesh's judiciary:

### 1. ⚖️ Case Prioritizer (কেস অগ্রাধিকার নির্ণয়)
- XGBoost ML model scores each case 0-100
- Trained on 3,000 cases, R² = 0.952, MAE = 3.34
- Top features: case age (31%), DV flag (25%), murder appeal (17%)
- Judges see cases ranked by urgency: critical → high → medium → low

### 2. 📋 Legal Summarizer (আইনি সারাংশকারী)
- RAG pipeline retrieves relevant Bangladesh laws from 10-law knowledge base
- LLM generates structured JSON summaries with cited sections
- Auto-detects sensitive cases (DV, minors) and redacts survivor names
- Includes confidence scoring and mandatory disclaimer

### 3. 🤖 NagorikBot (নাগরিকবট)
- Bangla-language legal aid chatbot for citizens
- Safety guardrails: never gives definitive legal advice
- Quick actions: land disputes, DV, wages, divorce, bail, legal aid
- Built-in directory of 10 legal aid offices across Bangladesh

## Security Features

- **Hash-chained access ledger**: tamper-evident audit trail (blockchain-like)
- **Dual authentication**: JWT for judges, NID+OTP for citizens
- **Sensitive case protection**: auto-flagging and name redaction
- **Role-based access**: citizens can only view their own cases

---

## Quick Start (Zero Cost, No Accounts Needed)

### Prerequisites
- [Python 3.11+](https://python.org/downloads)
- [Node.js LTS](https://nodejs.org)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
echo "DATABASE_URL=sqlite:///./odhikar.db" > .env
echo "JWT_SECRET=dev-secret-change-in-production" >> .env
echo "CORS_ORIGINS=http://localhost:5173" >> .env
# Optional: echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env

python -m app.seed      # Seed 500 sample cases
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
echo "VITE_API_URL=http://localhost:8000" > .env
npm install
npm run dev
```

Open **http://localhost:5173** → Landing Page → Login as judge.

For detailed setup instructions (including Bangla guide), see [`RUN_LOCALLY.md`](RUN_LOCALLY.md).

---

## Project Structure

```
odhikar/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models.py            # DB models (User, Case, Court, ...)
│   │   ├── schemas.py           # Pydantic validation
│   │   ├── auth_utils.py        # JWT, bcrypt, hash-chained ledger
│   │   ├── seed.py              # Generate 500 sample cases
│   │   ├── routers/
│   │   │   ├── auth.py          # Judge login, Citizen OTP
│   │   │   ├── courts.py        # Court listing
│   │   │   ├── cases.py         # Prioritized cases, stats
│   │   │   ├── summarizer.py    # AI summary endpoints
│   │   │   └── bot.py           # NagorikBot chat + legal aid
│   │   ├── ml/
│   │   │   ├── features.py      # Shared feature engineering
│   │   │   ├── train_prioritizer.py  # XGBoost training
│   │   │   ├── score.py         # Inference module
│   │   │   └── artifacts/       # Trained model + metrics
│   │   ├── ai/
│   │   │   ├── retrieval.py     # RAG keyword retrieval
│   │   │   └── llm_client.py    # Claude API integration
│   │   └── knowledge/
│   │       └── bangladesh_laws.json  # Legal knowledge base
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Routes
│   │   ├── pages/
│   │   │   ├── Landing.jsx      # Public landing page
│   │   │   ├── Login.jsx        # Judge/Citizen login
│   │   │   ├── Dashboard.jsx    # Case Prioritizer view
│   │   │   ├── CaseDetail.jsx   # Case + AI Summary
│   │   │   └── Bot.jsx          # NagorikBot chat
│   │   └── lib/
│   │       └── api.js           # Axios + JWT interceptor
│   ├── public/
│   │   ├── logo.jpg             # Lady Justice logo
│   │   └── bg-court.jpg         # Supreme Court background
│   └── tailwind.config.js       # BD government colors
├── TECHNICAL_DOCUMENTATION.md   # Full technical doc
├── RUN_LOCALLY.md               # Bangla setup guide
├── SETUP.md                     # Cloud deployment guide
└── README.md                    # This file
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite | Fast builds, modern DX |
| Styling | Tailwind CSS | BD government theme (green/red/gold) |
| Backend | FastAPI | Async Python, auto-generated API docs |
| Database | SQLAlchemy + SQLite/PostgreSQL | ORM, easy local/prod switch |
| ML | XGBoost | Interpretable, lightweight, no GPU needed |
| LLM | Anthropic Claude API | Strong Bangla support, structured output |
| RAG | Keyword retrieval | Zero infrastructure, works offline |
| Auth | JWT + bcrypt | Stateless, secure |

---

## Documentation

- [`TECHNICAL_DOCUMENTATION.md`](TECHNICAL_DOCUMENTATION.md): architecture, ML model details, RAG pipeline, security, API reference
- [`RUN_LOCALLY.md`](RUN_LOCALLY.md): step-by-step local setup guide (Bangla)
- [`SETUP.md`](SETUP.md): cloud deployment (Render, Vercel, Supabase)
- `http://localhost:8000/docs`: interactive API documentation (when running)

---

## Team TellTheTruth

Built for the AI for Justice hackathon, addressing Bangladesh's 46 lakh+ case backlog with practical, deployable AI tools.

---

*গণপ্রজাতন্ত্রী বাংলাদেশ সরকার, বিচার বিভাগ*
