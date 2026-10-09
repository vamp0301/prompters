"""Internal ML service for Prompters personalization.

Only the API server calls it (shared token, bound to localhost). It ranks recommendation
candidates with the trained model, or answers 503 cold_start when no model has been trained yet —
the API then uses its transparent baseline ranker.
"""

from __future__ import annotations

import hmac
import os

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .store import ModelStore
from .trainer import MODEL_NAME

store = ModelStore.from_env()
store.load()

app = FastAPI(title="prompters-ml", docs_url=None, redoc_url=None, openapi_url=None)


def require_token(x_ml_token: str = Header(default="")) -> None:
    expected = os.environ.get("ML_SERVICE_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=503, detail="ML_SERVICE_TOKEN is not configured")
    if not hmac.compare_digest(x_ml_token, expected):
        raise HTTPException(status_code=401, detail="unauthorized")


Number = float


class Item(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    features: dict[str, Number]


class RankRequest(BaseModel):
    items: list[Item] = Field(min_length=1, max_length=200)


class PredictRequest(BaseModel):
    rows: list[dict[str, Number]] = Field(min_length=1, max_length=500)


def cold_start() -> JSONResponse:
    return JSONResponse(status_code=503, content={"model_status": "cold_start", "model_name": MODEL_NAME})


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/model", dependencies=[Depends(require_token)])
def model():
    if not store.trained:
        return {"model_status": "cold_start", "model_name": MODEL_NAME}
    m = store.meta or {}
    return {"model_status": "trained", "model_name": MODEL_NAME, "model_version": m.get("version"), "library": m.get("library"), "features": m.get("features"), "families": m.get("families", []), "metrics": m.get("metrics"), "dataset_size": m.get("dataset_size"), "trained_at": m.get("trained_at")}


@app.post("/predict", dependencies=[Depends(require_token)])
def predict(req: PredictRequest):
    if not store.trained:
        return cold_start()
    try:
        preds = store.predict(req.rows)
    except KeyError as e:
        raise HTTPException(status_code=422, detail=f"missing features: {e}") from e
    return {"model_status": "trained", "model_name": MODEL_NAME, "model_version": store.meta["version"], "predictions": preds}


@app.post("/rank", dependencies=[Depends(require_token)])
def rank(req: RankRequest):
    if not store.trained:
        return cold_start()
    try:
        preds = store.predict([i.features for i in req.items])
    except KeyError as e:
        raise HTTPException(status_code=422, detail=f"missing features: {e}") from e
    return {"model_status": "trained", "model_name": MODEL_NAME, "model_version": store.meta["version"], "families": store.meta.get("families", []), "scores": {i.id: p for i, p in zip(req.items, preds)}}


@app.post("/reload", dependencies=[Depends(require_token)])
def reload():
    store.load()
    return {"model_status": "trained" if store.trained else "cold_start", "model_version": (store.meta or {}).get("version")}
