"""
Loads the trained Case Prioritizer model once (at import time) and
exposes a simple scoring function for the API to call.
"""
from pathlib import Path
from datetime import datetime

import joblib

from app.ml.features import build_feature_vector, score_to_urgency

MODEL_PATH = Path(__file__).parent / "artifacts" / "model.pkl"

_model = None


def _get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise RuntimeError(
                f"No trained model found at {MODEL_PATH}. Run "
                "`python -m app.ml.train_prioritizer` first."
            )
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_priority(case) -> tuple[float, str]:
    """
    Takes a `Case` ORM object (or anything with the same attributes)
    and returns (priority_score, urgency_category).
    """
    case_age_days = (datetime.utcnow() - case.filed_date).days

    vector = build_feature_vector(
        case_age_days=max(0, case_age_days),
        case_type=case.case_type.value if hasattr(case.case_type, "value") else case.case_type,
        hearing_count=case.hearing_count,
        adjournment_count=case.adjournment_count,
        involves_minor=case.involves_minor,
        involves_domestic_violence=case.involves_domestic_violence,
        is_murder_appeal=case.is_murder_appeal,
        geographic_region=case.geographic_region,
    )
    score = float(_get_model().predict(vector.reshape(1, -1))[0])
    score = max(0.0, min(100.0, score))
    return round(score, 1), score_to_urgency(score)
