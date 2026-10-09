import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
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

/** Anonymous, stable per-student group id: lets the trainer hold out whole students without exporting who they are. */
export const studentGroup = (userId: string) => createHash("sha256").update(`group:${userId}`).digest("hex").slice(0, 12);

/**
 * Training rows: recommendations that were shown and resolved with a label (SUCCESS / NO_IMPROVEMENT /
 * ABANDONED). NOT_ACTED_ON rows have no label and are left out. Each row carries the baseline's score
 * (not a feature) so the trainer can compare the model against it on unseen students.
 */
export async function exportDataset() {
  const rows = await prisma.recommendation.findMany({
    where: { outcome: { in: ["SUCCESS", "FAILURE"] }, shownAt: { not: null } },
    select: { id: true, userId: true, createdAt: true, outcome: true, outcomeDetail: true, action: true, arm: true, features: true },
    orderBy: { createdAt: "asc" },
  });
  return rows
    .map((r) => {
      const f = r.features as { ml?: Record<string, number>; baselineScore?: number; role?: { key?: string; family?: string } } | null;
      if (!f?.ml) return null;
      return {
        id: r.id,
        group: studentGroup(r.userId),
        createdAt: r.createdAt.toISOString(),
        action: r.action,
        arm: r.arm,
        outcomeDetail: r.outcomeDetail,
        label: r.outcome === "SUCCESS" ? 1 : 0,
        baseline: typeof f.baselineScore === "number" ? f.baselineScore : null,
        // Career family: the trainer serves the model only for families with enough of their own data.
        family: f.role?.family ?? "unknown",
        roleKey: f.role?.key ?? null,
        features: Object.fromEntries(ML_FEATURES.map((k) => [k, f.ml![k] ?? -1])),
      };
    })
    .filter((r): r is NonNullable<typeof r> => !!r);
}

/**
 * Acceptance, completion, success and learning improvement — overall and per rollout arm — from
 * real recommendations. Each figure is reported only with enough rows; otherwise INSUFFICIENT_DATA.
 */
export async function productMetrics() {
  const shownRecs = await prisma.recommendation.findMany({
    where: { shownAt: { not: null } },
    select: { arm: true, outcomeDetail: true, improvement: true, outcomeSignals: true, features: true, feedback: { where: { source: "USER", action: "ACCEPTED" }, select: { id: true } } },
  });
  const familyOf = (r: (typeof shownRecs)[number]) => (r.features as { role?: { family?: string } } | null)?.role?.family ?? "unknown";
  const summarize = (recs: typeof shownRecs) => {
    const n = recs.length;
    const count = (pred: (r: (typeof recs)[number]) => boolean) => recs.filter(pred).length;
    const completed = count((r) => r.outcomeDetail === "SUCCESS" || r.outcomeDetail === "NO_IMPROVEMENT");
    const improvements = recs.map((r) => r.improvement).filter((x): x is number => typeof x === "number");
    const interviewDeltas = recs.map((r) => (r.outcomeSignals as { interviewDelta?: number | null } | null)?.interviewDelta).filter((x): x is number => typeof x === "number");
    const labelled = count((r) => ["SUCCESS", "NO_IMPROVEMENT", "ABANDONED"].includes(r.outcomeDetail ?? ""));
    return {
      shown: n,
      outcomes: {
        success: count((r) => r.outcomeDetail === "SUCCESS"),
        noImprovement: count((r) => r.outcomeDetail === "NO_IMPROVEMENT"),
        abandoned: count((r) => r.outcomeDetail === "ABANDONED"),
        notActedOn: count((r) => r.outcomeDetail === "NOT_ACTED_ON"),
        inProgress: count((r) => r.outcomeDetail === "STARTED"),
      },
      rates:
        n >= MIN_SHOWN_FOR_RATES
          ? { acceptanceRate: round(count((r) => r.feedback.length > 0) / n), completionRate: round(completed / n), successRate: round(count((r) => r.outcomeDetail === "SUCCESS") / n) }
          : "INSUFFICIENT_DATA",
      learningImprovement:
        improvements.length >= MIN_ROWS_FOR_IMPROVEMENT ? { meanMasteryDelta: round(improvements.reduce((a, b) => a + b, 0) / improvements.length), n: improvements.length } : "INSUFFICIENT_DATA",
      // Did the next interview go better on the recommended skill?
      interviewImprovement:
        interviewDeltas.length >= MIN_ROWS_FOR_IMPROVEMENT ? { meanInterviewDelta: round(interviewDeltas.reduce((a, b) => a + b, 0) / interviewDeltas.length), n: interviewDeltas.length } : "INSUFFICIENT_DATA",
      negativeOutcomeRate: labelled >= MIN_ROWS_FOR_IMPROVEMENT ? round(count((r) => r.outcomeDetail === "NO_IMPROVEMENT" || r.outcomeDetail === "ABANDONED") / labelled) : "INSUFFICIENT_DATA",
    };
  };
  return {
    ...summarize(shownRecs),
    byArm: { ml: summarize(shownRecs.filter((r) => r.arm === "ml")), baseline: summarize(shownRecs.filter((r) => r.arm !== "ml")) },
    // Per career family: a result for engineers says nothing about MBA or PM students.
    byFamily: Object.fromEntries([...new Set(shownRecs.map(familyOf))].sort().map((f) => [f, summarize(shownRecs.filter((r) => familyOf(r) === f))])),
  };
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
  type Report = { status?: string; model_version?: string; library?: string; metrics?: unknown; reason?: string; required?: unknown; gate?: unknown; comparison?: unknown };
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
      // A trained-but-not-promoted candidate keeps its version for traceability; only TRAINED is served.
      modelVersion: status === "TRAINED" || status === "TRAINED_NOT_PROMOTED" ? (parsed.model_version ?? null) : null,
      status,
      datasetSize: rows.length,
      positives,
      negatives: rows.length - positives,
      features: [...ML_FEATURES],
      metrics: {
        model: parsed.metrics ?? "INSUFFICIENT_DATA",
        // ML vs baseline on students the model never saw; promotion requires the model to win.
        comparison: parsed.comparison ?? null,
        gate: parsed.gate ?? null,
        product,
      } as unknown as Prisma.InputJsonValue,
      library: parsed.library ?? null,
      notes:
        status === "FAILED"
          ? res.out.slice(-1500)
          : status === "INSUFFICIENT_DATA"
            ? `Not trained: ${parsed.reason ?? `needs ${JSON.stringify(parsed.required)}`}`
            : status === "TRAINED_NOT_PROMOTED"
              ? "Trained but not promoted: it did not beat the baseline on unseen students. The live ranker is unchanged."
              : null,
      startedAt: started,
      finishedAt: new Date(),
    },
  });
  if (status === "TRAINED") await mlReload();
  return runRow;
}
