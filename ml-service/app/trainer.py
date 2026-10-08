"""Training for the recommendation-success model.

Predicts P(the student benefits from / completes a recommendation) from the feature vector the
API stored when the recommendation was shown. Labels come only from what students actually did
(resolved by the API from platform records). With too little data it refuses to train and says so
— it never fabricates rows, metrics or a model file.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score, brier_score_loss, precision_score, recall_score, roc_auc_score

MODEL_NAME = "recommendation-success"
MIN_ROWS = 200
MIN_PER_CLASS = 30
TEST_SHARE = 0.2


def make_model():
    """Gradient-boosted trees: XGBoost when its native library loads, else scikit-learn's equivalent."""
    try:
        from xgboost import XGBClassifier

        return XGBClassifier(n_estimators=200, max_depth=4, learning_rate=0.05, subsample=0.9, eval_metric="logloss"), "xgboost"
    except Exception:  # XGBoost missing or its OpenMP runtime unavailable (e.g. macOS without libomp)
        from sklearn.ensemble import HistGradientBoostingClassifier

        return HistGradientBoostingClassifier(max_depth=4, learning_rate=0.05, max_iter=200), "sklearn-hist-gradient-boosting"


def calibration(y: np.ndarray, p: np.ndarray, bins: int = 10):
    """Mean predicted vs observed rate per quantile bin."""
    out = []
    order = np.argsort(p)
    for chunk in np.array_split(order, min(bins, len(order))):
        if len(chunk):
            out.append({"predicted": round(float(p[chunk].mean()), 4), "observed": round(float(y[chunk].mean()), 4), "n": int(len(chunk))})
    return out


def train(rows: list[dict], out_dir: Path) -> dict:
    n = len(rows)
    positives = int(sum(1 for r in rows if r["label"] == 1))
    negatives = n - positives
    base = {"model_name": MODEL_NAME, "dataset_size": n, "positives": positives, "negatives": negatives}
    if n < MIN_ROWS or positives < MIN_PER_CLASS or negatives < MIN_PER_CLASS:
        return {**base, "status": "INSUFFICIENT_DATA", "required": {"rows": MIN_ROWS, "per_class": MIN_PER_CLASS}}

    features = list(rows[0]["features"].keys())
    rows = sorted(rows, key=lambda r: r["createdAt"])
    X = pd.DataFrame([[r["features"].get(f, -1) for f in features] for r in rows], columns=features, dtype=float)
    y = np.array([r["label"] for r in rows])
    # Time-based split: the model is evaluated on the most recent recommendations, never on its training rows.
    cut = int(n * (1 - TEST_SHARE))
    X_train, X_test, y_train, y_test = X.iloc[:cut], X.iloc[cut:], y[:cut], y[cut:]
    if len(set(y_train)) < 2 or len(set(y_test)) < 2:
        return {**base, "status": "INSUFFICIENT_DATA", "reason": "train or test split has only one class"}

    model, library = make_model()
    model.fit(X_train, y_train)
    p = model.predict_proba(X_test)[:, 1]
    pred = (p >= 0.5).astype(int)
    metrics = {
        "roc_auc": round(float(roc_auc_score(y_test, p)), 4),
        "pr_auc": round(float(average_precision_score(y_test, p)), 4),
        "precision": round(float(precision_score(y_test, pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, pred, zero_division=0)), 4),
        "brier": round(float(brier_score_loss(y_test, p)), 4),
        "base_rate": round(float(y_test.mean()), 4),
        "calibration": calibration(y_test, p),
        "test_size": int(len(y_test)),
        "train_size": int(len(y_train)),
    }
    digest = hashlib.sha1(json.dumps([r["id"] for r in rows]).encode()).hexdigest()[:8]
    version = f"{datetime.now(timezone.utc):%Y%m%d%H%M%S}-{digest}"
    out_dir.mkdir(parents=True, exist_ok=True)
    file = f"model-{version}.joblib"
    joblib.dump({"model": model, "features": features, "library": library, "version": version}, out_dir / file)
    meta = {"model_name": MODEL_NAME, "version": version, "file": file, "features": features, "library": library, "metrics": metrics, "dataset_size": n, "trained_at": datetime.now(timezone.utc).isoformat()}
    (out_dir / "current.json").write_text(json.dumps(meta, indent=2))
    return {**base, "status": "TRAINED", "model_version": version, "library": library, "features": features, "metrics": metrics}
