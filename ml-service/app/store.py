"""Loads the current trained model (if any). No model file → cold start, never a placeholder model."""

from __future__ import annotations

import json
import os
from pathlib import Path

import joblib


class ModelStore:
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.meta: dict | None = None
        self.bundle: dict | None = None

    @classmethod
    def from_env(cls) -> "ModelStore":
        return cls(Path(os.environ.get("ML_MODEL_DIR", Path(__file__).resolve().parent.parent / "models")))

    def load(self) -> None:
        current = self.model_dir / "current.json"
        if not current.exists():
            self.meta, self.bundle = None, None
            return
        meta = json.loads(current.read_text())
        bundle = joblib.load(self.model_dir / meta["file"])
        self.meta, self.bundle = meta, bundle

    @property
    def trained(self) -> bool:
        return self.bundle is not None

    def predict(self, rows: list[dict[str, float]]) -> list[float]:
        assert self.bundle is not None
        import pandas as pd

        features = self.bundle["features"]
        missing = sorted({f for r in rows for f in features if f not in r})
        if missing:
            raise KeyError(", ".join(missing[:5]))
        X = pd.DataFrame([[float(r[f]) for f in features] for r in rows], columns=features)
        return [float(p) for p in self.bundle["model"].predict_proba(X)[:, 1]]
