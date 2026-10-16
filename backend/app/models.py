"""
Core database tables for ODHIKAR.
More tables (legal_chunks for RAG) get added on Day 4.
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    judge = "judge"
    citizen = "citizen"
    admin = "admin"
    ngo = "ngo"


class CaseType(str, enum.Enum):
    criminal = "criminal"
    civil = "civil"
    family = "family"
    commercial = "commercial"


class Urgency(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class Court(Base):
    __tablename__ = "courts"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    court_type = Column(String, nullable=False)  # e.g. "Commercial Court", "District Court"
    created_at = Column(DateTime, default=datetime.utcnow)

    cases = relationship("Case", back_populates="court")


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    # NID = National ID number (Bangladesh). Used for citizen identity verification.
    nid = Column(String, unique=True, nullable=True, index=True)
    phone = Column(String, unique=True, nullable=True, index=True)
    email = Column(String, unique=True, nullable=True, index=True)
    password_hash = Column(String, nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.citizen)
    court_id = Column(UUID(as_uuid=False), ForeignKey("courts.id"), nullable=True)  # for judges
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class OTPCode(Base):
    """Stores one-time-passcodes for NID verification (mocked for the demo)."""
    __tablename__ = "otp_codes"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    nid = Column(String, nullable=False, index=True)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)


class Case(Base):
    __tablename__ = "cases"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    case_number = Column(String, unique=True, nullable=False, index=True)
    court_id = Column(UUID(as_uuid=False), ForeignKey("courts.id"), nullable=False)
    case_type = Column(Enum(CaseType), nullable=False)
    title = Column(String, nullable=False)
    filed_date = Column(DateTime, nullable=False)
    hearing_count = Column(Integer, default=0)
    adjournment_count = Column(Integer, default=0)
    # Social urgency signals used by the priority model
    involves_minor = Column(Boolean, default=False)
    involves_domestic_violence = Column(Boolean, default=False)
    is_murder_appeal = Column(Boolean, default=False)
    geographic_region = Column(String, nullable=True)

    priority_score = Column(Float, nullable=True)      # 0-100, set by the ML model
    urgency = Column(Enum(Urgency), nullable=True)

    next_hearing_date = Column(DateTime, nullable=True)
    status = Column(String, default="pending")  # pending, disposed, stayed

    created_at = Column(DateTime, default=datetime.utcnow)

    court = relationship("Court", back_populates="cases")
    documents = relationship("CaseDocument", back_populates="case")
    parties = relationship("CaseParty", back_populates="case")


class CaseParty(Base):
    """Links a citizen (by NID) to a case they are a party to. Powers privacy checks."""
    __tablename__ = "case_parties"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    case_id = Column(UUID(as_uuid=False), ForeignKey("cases.id"), nullable=False)
    nid = Column(String, nullable=False, index=True)
    party_role = Column(String, nullable=True)  # plaintiff, defendant, witness

    case = relationship("Case", back_populates="parties")


class CaseDocument(Base):
    __tablename__ = "case_documents"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    case_id = Column(UUID(as_uuid=False), ForeignKey("cases.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=True)  # Supabase storage URL
    extracted_text = Column(Text, nullable=True)
    summary_json = Column(Text, nullable=True)  # structured AI summary, stored as JSON text
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="documents")


class AccessLog(Base):
    """
    Tamper-evident access ledger. Each row's `record_hash` is a hash of
    (this row's data + previous row's hash), so any edit or deletion
    breaks the chain and is detectable.
    """
    __tablename__ = "access_logs"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    case_id = Column(UUID(as_uuid=False), ForeignKey("cases.id"), nullable=True)
    action = Column(String, nullable=False)  # "view_case", "view_summary", "login", etc.
    timestamp = Column(DateTime, default=datetime.utcnow)
    prev_hash = Column(String, nullable=True)
    record_hash = Column(String, nullable=False)


class MamlaBaziReport(Base):
    """Anonymous report: police refused FIR/GD or false case filed."""
    __tablename__ = "mamla_bazi_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String, nullable=False)  # "refusal" or "false_case"
    division = Column(String, nullable=False)
    district = Column(String, nullable=False)
    thana = Column(String, nullable=False)
    case_category = Column(String, nullable=False)
    incident_month = Column(String, nullable=False)  # YYYY-MM format
    description = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
