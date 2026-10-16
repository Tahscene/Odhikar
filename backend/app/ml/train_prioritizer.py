"""
Trains the Case Prioritizer model.

WHY A HYBRID APPROACH:
There is no historical "correct priority" label sitting in any real
database -- priority is a judgment call, not an observed outcome. So
we encode domain-expert priority rules (case age matters, murder
appeals and DV cases are urgent, repeated adjournments signal a case
stuck in limbo) as a labeling function, generate a large synthetic
dataset from it with realistic noise, then train XGBoost to LEARN
that function from the raw case features.

This is a standard, defensible pattern for bootstrapping a scoring
model before real outcome data exists: XGBoost recovers the expert
rule's structure (see feature_importance in metrics.json) while adding
capacity to model feature interactions a hand-written formula misses.
Once real judge feedback / case-resolution data is available in
production, the same pipeline retrains on that instead -- only this
file changes, nothing downstream (score.py, the API) needs to.

This script is fully self-contained: no database connection needed.
Run it directly:
    cd backend
    python -m app.ml.train_prioritizer
"""
import json
import random
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
import joblib

from app.ml.features import build_feature_vector, FEATURE_NAMES, CASE_TYPES, REGIONS

SEED = 42
N_SAMPLES = 3000
ARTIFACTS_DIR = Path(__file__).parent / "artifacts"

random.seed(SEED)
np.random.seed(SEED)


def expert_priority_label(
    case_age_days, case_type, hearing_count, adjournment_count,
    involves_minor, involves_domestic_violence, is_murder_appeal,
) -> float:
    """
    Encodes the priority logic described in the whitepaper (Section 1.3 /
    4.4): case age, type, social urgency flags and stalling
    (adjournments) all push a case up the queue. Returns a 0-100 "expert"
    priority score which becomes the training label (before adding noise).
    """
    age_years = case_age_days / 365.0
    score = min(45.0, age_years * 4.5)  # age alone caps at 45 pts (~10yr case)

    if is_murder_appeal:
        score += 25
    if involves_domestic_violence:
        score += 20
    if involves_minor:
        score += 15

    score += min(15.0, adjournment_count * 1.5)  # repeatedly stalled cases

    if case_type == "criminal":
        score += 5
    elif case_type == "family":
        score += 3

    return max(0.0, min(100.0, score))


def generate_synthetic_dataset(n: int):
    X, y = [], []
    for _ in range(n):
        case_age_days = random.randint(1, 15 * 365)
        case_type = random.choice(CASE_TYPES)
        hearing_count = random.randint(0, 20)
        adjournment_count = random.randint(0, 15)
        involves_minor = random.random() < 0.12
        involves_dv = (
            (case_type == "family" and random.random() < 0.4)
            or random.random() < 0.03
        )
        is_murder_appeal = case_type == "criminal" and random.random() < 0.15
        geographic_region = random.choice(REGIONS)

        label = expert_priority_label(
            case_age_days, case_type, hearing_count, adjournment_count,
            involves_minor, involves_dv, is_murder_appeal,
        )
        # Realistic noise: real priority judgments aren't a perfectly clean
        # formula. This also stops the model from trivially memorizing
        # the rule and forces it to learn the general pattern.
        label = max(0.0, min(100.0, label + np.random.normal(0, 4.0)))

        vec = build_feature_vector(
            case_age_days=case_age_days, case_type=case_type,
            hearing_count=hearing_count, adjournment_count=adjournment_count,
            involves_minor=involves_minor, involves_domestic_violence=involves_dv,
            is_murder_appeal=is_murder_appeal, geographic_region=geographic_region,
        )
        X.append(vec)
        y.append(label)
    return np.array(X), np.array(y)


def train():
    print(f"Generating {N_SAMPLES} synthetic training samples (seed={SEED})...")
    X, y = generate_synthetic_dataset(N_SAMPLES)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=SEED
    )
    print(f"Train: {len(X_train)} samples | Test (held-out): {len(X_test)} samples")

    # --- Evaluate on the held-out split first, so reported metrics are honest ---
    eval_model = XGBRegressor(
        n_estimators=150, max_depth=4, learning_rate=0.08,
        subsample=0.9, colsample_bytree=0.9, random_state=SEED,
    )
    eval_model.fit(X_train, y_train)
    preds = eval_model.predict(X_test)

    mae = float(mean_absolute_error(y_test, preds))
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    r2 = float(r2_score(y_test, preds))

    print(f"\nValidation metrics (held-out test set):")
    print(f"  MAE  = {mae:.2f}  (average error in priority points, 0-100 scale)")
    print(f"  RMSE = {rmse:.2f}")
    print(f"  R^2  = {r2:.4f}  (1.0 = perfect)")

    # --- Retrain the final deployed model on ALL data (standard practice: ---
    # --- validate on a held-out split, then use every available sample   ---
    # --- for the model that actually ships).                             ---
    final_model = XGBRegressor(
        n_estimators=150, max_depth=4, learning_rate=0.08,
        subsample=0.9, colsample_bytree=0.9, random_state=SEED,
    )
    final_model.fit(X, y)

    importance = dict(zip(FEATURE_NAMES, [float(v) for v in final_model.feature_importances_]))
    importance = dict(sorted(importance.items(), key=lambda kv: -kv[1]))

    print("\nFeature importance (top 5):")
    for name, val in list(importance.items())[:5]:
        print(f"  {name:32s} {val:.3f}")

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    model_path = ARTIFACTS_DIR / "model.pkl"
    metrics_path = ARTIFACTS_DIR / "metrics.json"

    joblib.dump(final_model, model_path)

    metrics = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "random_seed": SEED,
        "n_samples": N_SAMPLES,
        "n_train": len(X_train),
        "n_test": len(X_test),
        "validation": {"mae": mae, "rmse": rmse, "r2": r2},
        "feature_importance": importance,
        "feature_names": FEATURE_NAMES,
        "model": "XGBRegressor(n_estimators=150, max_depth=4, learning_rate=0.08)",
    }
    metrics_path.write_text(json.dumps(metrics, indent=2))

    print(f"\nSaved model -> {model_path}")
    print(f"Saved metrics -> {metrics_path}")


if __name__ == "__main__":
    train()
