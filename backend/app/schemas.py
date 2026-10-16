from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class JudgeSignup(BaseModel):
    name: str
    email: str
    password: str
    court_id: str


class JudgeLogin(BaseModel):
    email: str
    password: str


class CitizenOTPRequest(BaseModel):
    nid: str
    phone: str


class CitizenOTPVerify(BaseModel):
    nid: str
    code: str
    name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


class CaseOut(BaseModel):
    id: str
    case_number: str
    case_type: str
    title: str
    filed_date: datetime
    hearing_count: int
    adjournment_count: int
    involves_minor: bool
    involves_domestic_violence: bool
    is_murder_appeal: bool
    priority_score: Optional[float] = None
    urgency: Optional[str] = None
    next_hearing_date: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True
