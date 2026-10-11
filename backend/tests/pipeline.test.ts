import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { login, resetDb, seedFixture } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { techTokens } from "../src/modules/projects/pipeline.service.js";
import { startPrepWorker } from "../src/workers/prep-worker.js";

const fake = new FakeAI();
const brief = (rung: number, slug: string, technologies: string[]) => ({
  slug, rung, title: `Project ${slug}`, description: `Build ${slug}.`, skills: ["APIs"], technologies,
  requirements: ["Store todos", "List todos over HTTP", "Validate input"],
  milestones: [{ title: "Setup" }, { title: "API" }], explainQuestions: [{ question: "Why?", keywords: ["because"] }], hints: ["concept", "step", "code"], status: "PUBLISHED" as const,
});

let worker: ReturnType<typeof startPrepWorker> | undefined;
beforeAll(async () => {
  await resetDb();
  await seedFixture();
  await prisma.featureFlag.upsert({ where: { key: "AI_TUTOR" }, update: { enabled: true }, create: { key: "AI_TUTOR", description: "", enabled: true } });
  await prisma.project.create({ data: brief(1, "todo-api", ["Node.js", "Express"]) });
  await prisma.project.create({ data: brief(2, "cli-notes", ["Python"]) });
  setAIProvider(fake);
  worker = startPrepWorker();
});
afterAll(async () => {
  setAIProvider(undefined);
  await worker?.close();
});

type Agent = Awaited<ReturnType<typeof login>>["agent"];
/** Queues generation on the worker, then polls until the plan is READY or FAILED (as the page does). */
async function create(agent: Agent, slug = "todo-api", body: object = {}) {
  const res = await agent.post(`/api/projects/${slug}/pipeline`).send(body);
  if (res.status !== 200) return res;
  const until = Date.now() + 20_000;
  for (;;) {
    const r = await agent.get(`/api/projects/${slug}/pipeline`);
    const st = r.body.data.pipeline?.status;
    if (st === "READY" || st === "FAILED" || Date.now() > until) return r;
    await new Promise((x) => setTimeout(x, 100));
  }
}
const patch = (agent: Agent, key: string, body: object, slug = "todo-api") => agent.patch(`/api/projects/${slug}/pipeline/stages/${key}`).send(body);
const evidence = (keys: string[]) => Object.fromEntries(keys.map((k) => [k, { note: "Screenshot of passing request: GET /todos -> 200 []", url: "https://github.com/me/todo/commit/abc" }]));

describe("project build pipelines", () => {
  it("generates stages from THIS project's brief, with dependencies only on earlier stages", async () => {
    const { agent } = await login();
    expect((await agent.get("/api/projects/todo-api/pipeline")).body.data.pipeline).toBeNull();
    const res = await create(agent);
    expect(res.status).toBe(200);
    const p = res.body.data.pipeline;
    expect(p.stages.map((s: { key: string }) => s.key)).toEqual(["setup", "core", "api", "tests"]);
    expect(p.stages.map((s: { dependsOn: string[] }) => s.dependsOn)).toEqual([[], ["setup"], ["core"], ["api"]]);
    expect(p.current).toBe("setup");
    expect(p.requirements).toHaveLength(3);
    expect(p.stages.flatMap((s: { covers: number[] }) => s.covers).sort()).toEqual([1, 2, 3]);
    // The prompt carries this project's requirements and stack; the plan uses that stack.
    const call = fake.calls.filter((c) => c.task === "project_pipeline").at(-1)!;
    expect(call.user).toContain("2. List todos over HTTP");
    expect(call.user).toContain("Technologies: Node.js, Express");
    expect(p.stages[0].tasks[0]).toContain("Node.js + Express");
    // Solutions stay hidden until the student chooses to open one.
    expect(p.stages.every((s: { solution: unknown }) => s.solution === null)).toBe(true);
    // A second call returns the saved pipeline instead of generating again.
    const before = fake.calls.filter((c) => c.task === "project_pipeline").length;
    expect((await create(agent)).body.data.pipeline.total).toBe(4);
    expect(fake.calls.filter((c) => c.task === "project_pipeline").length).toBe(before);
  });

  it("a different project gets its own pipeline from its own stack", async () => {
    const { agent } = await login();
    // cli-notes is rung 2 — unlock it by completing rung 1.
    const todo = await prisma.project.findUniqueOrThrow({ where: { slug: "todo-api" } });
    const me = await prisma.user.findFirstOrThrow({ orderBy: { createdAt: "desc" } });
    await prisma.projectSubmission.create({ data: { userId: me.id, projectId: todo.id, repoUrl: "https://github.com/x/y", howIBuiltIt: {}, explainAnswers: [], explainScore: 90, independenceScore: 100, status: "COMPLETED" } });
    const p = (await create(agent, "cli-notes")).body.data.pipeline;
    expect(p.stages[0].tasks[0]).toContain("Python");
    expect(fake.calls.filter((c) => c.task === "project_pipeline").at(-1)!.user).toContain("Technologies: Python");
  });

  it("retries a plan that ignores the stack, and never drops an uncovered requirement", async () => {
    fake.pipelineGenericFirst = true;
    fake.pipelineSkipReq2 = true;
    const { agent } = await login();
    const before = fake.calls.filter((c) => c.task === "project_pipeline").length;
    const p = (await create(agent)).body.data.pipeline;
    fake.pipelineGenericFirst = false;
    fake.pipelineSkipReq2 = false;
    expect(fake.calls.filter((c) => c.task === "project_pipeline").length).toBe(before + 2);
    expect(fake.calls.filter((c) => c.task === "project_pipeline").at(-1)!.user).toMatch(/no stage uses the project's technologies/);
    expect(p.stages[0].tasks[0]).toContain("Node.js");
    const last = p.stages.at(-1);
    expect(last.covers).toContain(2);
    expect(last.acceptance.map((a: { text: string }) => a.text)).toContain("Requirement 2: List todos over HTTP");
  });

  it("marks a stage done only with evidence for every criterion and finished dependencies", async () => {
    const { agent } = await login();
    const p = (await create(agent)).body.data.pipeline;
    const crit = (key: string) => p.stages.find((s: { key: string }) => s.key === key).acceptance.map((a: { id: string }) => a.id);
    // Dependencies first.
    expect((await patch(agent, "core", { status: "DONE", evidence: evidence(crit("core")) })).status).toBe(409);
    // Evidence required (and must be substantial).
    const noEvidence = await patch(agent, "setup", { status: "DONE" });
    expect(noEvidence.status).toBe(422);
    expect(noEvidence.body.error.code).toBe("EVIDENCE_REQUIRED");
    expect((await patch(agent, "setup", { status: "DONE", evidence: { [crit("setup")[0]]: { note: "done" } } })).status).toBe(422);
    expect((await patch(agent, "setup", { status: "DONE", evidence: { "made-up": { note: "x".repeat(20) } } })).status).toBe(400);
    expect((await patch(agent, "setup", { status: "DONE", evidence: { [crit("setup")[0]]: { note: "x".repeat(20), url: "http://insecure.example" } } })).status).toBe(400);
    const ok = await patch(agent, "setup", { status: "DONE", evidence: evidence(crit("setup")) });
    expect(ok.status).toBe(200);
    expect(ok.body.data.pipeline).toMatchObject({ done: 1, current: "core" });
    expect(ok.body.data.pipeline.stages[0].evidence[crit("setup")[0]].url).toBe("https://github.com/me/todo/commit/abc");
    // Can't reopen a stage something done builds on.
    await patch(agent, "core", { status: "DONE", evidence: evidence(crit("core")) });
    expect((await patch(agent, "setup", { status: "IN_PROGRESS" })).status).toBe(409);
    // Progress persists: a fresh read resumes at the next stage.
    expect((await agent.get("/api/projects/todo-api/pipeline")).body.data.pipeline).toMatchObject({ done: 2, current: "api" });
  });

  it("regenerating keeps progress on stages that still exist", async () => {
    const { agent } = await login();
    const p = (await create(agent)).body.data.pipeline;
    const ids = p.stages[0].acceptance.map((a: { id: string }) => a.id);
    await patch(agent, "setup", { status: "DONE", evidence: evidence(ids) });
    const again = (await create(agent, "todo-api", { regenerate: true })).body.data.pipeline;
    expect(again.stages[0]).toMatchObject({ key: "setup", status: "DONE" });
  });

  it("opening a stage's solution reveals it once and counts as assistance like a hint", async () => {
    const { agent } = await login();
    await create(agent);
    expect((await agent.get("/api/projects/todo-api")).body.data.independenceScore).toBe(100);
    const sol = await agent.post("/api/projects/todo-api/pipeline/stages/core/solution");
    expect(sol.status).toBe(200);
    expect(sol.body.data.solution.code[0].code).toContain("Core logic");
    expect(sol.body.data.solution.diagram).toMatchObject({ kind: "flow" });
    expect(sol.body.data.independenceScore).toBeLessThan(100);
    const score = sol.body.data.independenceScore;
    // Opening it again costs nothing more; the view now includes it.
    expect((await agent.post("/api/projects/todo-api/pipeline/stages/core/solution")).body.data.independenceScore).toBe(score);
    const view = (await agent.get("/api/projects/todo-api/pipeline")).body.data.pipeline;
    expect(view.stages.find((s: { key: string }) => s.key === "core")).toMatchObject({ solutionViewed: true });
    expect(view.stages.find((s: { key: string }) => s.key === "api").solution).toBeNull();
    expect((await agent.get("/api/projects/todo-api")).body.data.independenceScore).toBe(score);
  });

  it("queues generation instead of running it in the request, and never queues twice", async () => {
    const { agent } = await login();
    const first = await agent.post("/api/projects/todo-api/pipeline").send({});
    expect(first.status).toBe(200);
    expect(first.body.data.pipeline).toMatchObject({ status: "QUEUED", stages: [] });
    const second = await agent.post("/api/projects/todo-api/pipeline").send({});
    expect(["QUEUED", "RUNNING", "READY"]).toContain(second.body.data.pipeline.status);
    const done = await create(agent);
    expect(done.body.data.pipeline.status).toBe("READY");
    // A stage can't be touched before the plan exists (a queued row with no stages yet — no race with the worker).
    const other = await login();
    const me = await prisma.user.findFirstOrThrow({ where: { email: other.email } });
    const todo = await prisma.project.findUniqueOrThrow({ where: { slug: "todo-api" } });
    await prisma.projectPipeline.create({ data: { userId: me.id, projectId: todo.id, status: "QUEUED" } });
    expect((await patch(other.agent, "setup", { status: "IN_PROGRESS" })).status).toBe(409);
  });

  it("records a failed generation honestly and lets the student retry", async () => {
    const { agent } = await login();
    const broken = fake.complete.bind(fake);
    fake.complete = async (system: string, user: string) => (system.includes("[task:project_pipeline]") ? JSON.stringify({ stages: [] }) : broken(system, user));
    const res = await create(agent);
    fake.complete = broken;
    expect(res.body.data.pipeline).toMatchObject({ status: "FAILED", stages: [] });
    expect(res.body.data.pipeline.error).toMatch(/Couldn't build a usable plan/);
    expect((await create(agent)).body.data.pipeline.status).toBe("READY");
  });

  it("keeps pipelines private and guarded", async () => {
    const owner = await login();
    await create(owner.agent);
    const other = await login();
    expect((await other.agent.get("/api/projects/todo-api/pipeline")).body.data.pipeline).toBeNull();
    expect((await patch(other.agent, "setup", { status: "IN_PROGRESS" })).status).toBe(404);
    // Locked project (rung 2, rung 1 not completed).
    expect((await create(other.agent, "cli-notes")).status).toBe(423);
    // AI help off during a timed test.
    await other.agent.post("/api/assessments/foundations-exam/start");
    expect((await create(other.agent)).status).toBe(423);
    // No provider → 503.
    const third = await login();
    setAIProvider(null);
    expect((await create(third.agent)).status).toBe(503);
    setAIProvider(fake);
  });

  it("matches a plan against each tool in phrases like 'Node.js + Express or FastAPI'", () => {
    expect(techTokens(["Node.js + Express or FastAPI", "PostgreSQL", "Vercel / Netlify"])).toEqual(["node.js", "express", "fastapi", "postgresql", "vercel", "netlify"]);
  });

  it("marks the pipeline stale when the brief changes", async () => {
    const { agent } = await login();
    await create(agent);
    await prisma.project.update({ where: { slug: "todo-api" }, data: { requirements: ["Store todos", "List todos over HTTP", "Validate input", "Delete todos"] } });
    expect((await agent.get("/api/projects/todo-api/pipeline")).body.data.pipeline.stale).toBe(true);
  });
});
