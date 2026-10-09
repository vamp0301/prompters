import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { login, resetDb, seedFixture } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { acquire, withLock, LockBusyError } from "../src/lib/lock.js";
import { prisma } from "../src/lib/prisma.js";
import { refreshIfStale } from "../src/modules/personalization/engine.js";
import { runPlan } from "../src/modules/prep/generation.service.js";
import { startPrepWorker } from "../src/workers/prep-worker.js";

/** Duplicate requests (two tabs, double-clicks, re-delivered jobs) must do expensive work once. */
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
const calls = (task: string) => fake.calls.filter((c) => c.task === task).length;
const prepCalls = () => fake.calls.filter((c) => c.task.startsWith("prep_") && c.task !== "prep_dedupe").length;

async function waitFor<T>(fn: () => Promise<T>, done: (v: T) => boolean, ms = 30_000): Promise<T> {
  const until = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (done(v) || Date.now() > until) return v;
    await new Promise((r) => setTimeout(r, 100));
  }
}
const resumeFor = async (agent: Agent) => (await agent.post("/api/career/resumes").send({ text: RESUME, label: "Main CV" })).body.data.id as string;

describe("locks", () => {
  it("only one holder at a time; a waiter gets it after release; only the owner releases", async () => {
    const release = await acquire("lock:test:a", 5_000);
    expect(release).not.toBeNull();
    expect(await acquire("lock:test:a", 5_000)).toBeNull();
    const waiting = acquire("lock:test:a", 5_000, 2_000);
    await new Promise((r) => setTimeout(r, 100));
    await release!();
    const second = await waiting;
    expect(second).not.toBeNull();
    await release!(); // the first owner's stale release must not free the second owner's lock
    expect(await acquire("lock:test:a", 5_000)).toBeNull();
    await second!();
    await expect(withLock("lock:test:b", 5_000, async () => withLock("lock:test:b", 5_000, async () => 1))).rejects.toBeInstanceOf(LockBusyError);
  });
});

describe("single-flight AI work", () => {
  it("two concurrent Top-100 requests for the same resume and role create one plan", async () => {
    const { agent, id } = await login();
    const resumeId = await resumeFor(agent);
    const [a, b] = await Promise.all([0, 1].map(() => agent.post("/api/career/prep").send({ resumeId, targetRole: "backend" })));
    expect([a.status, b.status].every((s) => s === 200 || s === 201)).toBe(true);
    expect(a.body.data.id).toBe(b.body.data.id);
    expect(await prisma.prepPlan.count({ where: { userId: id } })).toBe(1);
  });

  it("a plan whose job is delivered twice is generated once", async () => {
    const { agent, id: userId } = await login();
    const resumeId = await resumeFor(agent);
    const plan = await prisma.prepPlan.create({ data: { userId, resumeId, targetRole: "backend", title: "Backend", progress: {}, allocation: {} } });
    const before = prepCalls();
    await Promise.all([runPlan(plan.id), runPlan(plan.id)]);
    const once = prepCalls() - before;
    const done = await prisma.prepPlan.findUniqueOrThrow({ where: { id: plan.id } });
    expect(done.status).toBe("READY");
    // A third delivery after it finished does nothing at all.
    await runPlan(plan.id);
    expect(prepCalls() - before).toBe(once);
    // Same number of questions as a single run would publish (no doubles).
    const published = await prisma.prepQuestion.count({ where: { planId: plan.id, rank: { gt: 0 } } });
    const ranks = await prisma.prepQuestion.findMany({ where: { planId: plan.id, rank: { gt: 0 } }, select: { rank: true } });
    expect(new Set(ranks.map((r) => r.rank)).size).toBe(published);
  });

  it("a double-clicked PDF request makes one pack", async () => {
    worker = startPrepWorker();
    const { agent } = await login();
    const resumeId = await resumeFor(agent);
    const created = (await agent.post("/api/career/prep").send({ resumeId, targetRole: "backend" })).body.data;
    const plan = await waitFor(() => agent.get(`/api/career/prep/${created.id}`).then((r) => r.body.data), (p) => p.status === "READY" || p.status === "FAILED");
    expect(plan.status).toBe("READY");
    const [a, b] = await Promise.all([0, 1].map(() => agent.post(`/api/career/prep/${plan.id}/packs`).send({ variant: "QUESTIONS" })));
    expect(a.body.data.id).toBe(b.body.data.id);
    expect(await prisma.prepPack.count({ where: { planId: plan.id } })).toBe(1);
    const pack = await waitFor(() => agent.get(`/api/career/prep/${plan.id}/packs/${a.body.data.id}`).then((r) => r.body.data), (p) => p.status === "READY" || p.status === "FAILED");
    expect(pack.status).toBe("READY"); // packs run on their own queue
  });

  it("opening a project module in two tabs generates it once", async () => {
    const { agent } = await login();
    await resumeFor(agent);
    const list = (await agent.get("/api/career/projects")).body.data;
    const notes = list.projects.find((p: { name: string }) => p.name === "Notes API");
    const before = calls("project_story");
    const [a, b] = await Promise.all([0, 1].map(() => agent.get(`/api/career/projects/${notes.id}`)));
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(calls("project_story") - before).toBe(1);
    expect(a.body.data.content.questions).toHaveLength(20);
    expect(b.body.data.content.questions).toHaveLength(20);
  });

  it("the resume is analysed once even when several features ask for it at the same time", async () => {
    const { agent } = await login();
    await resumeFor(agent);
    const before = calls("resume_intelligence");
    const results = await Promise.all([0, 1, 2].map(() => agent.get("/api/career/projects")));
    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(calls("resume_intelligence") - before).toBe(1);
  });

  it("concurrent recommendation refreshes never create duplicates", async () => {
    const { agent, id } = await login();
    await resumeFor(agent);
    await Promise.all([0, 1, 2].map(() => refreshIfStale(id, { force: true })));
    const active = await prisma.recommendation.findMany({ where: { userId: id, status: "ACTIVE" }, select: { itemType: true, itemId: true, action: true } });
    const keys = active.map((r) => `${r.action}:${r.itemType}:${r.itemId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("admin guards", () => {
  it("an admin can't sign out a super admin, and viewing a user's record is audited", async () => {
    const admin = await login("ADMIN");
    const superAdmin = await login("SUPER_ADMIN");
    const student = await login();
    expect((await admin.agent.post(`/api/admin/users/${superAdmin.id}/revoke-sessions`)).status).toBe(400);
    expect((await admin.agent.post(`/api/admin/users/${student.id}/revoke-sessions`)).status).toBe(200);
    expect((await admin.agent.get(`/api/admin/users/${student.id}`)).status).toBe(200);
    expect(await prisma.adminAuditLog.count({ where: { actorId: admin.id, action: "VIEWED_USER", entityId: student.id } })).toBe(1);
  });
});
