import { createServer, type Server } from "node:http";
import { existsSync } from "node:fs";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { login, resetDb, seedFixture } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { normalizeEvent } from "../src/modules/personalization/events.js";
import { baselineScore, estimateDifficulty, estimateSkillState, type CandidateFeatures, type Observation } from "../src/modules/personalization/model.js";
import { explain } from "../src/modules/personalization/explain.js";
import { careerContext, conceptStates, loadStudentData, studentFeatures } from "../src/modules/personalization/data.js";
import { refresh } from "../src/modules/personalization/engine.js";
import { exportDataset, trainRecommendationModel } from "../src/modules/personalization/training.js";
import { ML_FEATURES } from "../src/modules/personalization/ranker.js";

const fake = new FakeAI();
const DAY = 86_400_000;
const RESUME = [
  "Riya Sharma — Backend developer",
  "Projects",
  "Notes API: Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication.",
  "Experience",
  "Backend intern at Acme for 6 months building REST APIs.",
  "Education",
  "B.Tech CSE 2026. Skills: JavaScript, Node.js, Express, MongoDB, Docker.",
].join("\n");

beforeAll(async () => {
  await resetDb();
  await seedFixture();
  await prisma.featureFlag.create({ data: { key: "AI_INTERVIEW", description: "", enabled: true } });
  setAIProvider(fake);
});
afterAll(() => {
  setAIProvider(undefined);
  delete process.env.ML_SERVICE_URL;
});

// ───────────────────────── pure units ─────────────────────────

describe("events", () => {
  it("normalizes server events with the entity they are about", () => {
    expect(normalizeEvent("quiz_submitted", "t1", { kind: "MASTERY", score: 80 })).toEqual({ eventType: "QUIZ_COMPLETED", entityType: "TOPIC", entityId: "t1" });
    expect(normalizeEvent("build_submitted", "t1", { task: "alpha-build", passedCount: 1, total: 3 })).toEqual({ eventType: "BUILD_FAILED", entityType: "BUILD_TASK", entityId: "alpha-build" });
    expect(normalizeEvent("build_submitted", "t1", { task: "alpha-build", passedCount: 3, total: 3 }).eventType).toBe("BUILD_SUBMITTED");
    expect(normalizeEvent("prep_practice", null, { questionId: "q9", score: 70 })).toEqual({ eventType: "QUESTION_ANSWERED", entityType: "PREP_QUESTION", entityId: "q9" });
    expect(normalizeEvent("interview_completed", null, { sessionId: "s1" })).toEqual({ eventType: "INTERVIEW_COMPLETED", entityType: "INTERVIEW_SESSION", entityId: "s1" });
    expect(normalizeEvent("login", null, {})).toEqual({ eventType: null, entityType: null, entityId: null });
  });
});

describe("skill state", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * DAY);
  const quiz = (score: number, daysAgo: number): Observation => ({ source: "quiz", score, at: at(daysAgo), weight: 1 });

  it("one quiz moves mastery but never decides it; repeated evidence builds confidence", () => {
    const one = estimateSkillState([quiz(1, 1)], { now, prior: 0.3, priorWeight: 1 });
    expect(one.mastery).toBeLessThan(0.7);
    expect(one.confidence).toBeLessThan(0.3);
    const many = estimateSkillState([1, 2, 3, 5, 8].map((d) => quiz(0.95, d)), { now, prior: 0.3, priorWeight: 1 });
    expect(many.mastery).toBeGreaterThan(0.8);
    expect(many.confidence).toBeGreaterThan(0.7);
    expect(many.correctAttempts).toBe(5);
    expect(many.signals.quiz).toBe(5);
  });

  it("forgetting risk grows with time and shrinks with successful recalls on separate days", () => {
    const recent = estimateSkillState([quiz(0.9, 1)], { now, prior: 0.3, priorWeight: 1 });
    const old = estimateSkillState([quiz(0.9, 20)], { now, prior: 0.3, priorWeight: 1 });
    expect(old.forgettingRisk).toBeGreaterThan(recent.forgettingRisk);
    const spaced = estimateSkillState([quiz(0.9, 30), quiz(0.9, 25), quiz(0.9, 20)], { now, prior: 0.3, priorWeight: 1 });
    const crammed = estimateSkillState([quiz(0.9, 20), { ...quiz(0.9, 20), at: new Date(at(20).getTime() + 60_000) }, { ...quiz(0.9, 20), at: new Date(at(20).getTime() + 120_000) }], { now, prior: 0.3, priorWeight: 1 });
    expect(spaced.forgettingRisk).toBeLessThan(crammed.forgettingRisk);
    expect(recent.nextReview!.getTime()).toBeGreaterThan(recent.lastSeen!.getTime());
    // The curriculum's review schedule wins when there is one.
    const scheduled = new Date("2026-10-20T00:00:00Z");
    expect(estimateSkillState([quiz(0.9, 1)], { now, prior: 0.3, priorWeight: 1, scheduledReview: scheduled }).nextReview).toEqual(scheduled);
    // No evidence → nothing to forget, no confidence.
    expect(estimateSkillState([], { now, prior: 0.5, priorWeight: 1, resumePrior: true })).toMatchObject({ mastery: 0.5, confidence: 0, forgettingRisk: 0, attempts: 0, signals: { resumePrior: true } });
  });

  it("difficulty: cold start below 5 answers; otherwise the hardest level still succeeded at ≥ 70%", () => {
    const o = (difficulty: number, score: number, daysAgo = 1): Observation => ({ source: "prep", score, at: at(daysAgo), weight: 1, difficulty });
    expect(estimateDifficulty([o(1, 1), o(2, 1)], { now, coldStartHint: "easy" })).toMatchObject({ level: "easy", status: "cold_start", confidence: 0.2 });
    const mid = estimateDifficulty([o(1, 0.9), o(2, 0.9), o(2, 0.95), o(3, 0.85), o(3, 0.8), o(3, 0.9), o(4, 0.3), o(5, 0.2)], { now, coldStartHint: "easy" });
    expect(mid).toMatchObject({ level: "medium", status: "learned" });
    expect(mid.byLevel.hard.answers).toBe(2);
    const flying = estimateDifficulty([o(1, 1), o(2, 1), o(3, 1), o(3, 0.95), o(3, 0.95), o(4, 0.4)], { now, coldStartHint: "easy" });
    expect(flying.trend).toBe("increase");
  });

  it("baseline ranking: a weak, relevant, interview-weak skill outranks a strong, irrelevant one", () => {
    const f = (o: Partial<CandidateFeatures>): CandidateFeatures => ({ skillGap: 0, jobRelevance: 0, forgettingRisk: 0, prerequisiteReadiness: 1, interviewRelevance: 0, successProbability: 0.5, mastery: 1, confidence: 1, questionImportance: 0, dueForReview: 0, ...o });
    expect(baselineScore(f({ skillGap: 0.8, jobRelevance: 1, interviewRelevance: 0.8 }))).toBeGreaterThan(baselineScore(f({ skillGap: 0.1, jobRelevance: 0.2 })));
    expect(baselineScore(f({ skillGap: 0.8, jobRelevance: 1, interviewRelevance: 0.8 }))).toBe(0.3 * 0.8 + 0.2 + 0.15 + 0.08 + 0.05);
  });

  it("explanations only state numbers that exist", () => {
    expect(explain({ action: "PRACTICE_SKILL", subject: "Caching", reasons: ["interview_weakness", "high_role_relevance"], facts: { interviewAverage: 29, role: "Backend Developer" } })).toBe("Your interview answers on Caching averaged 29%. It's core for a Backend Developer role.");
    expect(explain({ action: "PRACTICE_SKILL", subject: "Redis", reasons: ["not_yet_practised"], facts: {} })).toBe("You haven't practised Redis yet.");
  });
});

// ───────────────────────── integration ─────────────────────────

async function resumeFor(agent: Awaited<ReturnType<typeof login>>["agent"]) {
  const r = await agent.post("/api/career/resumes").send({ text: RESUME, label: "Main CV" });
  if (r.status !== 201) throw new Error(`resume upload ${r.status}: ${JSON.stringify(r.body)}`);
  return r.body.data.id as string;
}

const ev = (s: number) => ({ correctness: s, completeness: s, depth: s, reasoning: s, understanding: s, practical: s, feedback: "f", strengths: [], gaps: [] });

/** A student with a completed interview (weak on Caching, strong on Node.js) and a Top-100 plan. */
async function studentWithHistory() {
  const u = await login();
  const resumeId = await resumeFor(u.agent);
  const answered = new Date(Date.now() - 2 * DAY);
  await prisma.interviewSession.create({
    data: {
      userId: u.id, consent: {}, status: "COMPLETED",
      turns: {
        create: [
          { order: 0, kind: "QUESTION", question: "How does cache invalidation work?", skill: "Caching", category: "CONCEPTUAL", evaluation: ev(2), answeredAt: answered },
          { order: 1, kind: "QUESTION", question: "What is a cache stampede?", skill: "Caching", category: "CONCEPTUAL", evaluation: ev(3), answeredAt: answered },
          { order: 2, kind: "QUESTION", question: "Explain the event loop.", skill: "Node.js", category: "SKILL", evaluation: ev(9), answeredAt: answered },
          { order: 3, kind: "QUESTION", question: "How do streams work?", skill: "Node.js", category: "SKILL", evaluation: ev(9), answeredAt: answered },
        ],
      },
    },
  });
  const q = (rank: number, skill: string, difficulty: number, probability: number) => ({
    rank, stage: difficulty <= 2 ? 1 : difficulty === 3 ? 2 : 3, category: "SKILL" as const, priority: "IMPORTANT" as const, question: `${skill} question ${rank}: how would you handle it?`, skill, probability, difficulty, followUpDepth: 3, why: "w", sourceType: "ROLE", sourceLabel: "Backend Developer", hint: "h",
  });
  const plan = await prisma.prepPlan.create({
    data: {
      userId: u.id, resumeId, targetRole: "backend", title: "Backend Developer", status: "READY", progress: {}, allocation: {},
      questions: { create: [q(1, "Node.js", 2, 0.9), q(2, "Node.js", 4, 0.5), q(3, "Caching", 2, 0.9), q(4, "Caching", 3, 0.7)] },
    },
    include: { questions: true },
  });
  const nodeQ = plan.questions.find((x) => x.rank === 1)!;
  await prisma.prepAttempt.create({ data: { questionId: nodeQ.id, userId: u.id, answer: "a", score: 92, evaluation: {}, createdAt: answered } });
  return { ...u, resumeId, plan };
}

describe("personalization API", () => {
  it("cold start: a new student gets roadmap-led recommendations from the baseline, honestly labelled", async () => {
    const { agent, id } = await login();
    const res = await agent.get("/api/personalization/next");
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.coldStart).toBe(true);
    expect(d.engine).toMatchObject({ mode: "baseline", modelStatus: "not_configured", modelName: "baseline-weighted", modelVersion: "1" });
    expect(d.next, JSON.stringify(d.next)).toMatchObject({ action: "LEARN_TOPIC", itemId: "alpha", href: "/learn/topic/alpha" });
    expect(d.next.reasons.map((r: { code: string }) => r.code)).toEqual(expect.arrayContaining(["next_in_roadmap", "prerequisites_satisfied"]));
    expect(d.next.why).toMatch(/next on your roadmap/);
    expect(d.difficulty).toMatchObject({ level: "easy", status: "cold_start" }); // from onboarding: BEGINNER
    // Every score and estimate is recorded with its model.
    const preds = await prisma.mLPrediction.findMany({ where: { userId: id } });
    expect(preds.filter((p) => p.target === "RECOMMENDATION_SCORE").every((p) => p.modelName === "baseline-weighted" && p.modelVersion === "1" && p.confidence === null)).toBe(true);
    expect(preds.find((p) => p.target === "OPTIMAL_DIFFICULTY")).toMatchObject({ modelName: "difficulty-baseline", modelVersion: "1", confidence: 0.2 });
    // A student with nothing at all (not onboarded, no resume) still gets an answer.
    const bare = await login("STUDENT", { onboard: false });
    expect((await bare.agent.get("/api/personalization/next")).status).toBe(200);
  });

  it("interview results and practice feed skill state; weak, relevant skills rise to the top", async () => {
    const s = await studentWithHistory();
    await refresh(s.id);
    const states = await prisma.studentSkillState.findMany({ where: { userId: s.id } });
    const caching = states.find((x) => x.conceptId === "skill:caching")!;
    const node = states.find((x) => x.conceptId === "skill:nodejs")!;
    expect(caching.mastery).toBeLessThan(0.5);
    expect(node.mastery).toBeGreaterThan(caching.mastery);
    expect(caching.signals).toMatchObject({ interview: 2, interviewAverage: 0.25, inRole: true }); // answers scored 20 and 30
    expect(node.signals).toMatchObject({ interview: 2, prep: 1, resumePrior: true, onResume: true });
    expect(caching.modelVersion).toBe("skill-state-baseline@1");

    const next = (await s.agent.get("/api/personalization/next")).body.data;
    expect(next.interviewWeaknesses.map((x: { conceptId: string }) => x.conceptId)).toContain("skill:caching");
    expect(next.skillGaps.map((x: { conceptId: string }) => x.conceptId)).toContain("skill:caching");
    const recs = (await s.agent.get("/api/personalization/recommendations")).body.data as { action: string; itemId: string; rank: number; reasons: { code: string }[]; why: string; features: Record<string, number> }[];
    const cachingRec = recs.find((r) => r.action === "PRACTICE_SKILL" && r.itemId === "caching")!;
    expect(cachingRec.reasons.map((r) => r.code)).toEqual(expect.arrayContaining(["interview_weakness", "high_role_relevance"]));
    expect(cachingRec.why).toMatch(/interview answers on Caching averaged 25%/);
    expect(cachingRec.features.interviewRelevance).toBe(0.75);
    const nodeRec = recs.find((r) => r.action === "PRACTICE_SKILL" && r.itemId === "nodejs");
    if (nodeRec) expect(cachingRec.rank).toBeLessThan(nodeRec.rank);
    // The matching Top-100 question is suggested at the student's level.
    expect(recs.some((r) => r.action === "PRACTICE_QUESTION" && r.features.questionImportance >= 0.7)).toBe(true);
  });

  it("features are reproducible from the database", async () => {
    const s = await studentWithHistory();
    const now = new Date();
    const a = await loadStudentData(s.id, now);
    const b = await loadStudentData(s.id, now);
    expect(JSON.stringify(studentFeatures(a, careerContext(a)))).toBe(JSON.stringify(studentFeatures(b, careerContext(b))));
    expect(JSON.stringify(conceptStates(a, careerContext(a)))).toBe(JSON.stringify(conceptStates(b, careerContext(b))));
    expect(studentFeatures(a, careerContext(a))).toMatchObject({ interviewAnswers: 4, prepAnswers: 1, targetRole: "backend", targetLevel: "STUDENT" });
  });

  it("events: server events are normalized; the browser can only send allow-listed, owned, score-free events", async () => {
    const s = await studentWithHistory();
    const other = await studentWithHistory();
    const uploaded = await prisma.learningEvent.findFirst({ where: { userId: s.id, eventType: "RESUME_UPLOADED" } });
    expect(uploaded).toMatchObject({ entityType: "RESUME", entityId: s.resumeId });

    const ok = await s.agent.post("/api/personalization/events").send({ eventType: "TOPIC_REVISITED", entityType: "TOPIC", entityId: "alpha", metadata: { from: "dashboard" } });
    expect(ok.status).toBe(201);
    expect(ok.body.data).toMatchObject({ eventType: "TOPIC_REVISITED", entityType: "TOPIC", entityId: "alpha" });
    const q = s.plan.questions[0].id;
    expect((await s.agent.post("/api/personalization/events").send({ eventType: "QUESTION_SKIPPED", entityType: "PREP_QUESTION", entityId: q })).status).toBe(201);
    // Not allowed from the client: anything carrying a score or outcome.
    expect((await s.agent.post("/api/personalization/events").send({ eventType: "QUIZ_COMPLETED", entityType: "TOPIC", entityId: "alpha", metadata: { score: 100 } })).status).toBe(400);
    expect((await s.agent.post("/api/personalization/events").send({ eventType: "TOPIC_REVISITED", entityType: "JOB", entityId: "alpha" })).status).toBe(400);
    expect((await s.agent.post("/api/personalization/events").send({ eventType: "TOPIC_REVISITED", entityType: "TOPIC", entityId: "no-such-topic" })).status).toBe(404);
    // Another student's question is not yours to report on.
    expect((await s.agent.post("/api/personalization/events").send({ eventType: "QUESTION_SKIPPED", entityType: "PREP_QUESTION", entityId: other.plan.questions[0].id })).status).toBe(404);
    const big = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`k${i}`, i]));
    expect((await s.agent.post("/api/personalization/events").send({ eventType: "TOPIC_REVISITED", entityType: "TOPIC", entityId: "alpha", metadata: big })).status).toBe(400);
  });

  it("feedback and authorization: only your own recommendations; success labels are system-only", async () => {
    const a = await studentWithHistory();
    const b = await login();
    const recs = (await a.agent.get("/api/personalization/recommendations")).body.data as { id: string }[];
    const id = recs[0].id;
    expect((await a.agent.post("/api/personalization/feedback").send({ recommendationId: id, action: "SHOWN" })).body.data).toEqual({ recorded: true });
    expect((await a.agent.post("/api/personalization/feedback").send({ recommendationId: id, action: "SHOWN" })).body.data).toEqual({ recorded: false });
    expect((await a.agent.post("/api/personalization/feedback").send({ recommendationId: id, action: "SUCCESSFUL" })).status).toBe(400);
    expect((await b.agent.post("/api/personalization/feedback").send({ recommendationId: id, action: "ACCEPTED" })).status).toBe(404);
    const bRecs = (await b.agent.get("/api/personalization/recommendations")).body.data as { id: string }[];
    expect(bRecs.some((r) => r.id === id)).toBe(false);
    expect((await b.agent.get("/api/personalization/skill-map")).body.data.skills.some((s: { conceptId: string; attempts: number }) => s.conceptId === "skill:caching" && s.attempts > 0)).toBe(false);
    const skip = recs[1].id;
    await a.agent.post("/api/personalization/feedback").send({ recommendationId: skip, action: "SKIPPED" });
    expect((await prisma.recommendation.findUniqueOrThrow({ where: { id: skip } })).status).toBe("DISMISSED");
    // Unauthenticated: nothing.
    const { default: supertest } = await import("supertest");
    const { createApp } = await import("../src/server/app.js");
    expect((await supertest(createApp()).get("/api/personalization/next")).status).toBe(401);
  });

  it("feedback loop: outcomes are resolved from real activity and become training rows", async () => {
    const s = await studentWithHistory();
    const t0 = new Date();
    await refresh(s.id, t0);
    const cachingQ = await prisma.recommendation.findFirstOrThrow({ where: { userId: s.id, action: "PRACTICE_QUESTION", status: "ACTIVE" } });
    const skill = await prisma.recommendation.findFirstOrThrow({ where: { userId: s.id, action: "PRACTICE_SKILL", itemId: "caching" } });
    await prisma.recommendation.updateMany({ where: { id: { in: [cachingQ.id, skill.id] } }, data: { shownAt: t0 } });
    // The student answers the suggested question well…
    await prisma.prepAttempt.create({ data: { questionId: cachingQ.itemId, userId: s.id, answer: "a", score: 85, evaluation: {}, createdAt: new Date(t0.getTime() + 60_000) } });
    await refresh(s.id, new Date(t0.getTime() + 120_000));
    const done = await prisma.recommendation.findUniqueOrThrow({ where: { id: cachingQ.id }, include: { feedback: true } });
    expect(done).toMatchObject({ status: "DONE", outcome: "SUCCESS" });
    expect(done.feedback.map((f) => [f.action, f.source]).sort()).toEqual([["COMPLETED", "SYSTEM"], ["SUCCESSFUL", "SYSTEM"]]);

    // …and a shown recommendation nobody acted on expires as a negative example after a week.
    const open = await prisma.recommendation.findFirstOrThrow({ where: { userId: s.id, status: "ACTIVE", shownAt: null, action: "LEARN_TOPIC" } });
    await prisma.recommendation.update({ where: { id: open.id }, data: { shownAt: t0 } });
    await refresh(s.id, new Date(t0.getTime() + 8 * DAY));
    expect(await prisma.recommendation.findUniqueOrThrow({ where: { id: open.id } })).toMatchObject({ status: "EXPIRED", outcome: "FAILURE" });

    const rows = await exportDataset();
    const mine = rows.filter((r) => r.id === cachingQ.id || r.id === open.id);
    expect(mine.map((r) => r.label).sort()).toEqual([0, 1]);
    expect(Object.keys(mine[0].features)).toEqual([...ML_FEATURES]);
    // Never-shown recommendations are never training rows.
    const unshown = await prisma.recommendation.findMany({ where: { userId: s.id, shownAt: null }, select: { id: true } });
    expect(rows.some((r) => unshown.some((u) => u.id === r.id))).toBe(false);
  });

  const mlDir = path.resolve(import.meta.dirname, "../../ml-service");
  it.skipIf(!existsSync(path.join(mlDir, ".venv/bin/python")))("training refuses to fit on too little data and records the run", async () => {
    const run = await trainRecommendationModel({ mlDir });
    expect(run.status).toBe("INSUFFICIENT_DATA");
    expect(run.modelVersion).toBeNull();
    expect(run.datasetSize).toBeGreaterThanOrEqual(2);
    expect(run.features).toEqual([...ML_FEATURES]);
    expect(run.metrics).toMatchObject({ model: "INSUFFICIENT_DATA", product: { rates: "INSUFFICIENT_DATA", learningImprovement: "INSUFFICIENT_DATA" } });
    expect(run.notes).toMatch(/Not trained/);
  }, 60_000);
});

describe("ML service integration and fallback", () => {
  let server: Server;
  let mode: "trained" | "cold" | "slow" | "error" = "trained";
  let seenToken = "";
  beforeAll(async () => {
    server = createServer((req, res) => {
      seenToken = String(req.headers["x-ml-token"] ?? "");
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const items = (JSON.parse(body || "{}").items ?? []) as { id: string; features: Record<string, number> }[];
        const reply = () => {
          if (mode === "cold") return res.writeHead(503, { "content-type": "application/json" }).end(JSON.stringify({ model_status: "cold_start" }));
          if (mode === "error") return res.writeHead(500).end("boom");
          // A "trained" model that simply prefers revisions and topics over skills — distinguishable from the baseline.
          const scores = Object.fromEntries(items.map((i) => [i.id, i.features.action_LEARN_TOPIC ? 0.99 : 0.1 + i.features.skillGap * 0.1]));
          res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ model_status: "trained", model_name: "recommendation-success", model_version: "test-v1", scores }));
        };
        if (mode === "slow") setTimeout(reply, 1500);
        else reply();
      });
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    process.env.ML_SERVICE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    process.env.ML_SERVICE_TOKEN = "internal-test-token";
  });
  afterAll(async () => {
    delete process.env.ML_SERVICE_URL;
    delete process.env.ML_TIMEOUT_MS;
    await new Promise((r) => server.close(r));
  });

  it("uses the trained model when it answers, and records its version on every score", async () => {
    mode = "trained";
    const s = await studentWithHistory();
    const run = await refresh(s.id);
    expect(run.engine).toMatchObject({ mode: "ml", modelStatus: "trained", modelName: "recommendation-success", modelVersion: "test-v1" });
    expect(seenToken).toBe("internal-test-token");
    const recs = await prisma.recommendation.findMany({ where: { userId: s.id, status: "ACTIVE" }, orderBy: { rank: "asc" } });
    expect(recs[0].action).toBe("LEARN_TOPIC"); // the model's order, not the baseline's
    expect(recs.every((r) => r.modelName === "recommendation-success" && r.modelVersion === "test-v1")).toBe(true);
    const preds = await prisma.mLPrediction.findMany({ where: { userId: s.id, target: "RECOMMENDATION_SCORE" } });
    expect(preds.every((p) => p.modelVersion === "test-v1")).toBe(true);
    // The baseline score is kept alongside for audit.
    expect((recs[0].features as { baselineScore: number }).baselineScore).toBeGreaterThan(0);
  });

  it.each([
    ["cold", "cold_start"],
    ["error", "error"],
    ["slow", "timeout"],
  ] as const)("falls back to the baseline when the service is %s", async (m, status) => {
    mode = m;
    process.env.ML_TIMEOUT_MS = "300";
    const s = await studentWithHistory();
    const run = await refresh(s.id);
    expect(run.engine).toMatchObject({ mode: "baseline", modelStatus: status, modelName: "baseline-weighted" });
    expect(await prisma.recommendation.count({ where: { userId: s.id, status: "ACTIVE" } })).toBeGreaterThan(0);
    delete process.env.ML_TIMEOUT_MS;
  });

  it("falls back when the service is down", async () => {
    const saved = process.env.ML_SERVICE_URL;
    process.env.ML_SERVICE_URL = "http://127.0.0.1:9"; // nothing listens here
    try {
      const s = await studentWithHistory();
      const res = await s.agent.get("/api/personalization/next");
      expect(res.status).toBe(200);
      expect(res.body.data.engine).toMatchObject({ mode: "baseline", modelStatus: "unavailable" });
      expect(res.body.data.next).not.toBeNull();
    } finally {
      process.env.ML_SERVICE_URL = saved;
    }
  });
});

describe("Top-100 integration", () => {
  it("adds a 'for you' order without changing the existing contract", async () => {
    delete process.env.ML_SERVICE_URL;
    const s = await studentWithHistory();
    const base = (await s.agent.get(`/api/career/prep/${s.plan.id}/questions/page`)).body.data;
    expect(base.items.map((q: { rank: number }) => q.rank)).toEqual([1, 2, 3, 4]);
    expect(base.items[0].personal).toBeUndefined();
    const mine = (await s.agent.get(`/api/career/prep/${s.plan.id}/questions/page`).query({ sort: "personal" })).body.data;
    expect(mine.total).toBe(4);
    // Caching (weak in the interview) before Node.js (strong, already answered well).
    expect(mine.items[0].skill).toBe("Caching");
    expect(mine.items[0].personal.reasons).toEqual(expect.arrayContaining(["interview_weakness", "high_role_relevance"]));
    const nodeAnswered = mine.items.find((q: { rank: number }) => q.rank === 1);
    expect(nodeAnswered.personal.score).toBeLessThan(mine.items[0].personal.score);
    const other = await login();
    expect((await other.agent.get(`/api/career/prep/${s.plan.id}/questions/page`).query({ sort: "personal" })).status).toBe(404);
  });
});
