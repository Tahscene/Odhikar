"""
Fills the database with sample courts + synthetic cases so you have
something to look at before real court data is loaded.

Run it AFTER the backend has started at least once (so tables exist):
    cd backend
    python -m app.seed
"""
import random
from datetime import datetime, timedelta

from app.database import SessionLocal, Base, engine
from app import models

Base.metadata.create_all(bind=engine)

COURTS = [
    ("Dhaka Commercial Court-1", "Dhaka", "Commercial Court"),
    ("Dhaka Commercial Court-2", "Dhaka", "Commercial Court"),
    ("Dhaka District Judge Court", "Dhaka", "District Court"),
    ("Mymensingh District Court", "Mymensingh", "District Court"),
    ("Rangpur District Court", "Rangpur", "District Court"),
]

CASE_TITLES = {
    models.CaseType.criminal: [
        "State vs. Karim Uddin (Theft)", "State vs. Jamal Hossain (Assault)",
        "State vs. Abdul Kader (Murder Appeal)", "State vs. Rafiq Islam (Fraud)",
    ],
    models.CaseType.civil: [
        "Rahim vs. Karim (Land Boundary Dispute)", "Selina Begum vs. Md. Hasan (Property Claim)",
        "Abdul Malek vs. Sonali Bank (Loan Dispute)", "Fatema Khatun vs. Dhaka WASA (Damages)",
    ],
    models.CaseType.family: [
        "Rina Akter vs. Md. Salam (Protection Order)", "Nasrin Sultana (Custody Petition)",
        "Shirin Aktar vs. Kamal Hossain (Maintenance Claim)",
    ],
    models.CaseType.commercial: [
        "ABC Textiles Ltd. vs. XYZ Traders (Contract Breach)",
        "Green Delta Corp vs. Padma Suppliers (Payment Dispute)",
    ],
}


def random_date_within_years(max_years_ago: int) -> datetime:
    days_ago = random.randint(1, max_years_ago * 365)
    return datetime.utcnow() - timedelta(days=days_ago)


def run():
    db = SessionLocal()
    try:
        if db.query(models.Court).first():
            print("Courts already seeded, skipping. Delete rows manually if you want to reseed.")
            return

        court_objs = []
        for name, district, court_type in COURTS:
            c = models.Court(name=name, district=district, court_type=court_type)
            db.add(c)
            court_objs.append(c)
        db.commit()
        for c in court_objs:
            db.refresh(c)

        case_types = list(CASE_TITLES.keys())
        counter = 1
        for _ in range(500):
            case_type = random.choice(case_types)
            title = random.choice(CASE_TITLES[case_type])
            filed = random_date_within_years(15)
            case_age_years = (datetime.utcnow() - filed).days / 365

            is_murder_appeal = case_type == models.CaseType.criminal and "Murder" in title
            involves_dv = case_type == models.CaseType.family and random.random() < 0.4
            involves_minor = random.random() < 0.1

            case = models.Case(
                case_number=f"{case_type.value[:3].upper()}-{2026 - int(case_age_years)}-{counter:04d}",
                court_id=random.choice(court_objs).id,
                case_type=case_type,
                title=title,
                filed_date=filed,
                hearing_count=random.randint(0, 15),
                adjournment_count=random.randint(0, 10),
                involves_minor=involves_minor,
                involves_domestic_violence=involves_dv,
                is_murder_appeal=is_murder_appeal,
                geographic_region=random.choice(["Dhaka", "Mymensingh", "Rangpur", "Rural"]),
                status="pending",
            )
            db.add(case)
            counter += 1

        db.commit()
        print(f"Seeded {len(COURTS)} courts and 500 synthetic cases.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
