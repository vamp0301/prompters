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
from app.trainer import MIN_ROWS, train

FEATURES = ["skillGap", "jobRelevance", "forgettingRisk", "successProbability"]
TOKEN = "test-token"


def synthetic(n: int, seed: int = 7) -> list[dict]:
    rnd = random.Random(seed)
    rows = []
    for i in range(n):
        f = {k: rnd.random() for k in FEATURES}
        p = 0.15 + 0.7 * f["successProbability"] * (0.5 + 0.5 * f["jobRelevance"])
        rows.append({"id": f"r{i}", "createdAt": f"2026-01-01T00:{i // 60:02d}:{i % 60:02d}Z", "label": 1 if rnd.random() < p else 0, "features": f})
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
    assert report["dataset_size"] == MIN_ROWS - 1
    assert not (tmp_path / "current.json").exists()
    assert not list(tmp_path.glob("*.joblib"))


def test_refuses_when_one_class_only(tmp_path):
    rows = [{**r, "label": 1} for r in synthetic(400)]
    assert train(rows, tmp_path)["status"] == "INSUFFICIENT_DATA"


def test_trains_reports_metrics_and_serves_versioned_predictions(client, tmp_path):
    report = train(synthetic(600), tmp_path)
    assert report["status"] == "TRAINED"
    m = report["metrics"]
    for k in ["roc_auc", "pr_auc", "precision", "recall", "brier", "calibration"]:
        assert k in m
    assert m["roc_auc"] > 0.55  # the synthetic signal is learnable; real data is evaluated the same way
    assert m["test_size"] == 120  # newest 20 % held out
    meta = json.loads((tmp_path / "current.json").read_text())
    assert meta["version"] == report["model_version"] and meta["library"] in {"xgboost", "sklearn-hist-gradient-boosting"}

    assert client.post("/reload", headers=H).json()["model_status"] == "trained"
    info = client.get("/model", headers=H).json()
    assert info["model_version"] == report["model_version"] and info["features"] == FEATURES
    items = [{"id": "likely", "features": {"skillGap": 0.5, "jobRelevance": 1, "forgettingRisk": 0.2, "successProbability": 0.95}}, {"id": "unlikely", "features": {"skillGap": 0.5, "jobRelevance": 0, "forgettingRisk": 0.2, "successProbability": 0.02}}]
    r = client.post("/rank", headers=H, json={"items": items}).json()
    assert r["model_status"] == "trained" and r["model_version"] == report["model_version"]
    assert 0 <= r["scores"]["unlikely"] < r["scores"]["likely"] <= 1
    p = client.post("/predict", headers=H, json={"rows": [i["features"] for i in items]}).json()
    assert len(p["predictions"]) == 2


def test_rejects_missing_features_and_oversized_requests(client, tmp_path):
    train(synthetic(600), tmp_path)
    client.post("/reload", headers=H)
    assert client.post("/rank", headers=H, json={"items": [{"id": "a", "features": {"skillGap": 0.5}}]}).status_code == 422
    too_many = [{"id": str(i), "features": {k: 0.5 for k in FEATURES}} for i in range(201)]
    assert client.post("/rank", headers=H, json={"items": too_many}).status_code == 422
