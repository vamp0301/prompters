# Prompters ML service

Internal FastAPI service that ranks personalization candidates with a gradient-boosted tree model
predicting **P(the student benefits from / completes a recommendation)**.

- No trained model → every ranking call answers `503 {"model_status": "cold_start"}` and the API
  uses its transparent baseline ranker. Nothing is faked: there is no placeholder model.
- Training (`npm run ml:train` in `backend/`) exports real, resolved recommendations and records an
  `MLTrainingRun` either way. Labels: SUCCESS (completed with measurable mastery gain) = 1;
  NO_IMPROVEMENT and ABANDONED = 0; NOT_ACTED_ON is excluded (no label).
- **Gate** (all must pass, else `INSUFFICIENT_DATA` with the measured values): ≥ 200 labelled rows,
  ≥ 30 positives, ≥ 30 negatives, ≥ 20 unique students, ≥ 50 % of features varying, and features
  known (not -1) at least 50 % of the time.
- **Evaluation on unseen students**: the newest 20 % of *students* are held out; the model never
  sees them. ROC-AUC, PR-AUC, precision, recall, Brier and calibration are reported for those
  students, next to the transparent baseline's ROC-AUC / PR-AUC on the same rows.
- **Promotion**: the model goes live (`models/current.json`) only if it beats the baseline on
  unseen students (ROC-AUC by ≥ 0.01 and PR-AUC not worse). Otherwise the run is
  `TRAINED_NOT_PROMOTED`: the candidate is kept for inspection and the live ranker is unchanged.
- **Rollout**: even a promoted model only ranks the ML arm — a stable per-student split set by
  `ML_TRAFFIC_PERCENT` (default 10) in the API. Each recommendation records its arm, and
  `MLTrainingRun.metrics.product.byArm` compares completion, success and mastery gain per arm.
- Library: XGBoost when its native library loads; otherwise scikit-learn's
  `HistGradientBoostingClassifier`. The run records which one was used. (macOS: `brew install libomp`
  enables XGBoost.)

## Run

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
ML_SERVICE_TOKEN=<random secret> .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8100
```

Then set `ML_SERVICE_URL=http://127.0.0.1:8100` and the same `ML_SERVICE_TOKEN` for the API.
Keep it off the public internet: every endpoint except `/health` requires the token.

## Endpoints

| | |
|---|---|
| `GET /health` | liveness (no auth) |
| `GET /model` | model status, version, library, features, evaluation metrics |
| `POST /predict` | `{rows: [{feature: value}]}` → probabilities |
| `POST /rank` | `{items: [{id, features}]}` → `{scores: {id: p}}` |
| `POST /reload` | reload `models/current.json` after training |

## Tests

```bash
.venv/bin/python -m pytest -q
```
