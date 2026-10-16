import os
import hashlib
import json
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app import models

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 12

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    payload = decode_access_token(creds.credentials)
    user = db.query(models.User).filter(models.User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(*allowed_roles: str):
    def checker(user: models.User = Depends(get_current_user)) -> models.User:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Not allowed for this role")
        return user
    return checker


def write_access_log(db: Session, user_id: str | None, case_id: str | None, action: str):
    """
    Appends one row to the tamper-evident access ledger.
    Each row's hash covers its own data + the previous row's hash,
    so altering any past row breaks every hash after it.
    """
    last = db.query(models.AccessLog).order_by(models.AccessLog.timestamp.desc()).first()
    prev_hash = last.record_hash if last else "genesis"
    timestamp = datetime.utcnow()

    payload = json.dumps({
        "user_id": user_id, "case_id": case_id, "action": action,
        "timestamp": timestamp.isoformat(), "prev_hash": prev_hash,
    }, sort_keys=True)
    record_hash = hashlib.sha256(payload.encode()).hexdigest()

    entry = models.AccessLog(
        user_id=user_id, case_id=case_id, action=action,
        timestamp=timestamp, prev_hash=prev_hash, record_hash=record_hash,
    )
    db.add(entry)
    db.commit()
