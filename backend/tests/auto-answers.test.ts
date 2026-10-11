import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.PREP_AUTO_FULL_ANSWERS = "5";
});

import { login, resetDb, seedFixture } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { AppError } from "../src/utils/errors.js";
import { runPlanAnswers } from "../src/modules/prep/practice.service.js";
import { startPrepWorker } from "../src/workers/prep-worker.js";

const fake = new FakeAI();
const RESUME = ["Riya Sharma — Backend developer", "Projects", "Notes API: Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication.", "Experience", "Backend intern at Acme for 6 months building REST APIs.", "Education", "B.Tech CSE 2026. Skills: JavaScript, Node.js, Express, MongoDB, Docker."].join("\n");

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
async function readyPlan(agent: Agent) {
  const resumeId = (await agent.post("/api/career/resumes").send({ text: RESUME, label: "CV" })).body.data.id;
  const id = (await agent.post("/api/career/prep").send({ resumeId, targetRole: "fullstack" })).body.data.id as string;
  const until = Date.now() + 20_000;
  while (Date.now() < until && (await agent.get(`/api/career/prep/${id}`)).body.data.status !== "READY") await new Promise((r) => setTimeout(r, 100));
  return id;
}
const entries = async (planId: string) =>
  (await prisma.prepQuestion.findMany({ where: { planId, rank: { gt: 0 } }, orderBy: { rank: "asc" }, select: { id: true, fullAnswers: true } })).map((q) => ({ id: q.id, e: (q.fullAnswers as Record<string, { status: string }>).hinglish ?? null }));

describe("automatic complete answers", () => {
  it("writes answers for the top questions after the plan is ready — no button needed", async () => {
    const { agent } = await login();
    const planId = await readyPlan(agent);
    const until = Date.now() + 20_000;
    let list = await entries(planId);
    while (Date.now() < until && list.slice(0, 5).some((x) => x.e?.status !== "READY")) {
      await new Promise((r) => setTimeout(r, 150));
      list = await entries(planId);
    }
    expect(list.slice(0, 5).map((x) => x.e?.status)).toEqual(["READY", "READY", "READY", "READY", "READY"]);
    expect(list[5].e).toBeNull(); // beyond PREP_AUTO_FULL_ANSWERS
    // Opening the question shows the answer straight away.
    const fa = (await agent.get(`/api/career/prep/${planId}/questions/${list[0].id}/full-answer`)).body.data.fullAnswer;
    expect(fa.status).toBe("READY");
    expect(fa.structured.answer).toBeTruthy();
  });

  it("stops quietly when the AI is unavailable, leaving no error behind", async () => {
    const { agent } = await login();
    const planId = await readyPlan(agent);
    // Wait for the automatic run to finish, then clear and rerun it with the AI down.
    await new Promise((r) => setTimeout(r, 1500));
    await prisma.prepQuestion.updateMany({ where: { planId }, data: { fullAnswers: {} } });
    const real = fake.complete.bind(fake);
    fake.complete = async (system: string, user: string) => {
      if (system.includes("[task:tutor_answer]")) throw new AppError(502, "AI_UPSTREAM_ERROR", "The AI service has reached its daily limit.");
      return real(system, user);
    };
    await runPlanAnswers(planId);
    fake.complete = real;
    const list = await entries(planId);
    expect(list.filter((x) => x.e).map((x) => x.e)).toEqual([]); // no FAILED or stuck RUNNING entries
  });
});
