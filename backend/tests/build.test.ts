import { beforeAll, describe, expect, it } from "vitest";
import { answersFor, login, resetDb, seedFixture, startWorker } from "./helpers.js";

beforeAll(async () => {
  await resetDb();
  await seedFixture();
  startWorker();
});

describe("build without AI", () => {
  it("runs visible tests only and hides hidden test inputs", async () => {
    const { agent } = await login();
    const task = await agent.get("/api/build-tasks/alpha-build");
    expect(task.body.data.publicTests).toHaveLength(2);
    expect(task.body.data.hiddenTestCount).toBe(1);
    expect(task.body.data.ai).toEqual({ chat: false, autocomplete: false });
    expect(JSON.stringify(task.body.data.publicTests)).not.toContain("secret");
    expect(JSON.stringify(task.body.data.publicTests)).not.toContain("[40,2]");

    await agent.post("/api/build-tasks/alpha-build/start").send({ language: "javascript" });
    const run = await agent.post("/api/build-tasks/alpha-build/run").send({ language: "javascript", code: "function add(a, b) { console.log('adding'); return a + b; }" });
    expect(run.status).toBe(200);
    expect(run.body.data.tests).toHaveLength(2);
    expect(run.body.data.output).toContain("adding");

    const bad = await agent.post("/api/build-tasks/alpha-build/submit").send({ language: "javascript", code: "function add(a, b) { return a + b === 42 ? 0 : a + b; }" });
    expect(bad.body.data.passedCount).toBe(2);
    const hidden = bad.body.data.tests.find((t: { hidden: boolean }) => t.hidden);
    expect(hidden).toMatchObject({ name: "Hidden test", passed: false });
    expect(hidden.args).toBeUndefined();
  });

  it("hints lower independence, explain-your-code completes the build", async () => {
    const { agent } = await login();
    await agent.post("/api/build-tasks/alpha-build/start").send({ language: "python" });
    const h1 = await agent.post("/api/build-tasks/alpha-build/hint");
    expect(h1.body.data).toMatchObject({ level: 1, hint: "concept", independenceScore: 92 });

    const early = await agent.post("/api/build-tasks/alpha-build/explain").send({ answers: ["x"] });
    expect(early.status).toBe(409);

    const sub = await agent.post("/api/build-tasks/alpha-build/submit").send({ language: "python", code: "def add(a, b):\n    return a + b\n" });
    expect(sub.body.data.status).toBe("TESTS_PASSED");
    expect(sub.body.data.explainQuestions).toEqual(["Why does add work?"]);

    const weak = await agent.post("/api/build-tasks/alpha-build/explain").send({ answers: ["it works"] });
    expect(weak.body.data.passed).toBe(false);

    const ok = await agent.post("/api/build-tasks/alpha-build/explain").send({ answers: ["It uses the plus operator on both numbers and I return the result to the caller"] });
    expect(ok.body.data).toMatchObject({ passed: true, independenceScore: 92 });
    expect(ok.body.data.projectScore).toBeGreaterThan(80);
  });
});

describe("readiness", () => {
  it("is computed from real progress and moves when the learner masters a topic", async () => {
    const { agent } = await login();
    const before = await agent.get("/api/readiness");
    expect(before.body.data.score).toBeLessThan(10);
    expect(before.body.data.nextActions.length).toBeGreaterThan(0);

    const start = await agent.post("/api/topics/alpha/quiz");
    await agent.post(`/api/attempts/${start.body.data.id}/submit`).send({ answers: await answersFor(start.body.data.id, "correct") });
    const after = await agent.get("/api/readiness");
    expect(after.body.data.score).toBeGreaterThan(before.body.data.score);
    expect(after.body.data.factors.mastery).toBeGreaterThan(0);

    const dash = await agent.get("/api/dashboard");
    expect(dash.body.data.readiness.score).toBe(after.body.data.score);
    expect(dash.body.data.totals.mastered).toBe(1);
    const journey = await agent.get("/api/journey");
    expect(journey.body.data.milestones.find((m: { label: string }) => m.label === "First mastery").at).toBeTruthy();
  });
});
