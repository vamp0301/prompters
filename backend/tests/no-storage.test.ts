import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// The whole app with no object storage (Render without R2). Must run before the app modules load env.
vi.hoisted(() => {
  process.env.STORAGE_DRIVER = "none";
  process.env.AUDIO_RECORDING = "false";
});

import { login, resetDb, seedFixture, startWorker } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { storage } from "../src/lib/storage.js";
import { startPrepWorker } from "../src/workers/prep-worker.js";

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
const JD = "Backend Developer at Zeta. Required: Node.js, Express, MongoDB, Redis, AWS. Nice to have: Docker. Build and scale APIs.";
const GOOD = "I keep it in an HTTP-only cookie so scripts cannot read it";

type Agent = Awaited<ReturnType<typeof login>>["agent"];

let prepWorker: ReturnType<typeof startPrepWorker> | undefined;
beforeAll(async () => {
  await resetDb();
  await seedFixture();
  await prisma.featureFlag.create({ data: { key: "AI_INTERVIEW", description: "", enabled: true } });
  setAIProvider(fake);
  startWorker();
  prepWorker = startPrepWorker();
});
afterAll(async () => {
  setAIProvider(undefined);
  await prepWorker?.close();
});

async function waitFor<T>(fn: () => Promise<T>, done: (v: T) => boolean, ms = 20_000): Promise<T> {
  const until = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (done(v) || Date.now() > until) return v;
    await new Promise((r) => setTimeout(r, 100));
  }
}

/** Uploads the resume as a file (not pasted text), the path that used to store the original. */
const uploadResume = (agent: Agent) =>
  agent.post("/api/career/resumes").send({ fileBase64: Buffer.from(RESUME).toString("base64"), mimeType: "text/plain", fileName: "cv.txt" });

describe("STORAGE_DRIVER=none", () => {
  it("tells the UI that file storage and recording are off", async () => {
    const { agent } = await login();
    const me = (await agent.get("/api/auth/me")).body.data;
    expect(me.flags).toMatchObject({ FILE_STORAGE: false, AUDIO_RECORDING: false });
  });

  it("parses and saves an uploaded resume without keeping the original file", async () => {
    const { agent } = await login();
    const res = await uploadResume(agent);
    expect(res.status).toBe(201);
    const saved = await prisma.careerResume.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(saved.storageKey).toBeNull();
    expect(saved.text).toContain("Notes REST API");
    expect(saved.parsed).toBeTruthy();
    // Deleting it still works.
    expect((await agent.delete(`/api/career/resumes/${saved.id}`)).status).toBe(200);
  });

  it("runs an interview with recording refused clearly and audio never kept", async () => {
    const { agent } = await login();
    const resumeId = (await uploadResume(agent)).body.data.id;
    const job = await agent.post("/api/career/jobs").send({ text: JD });
    const matchId = (await agent.post("/api/career/analyses").send({ resumeId, jobId: job.body.data.id })).body.data.id;
    const start = await agent.post("/api/career/sessions").send({ matchId, durationMinutes: 15, consent: { analysis: true, integrity: true, preparationOnly: true } });
    expect(start.status).toBe(201);
    const sessionId = start.body.data.id;
    // Never asked: the room treats this as "no recording".
    expect((await agent.get(`/api/career/sessions/${sessionId}`)).body.data.recordAudio).toBe(false);
    const allow = await agent.post(`/api/career/sessions/${sessionId}/recording`).send({ allow: true });
    expect(allow.status).toBe(503);
    expect(allow.body.error.code).toBe("RECORDING_DISABLED");
    expect((await agent.post(`/api/career/sessions/${sessionId}/recording`).send({ allow: false })).status).toBe(200);
    // An old client that still sends audio: the answer counts, the audio is dropped.
    const audio = Buffer.from("fake-opus-audio").toString("base64");
    const res = await agent.post(`/api/career/sessions/${sessionId}/answer`).send({ turnId: start.body.data.current.id, answerText: GOOD, audioBase64: audio, audioMime: "audio/webm" });
    expect(res.status).toBe(200);
    const turns = await prisma.interviewTurn.findMany({ where: { sessionId } });
    expect(turns.some((t) => t.audioKey)).toBe(false);
    expect((await agent.delete(`/api/career/sessions/${sessionId}/recordings`)).body.data.deleted).toBe(0);
  });

  it("builds PDF packs on download instead of storing them", async () => {
    const { agent } = await login();
    const other = await login();
    const resumeId = (await uploadResume(agent)).body.data.id;
    const created = await agent.post("/api/career/prep").send({ resumeId, targetRole: "fullstack" });
    const plan = await waitFor(() => agent.get(`/api/career/prep/${created.body.data.id}`).then((r) => r.body.data), (p) => p.status === "READY" || p.status === "FAILED");
    expect(plan.status).toBe("READY");
    for (const language of ["en", "hi"] as const) {
      const req = await agent.post(`/api/career/prep/${plan.id}/packs`).send({ variant: "GUIDE", language });
      const pack = await waitFor(() => agent.get(`/api/career/prep/${plan.id}/packs/${req.body.data.id}`).then((r) => r.body.data), (p) => p.status === "READY" || p.status === "FAILED");
      expect(pack.status).toBe("READY");
      expect((await prisma.prepPack.findUniqueOrThrow({ where: { id: pack.id } })).storageKey).toBeNull();
      const file = await agent.get(`/api/career/prep/${plan.id}/packs/${pack.id}/download`).buffer(true).parse((res, cb) => {
        const parts: Buffer[] = [];
        res.on("data", (b: Buffer) => parts.push(b));
        res.on("end", () => cb(null, Buffer.concat(parts)));
      });
      expect(file.status).toBe(200);
      expect((file.body as Buffer).subarray(0, 5).toString()).toBe("%PDF-");
      expect((await other.agent.get(`/api/career/prep/${plan.id}/packs/${pack.id}/download`)).status).toBe(404);
    }
    // Downloading again doesn't call the model: translations were saved by the worker.
    const translations = fake.calls.filter((c) => c.task === "translate_hi").length;
    const hi = (await prisma.prepPack.findFirstOrThrow({ where: { planId: plan.id, language: "hi" } })).id;
    expect((await agent.get(`/api/career/prep/${plan.id}/packs/${hi}/download`)).status).toBe(200);
    expect(fake.calls.filter((c) => c.task === "translate_hi").length).toBe(translations);
  });

  it("deletes an account cleanly, and refuses any write to storage loudly", async () => {
    const { agent, id, email } = await login();
    await uploadResume(agent);
    expect((await agent.delete("/api/auth/account").send({ confirm: email })).status).toBe(200);
    expect(await prisma.user.findUnique({ where: { id } })).toBeNull();
    await expect(storage().put("resumes/x/y.pdf", Buffer.from("x"), "application/pdf")).rejects.toThrow(/File storage is turned off/);
    expect(await storage().get("resumes/x/y.pdf")).toBeNull();
  });
});
