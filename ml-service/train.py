"""CLI: train the recommendation-success model from an exported dataset (JSONL).

    python train.py --data dataset.jsonl --out models --report report.json

Writes a report either way. With too little real data the report says INSUFFICIENT_DATA and no
model is written.
"""

import argparse
import json
from pathlib import Path

from app.trainer import train


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--report", required=True)
    a = ap.parse_args()
    rows = [json.loads(line) for line in Path(a.data).read_text().splitlines() if line.strip()]
    report = train(rows, Path(a.out))
    Path(a.report).write_text(json.dumps(report, indent=2))
    print(json.dumps({k: v for k, v in report.items() if k != "features"}))


if __name__ == "__main__":
    main()
