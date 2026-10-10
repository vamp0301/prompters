import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { login, resetDb, seedFixture } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { keywords, retrieve, verify, answerSchema } from "../src/ai/answer.js";

const fake = new FakeAI();
beforeAll(async () => {
  await resetDb();
  await seedFixture();
  await prisma.featureFlag.upsert({ where: { key: "AI_TUTOR" }, update: { enabled: true }, create: { key: "AI_TUTOR", description: "", enabled: true } });
  setAIProvider(fake);
});
afterAll(() => setAIProvider(undefined));

const ask = (agent: Awaited<ReturnType<typeof login>>["agent"], body: object) => agent.post("/api/ai/explain").send({ topicSlug: "alpha", ...body });

describe("solution-first tutor", () => {
  it("answers directly with a solution, example, code and diagram — and keeps the Markdown answer for old clients", async () => {
    const { agent } = await login();
    const res = await ask(agent, { question: "How do I find a duplicate fast?" });
    expect(res.status).toBe(200);
    const { structured, answer, mode } = res.body.data;
    expect(mode).toBe("solution");
    expect(structured.answer).toMatch(/hash map/);
    expect(structured.solution.steps.length).toBeGreaterThan(0);
    expect(structured.examples[0]).toMatchObject({ input: "[3, 1, 3]", output: "3" });
    expect(structured.code[0].code).toContain("new Set()");
    expect(structured.diagram).toMatchObject({ kind: "flow" });
    expect(typeof answer).toBe("string");
    expect(answer).toContain("```javascript");
    // The prompt demands the solution first and forbids hint-only answers in this mode.
    const call = fake.calls.filter((c) => c.task === "tutor_answer").at(-1)!;
    expect(call.system).toMatch(/SOLUTION FIRST/);
    expect(call.system).not.toMatch(/never write complete solutions/);
  });

  it("is grounded in the published lesson, and drops sources the model invented", async () => {
    const { agent } = await login();
    const res = await ask(agent, { question: "What is alpha and how does beta relate?" });
    const { structured, sources, verification } = res.body.data;
    const call = fake.calls.filter((c) => c.task === "tutor_answer").at(-1)!;
    expect(call.user).toContain("ALPHA — DEFINITION"); // the current topic's lesson
    expect(call.user).toContain("BETA"); // a related published topic matched by keyword
    expect(structured.sources).toEqual(["S1"]);
    expect(sources).toEqual([expect.objectContaining({ id: "S1", topicSlug: "alpha" })]);
    expect(verification).toMatchObject({ grounded: true, inventedSources: 1, diagram: "valid" });
  });

  it("only reads the published snapshot, never an unpublished draft", async () => {
    const alpha = await prisma.topic.findUniqueOrThrow({ where: { slug: "alpha" } });
    await prisma.topicSection.updateMany({ where: { topicId: alpha.id }, data: { content: { en: "SECRET DRAFT", hinglish: "SECRET DRAFT" } } });
    const sources = await retrieve(alpha.id, "alpha", "en");
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.some((s) => s.text.includes("SECRET DRAFT"))).toBe(false);
  });

  it("hint mode is opt-in and returns no code", async () => {
    const { agent } = await login();
    const res = await ask(agent, { question: "How do I find a duplicate fast?", mode: "hints" });
    expect(res.body.data.mode).toBe("hints");
    expect(res.body.data.structured.code).toEqual([]);
    expect(fake.calls.filter((c) => c.task === "tutor_answer").at(-1)!.system).toMatch(/HINT MODE/);
  });

  it("drops a diagram that teaches nothing instead of rendering it", async () => {
    fake.tutorBadDiagram = true;
    const { agent } = await login();
    const res = await ask(agent, { question: "How do I find a duplicate fast?" });
    fake.tutorBadDiagram = false;
    expect(res.body.data.structured.diagram).toBeNull();
    expect(res.body.data.verification.diagram).toBe("dropped");
  });

  it("says honestly when no lesson backs the answer", () => {
    const raw = answerSchema.parse({ answer: "x", sources: ["S7"] });
    const { answer, verification } = verify(raw, []);
    expect(verification).toMatchObject({ grounded: false, inventedSources: 1, sourcesRetrieved: 0 });
    expect(answer.assumptions[0]).toMatch(/general knowledge/);
  });

  it("extracts useful search terms", () => {
    expect(keywords("How does the JWT token expire in Node.js?")).toEqual(expect.arrayContaining(["jwt", "token", "expire", "node.js"]));
    expect(keywords("what is it")).toEqual([]);
  });

  it("keeps its guards: login required, AI off during a timed test, 503 without a provider", async () => {
    const anon = await import("supertest").then((m) => m.default);
    const { app } = await import("./helpers.js");
    expect((await anon(app).post("/api/ai/explain").send({ topicSlug: "alpha", question: "What is alpha?" })).status).toBe(401);
    const { agent } = await login();
    setAIProvider(null);
    expect((await ask(agent, { question: "What is alpha?" })).status).toBe(503);
    setAIProvider(fake);
  });
});
