import { beforeAll, describe, expect, it } from "vitest";
import { answersFor, login, resetDb, seedFixture, startWorker } from "./helpers.js";
import { prisma } from "../src/lib/prisma.js";

beforeAll(async () => {
  await resetDb();
  await seedFixture();
  startWorker();
});

describe("roadmap and topics", () => {
  it("shows only the learner's starting track and keeps coming-soon topics visible", async () => {
    const { agent } = await login("STUDENT", { language: "JAVASCRIPT" });
    const res = await agent.get("/api/roadmap");
    const slugs = res.body.data.stages.map((s: { slug: string }) => s.slug);
    expect(slugs).toEqual(["foundations", "javascript"]);
    const js = res.body.data.stages[1];
    expect(js.unlocked).toBe(false);
    expect(js.lockReason).toMatch(/Foundations stage exam/);
    expect(js.modules[0].topics.find((t: { slug: string }) => t.slug === "soon").state).toBe("COMING_SOON");
  });

  it("locks a topic until its prerequisites are mastered", async () => {
    const { agent } = await login();
    const res = await agent.get("/api/topics/beta");
    expect(res.status).toBe(423);
    expect(res.body.error.details.missingPrerequisites[0].slug).toBe("alpha");
    expect(res.body.error.message).toMatch(/Before BETA/);
  });

  it("serves the published snapshot, not the working draft", async () => {
    const { agent } = await login();
    const alpha = await prisma.topic.findUniqueOrThrow({ where: { slug: "alpha" } });
    await prisma.topicSection.update({ where: { topicId_type: { topicId: alpha.id, type: "DEFINITION" } }, data: { content: { hinglish: "DRAFT", en: "DRAFT" } } });
    const res = await agent.get("/api/topics/alpha");
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data.sections)).not.toContain("DRAFT");
    expect(res.body.data.sections).toHaveLength(10);
    expect(res.body.data.promptCards[0].locked).toBe(true);
  });
});

describe("mastery quiz", () => {
  it("never sends correct answers to the browser", async () => {
    const { agent } = await login();
    const res = await agent.post("/api/topics/alpha/quiz");
    expect(res.status).toBe(200);
    expect(res.body.data.questions).toHaveLength(5);
    expect(JSON.stringify(res.body.data)).not.toMatch(/"correct"|"keywords"/);
  });

  it("80%+ masters the topic, schedules review, unlocks prompts and the next topic", async () => {
    const { agent, id } = await login();
    const start = await agent.post("/api/topics/alpha/quiz");
    const answers = await answersFor(start.body.data.id, (i) => i !== 0); // 4/5 = 80%
    const res = await agent.post(`/api/attempts/${start.body.data.id}/submit`).send({ answers });
    expect(res.body.data.score).toBe(80);
    expect(res.body.data.passed).toBe(true);
    expect(res.body.data.effects.mastered).toBe(true);
    expect(res.body.data.questions[0].explanation).toBe("because");

    const m = await prisma.mastery.findFirstOrThrow({ where: { userId: id, topic: { slug: "alpha" } } });
    expect(m.status).toBe("MASTERED");
    expect(m.nextReviewAt!.getTime()).toBeGreaterThan(Date.now() + 23 * 3600_000);

    expect((await agent.get("/api/topics/beta")).status).toBe(200);
    const prompts = await agent.get("/api/prompts");
    expect(prompts.body.data[0].unlocked).toBe(true);
    const card = await agent.get(`/api/prompts/${prompts.body.data[0].id}`);
    expect(card.body.data.template).toContain("[THING]");
  });

  it("below 80% does not master, and a retry draws a fresh set", async () => {
    const { agent, id } = await login();
    const first = await agent.post("/api/topics/alpha/quiz");
    const res = await agent.post(`/api/attempts/${first.body.data.id}/submit`).send({ answers: await answersFor(first.body.data.id, (i) => i < 3) });
    expect(res.body.data.passed).toBe(false);
    const m = await prisma.mastery.findFirstOrThrow({ where: { userId: id, topic: { slug: "alpha" } } });
    expect(m.status).toBe("LEARNING");
    const second = await agent.post("/api/topics/alpha/quiz");
    const firstIds = first.body.data.questions.map((q: { id: string }) => q.id);
    const fresh = second.body.data.questions.filter((q: { id: string }) => !firstIds.includes(q.id));
    expect(fresh.length).toBeGreaterThanOrEqual(4); // pool of 9, quiz of 5
  });

  it("double submit does not grade twice and other users cannot read the attempt", async () => {
    const { agent } = await login();
    const other = await login();
    const start = await agent.post("/api/topics/alpha/quiz");
    const answers = await answersFor(start.body.data.id, "correct");
    await agent.post(`/api/attempts/${start.body.data.id}/submit`).send({ answers });
    const again = await agent.post(`/api/attempts/${start.body.data.id}/submit`).send({ answers: {} });
    expect(again.body.data.score).toBe(100);
    expect((await other.agent.get(`/api/attempts/${start.body.data.id}`)).status).toBe(404);
  });

  it("a failed spaced review sends the topic back to practice", async () => {
    const { agent, id } = await login();
    const start = await agent.post("/api/topics/alpha/quiz");
    await agent.post(`/api/attempts/${start.body.data.id}/submit`).send({ answers: await answersFor(start.body.data.id, "correct") });
    const review = await agent.post("/api/topics/alpha/review");
    const res = await agent.post(`/api/attempts/${review.body.data.id}/submit`).send({ answers: await answersFor(review.body.data.id, "wrong") });
    expect(res.body.data.effects.backToPractice).toBe(true);
    const m = await prisma.mastery.findFirstOrThrow({ where: { userId: id, topic: { slug: "alpha" } } });
    expect(m.status).toBe("NEEDS_REVIEW");
    const due = await agent.get("/api/reviews/due");
    expect(due.body.data.due).toHaveLength(1);
    const practice = await agent.post("/api/practice");
    expect(practice.status).toBe(200);
  });
});

describe("stage exam with integrity rules", () => {
  it("auto-submits after too many tab switches and logs integrity", async () => {
    const { agent } = await login();
    const start = await agent.post("/api/assessments/foundations-exam/start");
    expect(start.status).toBe(200);
    expect(start.body.data.expiresAt).toBeTruthy();
    expect(start.body.data.assessment.tabSwitchLimit).toBe(1);
    const id = start.body.data.id;
    await agent.put(`/api/attempts/${id}/draft`).send({ answers: await answersFor(id, "correct") });
    await agent.post(`/api/attempts/${id}/integrity`).send({ events: [{ type: "TAB_HIDDEN" }, { type: "PASTE" }] });
    const res = await agent.post(`/api/attempts/${id}/integrity`).send({ events: [{ type: "TAB_HIDDEN" }] });
    expect(res.body.data.autoSubmitted).toBe(true);
    expect(res.body.data.result.flagged).toBe(true);
    expect(res.body.data.result.integrityScore).toBe(70);
    expect(res.body.data.result.score).toBe(100);
  });

  it("passing the exam unlocks the next stage", async () => {
    const { agent } = await login();
    const start = await agent.post("/api/assessments/foundations-exam/start");
    await agent.post(`/api/attempts/${start.body.data.id}/submit`).send({ answers: await answersFor(start.body.data.id, "correct") });
    const roadmap = await agent.get("/api/roadmap");
    expect(roadmap.body.data.stages[0].passed).toBe(true);
    expect(roadmap.body.data.stages[1].unlocked).toBe(true);
    expect((await agent.get("/api/topics/gamma")).status).toBe(200);
  });

  it("refuses AI help while a timed test is running", async () => {
    const { agent } = await login();
    await agent.post("/api/assessments/foundations-exam/start");
    const res = await agent.post("/api/ai/explain").send({ topicSlug: "alpha", question: "What is alpha?" });
    expect(res.status).toBe(423);
  });
});
