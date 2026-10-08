import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { login, resetDb, seedFixture } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { refresh } from "../src/modules/personalization/engine.js";
import { aiSection } from "../src/modules/project-experience/ai-section.js";
import { NOT_MEASURED, NOT_SPECIFIED } from "../src/modules/project-experience/content.js";
import { resumeFacts } from "../src/modules/project-experience/extract.js";
import { techsMentioned } from "../src/modules/project-experience/tech.js";
import { foreignTechs, unverifiedMetrics } from "../src/modules/project-experience/validate.js";
import { assess, CountingProvider, providerFor, summarizeBench } from "../src/modules/project-experience/benchmark.js";
import { buildContent, contextOf } from "../src/modules/project-experience/project.service.js";
import { apiInterview, failureMatrix, integrationsOf, MEASUREMENT_NOT_PROVIDED, TESTS_NOT_CLAIMED } from "../src/modules/project-experience/integrations.js";

const fake = new FakeAI();
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
afterAll(() => setAIProvider(undefined));

type Agent = Awaited<ReturnType<typeof login>>["agent"];
async function withResume() {
  const u = await login();
  const r = await u.agent.post("/api/career/resumes").send({ text: RESUME, label: "Main CV" });
  expect(r.status).toBe(201);
  const list = (await u.agent.get("/api/career/projects")).body.data;
  return { ...u, resumeId: r.body.data.id as string, list };
}
const projectByName = (list: { projects: { id: string; name: string }[] }, name: string) => list.projects.find((p) => p.name === name)!;
const open = (agent: Agent, id: string) => agent.get(`/api/career/projects/${id}`);

// ───────────────────────── pure units ─────────────────────────

describe("no-fabrication checks", () => {
  it("numbers must come from the evidence; hypothetical framing in questions is the caller's choice", () => {
    const evidence = "Built a job pipeline across 10+ ATS providers with 600+ users";
    expect(unverifiedMetrics("Reduced latency by 70% for 100K users", evidence)).toEqual(["70%", "100K"]);
    expect(unverifiedMetrics("Served 600 users from 10 providers", evidence)).toEqual([]);
    expect(unverifiedMetrics("99.99% uptime", evidence).length).toBeGreaterThan(0);
  });

  it("knows which technologies a text claims, including nested names", () => {
    expect([...techsMentioned("Next.js app on MongoDB, cached in Redis, Gemini for AI")].sort()).toEqual(["gemini", "mongodb", "nextjs", "redis"]);
    expect(foreignTechs("We cached jobs in Redis", new Set(["mongodb", "nextjs"]))).toEqual(["redis"]);
    expect(foreignTechs("React Native screens", new Set(["react native"]))).toEqual([]);
  });

  it("facts come only from the resume; unknown facts stay empty", () => {
    const facts = resumeFacts("Notes API", { chunks: [], technologies: ["Node.js", "Express", "MongoDB", "JWT"], problem: null, architecture: null, features: [], contribution: "Built it alone", claims: [], company: null, role: null }, "PROJECT");
    expect(facts.project).toEqual({ value: "Notes API", source: "RESUME" });
    expect(facts.database).toEqual({ value: "MongoDB", source: "RESUME" });
    expect(facts.authentication).toEqual({ value: "JWT", source: "RESUME" });
    expect(facts.contribution).toEqual({ value: "Built it alone", source: "RESUME" });
    for (const k of ["users", "productionScale", "performanceImprovement", "teamSize", "cache", "ai"] as const) expect(facts[k]).toEqual({ value: null, source: null });
  });

  it("the AI section appears only for AI projects and frames Gemini vs Ollama as judgment, not a benchmark", () => {
    expect(aiSection("Notes API", ["Node.js", "MongoDB"])).toBeNull();
    const ai = aiSection("DoCrud", ["Next.js", "Gemini"])!;
    expect(ai.used).toEqual(["Gemini"]);
    expect(ai.decision.question).toBe("Why did you use Gemini instead of Ollama?");
    expect(ai.decision.answer).toMatch(/wouldn't say Gemini is universally better/);
    expect(ai.decision.recommendation).toBe("Use a provider abstraction and benchmark both");
    expect(ai.comparison.map((o) => o.option)).toEqual(expect.arrayContaining(["Gemini (Google)", "OpenAI API", "Ollama"]));
    expect(ai.followUps).toHaveLength(12);
    expect(JSON.stringify(ai)).not.toMatch(/\b\d+\s*%|\b\d+x faster|\b\d+\s*ms\b/);
    expect(aiSection("LocalBot", ["Ollama"])!.decision.question).toMatch(/Why did you use Ollama instead of a hosted API/);
  });
});

// ───────────────────────── extraction & module ─────────────────────────

describe("project experience modules", () => {
  it("API map: databases and queues are infrastructure, AI/sign-in/storage are third-party, libraries are not services", () => {
    const facts = resumeFacts("X", { technologies: [], chunks: [], claims: [] } as never, "PROJECT");
    const ev = (technologies: string[], text = "") => ({ technologies, chunks: text ? [{ type: "PROJECT", title: "X", text }] : [], claims: [] }) as never;
    const kinds = (t: string[], text = "") => integrationsOf(t, facts, ev(t, text)).map((i) => `${i.kind}:${i.name}`);
    expect(kinds(["Node.js", "Express", "MongoDB", "Redis", "BullMQ", "JWT", "Prisma", "Zod", "PM2"])).toEqual(["OWN_REST:REST API (Node.js)", "INFRASTRUCTURE:MongoDB", "INFRASTRUCTURE:Redis", "INFRASTRUCTURE:BullMQ"]);
    expect(kinds(["Express", "Gemini 1.5 Flash", "Google OAuth", "Cloudflare R2"])).toEqual(["OWN_REST:REST API (Express)", "THIRD_PARTY:Gemini", "THIRD_PARTY:OAuth", "THIRD_PARTY:Cloudflare R2"]);
    // Next.js may be front-end only: it is an API server only when the resume says so.
    expect(kinds(["Next.js", "PostgreSQL"])).toEqual(["INFRASTRUCTURE:PostgreSQL"]);
    expect(kinds(["Next.js", "PostgreSQL"], "Built API route handlers for bookings.")).toContain("OWN_REST:REST API (Next.js)");
    // Browser APIs only when the resume or facts name them.
    expect(kinds(["React"], "Voice answers with the Web Speech API and getUserMedia; fullscreen test mode.")).toEqual(["BROWSER:SpeechRecognition", "BROWSER:getUserMedia", "BROWSER:Fullscreen"]);
  });

  it("failure matrix: only fallbacks the candidate says they built are IMPLEMENTED; the rest are recommendations", () => {
    const facts = resumeFacts("X", { technologies: [], chunks: [], claims: [] } as never, "PROJECT");
    facts.implementedFallbacks = { value: "Redis down → read from MongoDB directly", source: "USER" };
    const integrations = integrationsOf(["Express", "MongoDB", "Redis"], facts, { technologies: ["Express", "MongoDB", "Redis"], chunks: [], claims: [] } as never);
    const rows = failureMatrix(integrations, facts);
    const implemented = rows.filter((r) => r.status === "IMPLEMENTED");
    // The fact names both Redis and MongoDB; it is credited to each dependency it mentions, verbatim.
    expect(implemented.map((r) => r.dependency).sort()).toEqual(["MongoDB", "Redis"]);
    expect(implemented.every((r) => r.response === "Redis down → read from MongoDB directly")).toBe(true);
    expect(rows.filter((r) => r.dependency === "REST API (Express)").every((r) => r.status === "RECOMMENDED")).toBe(true);
    // API interview: endpoint drain-down L1→L5, then the final architecture test.
    const qs = apiInterview(integrations, facts, "ALL");
    expect(qs.filter((q) => q.key.startsWith("api-chain")).map((q) => q.level)).toEqual([1, 2, 3, 4, 5]);
    expect(qs.filter((q) => q.kind === "SYSTEM")).toHaveLength(5);
    expect(qs.map((q) => q.level)).toEqual([...qs.map((q) => q.level)].sort((a, b) => a - b));
    expect(apiInterview(integrations, facts, "BROWSER")).toEqual([]);
    // No own API on the resume → no "your endpoint" questions.
    const noApi = integrationsOf(["MongoDB"], facts, { technologies: ["MongoDB"], chunks: [], claims: [] } as never);
    expect(apiInterview(noApi, facts, "ALL").some((q) => q.key.startsWith("api-chain"))).toBe(false);
  });

  it("extracts every resume project and job as its own module, with facts only from the resume", async () => {
    const { list } = await withResume();
    expect(list.projects.map((p: { name: string }) => p.name).sort()).toEqual(["Backend Intern @ Acme", "Notes API"]);
    const notes = projectByName(list, "Notes API") as unknown as { source: string; technologies: string[]; claims: number; generated: boolean };
    expect(notes).toMatchObject({ source: "PROJECT", claims: 1, generated: false });
    expect(notes.technologies).toEqual(["Node.js", "Express", "MongoDB", "JWT", "REST APIs"]);
    const job = projectByName(list, "Backend Intern @ Acme") as unknown as { source: string; role: string; company: string };
    expect(job).toMatchObject({ source: "EXPERIENCE", role: "Backend Intern", company: "Acme" });
  });

  it("a job that describes a listed project is one module (both sources merged)", async () => {
    const u = await login();
    const resume = await prisma.careerResume.create({ data: { userId: u.id, label: "CV", text: "x", parsed: { name: "R", skills: { languages: [], frameworks: [], databases: [], cloud: [], devops: [], other: [] }, projects: [], experience: [], education: [], totalExperienceMonths: 6 }, analyzedAt: new Date() } });
    await prisma.resumeChunk.createMany({
      data: [
        { resumeId: resume.id, order: 0, type: "PROJECT", section: "Projects", title: "EduOS", text: "Multi-tenant school platform", technologies: ["Next.js", "PostgreSQL"] },
        { resumeId: resume.id, order: 1, type: "EXPERIENCE", section: "Experience", title: "SDE Intern @ Corescent", text: "Built EduOS tenant isolation and RBAC", technologies: ["Prisma"] },
      ],
    });
    const list = (await u.agent.get("/api/career/projects").query({ resumeId: resume.id })).body.data;
    expect(list.projects).toHaveLength(1);
    expect(list.projects[0]).toMatchObject({ name: "EduOS", source: "BOTH", role: "SDE Intern", company: "Corescent" });
    expect(list.projects[0].technologies).toEqual(["Next.js", "PostgreSQL", "Prisma"]);
  });

  it("opening a project builds the full module: 20 questions L1-L5, decisions, diagrams, claim defense", async () => {
    const { agent, list } = await withResume();
    const notes = projectByName(list, "Notes API");
    const res = await open(agent, notes.id);
    expect(res.status).toBe(200);
    const p = res.body.data;
    const c = p.content;
    // Exactly 20 core questions, 4 per level, each about this project, each with answers and follow-ups.
    expect(c.questions).toHaveLength(20);
    expect([1, 2, 3, 4, 5].map((l) => c.questions.filter((q: { level: number }) => q.level === l).length)).toEqual([4, 4, 4, 4, 4]);
    for (const q of c.questions) {
      expect(q.question).toMatch(/Notes API|Node\.js|Express|MongoDB|JWT/);
      for (const k of ["answer", "whyThisAnswer", "followUp", "followUpAnswer", "deepFollowUp", "deepFollowUpAnswer"]) expect(q[k]).toBeTruthy();
    }
    // One decision card per project technology — never for one it doesn't use ("REST" is named in the resume text).
    expect(c.technologies.map((t: { technology: string }) => t.technology)).toEqual(["Node.js", "Express", "MongoDB", "JWT", "REST APIs"]);
    expect(c.autoFixes).toContain("Dropped a card for Kafka, which the project doesn't use.");
    for (const t of c.technologies) for (const k of ["whyUsed", "alternative", "whyNotAlternative", "alternativeBetterWhen", "recommendation", "interviewQuestion", "followUp", "deeperFollowUp"]) expect(t[k]).toBeTruthy();
    expect(c.decisionMap.length).toBeGreaterThan(0);
    // Architecture diagram with only the project's components; skill ladder L1-L5; no AI section (no AI used).
    expect(c.story.architecture.diagram.kind).toBe("architecture");
    expect(c.story.skillLadder.map((l: { level: number }) => l.level)).toEqual([1, 2, 3, 4, 5]);
    expect(c.ai).toBeNull();
    // Resume claims get defense questions; a personal project gets no work-experience questions.
    expect(c.claimDefense).toHaveLength(1);
    expect(c.claimDefense[0].claim).toBe("Built JWT authentication for the Notes API");
    expect(c.claimDefense[0].questions.length).toBeGreaterThanOrEqual(5);
    expect(c.experienceQuestions).toEqual([]);
    expect(c.drillDown.length).toBeGreaterThanOrEqual(6);
    // Unknown stays unknown.
    expect(c.story.performance.result.text).toBe(NOT_MEASURED);
    expect(c.story.overview.users).toEqual({ text: NOT_SPECIFIED, basis: "NOT_SPECIFIED" });
    // Verified facts are exactly the resume's.
    expect(p.verified.claims).toEqual([expect.objectContaining({ claim: "Built JWT authentication for the Notes API" })]);
    // The prompt told the model which technologies exist and how to treat unknowns.
    const call = fake.calls.filter((x) => x.task === "project_story").at(-1)!;
    expect(call.user).toContain("<technologies>");
    expect(call.system).toContain(NOT_SPECIFIED);
    // Cached: opening again doesn't regenerate.
    const before = fake.calls.filter((x) => x.task.startsWith("project_")).length;
    await open(agent, notes.id);
    expect(fake.calls.filter((x) => x.task.startsWith("project_")).length).toBe(before);
  });

  it("work-experience modules get ownership and production questions", async () => {
    const { agent, list } = await withResume();
    const job = projectByName(list, "Backend Intern @ Acme");
    const c = (await open(agent, job.id)).body.data.content;
    expect(c.experienceQuestions.length).toBeGreaterThanOrEqual(4);
    expect(fake.calls.filter((x) => x.task === "project_story").at(-1)!.system).toMatch(/WORK EXPERIENCE: emphasise ownership/);
  });

  it("fabrication is rejected and retried; if it persists it is removed, never shown", async () => {
    const { agent, list } = await withResume();
    const notes = projectByName(list, "Notes API");
    // First drafts invent a 70% latency win / 100K users and claim Redis + Kafka; the retry is clean.
    fake.badProject = ["metrics", "metrics"];
    const c1 = (await open(agent, notes.id)).body.data.content;
    expect(fake.calls.filter((x) => x.task === "project_story").at(-1)!.user).toMatch(/rejected.*\n.*numbers not in the resume/);
    expect(JSON.stringify(c1)).not.toMatch(/70%|100K|99\.99/);

    const other = await withResume();
    const n2 = projectByName(other.list, "Notes API");
    fake.badProject = ["foreign"];
    fake.stubbornProject = true;
    try {
      const c2 = (await open(other.agent, n2.id)).body.data.content;
      // Still claiming Redis/Kafka after the retry → scrubbed: the module never says the project used them.
      expect(c2.story.overview.whatBuilt).toEqual({ text: NOT_SPECIFIED, basis: "NOT_SPECIFIED" });
      expect(JSON.stringify(c2.story.architecture.diagram)).not.toMatch(/Redis/);
      expect(c2.autoFixes.join(" ")).toMatch(/unsupported technology claim/);
    } finally {
      fake.stubbornProject = false;
      fake.badProject = [];
    }
  });

  it("generic questions are rejected; fewer than 20 project-specific questions is never shipped", async () => {
    const { agent, list } = await withResume();
    const notes = projectByName(list, "Notes API");
    fake.badProject = ["generic"];
    fake.stubbornProject = true;
    try {
      const res = await open(agent, notes.id);
      expect(res.status).toBe(502);
      expect(await prisma.projectExperience.findUniqueOrThrow({ where: { id: notes.id } })).toMatchObject({ content: null });
    } finally {
      fake.stubbornProject = false;
      fake.badProject = [];
    }
  });

  it("a retry that is still short at some level is completed from first-draft questions that passed every check", async () => {
    const { agent, list } = await withResume();
    const notes = projectByName(list, "Notes API");
    // Draft 1: three generic L5 questions. Retry: three generic L1 questions. Together: 20 valid.
    fake.questionDrafts = ["genericHigh", "generic"];
    try {
      const res = await open(agent, notes.id);
      expect(res.status).toBe(200);
      const qs = res.body.data.content.questions as { level: number; question: string }[];
      expect([1, 2, 3, 4, 5].map((l) => qs.filter((q) => q.level === l).length)).toEqual([4, 4, 4, 4, 4]);
      expect(qs.some((q) => /variable number/.test(q.question))).toBe(false);
      expect(res.body.data.content.autoFixes).toContain("Kept 3 checked questions from the first draft to complete the levels.");
    } finally {
      fake.questionDrafts = [];
    }
  });

  it("a number posed by a hypothetical question may appear in its answer; other numbers still may not", async () => {
    const { agent, list } = await withResume();
    const notes = projectByName(list, "Notes API");
    fake.questionDrafts = ["hypothetical"];
    try {
      const res = await open(agent, notes.id);
      expect(res.status).toBe(200);
      const q = (res.body.data.content.questions as { question: string; answer: string }[]).find((x) => /600,000/.test(x.question))!;
      expect(q.answer).toContain("600,000 users");
    } finally {
      fake.questionDrafts = [];
    }
    expect(unverifiedMetrics("We handled 600,000 users.", "Notes API for 600 users")).toEqual(["600,000 users"]);
  });

  it("benchmark harness: counts calls and rule violations per model, and never saves", async () => {
    const { list } = await withResume();
    const notes = projectByName(list, "Notes API");
    const row = await prisma.projectExperience.findUniqueOrThrow({ where: { id: notes.id } });
    const counter = new CountingProvider(fake);
    setAIProvider(counter);
    fake.questionDrafts = ["genericHigh"]; // forces one retry on the questions part
    try {
      const content = await buildContent(row);
      const r = assess("fake:model", notes.name, contextOf(row), content, 1, counter.calls);
      expect(r).toMatchObject({ ok: true, calls: 4, retries: 1, levels: [4, 4, 4, 4, 4], inventedNumbers: [], unusedTechs: [], techCoverage: 1, missing: [] });
      expect(summarizeBench([r, { ...r, ok: false, error: "x", seconds: 0 }])).toEqual([expect.objectContaining({ model: "fake:model", projects: 2, built: 1, failures: 1, retries: 2 })]);
    } finally {
      fake.questionDrafts = [];
      setAIProvider(fake);
    }
    expect((await prisma.projectExperience.findUniqueOrThrow({ where: { id: notes.id } })).content).toBeNull();
    // Specs are provider:model; keys come from the environment, never the command line.
    expect(() => providerFor("gemini", {})).toThrow(/Model missing/);
    expect(() => providerFor("openai:gpt-x", {})).toThrow(/OPENAI_API_KEY/);
    expect(() => providerFor("acme:m", {})).toThrow(/Unknown provider/);
    expect(providerFor("ollama:llama3.1", {}).name).toBe("ollama");
  });

  it("editable facts: the user's values win, the resume is untouched, the module goes stale and regenerates with them", async () => {
    const { agent, list, id, resumeId } = await withResume();
    const notes = projectByName(list, "Notes API");
    await open(agent, notes.id);
    const res = await agent.patch(`/api/career/projects/${notes.id}/facts`).send({ facts: { users: "Students in my college", cache: "Redis", performanceImprovement: "" } });
    expect(res.status).toBe(200);
    const facts = Object.fromEntries(res.body.data.facts.map((f: { key: string; value: string | null; source: string | null }) => [f.key, f]));
    expect(facts.users).toMatchObject({ value: "Students in my college", source: "USER" });
    expect(facts.database).toMatchObject({ value: "MongoDB", source: "RESUME" });
    expect(facts.performanceImprovement).toMatchObject({ value: null, source: null });
    expect(res.body.data.stale).toBe(true);
    // A technology the user adds becomes part of the project.
    expect(res.body.data.technologies).toContain("Redis");
    const regenerated = (await open(agent, notes.id)).body.data;
    expect(regenerated.stale).toBe(false);
    expect(fake.calls.filter((x) => x.task === "project_story").at(-1)!.user).toMatch(/Users: Students in my college/);
    // Re-syncing from the resume keeps the user's edit; the resume itself is unchanged.
    await agent.get("/api/career/projects");
    const synced = await prisma.projectExperience.findUniqueOrThrow({ where: { id: notes.id } });
    expect((synced.facts as Record<string, { value: string }>).users.value).toBe("Students in my college");
    expect((await prisma.careerResume.findUniqueOrThrow({ where: { id: resumeId } })).text).toBe(RESUME);
    // Only the field names are logged, never the values.
    const ev = await prisma.learningEvent.findFirstOrThrow({ where: { userId: id, eventType: "PROJECT_FACT_EDITED" } });
    expect(JSON.stringify(ev.meta)).not.toContain("Students in my college");
    expect((await agent.patch(`/api/career/projects/${notes.id}/facts`).send({ facts: { nonsense: "x" } })).status).toBe(400);
    const other = await login();
    expect((await other.agent.patch(`/api/career/projects/${notes.id}/facts`).send({ facts: { users: "x" } })).status).toBe(404);
    expect((await other.agent.get(`/api/career/projects/${notes.id}`)).status).toBe(404);
  });
});

// ───────────────────────── knowledge tests ─────────────────────────

const STRONG = "I chose this because the data model fit our access pattern and I measured the slow query first";
const WEAK = "not sure";

describe("project knowledge tests", () => {
  it("drill-down climbs L1 → L5 on strong answers", async () => {
    const { agent, list } = await withResume();
    const notes = projectByName(list, "Notes API");
    let t = (await agent.post(`/api/career/projects/${notes.id}/tests`).send({ mode: "DRILL" })).body.data;
    expect(t.current.level).toBe(1);
    const levels: number[] = [];
    while (t.current) {
      levels.push(t.current.level);
      t = (await agent.post(`/api/career/projects/${notes.id}/tests/${t.id}/answer`).send({ answer: STRONG })).body.data;
    }
    expect(levels).toEqual([1, 2, 3, 4, 5]);
    expect(t.status).toBe("COMPLETED");
    expect(t.result.highestLevelPassed).toBe(5);
  });

  it("weak answers get a follow-up from the candidate's own words, then a step back to check prerequisites", async () => {
    const { agent, list } = await withResume();
    const notes = projectByName(list, "Notes API");
    let t = (await agent.post(`/api/career/projects/${notes.id}/tests`).send({ mode: "DRILL" })).body.data;
    t = (await agent.post(`/api/career/projects/${notes.id}/tests/${t.id}/answer`).send({ answer: STRONG })).body.data; // L1 ✓ → L2
    expect(t.current.level).toBe(2);
    t = (await agent.post(`/api/career/projects/${notes.id}/tests/${t.id}/answer`).send({ answer: WEAK })).body.data;
    expect(t.current).toMatchObject({ isFollowUp: true, level: 2 });
    expect(t.current.question).toMatch(/You said "not sure"/);
    expect(t.last).toMatchObject({ verdict: "PARTIAL", missing: ["indexing", "failure handling"] });
  });

  it("all five modes, dimension scores with evidence, skill gaps, and a re-interview", async () => {
    const { agent, list, id } = await withResume();
    const notes = projectByName(list, "Notes API");
    await open(agent, notes.id);
    const run = async (mode: string, answer: string) => {
      let t = (await agent.post(`/api/career/projects/${notes.id}/tests`).send({ mode })).body.data;
      const total = t.progress.total;
      while (t.current) t = (await agent.post(`/api/career/projects/${notes.id}/tests/${t.id}/answer`).send({ answer })).body.data;
      return { t, total };
    };
    expect((await run("QUICK", WEAK)).total).toBe(10);
    const deep = await run("DEEP", STRONG);
    expect(deep.total).toBe(20);
    expect(deep.t.isRetest).toBe(true);
    expect((await run("SENIOR", STRONG)).total).toBe(8);
    const defense = await run("DEFENSE", STRONG);
    expect(defense.t.answers.every((a: { question: string }) => ["What exactly did you build?", "How did you measure it?", "What would break first?", "What did it cost?", "What would you do differently?"].includes(a.question))).toBe(true);

    // The quick test (weak answers) found gaps, with evidence for each dimension score.
    const quick = await prisma.projectTest.findFirstOrThrow({ where: { projectId: notes.id, mode: "QUICK" } });
    const result = quick.result as { dimensions: { score: number | null; evidence: string[] }[]; skills: { status: string; skill: string }[]; unknownSkills: string[] };
    const scored = result.dimensions.filter((d) => d.score !== null);
    expect(scored.length).toBeGreaterThan(0);
    for (const d of scored) expect(d.evidence[0]).toMatch(/— \d+%: .*missed indexing/);
    expect(result.skills.every((s) => s.status === "WEAK")).toBe(true);

    const report = (await agent.get(`/api/career/projects/${notes.id}/report`)).body.data;
    expect(report.tests).toHaveLength(4);
    expect(report.progress.find((x: { dimension: string; first: number | null; latest: number | null }) => x.first !== null && x.latest !== null)).toBeTruthy();
    // Events: test started/completed, re-interview, gaps, answers — scores only, never answer text.
    const types = new Set((await prisma.learningEvent.findMany({ where: { userId: id, eventType: { startsWith: "PROJECT_" } } })).map((e) => e.eventType));
    for (const e of ["PROJECT_VIEWED", "PROJECT_KNOWLEDGE_TEST_STARTED", "PROJECT_KNOWLEDGE_TEST_COMPLETED", "PROJECT_REINTERVIEW_STARTED", "PROJECT_REINTERVIEW_COMPLETED", "PROJECT_QUESTION_ANSWERED", "PROJECT_SKILL_GAP_IDENTIFIED"]) expect(types).toContain(e);
    const answered = await prisma.learningEvent.findMany({ where: { userId: id, eventType: "PROJECT_QUESTION_ANSWERED" } });
    expect(JSON.stringify(answered.map((e) => e.meta))).not.toContain(STRONG);
    // A project with no resume claims has nothing to defend.
    const job = projectByName(list, "Backend Intern @ Acme");
    expect((await agent.post(`/api/career/projects/${job.id}/tests`).send({ mode: "DEFENSE" })).status).toBe(400);
  });

  it("APIs tab and API Interview Mode run from the resume and facts, with no AI-generated module", async () => {
    const { agent, list } = await withResume();
    const notes = projectByName(list, "Notes API");
    const p = (await agent.get(`/api/career/projects/${notes.id}?generate=0`)).body.data;
    expect(p.content).toBeNull();
    const m = p.integrations;
    expect(m.kinds.map((k: { kind: string }) => k.kind)).toEqual(["OWN_REST", "INFRASTRUCTURE"]);
    expect(m.methods.map((x: { method: string }) => x.method)).toEqual(["GET", "POST", "PUT", "PATCH", "DELETE"]);
    // Nothing measured or tested is claimed until the candidate says so.
    expect(m.measurements).toEqual({ value: MEASUREMENT_NOT_PROVIDED, basis: "NOT_SPECIFIED" });
    expect(m.testing).toEqual({ value: TESTS_NOT_CLAIMED, basis: "NOT_SPECIFIED" });
    expect(m.failures.every((r: { status: string }) => r.status === "RECOMMENDED")).toBe(true);
    expect(m.focuses).toEqual(["ALL", "OWN_REST", "INFRASTRUCTURE"]);

    const edited = (await agent.patch(`/api/career/projects/${notes.id}/facts`).send({ facts: { importantApis: "POST /notes\nGET /notes/:id", implementedFallbacks: "MongoDB down → return 503 with a retry message", apiMeasurements: "p95 120 ms on GET /notes (k6, 50 users)" } })).body.data;
    expect(edited.integrations.chain[0].question).toContain("your POST /notes endpoint");
    expect(edited.integrations.failures.find((r: { status: string }) => r.status === "IMPLEMENTED")).toMatchObject({ dependency: "MongoDB", response: "MongoDB down → return 503 with a retry message" });
    expect(edited.integrations.measurements).toEqual({ value: "p95 120 ms on GET /notes (k6, 50 users)", basis: "USER_FACT" });

    expect((await agent.post(`/api/career/projects/${notes.id}/tests`).send({ mode: "API", focus: "BROWSER" })).status).toBe(400);
    let t = (await agent.post(`/api/career/projects/${notes.id}/tests`).send({ mode: "API", focus: "ALL" })).body.data;
    expect(t.mode).toBe("API");
    expect(t.current).toMatchObject({ level: 1, question: expect.stringContaining("POST /notes") });
    const levels: number[] = [];
    while (t.current) {
      levels.push(t.current.level);
      t = (await agent.post(`/api/career/projects/${notes.id}/tests/${t.id}/answer`).send({ answer: STRONG })).body.data;
    }
    expect(t.status).toBe("COMPLETED");
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(levels.at(-1)).toBe(5);
    expect((t.result as { dimensions: { dimension: string; score: number | null }[] }).dimensions.find((d) => d.dimension === "API")!.score).toBeGreaterThan(0);
    // Still no AI module: the API mode never needed one.
    expect((await prisma.projectExperience.findUniqueOrThrow({ where: { id: notes.id } })).content).toBeNull();
  });

  it("project weaknesses feed personalization: skill state and a 'review before your next interview' recommendation", async () => {
    const { agent, list, id } = await withResume();
    const notes = projectByName(list, "Notes API");
    let t = (await agent.post(`/api/career/projects/${notes.id}/tests`).send({ mode: "QUICK" })).body.data;
    while (t.current) t = (await agent.post(`/api/career/projects/${notes.id}/tests/${t.id}/answer`).send({ answer: WEAK })).body.data;
    await refresh(id);
    const node = await prisma.studentSkillState.findUniqueOrThrow({ where: { userId_conceptId: { userId: id, conceptId: "skill:nodejs" } } });
    expect((node.signals as { project: number }).project).toBeGreaterThan(0);
    const rec = await prisma.recommendation.findFirst({ where: { userId: id, action: "PRACTICE_PROJECT" } });
    expect(rec).not.toBeNull();
    expect(rec!.title).toMatch(/before your next Notes API interview/);
    expect(rec!.reasons).toContain("project_weakness");
    expect(rec!.href).toBe(`/career/projects/${notes.id}?tab=gaps`);
  });
});
