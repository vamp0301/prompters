import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { currentUser } from "../../middleware/auth.js";
import { personalizationLimiter } from "../../middleware/rate-limit.js";
import { badRequest, notFound } from "../../utils/errors.js";
import { handler, parse } from "../../utils/http.js";
import { computeReadiness } from "../readiness/readiness.service.js";
import { COLD_START_EVIDENCE, lastEngine, recView, refreshIfStale } from "./engine.js";
import { CLIENT_ENTITY, CLIENT_EVENTS } from "./events.js";
import { careerContext, loadStudentData, studentDifficulty, studentFeatures } from "./data.js";
import { mlModelInfo } from "./ml-client.js";
import { interviewProgress } from "./progress.js";
import { SKILL_STATE_MODEL } from "./model.js";

/**
 * Personalization API. Every query is scoped to the signed-in student (`currentUser`) — there is no
 * parameter that addresses another student, so one student can never read another's data.
 */

type StateSignals = { kind?: "topic" | "skill"; interviewAverage?: number | null; interviewAnswers?: number; jobRelevance?: number; required?: boolean; inRole?: boolean; onResume?: boolean };

export const stateView = (s: { conceptId: string; label: string; mastery: number; confidence: number; forgettingRisk: number; attempts: number; correctAttempts: number; lastSeen: Date | null; nextReview: Date | null; signals: Prisma.JsonValue; modelVersion: string }) => {
  const sig = (s.signals ?? {}) as StateSignals;
  return {
    conceptId: s.conceptId,
    label: s.label,
    kind: sig.kind ?? (s.conceptId.startsWith("topic:") ? "topic" : "skill"),
    mastery: s.mastery,
    confidence: s.confidence,
    forgettingRisk: s.forgettingRisk,
    attempts: s.attempts,
    correctAttempts: s.correctAttempts,
    lastSeen: s.lastSeen,
    nextReview: s.nextReview,
    interviewAverage: sig.interviewAverage ?? null,
    jobRelevance: sig.jobRelevance ?? null,
    modelVersion: s.modelVersion,
  };
};

const FEEDBACK_ACTIONS = ["SHOWN", "ACCEPTED", "IGNORED", "STARTED", "COMPLETED", "SKIPPED"] as const;

export function personalizationRoutes() {
  const r = Router();
  r.use(personalizationLimiter());

  /** "What should I do next?" — the top recommendation plus skill gaps, due revisions, interview weaknesses and practice. */
  r.get("/next", handler(async (req) => {
    const me = currentUser(req);
    const run = await refreshIfStale(me.id);
    const [recs, states, engine, difficulty] = await Promise.all([
      prisma.recommendation.findMany({ where: { userId: me.id, status: "ACTIVE" }, orderBy: { rank: "asc" } }),
      prisma.studentSkillState.findMany({ where: { userId: me.id } }),
      run.refreshed && "engine" in run ? Promise.resolve(run.engine!) : lastEngine(me.id),
      prisma.mLPrediction.findFirst({ where: { userId: me.id, target: "OPTIMAL_DIFFICULTY" }, orderBy: { createdAt: "desc" } }),
    ]);
    const views = states.map(stateView);
    const evidence = views.reduce((a, s) => a + s.attempts, 0);
    const now = Date.now();
    const top = recs[0] ? recView(recs[0]) : null;
    const dMeta = (difficulty?.meta ?? null) as { level?: string; status?: string; trend?: string } | null;
    return {
      next: top,
      engine,
      // Honest about how much the system knows: below this much evidence it's driven by resume, role and roadmap.
      coldStart: evidence < COLD_START_EVIDENCE,
      evidence,
      difficulty: dMeta ? { level: dMeta.level, status: dMeta.status, trend: dMeta.trend, confidence: difficulty!.confidence } : null,
      skillGaps: views
        .filter((s) => s.kind === "skill" && s.attempts > 0 && s.mastery < 0.6 && (s.jobRelevance ?? 0) >= 0.5)
        .sort((a, b) => (1 - b.mastery) * (b.jobRelevance ?? 0) - (1 - a.mastery) * (a.jobRelevance ?? 0))
        .slice(0, 5),
      dueRevisions: views
        .filter((s) => s.kind === "topic" && s.nextReview && s.nextReview.getTime() <= now + 86_400_000)
        .sort((a, b) => a.nextReview!.getTime() - b.nextReview!.getTime())
        .slice(0, 5),
      interviewWeaknesses: views
        .filter((s) => s.interviewAverage !== null && s.interviewAverage < 0.6)
        .sort((a, b) => a.interviewAverage! - b.interviewAverage!)
        .slice(0, 5),
      recommendedPractice: recs.filter((x) => x.id !== recs[0]?.id && ["PRACTICE_QUESTION", "PRACTICE_SKILL", "LEARN_CONCEPT", "REVISE_TOPIC"].includes(x.action)).slice(0, 4).map(recView),
    };
  }));

  /** All active recommendations, ranked, with reasons, features and the model that scored them. */
  r.get("/recommendations", handler(async (req) => {
    const me = currentUser(req);
    await refreshIfStale(me.id);
    const recs = await prisma.recommendation.findMany({ where: { userId: me.id, status: "ACTIVE" }, orderBy: { rank: "asc" } });
    return recs.map((x) => ({ ...recView(x), features: (x.features as { features?: unknown }).features ?? null }));
  }));

  /** The student's profile as the engine sees it (features recomputed from their records). */
  r.get("/profile", handler(async (req) => {
    const me = currentUser(req);
    const d = await loadStudentData(me.id);
    const career = careerContext(d);
    const [states, engine, training] = await Promise.all([
      prisma.studentSkillState.findMany({ where: { userId: me.id }, orderBy: { mastery: "desc" } }),
      lastEngine(me.id),
      prisma.mLTrainingRun.findFirst({ where: { modelName: "recommendation-success" }, orderBy: { startedAt: "desc" }, select: { status: true, modelVersion: true, datasetSize: true, finishedAt: true } }),
    ]);
    return {
      studentId: me.id,
      skills: Object.fromEntries(states.filter((s) => s.conceptId.startsWith("skill:")).map((s) => [s.conceptId.slice(6), Math.round(s.mastery * 100) / 100])),
      features: studentFeatures(d, career),
      difficulty: studentDifficulty(d, career),
      career: { targetRole: career.role, targetRoleLabel: career.roleLabel, targetLevel: career.band, experienceMonths: career.experienceMonths, job: career.jobTitle },
      engine,
      skillStateModel: `${SKILL_STATE_MODEL.name}@${SKILL_STATE_MODEL.version}`,
      latestTraining: training,
    };
  }));

  /** Every concept the engine tracks for this student. */
  r.get("/skill-map", handler(async (req) => {
    const me = currentUser(req);
    const states = (await prisma.studentSkillState.findMany({ where: { userId: me.id }, orderBy: [{ mastery: "asc" }] })).map(stateView);
    return { topics: states.filter((s) => s.kind === "topic"), skills: states.filter((s) => s.kind === "skill") };
  }));

  /** The platform's readiness score, plus what the skill state says about it. */
  r.get("/readiness", handler(async (req) => {
    const me = currentUser(req);
    const [readiness, states] = await Promise.all([computeReadiness(me.id), prisma.studentSkillState.findMany({ where: { userId: me.id, conceptId: { startsWith: "skill:" } } })]);
    const evidenced = states.filter((s) => s.attempts > 0);
    return {
      readiness,
      skills: {
        tracked: states.length,
        withEvidence: evidenced.length,
        strong: evidenced.filter((s) => s.mastery >= 0.75).map((s) => s.label),
        weak: evidenced.filter((s) => s.mastery < 0.5).map((s) => s.label),
      },
    };
  }));

  /** Interview → recommendation → next interview: per-skill change between the last two interviews. */
  r.get("/interview-progress", handler(async (req) => interviewProgress(currentUser(req).id)));

  /** Low-stakes interaction events from the browser (allow-listed; never scores or outcomes). */
  r.post("/events", handler(async (req, res) => {
    const me = currentUser(req);
    const body = parse(
      z.object({
        eventType: z.enum(CLIENT_EVENTS),
        entityType: z.string(),
        entityId: z.string().min(1).max(100),
        metadata: z.record(z.union([z.string().max(200), z.number(), z.boolean()])).refine((m) => Object.keys(m).length <= 10, "Too many metadata fields.").optional(),
      }),
      req.body,
    );
    if (!(CLIENT_ENTITY[body.eventType] as string[]).includes(body.entityType)) throw badRequest(`${body.eventType} can't be about ${body.entityType}.`);
    // The entity must exist and (where it is personal) belong to this student.
    const owned =
      body.entityType === "TOPIC"
        ? await prisma.topic.count({ where: { slug: body.entityId, status: "PUBLISHED" } })
        : body.entityType === "PREP_QUESTION"
          ? await prisma.prepQuestion.count({ where: { id: body.entityId, rank: { gt: 0 }, plan: { userId: me.id } } })
          : body.entityType === "JOB"
            ? await prisma.jobTarget.count({ where: { id: body.entityId, userId: me.id } })
            : 0;
    if (!owned) throw notFound(body.entityType === "TOPIC" ? "Topic" : body.entityType === "JOB" ? "Job" : "Question");
    const event = await prisma.learningEvent.create({
      data: { userId: me.id, type: "client_event", eventType: body.eventType, entityType: body.entityType, entityId: body.entityId, meta: (body.metadata ?? {}) as Prisma.InputJsonValue },
      select: { id: true, eventType: true, entityType: true, entityId: true, createdAt: true },
    });
    res.status(201);
    return event;
  }));

  /** What the student did with a recommendation. Success/failure labels are system-only (resolved from activity). */
  r.post("/feedback", handler(async (req, res) => {
    const me = currentUser(req);
    const body = parse(z.object({ recommendationId: z.string().min(1).max(40), action: z.enum(FEEDBACK_ACTIONS) }), req.body);
    const rec = await prisma.recommendation.findFirst({ where: { id: body.recommendationId, userId: me.id } });
    if (!rec) throw notFound("Recommendation");
    // "Shown" once per recommendation, so repeated renders don't inflate it.
    if (body.action === "SHOWN" && rec.shownAt) return { recorded: false };
    await prisma.$transaction([
      prisma.recommendationFeedback.create({ data: { recommendationId: rec.id, userId: me.id, action: body.action } }),
      ...(body.action === "SHOWN" ? [prisma.recommendation.update({ where: { id: rec.id }, data: { shownAt: new Date() } })] : []),
      ...(body.action === "SKIPPED" && rec.status === "ACTIVE" ? [prisma.recommendation.update({ where: { id: rec.id }, data: { status: "DISMISSED", shownAt: rec.shownAt ?? new Date() } })] : []),
    ]);
    res.status(201);
    return { recorded: true };
  }));

  /** Force a recompute (e.g. after a big change like a new resume). Same throttle as reads. */
  r.post("/refresh", handler(async (req) => {
    const me = currentUser(req);
    const run = await refreshIfStale(me.id, { force: true });
    return { refreshed: run.refreshed, engine: "engine" in run ? run.engine : await lastEngine(me.id) };
  }));

  /** Which ranker is live and whether the ML model is trained (no secrets, no other students' data). */
  r.get("/model", handler(async () => {
    const [info, training] = await Promise.all([mlModelInfo(), prisma.mLTrainingRun.findMany({ where: { modelName: "recommendation-success" }, orderBy: { startedAt: "desc" }, take: 5 })]);
    return { service: info, trainingRuns: training };
  }));

  return r;
}
