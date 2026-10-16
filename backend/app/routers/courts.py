from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models

router = APIRouter(prefix="/courts", tags=["courts"])


@router.get("")
def list_courts(db: Session = Depends(get_db)):
    courts = db.query(models.Court).order_by(models.Court.name).all()
    return [
        {"id": c.id, "name": c.name, "district": c.district, "court_type": c.court_type}
        for c in courts
    ]
