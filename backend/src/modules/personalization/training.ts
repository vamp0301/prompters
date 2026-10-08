import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { mlReload } from "./ml-client.js";
import { ML_FEATURES } from "./ranker.js";

/**
 * Training pipeline for the recommendation-success model:
 *   real recommendations that were shown and later resolved (SUCCESS / FAILURE)
 *   → JSONL → Python trainer → MLTrainingRun row (+ hot reload of the service).
 * Product metrics (acceptance, completion, learning improvement) are computed here from the
 * feedback tables. Every number is either computed from real rows or reported as INSUFFICIENT_DATA.
 */

export const MODEL_NAME = "recommendation-success";
/** Fewer shown recommendations than this and rates aren't reported (they would be noise). */
const MIN_SHOWN_FOR_RATES = 50;
const MIN_ROWS_FOR_IMPROVEMENT = 30;

export async function exportDataset() {
  const rows = await prisma.recommendation.findMany({
    where: { outcome: { in: ["SUCCESS", "FAILURE"] }, shownAt: { not: null } },
    select: { id: true, createdAt: true, outcome: true, action: true, features: true },
    orderBy: { createdAt: "asc" },
  });
  return rows
    .map((r) => {
      const ml = (r.features as { ml?: Record<string, number> } | null)?.ml;
      if (!ml) return null;
      return { id: r.id, createdAt: r.createdAt.toISOString(), action: r.action, label: r.outcome === "SUCCESS" ? 1 : 0, features: Object.fromEntries(ML_FEATURES.map((k) => [k, ml[k] ?? -1])) };
    })
    .filter((r): r is NonNullable<typeof r> => !!r);
}

/** Acceptance, completion and learning improvement from real feedback — or INSUFFICIENT_DATA. */
export async function productMetrics() {
  const shown = await prisma.recommendation.count({ where: { shownAt: { not: null } } });
  const count = (action: string) => prisma.recommendationFeedback.groupBy({ by: ["recommendationId"], where: { action, recommendation: { shownAt: { not: null } } } }).then((g) => g.length);
  const [accepted, completed, successful] = await Promise.all([count("ACCEPTED"), count("COMPLETED"), count("SUCCESSFUL")]);
  const rates =
    shown >= MIN_SHOWN_FOR_RATES
      ? { acceptanceRate: round(accepted / shown), completionRate: round(completed / shown), successRate: round(successful / shown) }
      : "INSUFFICIENT_DATA";

  // Learning improvement: for completed skill/topic recommendations, mastery now minus mastery when recommended.
  const done = await prisma.recommendation.findMany({ where: { status: "DONE", outcome: { not: null } }, select: { userId: true, features: true } });
  const pairs = done.map((r) => ({ userId: r.userId, f: r.features as { conceptId?: string | null; features?: { mastery?: number } } })).filter((r) => r.f.conceptId && typeof r.f.features?.mastery === "number");
  const states = pairs.length ? await prisma.studentSkillState.findMany({ where: { OR: pairs.map((p) => ({ userId: p.userId, conceptId: p.f.conceptId! })) }, select: { userId: true, conceptId: true, mastery: true } }) : [];
  const now = new Map(states.map((s) => [`${s.userId}|${s.conceptId}`, s.mastery]));
  const deltas = pairs.map((p) => (now.has(`${p.userId}|${p.f.conceptId}`) ? now.get(`${p.userId}|${p.f.conceptId}`)! - p.f.features!.mastery! : null)).filter((x): x is number => x !== null);
  const learningImprovement = deltas.length >= MIN_ROWS_FOR_IMPROVEMENT ? { meanMasteryDelta: round(deltas.reduce((a, b) => a + b, 0) / deltas.length), n: deltas.length } : "INSUFFICIENT_DATA";
  return { shown, accepted, completed, successful, rates, learningImprovement };
}

const round = (x: number) => Math.round(x * 10000) / 10000;

function run(cmd: string, args: string[], cwd: string) {
  return new Promise<{ code: number; out: string }>((resolve) => {
    const p = spawn(cmd, args, { cwd, env: process.env });
    let out = "";
    p.stdout.on("data", (b) => (out += b));
    p.stderr.on("data", (b) => (out += b));
    p.on("close", (code) => resolve({ code: code ?? 1, out }));
    p.on("error", (e) => resolve({ code: 1, out: String(e) }));
  });
}

/** Exports, trains (in Python), records the run. Returns the run row. */
export async function trainRecommendationModel(opts: { mlDir: string; python?: string }) {
  const started = new Date();
  const rows = await exportDataset();
  const product = await productMetrics();
  const dir = mkdtempSync(path.join(tmpdir(), "prompters-ml-"));
  const data = path.join(dir, "dataset.jsonl");
  const report = path.join(dir, "report.json");
  writeFileSync(data, rows.map((r) => JSON.stringify(r)).join("\n"));
  const python = opts.python ?? path.join(opts.mlDir, ".venv", "bin", "python");
  const res = await run(python, ["train.py", "--data", data, "--out", path.join(opts.mlDir, "models"), "--report", report], opts.mlDir);
  type Report = { status?: string; model_version?: string; library?: string; metrics?: unknown; reason?: string; required?: unknown };
  let parsed: Report;
  try {
    parsed = JSON.parse(readFileSync(report, "utf8")) as Report;
  } catch {
    parsed = { status: "FAILED" };
  }
  const status = res.code === 0 && parsed.status ? parsed.status : "FAILED";
  const positives = rows.filter((r) => r.label === 1).length;
  const runRow = await prisma.mLTrainingRun.create({
    data: {
      modelName: MODEL_NAME,
      modelVersion: status === "TRAINED" ? (parsed.model_version ?? null) : null,
      status,
      datasetSize: rows.length,
      positives,
      negatives: rows.length - positives,
      features: [...ML_FEATURES],
      metrics: { model: status === "TRAINED" ? parsed.metrics : "INSUFFICIENT_DATA", product } as unknown as Prisma.InputJsonValue,
      library: parsed.library ?? null,
      notes: status === "FAILED" ? res.out.slice(-1500) : status === "INSUFFICIENT_DATA" ? `Not trained: ${parsed.reason ?? `needs ${JSON.stringify(parsed.required)}`}` : null,
      startedAt: started,
      finishedAt: new Date(),
    },
  });
  if (status === "TRAINED") await mlReload();
  return runRow;
}
