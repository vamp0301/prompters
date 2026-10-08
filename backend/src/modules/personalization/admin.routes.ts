import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { currentUser, requireRole } from "../../middleware/auth.js";
import { notFound } from "../../utils/errors.js";
import { handler, param, parse } from "../../utils/http.js";
import { audit } from "../platform/audit.js";
import { lastEngine, recView } from "./engine.js";
import { mlConfigured } from "./ml-client.js";
import { stateView } from "./personalization.routes.js";
import { interviewProgress } from "./progress.js";
import { armOf, mlTrafficPercent } from "./ranker.js";

/**
 * Personalization debug (ADMIN+): what the engine believes about one student and why it recommends
 * what it does — skill state, last interview, ranker and arm, scores, reasons, features, outcomes.
 * Read-only, and every look at a student's data is written to the audit log.
 */
export function adminPersonalizationRoutes() {
  const r = Router();
  const admin = requireRole("ADMIN");

  r.get("/personalization/students", admin, handler(async (req) => {
    const { q } = parse(z.object({ q: z.string().trim().max(120).default("") }), req.query);
    return prisma.user.findMany({
      where: { role: "STUDENT", ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {}) },
      orderBy: { lastActiveAt: { sort: "desc", nulls: "last" } },
      take: 20,
      select: { id: true, name: true, email: true, lastActiveAt: true },
    });
  }));

  r.get("/personalization/students/:id", admin, handler(async (req) => {
    const id = param(req, "id");
    const student = await prisma.user.findFirst({ where: { id, role: "STUDENT" }, select: { id: true, name: true, email: true } });
    if (!student) throw notFound("Student");
    const [states, engine, active, resolved, predictions, difficulty, progress, training] = await Promise.all([
      prisma.studentSkillState.findMany({ where: { userId: id }, orderBy: [{ mastery: "asc" }] }),
      lastEngine(id),
      prisma.recommendation.findMany({ where: { userId: id, status: "ACTIVE" }, orderBy: { rank: "asc" } }),
      prisma.recommendation.findMany({ where: { userId: id, outcomeDetail: { not: null } }, orderBy: { updatedAt: "desc" }, take: 20 }),
      prisma.mLPrediction.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 10, select: { modelName: true, modelVersion: true, target: true, prediction: true, confidence: true, meta: true, createdAt: true } }),
      prisma.mLPrediction.findFirst({ where: { userId: id, target: "OPTIMAL_DIFFICULTY" }, orderBy: { createdAt: "desc" } }),
      interviewProgress(id),
      prisma.mLTrainingRun.findFirst({ where: { modelName: "recommendation-success" }, orderBy: { startedAt: "desc" }, select: { status: true, modelVersion: true, datasetSize: true, notes: true, startedAt: true } }),
    ]);
    await audit(currentUser(req).id, "VIEWED_PERSONALIZATION", "User", id);
    const withDebug = (x: (typeof active)[number]) => ({
      ...recView(x),
      status: x.status,
      arm: x.arm,
      features: (x.features as { features?: unknown }).features ?? null,
      baselineScore: (x.features as { baselineScore?: number }).baselineScore ?? null,
      shownAt: x.shownAt,
      outcome: x.outcomeDetail ?? "PENDING",
      label: x.outcome,
      improvement: x.improvement,
      signals: x.outcomeSignals,
      resolvedAt: x.resolvedAt,
    });
    return {
      student,
      ranker: {
        current: engine,
        arm: armOf(id),
        mlTrafficPercent: mlTrafficPercent(),
        mlConfigured: mlConfigured(),
        latestTraining: training,
      },
      difficulty: difficulty ? { ...(difficulty.meta as object), confidence: difficulty.confidence, model: `${difficulty.modelName}@${difficulty.modelVersion}` } : null,
      skillState: states.map(stateView),
      interviewProgress: progress,
      next: active[0] ? withDebug(active[0]) : null,
      active: active.map(withDebug),
      resolved: resolved.map(withDebug),
      predictions,
    };
  }));

  return r;
}
