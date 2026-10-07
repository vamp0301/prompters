import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Worker } from "bullmq";
import { login, resetDb, seedFixture } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { allocateQuestions, calibratePriorities, DEFAULT_ALLOCATION, priorityFor, rankQuestions, TOTAL_QUESTIONS } from "../src/modules/prep/allocation.js";
import { sevenDayPlan, skillFocus } from "../src/modules/prep/pack.service.js";
import { fontRuns } from "../src/modules/prep/pdf.js";
import { canonicalSkill, evidenceInResume, sectionize, skillMatcher, verbatimEvidence } from "../src/modules/prep/text.js";
import { validateBatch, type Source, type ValidationContext } from "../src/modules/prep/validator.js";
import { startPrepWorker } from "../src/workers/prep-worker.js";
import { selectTop } from "../src/modules/prep/generation.service.js";

const fake = new FakeAI();
const RESUME = [
  "Riya Sharma — Backend developer",
  "Projects",
  "Notes API: Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication.",
  "Experience",
  "Backend intern at Acme for 6 months building REST APIs.",
  "Achievements",
  "2★ CodeChef",
  "Education",
  "B.Tech CSE 2026. Skills: JavaScript, Node.js, Express, MongoDB, Docker.",
].join("\n");
const JD = "Backend Developer at Zeta. Required: Node.js, Express, MongoDB, Redis, AWS. Nice to have: Docker. Build and scale APIs.";

let worker: Worker | undefined;
beforeAll(async () => {
  await resetDb();
  await seedFixture();
  await prisma.featureFlag.create({ data: { key: "AI_INTERVIEW", description: "", enabled: true } });
  setAIProvider(fake);
  worker = startPrepWorker();
});
afterAll(async () => {
  setAIProvider(undefined);
  await worker?.close();
});

type Agent = Awaited<ReturnType<typeof login>>["agent"];

async function waitFor<T>(fn: () => Promise<T>, done: (v: T) => boolean, ms = 20_000): Promise<T> {
  const until = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (done(v) || Date.now() > until) return v;
    await new Promise((r) => setTimeout(r, 100));
  }
}

const planStatus = (agent: Agent, id: string) => waitFor(() => agent.get(`/api/career/prep/${id}`).then((r) => r.body.data), (p) => p.status === "READY" || p.status === "FAILED");

async function resumeFor(agent: Agent) {
  return (await agent.post("/api/career/resumes").send({ text: RESUME, label: "Main CV" })).body.data.id as string;
}

// ───────────────────────── pure units ─────────────────────────

describe("allocation", () => {
  it("matches the default table for a resume with plenty of material and always sums to 100", () => {
    expect(allocateQuestions({ projects: 3, claims: 8, achievements: 3, gapSkills: 0 })).toEqual(DEFAULT_ALLOCATION);
    for (const projects of [0, 1, 2, 4, 7]) {
      for (const claims of [0, 1, 4, 12]) {
        for (const achievements of [0, 1, 5]) {
          const a = allocateQuestions({ projects, claims, achievements, gapSkills: 3 });
          expect(Object.values(a).reduce((x, y) => x + y, 0)).toBe(TOTAL_QUESTIONS);
          if (!projects) expect(a.PROJECT).toBe(0);
          if (!claims) expect(a.CLAIM).toBe(0);
          if (!achievements) expect(a.ACHIEVEMENT).toBe(0);
        }
      }
    }
  });

  it("gives project-heavy resumes more project questions", () => {
    expect(allocateQuestions({ projects: 5, claims: 8, achievements: 0, gapSkills: 0 }).PROJECT).toBeGreaterThan(allocateQuestions({ projects: 1, claims: 8, achievements: 0, gapSkills: 0 }).PROJECT);
  });

  it("derives priority from probability and ranks INTENSE first", () => {
    expect([0.95, 0.7, 0.5, 0.1].map(priorityFor)).toEqual(["INTENSE", "IMPORTANT", "GOOD", "MAY_BE_ASKED"]);
    const ranked = rankQuestions([
      { priority: "GOOD" as const, probability: 0.5, category: "SKILL" as const, difficulty: 1 },
      { priority: "INTENSE" as const, probability: 0.85, category: "SKILL" as const, difficulty: 1 },
      { priority: "INTENSE" as const, probability: 0.85, category: "PROJECT" as const, difficulty: 1 },
    ]);
    expect(ranked.map((q) => `${q.priority}:${q.category}`)).toEqual(["INTENSE:PROJECT", "INTENSE:SKILL", "GOOD:SKILL"]);
  });
});

describe("priority calibration", () => {
  it("spreads an over-confident bank across all four bands but never above the probability band", () => {
    const p = calibratePriorities(Array.from({ length: 100 }, () => ({ probability: 0.95 })));
    expect([p.filter((x) => x === "INTENSE").length, p.filter((x) => x === "IMPORTANT").length, p.filter((x) => x === "GOOD").length, p.filter((x) => x === "MAY_BE_ASKED").length]).toEqual([25, 30, 25, 20]);
    expect(calibratePriorities([{ probability: 0.3 }, { probability: 0.9 }])[0]).toBe("MAY_BE_ASKED");
  });
});

describe("final selection", () => {
  it("fills each category up to its allocation, then backfills from the best leftovers", () => {
    const mk = (category: "SKILL" | "PROJECT", n: number, p: number) => Array.from({ length: n }, (_, i) => ({ category, probability: p - i / 1000, priority: priorityFor(p), difficulty: 2, id: `${category}${i}` }));
    const rows = [...mk("SKILL", 80, 0.9), ...mk("PROJECT", 15, 0.5)];
    const picked = selectTop(rows, { ...DEFAULT_ALLOCATION, SKILL: 70, PROJECT: 30, GENERAL: 0, CLAIM: 0, ACHIEVEMENT: 0, CONCEPTUAL: 0, SCENARIO: 0 });
    expect(picked).toHaveLength(95);
    expect(picked.filter((r) => r.category === "PROJECT")).toHaveLength(15);
    expect(picked.filter((r) => r.category === "SKILL")).toHaveLength(80); // 70 allocated + 10 backfilled for PROJECT's shortfall
  });
});

describe("resume text helpers", () => {
  it("splits a resume into typed sections", () => {
    const s = sectionize(RESUME);
    expect(s.map((x) => x.kind)).toEqual(["SUMMARY", "PROJECT", "EXPERIENCE", "ACHIEVEMENT", "EDUCATION"]);
    expect(sectionize("one paragraph with no headings at all")).toHaveLength(1);
  });

  it("checks evidence against the resume and maps skill aliases", () => {
    expect(evidenceInResume("Built a Notes REST API with Node.js, Express, MongoDB", RESUME)).toBe(true);
    expect(evidenceInResume("Scaled the platform to one million daily active users", RESUME)).toBe(false);
    expect(canonicalSkill("Node.js")).toBe(canonicalSkill("NodeJS"));
    const match = skillMatcher(["Node.js", "MongoDB", "Data structures"]);
    expect(match("MongoDB indexing")).toBe("MongoDB");
    expect(match("node js")).toBe("Node.js");
    expect(match("Kotlin")).toBeNull();
  });

  it("only ever returns the candidate's own words as evidence", () => {
    expect(verbatimEvidence("built a notes REST API with Node.js", RESUME)).toBe("built a notes REST API with Node.js");
    expect(verbatimEvidence("Engineered a notes service on Node.js + MongoDB with JWT", RESUME)).toBe("Notes API: Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication.");
    expect(verbatimEvidence("Led a team of twelve engineers at Google", RESUME)).toBe("");
  });

  it("splits mixed Hindi/English text into font runs", () => {
    const runs = fontRuns("आपने MongoDB क्यों चुना? 2★ → done");
    expect(runs.map(([f]) => f)).toEqual(["deva", "regular", "deva", "regular", "symbols", "regular"]);
    expect(runs.map(([, t]) => t).join("")).toContain("->");
  });
});

describe("question validator", () => {
  const project: Source = { type: "PROJECT", label: "Notes API", evidence: "Built a Notes REST API", chunkId: "chunk1" };
  const ctx = (category: ValidationContext["category"]): ValidationContext => ({
    category,
    resumeText: RESUME,
    sources: new Map([["P1", project]]),
    matchSkill: skillMatcher(["Node.js", "MongoDB", "JWT"]),
    accepted: [],
    fallbackSource: { type: "ROLE", label: "Backend Developer", evidence: "" },
  });
  const q = (over: Record<string, unknown> = {}) => ({
    question: "Why did you choose MongoDB for your Notes API instead of PostgreSQL?",
    skill: "MongoDB",
    sourceRef: "P1",
    probability: 0.9,
    difficulty: 3,
    followUpDepth: 2,
    why: "Listed in Notes API",
    evidence: "Built a Notes REST API with Node.js",
    hint: "Think about document shape.",
    keyPoints: ["schema flexibility"],
    followUps: [],
    ...over,
  });

  it("strips internal refs that leak into question text", () => {
    const { questions } = validateBatch([q({ question: "In your Notes API (P1), why did you pick MongoDB over PostgreSQL (P1, C2)?" })], ctx("PROJECT"));
    expect(questions[0].question).toBe("In your Notes API, why did you pick MongoDB over PostgreSQL?");
  });

  it("accepts a grounded question and normalises priority, depth and evidence", () => {
    const { questions, stats } = validateBatch([q(), q({ question: "What is a MongoDB index, and why does your Notes API need one?", difficulty: 5, evidence: "made up words never written anywhere" })], ctx("PROJECT"));
    expect(stats.accepted).toBe(2);
    expect(questions[0]).toMatchObject({ priority: "INTENSE", followUpDepth: 3, chunkId: "chunk1", sourceLabel: "Notes API" });
    expect(questions[1].difficulty).toBe(2); // definition questions can't be L5
    // Fabricated quote replaced by the candidate's real resume line for that project.
    expect(questions[1].evidence).toBe("Notes API: Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication.");
  });

  it("rejects HR, trivial, duplicate, unanchored, unknown-skill and malformed questions", () => {
    const c = ctx("PROJECT");
    const { stats } = validateBatch(
      [
        q(),
        q({ question: "Why did you pick MongoDB for your Notes API instead of PostgreSQL?" }),
        q({ question: "Tell me about yourself and your strengths?" }),
        q({ question: "Do you know MongoDB well enough for production?" }),
        q({ sourceRef: null, question: "How did you paginate notes in your MongoDB collection?" }),
        q({ sourceRef: "P9", question: "How did you deploy the frontend of that other system?" }),
        q({ skill: "Kotlin", question: "How does Kotlin coroutine scheduling work in your Notes API?" }),
        q({ keyPoints: [] }),
      ],
      c,
    );
    expect(stats.accepted).toBe(1);
    expect(stats.rejected).toEqual({ duplicate: 1, not_technical: 1, malformed: 1, no_source: 2, unknown_skill: 1, schema: 1 });
  });
});

describe("pack planning helpers", () => {
  it("orders skills by importance and splits the bank across a 7-day plan", () => {
    const base = { id: "", planId: "", question: "", probability: 0.5, difficulty: 2, followUpDepth: 3, why: "", evidence: "", sourceType: "", sourceLabel: "", chunkId: null, claimId: null, hint: "", keyPoints: [], followUps: [], translations: {}, status: "NEW", createdAt: new Date() };
    const qs = Array.from({ length: 20 }, (_, i) => ({
      ...base,
      rank: i + 1,
      skill: ["JWT", "MongoDB", "Redis"][i % 3],
      category: (i % 4 === 0 ? "PROJECT" : "SKILL") as "PROJECT" | "SKILL",
      priority: (i < 6 ? "INTENSE" : "GOOD") as "INTENSE" | "GOOD",
      bestScore: i % 3 === 2 ? 30 : null,
    }));
    // Same INTENSE count as JWT, but weak practice (30%) pushes Redis to the top.
    expect(skillFocus(qs).map((f) => f.skill)).toEqual(["Redis", "JWT", "MongoDB"]);
    const plan = sevenDayPlan(qs);
    expect([...plan.days.flatMap((d) => d.ranks), ...plan.deepDive].sort((a, b) => a - b)).toEqual(qs.map((q) => q.rank));
  });
});

// ───────────────────────── end to end ─────────────────────────

describe("Top-100 preparation plan", () => {
  it("generates a validated, ranked Top 100 from a resume + target role without touching V1 analyses", async () => {
    const { agent } = await login();
    const resumeId = await resumeFor(agent);
    const job = await agent.post("/api/career/jobs").send({ text: JD });
    const oldMatch = await agent.post("/api/career/analyses").send({ resumeId, jobId: job.body.data.id });
    expect(oldMatch.body.data.questions).toHaveLength(10);

    expect((await agent.post("/api/career/prep").send({ resumeId })).status).toBe(400);
    expect((await agent.post("/api/career/prep").send({ resumeId, jobId: job.body.data.id, targetRole: "backend" })).status).toBe(400);

    const created = await agent.post("/api/career/prep").send({ resumeId, targetRole: "backend" });
    expect(created.status).toBe(201);
    const plan = await planStatus(agent, created.body.data.id);
    expect(plan.status).toBe("READY");
    expect(plan.title).toBe("Backend Developer");

    // Semantic intelligence persisted: chunks incl. computed SKILL chunks; the fabricated claim was dropped.
    const chunks = await prisma.resumeChunk.findMany({ where: { resumeId } });
    expect(chunks.some((c) => c.type === "SKILL" && c.title === "Node.js")).toBe(true);
    const claims = await prisma.resumeClaim.findMany({ where: { resumeId } });
    expect(claims.map((c) => c.claim)).toEqual(["Built JWT authentication for the Notes API"]);

    const qs = (await agent.get(`/api/career/prep/${plan.id}/questions`)).body.data as { id: string; rank: number; category: string; priority: string; question: string; sourceType: string; evidence: string }[];
    expect(qs).toHaveLength(100);
    expect(qs.map((q) => q.rank)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
    expect(new Set(qs.map((q) => q.question.toLowerCase())).size).toBe(100);
    expect(qs.some((q) => /about yourself|kotlin/i.test(q.question))).toBe(false);
    for (const q of qs.filter((x) => x.category === "PROJECT")) expect(["PROJECT", "EXPERIENCE"]).toContain(q.sourceType);
    for (const q of qs.filter((x) => x.category === "CLAIM")) expect(q.sourceType).toBe("CLAIM");
    expect(qs.some((q) => q.evidence.includes("Invented quote"))).toBe(false);

    // Allocation from the resume: 2 project/experience chunks, 1 surviving claim, 1 achievement.
    const p = await prisma.prepPlan.findUniqueOrThrow({ where: { id: plan.id } });
    expect(p.allocation).toMatchObject({ PROJECT: 20, CLAIM: 4, ACHIEVEMENT: 2 });
    const v = p.validation as { rejected: Record<string, number>; accepted: number };
    // Semantic de-dup removed one paraphrase and the slot was refilled back to 100.
    expect(v.rejected.near_duplicate).toBe(1);
    expect((p.progress as { dedupe: { removed: number } }).dedupe.removed).toBe(1);
    expect(v.rejected.duplicate).toBeGreaterThan(0);
    expect(v.rejected.not_technical).toBeGreaterThan(0);
    expect(v.rejected.unknown_skill).toBeGreaterThan(0);

    // V1 analysis untouched.
    const again = await agent.get(`/api/career/analyses/${oldMatch.body.data.id}`);
    expect(again.body.data.questions).toHaveLength(10);

    // Resume intelligence is computed once per resume.
    const before = fake.calls.filter((c) => c.task === "resume_intelligence").length;
    const second = await agent.post("/api/career/prep").send({ resumeId, jobId: job.body.data.id });
    const plan2 = await planStatus(agent, second.body.data.id);
    expect(plan2.status).toBe("READY");
    expect(plan2.title).toContain("Backend Developer");
    expect(fake.calls.filter((c) => c.task === "resume_intelligence").length).toBe(before);
    // JD mode tells the model which required skills are missing.
    expect(fake.calls.filter((c) => c.task.startsWith("prep_") && c.task !== "prep_dedupe").at(-1)!.user).toMatch(/not evidenced on the resume: Redis, AWS/);
  });

  it("lets the candidate practise a question and download a pack in English and Hindi", async () => {
    const { agent } = await login();
    const other = await login();
    const resumeId = await resumeFor(agent);
    const plan = await planStatus(agent, (await agent.post("/api/career/prep").send({ resumeId, targetRole: "fullstack" })).body.data.id);
    const qs = (await agent.get(`/api/career/prep/${plan.id}/questions`)).body.data as { id: string }[];

    const detail = await agent.get(`/api/career/prep/${plan.id}/questions/${qs[0].id}`);
    expect(detail.body.data.why).toBeTruthy();
    expect(detail.body.data).not.toHaveProperty("translations");
    const attempt = await agent.post(`/api/career/prep/${plan.id}/questions/${qs[0].id}/attempts`).send({ answer: "I store the token in an HTTP-only cookie so scripts can't read it." });
    expect(attempt.status).toBe(201);
    expect(attempt.body.data.status).toBe("CONFIDENT");
    expect(attempt.body.data.keyPoints.length).toBeGreaterThan(0);
    expect((await agent.patch(`/api/career/prep/${plan.id}/questions/${qs[1].id}`).send({ status: "CONFIDENT" })).body.data.status).toBe("CONFIDENT");

    for (const language of ["en", "hi"] as const) {
      const req = await agent.post(`/api/career/prep/${plan.id}/packs`).send({ variant: "GUIDE", language });
      expect(req.status).toBe(201);
      const pack = await waitFor(() => agent.get(`/api/career/prep/${plan.id}/packs/${req.body.data.id}`).then((r) => r.body.data), (p) => p.status === "READY" || p.status === "FAILED");
      expect(pack.status).toBe("READY");
      const file = await agent.get(`/api/career/prep/${plan.id}/packs/${pack.id}/download`).buffer(true).parse((res, cb) => {
        const parts: Buffer[] = [];
        res.on("data", (b: Buffer) => parts.push(b));
        res.on("end", () => cb(null, Buffer.concat(parts)));
      });
      expect(file.headers["content-type"]).toBe("application/pdf");
      expect((file.body as Buffer).subarray(0, 5).toString()).toBe("%PDF-");
      expect((await other.agent.get(`/api/career/prep/${plan.id}/packs/${pack.id}/download`)).status).toBe(404);
    }
    // Translations are cached on the questions: a second Hindi pack doesn't translate again.
    const translated = fake.calls.filter((c) => c.task === "translate_hi").length;
    expect(translated).toBe(10);
    const again = await agent.post(`/api/career/prep/${plan.id}/packs`).send({ variant: "QUESTIONS", language: "hi" });
    await waitFor(() => agent.get(`/api/career/prep/${plan.id}/packs/${again.body.data.id}`).then((r) => r.body.data), (p) => p.status === "READY");
    expect(fake.calls.filter((c) => c.task === "translate_hi").length).toBe(translated);

    expect((await other.agent.get(`/api/career/prep/${plan.id}`)).status).toBe(404);
    expect((await other.agent.get(`/api/career/prep/${plan.id}/questions/${qs[0].id}`)).status).toBe(404);
  });

  it("reuses a saved plan, regenerates only on request, and enforces the daily limit", async () => {
    const { agent } = await login();
    const resumeId = await resumeFor(agent);
    const first = await agent.post("/api/career/prep").send({ resumeId, targetRole: "frontend" });
    expect(first.status).toBe(201);
    await planStatus(agent, first.body.data.id);

    // Same resume + target again → the saved plan, no new generation.
    const again = await agent.post("/api/career/prep").send({ resumeId, targetRole: "frontend" });
    expect(again.status).toBe(200);
    expect(again.body.data).toMatchObject({ id: first.body.data.id, reused: true });
    expect((await agent.get("/api/career/prep/usage")).body.data).toMatchObject({ limit: 3, used: 1, remaining: 2, resetAt: null });

    // Explicit regenerate → a fresh plan (2/3); a different target → 3/3.
    const regen = await agent.post("/api/career/prep").send({ resumeId, targetRole: "frontend", regenerate: true });
    expect(regen.status).toBe(201);
    expect(regen.body.data.id).not.toBe(first.body.data.id);
    await planStatus(agent, regen.body.data.id);
    const third = await agent.post("/api/career/prep").send({ resumeId, targetRole: "devops" });
    await planStatus(agent, third.body.data.id);

    // Deleting a plan doesn't give the generation back.
    await agent.delete(`/api/career/prep/${third.body.data.id}`);
    const blocked = await agent.post("/api/career/prep").send({ resumeId, targetRole: "devops" });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("PREP_DAILY_LIMIT");
    expect(blocked.body.error.message).toMatch(/3 preparation plans per day/);
    const usage = (await agent.get("/api/career/prep/usage")).body.data;
    expect(usage).toMatchObject({ used: 3, remaining: 0 });
    expect(new Date(usage.resetAt).getTime()).toBeGreaterThan(Date.now());
    // Existing plans still open; reuse still works at the limit.
    expect((await agent.post("/api/career/prep").send({ resumeId, targetRole: "frontend" })).status).toBe(200);
  });

  it("reports an AI outage as an outage, not as a validation failure", async () => {
    const { agent } = await login();
    const resumeId = await resumeFor(agent);
    // Warm the resume intelligence first, then take the provider away.
    await planStatus(agent, (await agent.post("/api/career/prep").send({ resumeId, targetRole: "backend" })).body.data.id);
    setAIProvider(null);
    try {
      const plan = await planStatus(agent, (await agent.post("/api/career/prep").send({ resumeId, targetRole: "devops" })).body.data.id);
      expect(plan.status).toBe("FAILED");
      expect(plan.error).toMatch(/isn't configured.*use Retry/);
      expect(plan.error).not.toMatch(/quality checks/);
    } finally {
      setAIProvider(fake);
    }
  });

  it("fails honestly when too few questions pass validation, and keeps nothing visible", async () => {
    const { agent } = await login();
    const resumeId = await resumeFor(agent);
    fake.prepBroken = true;
    try {
      const plan = await planStatus(agent, (await agent.post("/api/career/prep").send({ resumeId, targetRole: "sde" })).body.data.id);
      expect(plan.status).toBe("FAILED");
      expect(plan.error).toMatch(/passed quality checks/);
      expect((await agent.get(`/api/career/prep/${plan.id}/questions`)).body.data).toEqual([]);
      expect((await agent.post(`/api/career/prep/${plan.id}/packs`).send({ variant: "QUESTIONS" })).status).toBe(409);
    } finally {
      fake.prepBroken = false;
    }
  });
});
