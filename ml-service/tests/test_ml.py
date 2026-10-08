"""ML service and trainer tests.

The "trains" tests use a small synthetic dataset generated here, in a temporary directory, purely
to check that the training/serving code works end to end. It is never written to models/ and is
never presented as a real model or real metrics.
"""

import json
import random
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.store import ModelStore
from app.trainer import MIN_ROWS, MIN_STUDENTS, train

FEATURES = ["skillGap", "jobRelevance", "forgettingRisk", "successProbability"]
TOKEN = "test-token"


def synthetic(n: int, seed: int = 7, students: int = 40, baseline: str = "noise") -> list[dict]:
    """Learnable synthetic rows spread over `students` (test fixture only). `baseline` is the
    transparent ranker's score for each row: "noise" (uninformative) or "oracle" (knows the label)."""
    rnd = random.Random(seed)
    rows = []
    for i in range(n):
        f = {k: rnd.random() for k in FEATURES}
        p = 0.15 + 0.7 * f["successProbability"] * (0.5 + 0.5 * f["jobRelevance"])
        label = 1 if rnd.random() < p else 0
        b = rnd.random() if baseline == "noise" else 0.9 * label + 0.05 * rnd.random()
        rows.append({"id": f"r{i}", "group": f"s{i % students}", "createdAt": f"2026-01-01T{(i % students):02d}:{i // 60 % 60:02d}:{i % 60:02d}Z", "label": label, "baseline": b, "features": f})
    return rows


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("ML_SERVICE_TOKEN", TOKEN)
    main.store = ModelStore(tmp_path)
    main.store.load()
    return TestClient(main.app)


H = {"x-ml-token": TOKEN}


def test_health_is_open_everything_else_needs_the_token(client):
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/model").status_code == 401
    assert client.get("/model", headers={"x-ml-token": "wrong"}).status_code == 401
    assert client.post("/rank", json={"items": [{"id": "a", "features": {}}]}).status_code == 401


def test_no_token_configured_refuses(client, monkeypatch):
    monkeypatch.delenv("ML_SERVICE_TOKEN")
    assert client.get("/model", headers=H).status_code == 503


def test_cold_start_without_a_trained_model(client):
    assert client.get("/model", headers=H).json()["model_status"] == "cold_start"
    r = client.post("/rank", headers=H, json={"items": [{"id": "a", "features": {"skillGap": 0.5}}]})
    assert r.status_code == 503 and r.json()["model_status"] == "cold_start"
    assert client.post("/predict", headers=H, json={"rows": [{"skillGap": 0.5}]}).status_code == 503


def test_refuses_to_train_on_too_little_data(tmp_path):
    report = train(synthetic(MIN_ROWS - 1), tmp_path)
    assert report["status"] == "INSUFFICIENT_DATA"
    assert report["gate"]["checks"]["rows"] == {"value": MIN_ROWS - 1, "required": MIN_ROWS, "ok": False}
    assert not (tmp_path / "current.json").exists()
    assert not list(tmp_path.glob("*.joblib"))


def test_refuses_when_rows_come_from_too_few_students(tmp_path):
    # 600 rows, but from 10 students: the model would learn those 10 people, not students in general.
    report = train(synthetic(600, students=10), tmp_path)
    assert report["status"] == "INSUFFICIENT_DATA"
    assert "students" in report["reason"]
    assert report["gate"]["checks"]["students"] == {"value": 10, "required": MIN_STUDENTS, "ok": False}


def test_refuses_when_features_carry_no_information(tmp_path):
    rows = synthetic(600)
    for r in rows:
        r["features"] = {k: -1 for k in FEATURES}  # nothing known about anyone
    report = train(rows, tmp_path)
    assert report["status"] == "INSUFFICIENT_DATA"
    assert not report["gate"]["checks"]["varying_features"]["ok"] and not report["gate"]["checks"]["known_rate"]["ok"]


def test_refuses_when_one_class_only(tmp_path):
    rows = [{**r, "label": 1} for r in synthetic(400)]
    assert train(rows, tmp_path)["status"] == "INSUFFICIENT_DATA"


def test_evaluates_on_unseen_students_and_promotes_only_when_it_beats_the_baseline(client, tmp_path):
    report = train(synthetic(600), tmp_path)
    assert report["status"] == "TRAINED"
    m = report["metrics"]
    for k in ["roc_auc", "pr_auc", "precision", "recall", "brier", "calibration"]:
        assert k in m
    # Held-out students are never in training.
    assert m["test_students"] == 8 and m["train_students"] == 32
    c = report["comparison"]
    assert c["on"] == "unseen students" and c["ml_beats_baseline"] is True
    assert c["ml"]["roc_auc"] > c["baseline"]["roc_auc"]
    meta = json.loads((tmp_path / "current.json").read_text())
    assert meta["version"] == report["model_version"] and meta["library"] in {"xgboost", "sklearn-hist-gradient-boosting"}

    assert client.post("/reload", headers=H).json()["model_status"] == "trained"
    info = client.get("/model", headers=H).json()
    assert info["model_version"] == report["model_version"] and info["features"] == FEATURES
    items = [{"id": "likely", "features": {"skillGap": 0.5, "jobRelevance": 1, "forgettingRisk": 0.2, "successProbability": 0.95}}, {"id": "unlikely", "features": {"skillGap": 0.5, "jobRelevance": 0, "forgettingRisk": 0.2, "successProbability": 0.02}}]
    r = client.post("/rank", headers=H, json={"items": items}).json()
    assert r["model_status"] == "trained" and r["model_version"] == report["model_version"]
    assert 0 <= r["scores"]["unlikely"] < r["scores"]["likely"] <= 1
    assert len(client.post("/predict", headers=H, json={"rows": [i["features"] for i in items]}).json()["predictions"]) == 2


def test_not_promoted_when_the_baseline_is_better(client, tmp_path):
    report = train(synthetic(600, baseline="oracle"), tmp_path)
    assert report["status"] == "TRAINED_NOT_PROMOTED"
    assert report["comparison"]["ml_beats_baseline"] is False
    # Kept for inspection, never served.
    assert not (tmp_path / "current.json").exists()
    assert list(tmp_path.glob("candidate-*.json"))
    assert client.post("/reload", headers=H).json()["model_status"] == "cold_start"


def test_rejects_missing_features_and_oversized_requests(client, tmp_path):
    assert train(synthetic(600), tmp_path)["status"] == "TRAINED"
    client.post("/reload", headers=H)
    assert client.post("/rank", headers=H, json={"items": [{"id": "a", "features": {"skillGap": 0.5}}]}).status_code == 422
    too_many = [{"id": str(i), "features": {k: 0.5 for k in FEATURES}} for i in range(201)]
    assert client.post("/rank", headers=H, json={"items": too_many}).status_code == 422
