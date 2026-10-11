import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { login, resetDb, seedFixture } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
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

let worker: ReturnType<typeof startPrepWorker> | undefined;
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
async function planWithQuestion(agent: Agent) {
  const resumeId = (await agent.post("/api/career/resumes").send({ text: RESUME, label: "CV" })).body.data.id;
  const id = (await agent.post("/api/career/prep").send({ resumeId, targetRole: "fullstack" })).body.data.id;
  const until = Date.now() + 20_000;
  while (Date.now() < until && (await agent.get(`/api/career/prep/${id}`)).body.data.status !== "READY") await new Promise((r) => setTimeout(r, 100));
  const qs = (await agent.get(`/api/career/prep/${id}/questions`)).body.data as { id: string }[];
  return { planId: id, qid: qs[0].id };
}
/** Requests the answer, then polls like the page does until it is READY or FAILED. */
async function full(agent: Agent, planId: string, qid: string, body: { language?: string; regenerate?: boolean } = {}) {
  const res = await agent.post(`/api/career/prep/${planId}/questions/${qid}/full-answer`).send(body);
  if (res.status !== 200) return { status: res.status, data: null, first: null };
  const first = res.body.data.fullAnswer;
  const until = Date.now() + 20_000;
  for (;;) {
    const r = await agent.get(`/api/career/prep/${planId}/questions/${qid}/full-answer${body.language ? `?language=${body.language}` : ""}`);
    const fa = r.body.data.fullAnswer;
    if (fa?.status === "READY" || fa?.status === "FAILED" || Date.now() > until) return { status: 200, data: fa, first };
    await new Promise((x) => setTimeout(x, 100));
  }
}

describe("Top-100 full answers", () => {
  it("writes a complete answer with an example, code, an animatable diagram and answered follow-ups", async () => {
    const { agent } = await login();
    const { planId, qid } = await planWithQuestion(agent);
    expect((await agent.get(`/api/career/prep/${planId}/questions/${qid}/full-answer`)).body.data.fullAnswer).toBeNull();
    const res = await full(agent, planId, qid);
    expect(res.status).toBe(200);
    // Queued for the worker, not written inside the request.
    expect(res.first).toMatchObject({ status: "QUEUED" });
    const d = res.data;
    expect(d.status).toBe("READY");
    expect(d.structured.answer).toBeTruthy();
    expect(d.structured.examples[0]).toMatchObject({ input: "[3, 1, 3]", output: "3" });
    expect(d.structured.code[0].code).toContain("new Set()");
    expect(d.structured.diagram.walkthrough).toHaveLength(3);
    // Follow-ups without an answer are dropped.
    expect(d.structured.followUps).toEqual([{ question: "What if memory is limited?", answer: expect.stringContaining("Sort first") }]);
    expect(d.answer).toContain("### Follow-up questions");
    // The question's own context goes to the model, in interview-question mode.
    const call = fake.calls.filter((c) => c.task === "tutor_answer").at(-1)!;
    expect(call.system).toMatch(/INTERVIEW-QUESTION MODE/);
    expect(call.system).toMatch(/walkthrough/);
    expect(call.user).toMatch(/<context>[\s\S]*A strong answer covers/);
  });

  it("is generated once per language and then served from the cache", async () => {
    const { agent } = await login();
    const { planId, qid } = await planWithQuestion(agent);
    await full(agent, planId, qid);
    const before = fake.calls.filter((c) => c.task === "tutor_answer").length;
    const again = await full(agent, planId, qid);
    expect(again.first).toMatchObject({ status: "READY" });
    expect(fake.calls.filter((c) => c.task === "tutor_answer").length).toBe(before);
    // Another language is a separate answer; regenerate writes a fresh one.
    expect((await full(agent, planId, qid, { language: "en" })).data).toMatchObject({ status: "READY", language: "en" });
    expect(fake.calls.filter((c) => c.task === "tutor_answer").length).toBe(before + 1);
    const fresh = await full(agent, planId, qid, { regenerate: true });
    expect(fresh.first.status).toBe("QUEUED");
    expect(fresh.first.structured).toBeTruthy(); // the earlier answer stays visible while rewriting
    expect(fake.calls.filter((c) => c.task === "tutor_answer").length).toBe(before + 2);
    // Both languages survive side by side.
    const row = await prisma.prepQuestion.findUniqueOrThrow({ where: { id: qid } });
    expect(Object.keys(row.fullAnswers as object).sort()).toEqual(["en", "hinglish"]);
    // The question detail stays light: cached answers aren't sent with it.
    expect((await agent.get(`/api/career/prep/${planId}/questions/${qid}`)).body.data).not.toHaveProperty("fullAnswers");
  });

  it("is private, guarded and honest about a busy or missing AI", async () => {
    const owner = await login();
    const { planId, qid } = await planWithQuestion(owner.agent);
    const other = await login();
    expect((await full(other.agent, planId, qid)).status).toBe(404);
    expect((await other.agent.get(`/api/career/prep/${planId}/questions/${qid}/full-answer`)).status).toBe(404);
    setAIProvider(null);
    expect((await full(owner.agent, planId, qid)).status).toBe(503);
    setAIProvider(fake);
  });

  it("records a failed answer honestly and lets the student try again", async () => {
    const { agent } = await login();
    const { planId, qid } = await planWithQuestion(agent);
    const real = fake.complete.bind(fake);
    fake.complete = async (system: string, user: string) => (system.includes("[task:tutor_answer]") ? "not json" : real(system, user));
    const failed = await full(agent, planId, qid);
    fake.complete = real;
    expect(failed.data).toMatchObject({ status: "FAILED", error: expect.stringMatching(/couldn't use/) });
    expect((await full(agent, planId, qid)).data.status).toBe("READY");
  });
});
