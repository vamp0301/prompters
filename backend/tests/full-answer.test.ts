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
const full = (agent: Agent, planId: string, qid: string, body: object = {}) => agent.post(`/api/career/prep/${planId}/questions/${qid}/full-answer`).send(body);

describe("Top-100 full answers", () => {
  it("writes a complete answer with an example, code, an animatable diagram and answered follow-ups", async () => {
    const { agent } = await login();
    const { planId, qid } = await planWithQuestion(agent);
    const res = await full(agent, planId, qid);
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.cached).toBe(false);
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
    expect(again.body.data.cached).toBe(true);
    expect(fake.calls.filter((c) => c.task === "tutor_answer").length).toBe(before);
    // Another language is a separate answer; regenerate forces a fresh one.
    expect((await full(agent, planId, qid, { language: "en" })).body.data).toMatchObject({ cached: false, language: "en" });
    expect((await full(agent, planId, qid, { regenerate: true })).body.data.cached).toBe(false);
    // The question detail stays light: cached answers aren't sent with it.
    expect((await agent.get(`/api/career/prep/${planId}/questions/${qid}`)).body.data).not.toHaveProperty("fullAnswers");
  });

  it("is private, guarded and honest about a busy or missing AI", async () => {
    const owner = await login();
    const { planId, qid } = await planWithQuestion(owner.agent);
    const other = await login();
    expect((await full(other.agent, planId, qid)).status).toBe(404);
    setAIProvider(null);
    expect((await full(owner.agent, planId, qid, { regenerate: true })).status).toBe(503);
    setAIProvider(fake);
  });
});
