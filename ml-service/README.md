# Prompters ML service

Internal FastAPI service that ranks personalization candidates with a gradient-boosted tree model
predicting **P(the student benefits from / completes a recommendation)**.

- No trained model → every ranking call answers `503 {"model_status": "cold_start"}` and the API
  uses its transparent baseline ranker. Nothing is faked: there is no placeholder model.
- Training (`npm run ml:train` in `backend/`) exports real, resolved recommendations (shown to a
  student and later resolved SUCCESS/FAILURE from their activity), trains here, and records an
  `MLTrainingRun`. With fewer than 200 labelled rows (or < 30 per class) it refuses and records
  `INSUFFICIENT_DATA`.
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
