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
# Rows from a handful of students would teach the model those students, not students in general.
MIN_STUDENTS = 20
# At least this share of features must actually vary, and known (not -1) on average this often.
MIN_VARYING_FEATURES = 0.5
MIN_KNOWN_RATE = 0.5
# Newest share of *students* held out: the model is evaluated on people it never saw.
TEST_STUDENT_SHARE = 0.2
# The model goes live only if it beats the transparent baseline on those unseen students.
PROMOTION_MARGIN = 0.01


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


def gate(rows: list[dict]) -> dict:
    """Every check the dataset must pass before a model is trained, with the measured values."""
    n = len(rows)
    positives = sum(1 for r in rows if r["label"] == 1)
    students = len({r.get("group") for r in rows if r.get("group")})
    features = list(rows[0]["features"].keys()) if rows else []
    varying = [f for f in features if len({r["features"].get(f, -1) for r in rows}) > 1]
    known = float(np.mean([[r["features"].get(f, -1) != -1 for f in features] for r in rows])) if rows and features else 0.0
    checks = {
        "rows": {"value": n, "required": MIN_ROWS, "ok": n >= MIN_ROWS},
        "positives": {"value": positives, "required": MIN_PER_CLASS, "ok": positives >= MIN_PER_CLASS},
        "negatives": {"value": n - positives, "required": MIN_PER_CLASS, "ok": n - positives >= MIN_PER_CLASS},
        "students": {"value": students, "required": MIN_STUDENTS, "ok": students >= MIN_STUDENTS},
        "varying_features": {"value": round(len(varying) / len(features), 3) if features else 0, "required": MIN_VARYING_FEATURES, "ok": bool(features) and len(varying) / len(features) >= MIN_VARYING_FEATURES},
        "known_rate": {"value": round(known, 3), "required": MIN_KNOWN_RATE, "ok": known >= MIN_KNOWN_RATE},
    }
    return {"ok": all(c["ok"] for c in checks.values()), "checks": checks}


def student_split(rows: list[dict]):
    """Train on earlier students, test on the newest ~20 % of students (by their first recommendation)."""
    first: dict[str, str] = {}
    for r in rows:
        g = r["group"]
        first[g] = min(first.get(g, r["createdAt"]), r["createdAt"])
    ordered = sorted(first, key=lambda g: first[g])
    held = set(ordered[-max(1, round(len(ordered) * TEST_STUDENT_SHARE)) :])
    train_rows = [r for r in rows if r["group"] not in held]
    test_rows = [r for r in rows if r["group"] in held]
    return train_rows, test_rows, held


def ranking_metrics(y: np.ndarray, p: np.ndarray) -> dict:
    return {"roc_auc": round(float(roc_auc_score(y, p)), 4), "pr_auc": round(float(average_precision_score(y, p)), 4)}


def train(rows: list[dict], out_dir: Path) -> dict:
    n = len(rows)
    positives = int(sum(1 for r in rows if r["label"] == 1))
    g = gate(rows)
    base = {"model_name": MODEL_NAME, "dataset_size": n, "positives": positives, "negatives": n - positives, "gate": g}
    if not g["ok"]:
        failed = [k for k, c in g["checks"].items() if not c["ok"]]
        return {**base, "status": "INSUFFICIENT_DATA", "reason": f"gate failed: {', '.join(failed)}", "required": {k: g["checks"][k]["required"] for k in failed}}

    features = list(rows[0]["features"].keys())
    train_rows, test_rows, held = student_split(rows)
    to_X = lambda rs: pd.DataFrame([[r["features"].get(f, -1) for f in features] for r in rs], columns=features, dtype=float)  # noqa: E731
    X_train, X_test = to_X(train_rows), to_X(test_rows)
    y_train, y_test = np.array([r["label"] for r in train_rows]), np.array([r["label"] for r in test_rows])
    if len(set(y_train)) < 2 or len(set(y_test)) < 2:
        return {**base, "status": "INSUFFICIENT_DATA", "reason": "train or unseen-student test split has only one class"}

    model, library = make_model()
    model.fit(X_train, y_train)
    p = model.predict_proba(X_test)[:, 1]
    pred = (p >= 0.5).astype(int)
    metrics = {
        **ranking_metrics(y_test, p),
        "precision": round(float(precision_score(y_test, pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, pred, zero_division=0)), 4),
        "brier": round(float(brier_score_loss(y_test, p)), 4),
        "base_rate": round(float(y_test.mean()), 4),
        "calibration": calibration(y_test, p),
        "test_rows": int(len(y_test)),
        "train_rows": int(len(y_train)),
        "test_students": len(held),
        "train_students": len({r["group"] for r in train_rows}),
    }
    # Baseline: the transparent formula's score for the same unseen rows.
    baseline_scores = np.array([r.get("baseline") if r.get("baseline") is not None else 0.5 for r in test_rows], dtype=float)
    baseline = ranking_metrics(y_test, baseline_scores)
    promoted = metrics["roc_auc"] >= baseline["roc_auc"] + PROMOTION_MARGIN and metrics["pr_auc"] >= baseline["pr_auc"]
    comparison = {"on": "unseen students", "ml": {k: metrics[k] for k in ("roc_auc", "pr_auc")}, "baseline": baseline, "margin_required": PROMOTION_MARGIN, "ml_beats_baseline": promoted}

    digest = hashlib.sha1(json.dumps([r["id"] for r in rows]).encode()).hexdigest()[:8]
    version = f"{datetime.now(timezone.utc):%Y%m%d%H%M%S}-{digest}"
    out_dir.mkdir(parents=True, exist_ok=True)
    file = f"model-{version}.joblib"
    joblib.dump({"model": model, "features": features, "library": library, "version": version}, out_dir / file)
    meta = {"model_name": MODEL_NAME, "version": version, "file": file, "features": features, "library": library, "metrics": metrics, "comparison": comparison, "dataset_size": n, "trained_at": datetime.now(timezone.utc).isoformat()}
    result = {**base, "model_version": version, "library": library, "features": features, "metrics": metrics, "comparison": comparison}
    if not promoted:
        # Kept for inspection, never served: the live ranker stays as it is.
        (out_dir / f"candidate-{version}.json").write_text(json.dumps(meta, indent=2))
        return {**result, "status": "TRAINED_NOT_PROMOTED"}
    (out_dir / "current.json").write_text(json.dumps(meta, indent=2))
    return {**result, "status": "TRAINED"}
