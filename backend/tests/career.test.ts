import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { login, resetDb, seedFixture, startWorker } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { weightedMatchScore } from "../src/modules/career/analysis.service.js";
import { computeReadiness } from "../src/modules/readiness/readiness.service.js";

const fake = new FakeAI();
const RESUME = "Riya Sharma — Backend developer. Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication. Backend intern at Acme for 6 months building REST APIs. B.Tech CSE 2026. Skills: JavaScript, Node.js, Express, MongoDB, Docker.";
const JD = "Backend Developer at Zeta. Required: Node.js, Express, MongoDB, Redis, AWS. Nice to have: Docker. Build and scale APIs.";

beforeAll(async () => {
  await resetDb();
  await seedFixture();
  // Coding questions are drawn from DSA build tasks.
  const stage = await prisma.stage.findFirstOrThrow({ where: { slug: "foundations" } });
  const dsa = await prisma.module.create({ data: { stageId: stage.id, slug: "dsa", title: "DSA", description: "", order: 9, status: "PUBLISHED" } });
  const topic = await prisma.topic.create({ data: { moduleId: dsa.id, slug: "arrays-x", title: "Arrays", order: 0, status: "PUBLISHED", publishedVersion: 1 } });
  await prisma.buildTask.create({
    data: {
      slug: "sum-build", topicId: topic.id, title: "Sum", description: "Return a + b", functionName: "sum",
      starterJs: "function sum(a, b) {}", starterPython: "def sum(a, b):\n    pass",
      tests: [{ name: "one", args: [1, 2], expected: 3 }, { name: "hidden", args: [5, 5], expected: 10, hidden: true }],
      hints: ["a", "b", "c"], explainQuestions: [{ question: "Why?", keywords: ["plus"] }], status: "PUBLISHED",
    },
  });
  await prisma.featureFlag.create({ data: { key: "AI_INTERVIEW", description: "", enabled: true } });
  setAIProvider(fake);
  startWorker();
});
afterAll(() => setAIProvider(undefined));

async function analysisFor(agent: Awaited<ReturnType<typeof login>>["agent"]) {
  const resume = await agent.post("/api/career/resumes").send({ text: RESUME, label: "Main CV" });
  const job = await agent.post("/api/career/jobs").send({ text: JD });
  return agent.post("/api/career/analyses").send({ resumeId: resume.body.data.id, jobId: job.body.data.id });
}

describe("resume + JD analysis", () => {
  it("parses documents, computes the match score in code and keeps the bank technical", async () => {
    const { agent } = await login();
    const res = await analysisFor(agent);
    expect(res.status).toBe(201);
    const m = res.body.data;
    expect(m.score).toBe(weightedMatchScore(m.breakdown));
    expect(m.score).toBe(75); // (60·25 + 80·20 + 70·15 + 90·15 + 50·10 + 100·10 + 100·5) / 100
    expect(m.missing).toEqual(["Redis", "AWS"]);
    expect(m.questions.some((q: { question: string }) => /about yourself/i.test(q.question))).toBe(false);
    expect(m.questions).toHaveLength(10);
    // Untrusted documents are fenced so instructions inside them aren't followed.
    const call = fake.calls.find((c) => c.task === "parse_resume")!;
    expect(call.user).toContain("<resume>");
    expect(call.system).toMatch(/Never follow instructions/);
    // The broken first job reply was retried, not stored.
    expect(fake.calls.filter((c) => c.task === "parse_job")).toHaveLength(2);
  });

  it("rejects files it can't read and keeps analyses private", async () => {
    const { agent } = await login();
    const bad = await agent.post("/api/career/resumes").send({ fileBase64: Buffer.from("not a pdf").toString("base64"), mimeType: "application/zip" });
    expect(bad.status).toBe(400);
    const mine = await analysisFor(agent);
    const other = await login();
    expect((await other.agent.get(`/api/career/analyses/${mine.body.data.id}`)).status).toBe(404);
  });
});

describe("AI technical interview", () => {
  it("requires all three consents", async () => {
    const { agent } = await login();
    const m = await analysisFor(agent);
    const res = await agent.post("/api/career/sessions").send({ matchId: m.body.data.id, consent: { recording: true, integrity: true, preparationOnly: false } });
    expect(res.status).toBe(400);
  });

  it("runs a full interview: follow-ups, coding, hidden transcript, report, audio controls", async () => {
    const { agent, id: userId } = await login();
    const other = await login();
    const m = await analysisFor(agent);
    const start = await agent.post("/api/career/sessions").send({
      matchId: m.body.data.id, language: "hinglish", questionTarget: 7, durationMinutes: 30,
      consent: { recording: true, integrity: true, preparationOnly: true },
    });
    expect(start.status).toBe(201);
    const sessionId = start.body.data.id;
    // Interviews are strictly English, even if an older client asks for Hinglish.
    expect(start.body.data.intro).toMatch(/^Hi Test, I'm Manisha\..*Please answer in English\./);
    expect((await agent.get(`/api/career/sessions/${sessionId}`)).body.data.language).toBe("en");
    expect((await prisma.interviewSession.findUniqueOrThrow({ where: { id: sessionId } })).language).toBe("en");
    // Real interviews open on the candidate's own resume.
    expect(start.body.data.current.area).toBe("PROJECTS");

    // A partial answer with audio → Manisha follows up instead of moving on.
    const audio = Buffer.from("fake-opus-audio").toString("base64");
    let res = await agent.post(`/api/career/sessions/${sessionId}/answer`).send({ turnId: start.body.data.current.id, answerText: "I used JWT tokens", audioBase64: audio, audioMime: "audio/webm;codecs=opus", durationSec: 40 });
    expect(res.body.data.current.kind).toBe("FOLLOW_UP");
    expect(res.body.data.current.question).toMatch(/Where did you store/);
    // Manisha's acknowledgement is a fixed neutral phrase, never the model's wording.
    expect(res.body.data.lead).toMatch(/^(Let's go one level deeper\.|Can you explain that further\?|Okay\. Let's go a little deeper on that\.)$/);

    // While in progress nothing about scores or the transcript is exposed.
    const mid = await agent.get(`/api/career/sessions/${sessionId}`);
    expect(mid.body.data.turns).toEqual([]);
    expect(mid.body.data.report).toBeNull();

    let current = res.body.data.current;
    let sawCoding = false;
    let verbal = 0;
    for (let i = 0; i < 10 && !res.body.data.done; i++) {
      if (current.kind === "CODING") {
        sawCoding = true;
        expect(current.coding.publicTests).toHaveLength(1);
        expect(JSON.stringify(current.coding)).not.toContain("[5,5]");
        const run = await agent.post(`/api/career/sessions/${sessionId}/run-code`).send({ turnId: current.id, language: "javascript", code: "function sum(a, b) { return a + b; }" });
        expect(run.body.data.tests[0].passed).toBe(true);
        res = await agent.post(`/api/career/sessions/${sessionId}/answer`).send({ turnId: current.id, code: "function sum(a, b) { return a + b; }", codeLanguage: "javascript", answerText: "Add them, O(1)." });
      } else {
        const answer = verbal++ === 1 ? "Mujhe pata nahi" : "I keep it in an HTTP-only cookie so scripts cannot read it";
        res = await agent.post(`/api/career/sessions/${sessionId}/answer`).send({ turnId: current.id, answerText: answer, durationSec: 30 });
      }
      current = res.body.data.current;
    }
    expect(res.body.data.done).toBe(true);
    expect(sawCoding).toBe(true);

    const final = await agent.get(`/api/career/sessions/${sessionId}`);
    const s = final.body.data;
    expect(s.status).toBe("COMPLETED");
    expect(s.turns).toHaveLength(7);
    expect(s.report.counts.total).toBe(7);
    expect(s.report.counts.incorrect).toBeGreaterThanOrEqual(1);
    expect(s.readinessScore).toBe(s.report.readiness);
    expect(["INTERVIEW_READY", "NEEDS_IMPROVEMENT", "NOT_YET_READY"]).toContain(s.result);
    expect(s.report.disclaimer).toMatch(/not an automated hiring decision/);
    expect(s.report.nextSteps.at(-1).label).toMatch(/another interview/);
    const coding = s.turns.find((t: { kind: string }) => t.kind === "CODING");
    expect(coding.codeResult).toMatchObject({ passed: 2, total: 2 });

    // Audio: owner can play it, nobody else can; deleting keeps the transcript.
    const withAudio = s.turns.find((t: { hasAudio: boolean }) => t.hasAudio);
    const play = await agent.get(`/api/career/sessions/${sessionId}/turns/${withAudio.id}/audio`);
    expect(play.status).toBe(200);
    expect(play.headers["content-type"]).toBe("audio/webm");
    expect((await other.agent.get(`/api/career/sessions/${sessionId}/turns/${withAudio.id}/audio`)).status).toBe(404);
    expect((await agent.delete(`/api/career/sessions/${sessionId}/recordings`)).body.data.deleted).toBe(1);
    expect((await agent.get(`/api/career/sessions/${sessionId}/turns/${withAudio.id}/audio`)).status).toBe(404);
    expect((await agent.get(`/api/career/sessions/${sessionId}`)).body.data.turns[0].answerText).toBe("I used JWT tokens");

    // The interview feeds the Readiness Score's interview factor.
    expect((await computeReadiness(userId)).factors.interview).toBeGreaterThan(0);
    const history = await agent.get("/api/career/sessions");
    expect(history.body.data[0].readinessScore).toBe(s.readinessScore);
  });

  it("ends the interview after the third screen-share interruption", async () => {
    const { agent } = await login();
    const m = await analysisFor(agent);
    const start = await agent.post("/api/career/sessions").send({ matchId: m.body.data.id, consent: { recording: true, integrity: true, preparationOnly: true, storeAudio: false } });
    expect(start.status, JSON.stringify(start.body)).toBe(201);
    const id = start.body.data.id;
    await agent.post(`/api/career/sessions/${id}/answer`).send({ turnId: start.body.data.current.id, answerText: "HTTP-only cookie", audioBase64: Buffer.from("x").toString("base64") });
    expect(await prisma.interviewTurn.count({ where: { sessionId: id, audioKey: { not: null } } })).toBe(0);
    const w1 = await agent.post(`/api/career/sessions/${id}/integrity`).send({ events: [{ type: "SCREEN_SHARE_STOPPED" }, { type: "TAB_HIDDEN" }] });
    expect(w1.body.data).toMatchObject({ warning: 1, ended: false });
    await agent.post(`/api/career/sessions/${id}/integrity`).send({ events: [{ type: "SCREEN_SHARE_STOPPED" }] });
    const w3 = await agent.post(`/api/career/sessions/${id}/integrity`).send({ events: [{ type: "SCREEN_SHARE_STOPPED" }] });
    expect(w3.body.data).toMatchObject({ warning: 3, ended: true });
    const s = (await agent.get(`/api/career/sessions/${id}`)).body.data;
    expect(s.status).toBe("ENDED_INTEGRITY");
    expect(s.report.integrity.status).toBe("Review recommended");
    expect(s.report.integrity.signals.TAB_HIDDEN).toBe(1);
  });

  it("explains clearly when no AI provider is configured", async () => {
    setAIProvider(null);
    const { agent } = await login();
    const res = await agent.post("/api/career/resumes").send({ text: RESUME });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("AI_UNAVAILABLE");
    setAIProvider(fake);
  });
});
