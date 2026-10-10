import { afterAll, beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import { app, login, resetDb, seedFixture } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { env, hostProblems, parseEnv, productionProblems } from "../src/config/env.js";
import { sandbox } from "../src/sandbox/index.js";
import { Queue } from "bullmq";
import { CODE_QUEUE, executeCode } from "../src/jobs/queues.js";
import { liveTargets } from "../src/jobs/prep-queue.js";
import { bullConnection } from "../src/lib/redis.js";
import { startHeartbeat } from "../src/lib/heartbeat.js";
import { prisma } from "../src/lib/prisma.js";
import { redis } from "../src/lib/redis.js";
import { deleteUserObjects, storage } from "../src/lib/storage.js";
import { recoverStuckPrepWork } from "../src/modules/prep/recovery.js";
import { startPrepWorker } from "../src/workers/prep-worker.js";

const fake = new FakeAI();
const RESUME = "Riya Sharma — Backend developer\nProjects\nNotes API: Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication.\nExperience\nBackend intern at Acme for 6 months building REST APIs.\nEducation\nB.Tech CSE 2026. Skills: JavaScript, Node.js, Express, MongoDB, Docker.";
const JD = "Backend Developer at Zeta. Required: Node.js, Express, MongoDB, Redis, AWS. Nice to have: Docker. Build and scale APIs.";

let worker: ReturnType<typeof startPrepWorker> | undefined;
beforeAll(async () => {
  await resetDb();
  await seedFixture();
  await prisma.featureFlag.create({ data: { key: "AI_INTERVIEW", description: "", enabled: true } });
  setAIProvider(fake);
});
afterAll(async () => {
  setAIProvider(undefined);
  await worker?.close();
});

type Agent = Awaited<ReturnType<typeof login>>["agent"];
const until = async <T>(fn: () => Promise<T>, done: (v: T) => boolean, ms = 20_000) => {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (done(v) || Date.now() > end) return v;
    await new Promise((r) => setTimeout(r, 100));
  }
};

// ───────────────────────── HTTP errors ─────────────────────────

describe("request body errors", () => {
  it("returns 413 with the normal envelope for oversized bodies, not a 500", async () => {
    const { agent } = await login();
    const big = await agent.post("/api/career/resumes").set("content-type", "application/json").send(JSON.stringify({ text: "x".repeat(9 * 1024 * 1024) }));
    expect(big.status).toBe(413);
    expect(big.body).toMatchObject({ success: false, error: { code: "PAYLOAD_TOO_LARGE" } });
    expect(big.body.error.requestId).toBeTruthy();
    // Non-career routes have the smaller 1 MB limit.
    const small = await supertest(app).post("/api/auth/login").set("content-type", "application/json").send(JSON.stringify({ email: "a@b.c", password: "y".repeat(2 * 1024 * 1024) }));
    expect(small.status).toBe(413);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await supertest(app).post("/api/auth/login").set("content-type", "application/json").send("{not json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.(ts|js):\d+/); // no stack traces
  });
});

// ───────────────────────── sessions ─────────────────────────

describe("session security", () => {
  it("logout-all invalidates every existing session", async () => {
    const { agent, email } = await login();
    const second = supertest.agent(app);
    expect((await second.post("/api/auth/login").send({ email, password: "Passw0rd!" })).status).toBe(200);
    expect((await second.get("/api/auth/me")).status).toBe(200);
    await agent.post("/api/auth/logout-all");
    expect((await second.get("/api/auth/me")).status).toBe(401);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });

  it("a password change signs out other sessions but keeps the current one", async () => {
    const { agent, email } = await login();
    const other = supertest.agent(app);
    await other.post("/api/auth/login").send({ email, password: "Passw0rd!" });
    const res = await agent.post("/api/auth/change-password").send({ currentPassword: "Passw0rd!", newPassword: "N3wPassw0rd!" });
    expect(res.status).toBe(200);
    expect((await other.get("/api/auth/me")).status).toBe(401);
    expect((await agent.get("/api/auth/me")).status).toBe(200);
  });

  it("rejects a tampered session cookie and never exposes the token to JavaScript", async () => {
    const reg = await supertest(app).post("/api/auth/register").send({ name: "Cookie", email: `cookie-${Date.now()}@test.dev`, password: "Passw0rd!" });
    const cookie = String(reg.headers["set-cookie"]);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(JSON.stringify(reg.body)).not.toMatch(/eyJ[A-Za-z0-9_-]+\./); // no JWT in the response body
    const token = cookie.match(/prompters_session=([^;]+)/)![1];
    const [h, p] = token.split(".");
    const forged = `${h}.${p}.${"A".repeat(43)}`;
    const res = await supertest(app).get("/api/auth/me").set("cookie", `prompters_session=${forged}`);
    expect(res.status).toBe(401);
  });
});

// ───────────────────────── authorization / IDOR ─────────────────────────

describe("cross-account access (IDOR)", () => {
  let owner: Agent;
  let attacker: Agent;
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    worker = startPrepWorker();
    owner = (await login()).agent;
    attacker = (await login()).agent;
    ids.resume = (await owner.post("/api/career/resumes").send({ text: RESUME })).body.data.id;
    ids.job = (await owner.post("/api/career/jobs").send({ text: JD })).body.data.id;
    ids.match = (await owner.post("/api/career/analyses").send({ resumeId: ids.resume, jobId: ids.job })).body.data.id;
    const session = await owner.post("/api/career/sessions").send({ matchId: ids.match, consent: { recording: true, integrity: true, preparationOnly: true } });
    ids.session = session.body.data.id;
    ids.turn = session.body.data.current.id;
    ids.plan = (await owner.post("/api/career/prep").send({ resumeId: ids.resume, targetRole: "backend" })).body.data.id;
    await until(() => owner.get(`/api/career/prep/${ids.plan}`).then((r) => r.body.data.status), (s) => s === "READY" || s === "FAILED");
    ids.question = (await owner.get(`/api/career/prep/${ids.plan}/questions`)).body.data[0].id;
    ids.pack = (await owner.post(`/api/career/prep/${ids.plan}/packs`).send({ variant: "QUESTIONS" })).body.data.id;
    ids.application = (await owner.post("/api/applications").send({ company: "Zeta", role: "Backend" })).body.data.id;
  });

  it("returns 404 (never 403 or data) for another user's resources", async () => {
    const reads = [
      `/api/career/analyses/${ids.match}`,
      `/api/career/sessions/${ids.session}`,
      `/api/career/sessions/${ids.session}/turns/${ids.turn}/audio`,
      `/api/career/prep/${ids.plan}`,
      `/api/career/prep/${ids.plan}/questions`,
      `/api/career/prep/${ids.plan}/questions/${ids.question}`,
      `/api/career/prep/${ids.plan}/packs/${ids.pack}`,
      `/api/career/prep/${ids.plan}/packs/${ids.pack}/download`,
    ];
    for (const path of reads) {
      const res = await attacker.get(path);
      expect([path, res.status]).toEqual([path, 404]);
    }
    // Lists only ever show your own data.
    for (const path of ["/api/career/resumes", "/api/career/jobs", "/api/career/analyses", "/api/career/sessions", "/api/career/prep", "/api/applications"]) {
      const res = await attacker.get(path);
      expect([path, res.body.data]).toEqual([path, []]);
    }
  });

  it("can't modify, practise on, start from or delete another user's resources", async () => {
    const writes: [string, string, object?][] = [
      ["post", "/api/career/analyses", { resumeId: ids.resume, jobId: ids.job }],
      ["post", "/api/career/sessions", { matchId: ids.match, consent: { recording: true, integrity: true, preparationOnly: true } }],
      ["post", `/api/career/sessions/${ids.session}/answer`, { turnId: ids.turn, answerText: "hijack" }],
      ["post", `/api/career/sessions/${ids.session}/end`],
      ["post", "/api/career/prep", { resumeId: ids.resume, targetRole: "backend" }],
      ["post", `/api/career/prep/${ids.plan}/retry`],
      ["post", `/api/career/prep/${ids.plan}/questions/${ids.question}/attempts`, { answer: "I store it in an HTTP-only cookie." }],
      ["patch", `/api/career/prep/${ids.plan}/questions/${ids.question}`, { status: "CONFIDENT" }],
      ["post", `/api/career/prep/${ids.plan}/packs`, { variant: "GUIDE" }],
      ["patch", `/api/applications/${ids.application}`, { status: "OFFER" }],
      ["delete", `/api/applications/${ids.application}`],
      ["delete", `/api/career/prep/${ids.plan}`],
      ["delete", `/api/career/sessions/${ids.session}`],
      ["delete", `/api/career/analyses/${ids.match}`],
      ["delete", `/api/career/jobs/${ids.job}`],
      ["delete", `/api/career/resumes/${ids.resume}`],
    ];
    for (const [method, path, body] of writes) {
      const req = attacker[method as "post" | "patch" | "delete"](path);
      const res = await (body ? req.send(body) : req);
      expect([method, path, res.status]).toEqual([method, path, 404]);
    }
    // Everything the owner has is untouched.
    expect((await owner.get(`/api/career/analyses/${ids.match}`)).status).toBe(200);
    expect((await owner.get(`/api/career/prep/${ids.plan}/questions/${ids.question}`)).body.data).toMatchObject({ status: "NEW", attempts: [] });
    expect((await owner.get(`/api/career/sessions/${ids.session}`)).body.data.status).toBe("IN_PROGRESS");
    expect((await owner.get("/api/applications")).body.data[0]).toMatchObject({ id: ids.application, status: "APPLIED" });
    expect(await prisma.prepPlan.count({ where: { resume: { id: ids.resume } } })).toBe(1);
  });
});

// ───────────────────────── account deletion ─────────────────────────

describe("account deletion", () => {
  it("removes every stored file the user owns, leaves other users' files, and is idempotent", async () => {
    const { agent, id, email } = await login();
    const other = await login();
    const mine = [`resumes/${id}/cv.pdf`, `interviews/${id}/s1/t1.webm`, `prep-packs/${id}/p1.pdf`];
    for (const key of mine) await storage().put(key, Buffer.from("private"), "application/octet-stream");
    await storage().put(`resumes/${other.id}/cv.pdf`, Buffer.from("theirs"), "application/pdf");

    expect((await agent.delete("/api/auth/account").send({ confirm: "wrong@email.dev" })).status).toBe(400);
    const res = await agent.delete("/api/auth/account").send({ confirm: email });
    expect(res.status).toBe(200);
    for (const key of mine) expect(await storage().get(key)).toBeNull();
    expect(await storage().get(`resumes/${other.id}/cv.pdf`)).not.toBeNull();
    expect(await prisma.user.findUnique({ where: { id } })).toBeNull();
    // Running cleanup again (or for a user with no files) is a no-op, not an error.
    expect(await deleteUserObjects(id)).toBe(0);
  });

  it("refuses prefixes that could match more than one user's folder", async () => {
    await expect(storage().deletePrefix("resumes/")).rejects.toThrow(/Invalid storage prefix/);
    await expect(storage().deletePrefix("../")).rejects.toThrow(/Invalid storage prefix/);
    await expect(storage().deletePrefix("resumes/../x/")).rejects.toThrow(/Invalid storage prefix/);
  });
});

// ───────────────────────── configuration ─────────────────────────

describe("production configuration guard", () => {
  const good = {
    JWT_SECRET: "q8Zr1v-very-long-random-production-secret-value-0001", SANDBOX_DRIVER: "docker" as const, STORAGE_DRIVER: "s3" as const, STORAGE_LOCAL_PERSISTENT: false, S3_BUCKET: "private-bucket" as string | undefined, AUDIO_RECORDING: false, COOKIE_SECURE: undefined,
    AI_PROVIDER: "gemini" as const, AI_API_KEY: "key", CORS_ORIGIN: "https://app.example.com", APP_URL: "https://app.example.com",
  };
  it("accepts a safe production config", () => {
    expect(productionProblems(good)).toEqual([]);
  });
  it("accepts code execution disabled instead of the Docker sandbox", () => {
    expect(productionProblems({ ...good, SANDBOX_DRIVER: "disabled" })).toEqual([]);
  });
  it("refuses the process sandbox, example secrets, insecure cookies and a bucket-less S3 driver", () => {
    expect(productionProblems({ ...good, SANDBOX_DRIVER: "process" })).toEqual([expect.stringMatching(/SANDBOX_DRIVER/)]);
    for (const secret of ["change-me-to-a-long-random-string-at-least-32-chars", "dev-only-secret-dev-only-secret-dev-only", "YOUR_RANDOM_SECRET_AT_LEAST_32_CHARS"]) {
      expect(productionProblems({ ...good, JWT_SECRET: secret })).toEqual([expect.stringMatching(/JWT_SECRET/)]);
    }
    expect(productionProblems({ ...good, COOKIE_SECURE: false })).toEqual([expect.stringMatching(/COOKIE_SECURE/)]);
    expect(productionProblems({ ...good, S3_BUCKET: undefined })).toEqual([expect.stringMatching(/S3_BUCKET/)]);
  });
  it("runs without object storage, but never keeps user files on an ephemeral disk", () => {
    expect(productionProblems({ ...good, STORAGE_DRIVER: "none", S3_BUCKET: undefined })).toEqual([]);
    expect(productionProblems({ ...good, STORAGE_DRIVER: "local" })).toEqual([expect.stringMatching(/STORAGE_DRIVER=local/)]);
    // Explicitly declared persistent volume (e.g. a mounted disk) is allowed.
    expect(productionProblems({ ...good, STORAGE_DRIVER: "local", STORAGE_LOCAL_PERSISTENT: true })).toEqual([]);
  });
  it("defaults to the safe choice in production when a variable is unset", () => {
    const base = { DATABASE_URL: "postgresql://x", JWT_SECRET: "q8Zr1v-very-long-random-production-secret-value-0001" };
    const prod = parseEnv({ ...base, NODE_ENV: "production" });
    expect(prod.success && [prod.data.SANDBOX_DRIVER, prod.data.STORAGE_DRIVER]).toEqual(["disabled", "none"]);
    const dev = parseEnv({ ...base, NODE_ENV: "development" });
    expect(dev.success && [dev.data.SANDBOX_DRIVER, dev.data.STORAGE_DRIVER]).toEqual(["process", "local"]);
  });
  it("refuses a non-production NODE_ENV on Render", () => {
    expect(hostProblems("development", { onRender: true })).toEqual([expect.stringMatching(/NODE_ENV=development on Render/)]);
    expect(hostProblems("production", { onRender: true })).toEqual([]);
    expect(hostProblems("development", { onRender: false })).toEqual([]);
  });
  it("refuses audio recording without file storage", () => {
    expect(productionProblems({ ...good, AUDIO_RECORDING: true })).toEqual([]);
    expect(productionProblems({ ...good, STORAGE_DRIVER: "none", AUDIO_RECORDING: true })).toEqual([expect.stringMatching(/AUDIO_RECORDING/)]);
  });
  it("refuses a keyless AI provider, an implicit localhost Redis and plain-HTTP remote origins", () => {
    expect(productionProblems({ ...good, AI_API_KEY: undefined })).toEqual([expect.stringMatching(/AI_API_KEY/)]);
    expect(productionProblems({ ...good, AI_PROVIDER: "none", AI_API_KEY: undefined })).toEqual([]);
    expect(productionProblems(good, { redisUrlSet: false })).toEqual([expect.stringMatching(/REDIS_URL/)]);
    expect(productionProblems({ ...good, CORS_ORIGIN: "http://app.example.com" })).toEqual([expect.stringMatching(/https/)]);
    // Local production image (docker-compose) stays allowed.
    expect(productionProblems({ ...good, CORS_ORIGIN: "http://localhost:3000", APP_URL: "http://localhost:3000" })).toEqual([]);
  });
});

// ───────────────────────── code execution disabled ─────────────────────────

describe("code execution disabled (SANDBOX_DRIVER=disabled)", () => {
  const previous = env.SANDBOX_DRIVER;
  beforeAll(() => {
    env.SANDBOX_DRIVER = "disabled";
  });
  afterAll(() => {
    env.SANDBOX_DRIVER = previous;
  });

  it("every code-run path answers 503 CODE_EXECUTION_DISABLED and /me tells the UI", async () => {
    const { agent } = await login();
    expect((await agent.get("/api/auth/me")).body.data.flags.CODE_EXECUTION).toBe(false);
    const run = await agent.post("/api/code/run").send({ language: "javascript", code: "console.log(1)" });
    expect(run.status).toBe(503);
    expect(run.body.error.code).toBe("CODE_EXECUTION_DISABLED");
    const task = await prisma.buildTask.findFirstOrThrow({ where: { status: "PUBLISHED" } });
    await agent.post(`/api/build-tasks/${task.slug}/start`).send({ language: "javascript" });
    const buildRun = await agent.post(`/api/build-tasks/${task.slug}/run`).send({ language: "javascript", code: "function x() {}" });
    expect(buildRun.status).toBe(503);
    // The process runner is never used as a fallback.
    expect(() => sandbox()).toThrow(/disabled/);
  });

  const interviewKinds = async () => {
    const { agent } = await login();
    const resumeId = (await agent.post("/api/career/resumes").send({ text: RESUME })).body.data.id;
    const jobId = (await agent.post("/api/career/jobs").send({ text: JD })).body.data.id;
    const matchId = (await agent.post("/api/career/analyses").send({ resumeId, jobId })).body.data.id;
    const start = await agent.post("/api/career/sessions").send({ matchId, questionTarget: 5, consent: { recording: true, integrity: true, preparationOnly: true } });
    const sessionId = start.body.data.id;
    let current = start.body.data.current;
    const kinds: string[] = [];
    for (let i = 0; i < 12 && current; i++) {
      kinds.push(current.kind);
      if (current.kind === "CODING" || current.kind === "PROBLEM") break;
      const r = await agent.post(`/api/career/sessions/${sessionId}/answer`).send({ turnId: current.id, answerText: "I store it in an HTTP-only cookie." });
      expect(r.status).toBe(200);
      current = r.body.data.done ? null : r.body.data.current;
    }
    return kinds;
  };

  beforeAll(async () => {
    // Coding turns are drawn from DSA build tasks; without one the test below would pass vacuously.
    const stage = await prisma.stage.findFirstOrThrow({ where: { slug: "foundations" } });
    const dsa = await prisma.module.create({ data: { stageId: stage.id, slug: "dsa", title: "DSA", description: "", order: 9, status: "PUBLISHED" } });
    const topic = await prisma.topic.create({ data: { moduleId: dsa.id, slug: "arrays-hardening", title: "Arrays", order: 0, status: "PUBLISHED", publishedVersion: 1 } });
    await prisma.buildTask.create({
      data: {
        slug: "sum-hardening", topicId: topic.id, title: "Sum", description: "Return a + b", functionName: "sum",
        starterJs: "function sum(a, b) {}", starterPython: "def sum(a, b):\n    pass",
        tests: [{ name: "one", args: [1, 2], expected: 3 }], hints: ["a", "b", "c"], explainQuestions: [{ question: "Why?", keywords: ["plus"] }], status: "PUBLISHED",
      },
    });
  });

  it("Manisha asks an explain-your-approach problem instead of a coding question (no Run button)", async () => {
    const kinds = await interviewKinds();
    expect(kinds.length).toBeGreaterThan(2);
    expect(kinds).not.toContain("CODING");
    expect(kinds).toContain("PROBLEM");
  });

  it("control: with execution enabled the same interview does include a coding turn", async () => {
    env.SANDBOX_DRIVER = "process";
    try {
      expect(await interviewKinds()).toContain("CODING");
    } finally {
      env.SANDBOX_DRIVER = "disabled";
    }
  });
});

// ───────────────────────── dependency outages ─────────────────────────

describe("dependency outages", () => {
  it("classifies database and Redis connection failures as 503, not as bugs", async () => {
    const { isDependencyOutage } = await import("../src/middleware/error-handler.js");
    const { Prisma } = await import("@prisma/client");
    expect(isDependencyOutage(new Prisma.PrismaClientKnownRequestError("Can't reach database server", { code: "P1001", clientVersion: "6" }))).toBe(true);
    expect(isDependencyOutage(Object.assign(new Error("Reached the max retries per request limit"), { name: "MaxRetriesPerRequestError" }))).toBe(true);
    expect(isDependencyOutage(new Error("connect ECONNREFUSED 127.0.0.1:6379"))).toBe(true);
    expect(isDependencyOutage(new Prisma.PrismaClientKnownRequestError("Unique constraint", { code: "P2002", clientVersion: "6" }))).toBe(false);
    expect(isDependencyOutage(new Error("Cannot read properties of undefined"))).toBe(false);
  });
});

// ───────────────────────── health ─────────────────────────

describe("health checks", () => {
  it("separates liveness, readiness and worker status", async () => {
    await redis().del("worker:heartbeat");
    expect((await supertest(app).get("/live")).body).toEqual({ success: true, data: { alive: true } });
    expect((await supertest(app).get("/ready")).body).toEqual({ success: true, data: { database: true, redis: true } });
    expect((await supertest(app).get("/health")).body.data).toEqual({ database: true, redis: true, worker: false });
    const stop = startHeartbeat(["test"]);
    await until(() => supertest(app).get("/health").then((r) => r.body.data.worker), (w) => w === true, 2000);
    expect((await supertest(app).get("/health")).body.data.worker).toBe(true);
    await stop();
    expect((await supertest(app).get("/health")).body.data.worker).toBe(false);
  });
});

// ───────────────────────── worker reliability ─────────────────────────

describe("code runner unavailable", () => {
  it("answers 503 SANDBOX_UNAVAILABLE (not a 500) and drops the orphaned job", async () => {
    // No code worker runs in this file, so nothing will pick the job up.
    const err = await executeCode({ language: "javascript", code: "console.log(1)" }, 300).catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 503, code: "SANDBOX_UNAVAILABLE" });
    const q = new Queue(CODE_QUEUE, { connection: bullConnection() });
    expect(await q.getWaitingCount()).toBe(0);
    await q.close();
  });
});

describe("stuck Top-100 work recovery", () => {
  it("re-queues orphaned plans, leaves live ones alone, and gives up honestly after repeated loss", async () => {
    await worker?.close(); // keep jobs in the queue so we can observe them
    worker = undefined;
    const { id: userId } = await login();
    const resume = await prisma.careerResume.create({ data: { userId, label: "cv", text: RESUME, parsed: {} } });
    const old = new Date(Date.now() - 10 * 60_000);
    const plan = await prisma.prepPlan.create({ data: { userId, resumeId: resume.id, targetRole: "backend", title: "Backend", status: "RUNNING", progress: {}, allocation: {}, createdAt: old } });
    const fresh = await prisma.prepPlan.create({ data: { userId, resumeId: resume.id, targetRole: "devops", title: "DevOps", status: "QUEUED", progress: {}, allocation: {} } });

    const first = await recoverStuckPrepWork();
    expect(first.requeued).toBeGreaterThanOrEqual(1);
    expect((await liveTargets()).plans.has(plan.id)).toBe(true);
    expect((await liveTargets()).plans.has(fresh.id)).toBe(false); // too young to be "stuck"
    expect((await prisma.prepPlan.findUniqueOrThrow({ where: { id: plan.id } })).status).toBe("QUEUED");

    // Now it has a live job: a second sweep must not enqueue a duplicate.
    const before = (await liveTargets()).plans.size;
    await recoverStuckPrepWork();
    expect((await liveTargets()).plans.size).toBe(before);

    // Lost too many times today → failed with an honest, actionable message.
    const lost = await prisma.prepPlan.create({ data: { userId, resumeId: resume.id, targetRole: "sde", title: "SDE", status: "RUNNING", progress: {}, allocation: {}, createdAt: old } });
    await redis().set(`prep:recover:plan:${lost.id}`, "3");
    await recoverStuckPrepWork();
    const failed = await prisma.prepPlan.findUniqueOrThrow({ where: { id: lost.id } });
    expect(failed.status).toBe("FAILED");
    expect(failed.error).toMatch(/interrupted.*Retry/);
  });
});
