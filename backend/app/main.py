import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models  # noqa: F401  (import so tables register with Base)
from app.routers import auth, courts, cases, summarizer, bot, mamla_bazi

# Creates tables on first run if they don't exist yet.
# Fine for this project's stage; a real production system would use Alembic migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ODHIKAR API", version="0.1.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(courts.router)
app.include_router(cases.router)
app.include_router(summarizer.router)
app.include_router(bot.router)
app.include_router(mamla_bazi.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "odhikar-api"}


@app.get("/")
def root():
    return {"message": "ODHIKAR API is running. See /docs for the API reference."}
