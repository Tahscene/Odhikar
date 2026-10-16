"""
Two login paths, matching the whitepaper:
  - Judges: email + password (they're issued accounts by the court admin)
  - Citizens: NID number + OTP (no password to remember, no internet-literacy needed)

NOTE: OTP is MOCKED for this demo. In production this would call the
government NID verification service + an SMS gateway. Here, the "code"
is generated and returned directly in the API response so you can test
without an SMS provider. Swap generate_and_store_otp's return for a real
SMS API call when you have one.
"""
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth_utils import (
    hash_password, verify_password, create_access_token, write_access_log
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/judge/signup", response_model=schemas.TokenResponse)
def judge_signup(payload: schemas.JudgeSignup, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    court = db.query(models.Court).filter(models.Court.id == payload.court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")

    user = models.User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=models.UserRole.judge,
        court_id=payload.court_id,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role.value)
    write_access_log(db, user.id, None, "judge_signup")
    return schemas.TokenResponse(access_token=token, role=user.role.value, name=user.name)


@router.post("/judge/login", response_model=schemas.TokenResponse)
def judge_login(payload: schemas.JudgeLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Wrong email or password")

    token = create_access_token(user.id, user.role.value)
    write_access_log(db, user.id, None, "login")
    return schemas.TokenResponse(access_token=token, role=user.role.value, name=user.name)


@router.post("/citizen/request-otp")
def citizen_request_otp(payload: schemas.CitizenOTPRequest, db: Session = Depends(get_db)):
    code = f"{random.randint(0, 999999):06d}"
    otp = models.OTPCode(
        nid=payload.nid,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    )
    db.add(otp)
    db.commit()

    # DEMO ONLY: real deployment sends `code` via SMS and does NOT return it here.
    return {"message": "OTP sent", "demo_code": code}


@router.post("/citizen/verify-otp", response_model=schemas.TokenResponse)
def citizen_verify_otp(payload: schemas.CitizenOTPVerify, db: Session = Depends(get_db)):
    otp = (
        db.query(models.OTPCode)
        .filter(models.OTPCode.nid == payload.nid, models.OTPCode.code == payload.code)
        .order_by(models.OTPCode.expires_at.desc())
        .first()
    )
    if not otp or otp.used or otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired code")

    otp.used = True

    user = db.query(models.User).filter(models.User.nid == payload.nid).first()
    if not user:
        user = models.User(
            name=payload.name or "Citizen",
            nid=payload.nid,
            role=models.UserRole.citizen,
            is_verified=True,
        )
        db.add(user)

    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role.value)
    write_access_log(db, user.id, None, "citizen_otp_login")
    return schemas.TokenResponse(access_token=token, role=user.role.value, name=user.name)
