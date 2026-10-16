"""
Feature engineering for the Case Prioritizer.

IMPORTANT: this exact function is called both when training the model
(train_prioritizer.py) and when scoring real cases at request time
(score.py). Using one shared function for both prevents "train/serve
skew" -- a common real-world ML bug where the live feature computation
quietly drifts from what the model was trained on.
"""
import numpy as np

CASE_TYPES = ["criminal", "civil", "family", "commercial"]
REGIONS = ["Dhaka", "Mymensingh", "Rangpur", "Rural"]

FEATURE_NAMES = (
    ["case_age_years", "hearing_count", "adjournment_count",
     "involves_minor", "involves_domestic_violence", "is_murder_appeal"]
    + [f"type_{t}" for t in CASE_TYPES]
    + [f"region_{r}" for r in REGIONS]
)


def build_feature_vector(
    *,
    case_age_days: float,
    case_type: str,
    hearing_count: int,
    adjournment_count: int,
    involves_minor: bool,
    involves_domestic_violence: bool,
    is_murder_appeal: bool,
    geographic_region: str | None,
) -> np.ndarray:
    """Turns raw case fields into the numeric vector the model expects."""
    case_age_years = case_age_days / 365.0

    type_onehot = [1.0 if case_type == t else 0.0 for t in CASE_TYPES]
    region_onehot = [1.0 if geographic_region == r else 0.0 for r in REGIONS]

    vector = [
        case_age_years,
        float(hearing_count),
        float(adjournment_count),
        1.0 if involves_minor else 0.0,
        1.0 if involves_domestic_violence else 0.0,
        1.0 if is_murder_appeal else 0.0,
        *type_onehot,
        *region_onehot,
    ]
    return np.array(vector, dtype=np.float32)


def score_to_urgency(score: float) -> str:
    if score >= 80:
        return "critical"
    if score >= 60:
        return "high"
    if score >= 40:
        return "medium"
    return "low"
