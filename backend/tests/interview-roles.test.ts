import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { login, resetDb, seedFixture, startWorker } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { buildBlueprint, groundAreas, type BankItem } from "../src/modules/career/interview.blueprint.js";
import { interviewProfile } from "../src/modules/career/interview-roles.js";

/** Manisha interviews for the candidate's career: no coding turns for careers that don't code. */
const fake = new FakeAI();
const CONSENT = { recording: true, integrity: true, preparationOnly: true };
const MBA_RESUME = "Aditi Rao — MBA (Marketing & Strategy), IIM 2026. EV adoption study: market research survey of 400 respondents; segmentation and a pricing recommendation. Summer intern at Acme Retail for 2 months: competitor analysis and a go-to-market plan. Skills: Excel, market research, stakeholder management, prioritization.";
const ANSWER = "I would start from the user problem because the metric only moves if the user's job gets easier, then compare options by impact and effort.";
type Agent = Awaited<ReturnType<typeof login>>["agent"];

beforeAll(async () => {
  await resetDb();
  await seedFixture();
  // A coding problem exists, so a coding turn WOULD be possible — careers that don't code must still never get one.
  const stage = await prisma.stage.findFirstOrThrow({ where: { slug: "foundations" } });
  const dsa = await prisma.module.create({ data: { stageId: stage.id, slug: "dsa", title: "DSA", description: "", order: 9, status: "PUBLISHED" } });
  const topic = await prisma.topic.create({ data: { moduleId: dsa.id, slug: "arrays-ir", title: "Arrays", order: 0, status: "PUBLISHED", publishedVersion: 1 } });
  await prisma.buildTask.create({
    data: {
      slug: "sum-ir", topicId: topic.id, title: "Sum", description: "Return a + b", functionName: "sum", starterJs: "function sum(a, b) {}", starterPython: "def sum(a, b):\n    pass",
      tests: [{ name: "one", args: [1, 2], expected: 3 }], hints: ["a", "b", "c"], explainQuestions: [{ question: "Why?", keywords: ["plus"] }], status: "PUBLISHED",
    },
  });
  await prisma.featureFlag.create({ data: { key: "AI_INTERVIEW", description: "", enabled: true } });
  setAIProvider(fake);
  startWorker();
});
afterAll(() => setAIProvider(undefined));

async function answerAll(agent: Agent, sessionId: string, first: { id: string; kind: string }) {
  let current: { id: string; kind: string } | null = first;
  const kinds: string[] = [];
  let res;
  for (let i = 0; i < 30 && current; i++) {
    kinds.push(current.kind);
    res = await agent.post(`/api/career/sessions/${sessionId}/answer`).send({ turnId: current.id, answerText: ANSWER });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    current = res.body.data.done ? null : res.body.data.current;
  }
  return { res: res!, kinds };
}

describe("interview profiles", () => {
  it("coding careers keep the technical interview; other careers get cases instead of coding and system design", () => {
    const be = interviewProfile("backend");
    expect(be).toMatchObject({ code: true, title: "Senior Technical Interviewer", reportName: "Technical Readiness Report" });
    expect(be.weights.PROBLEM_SOLVING).toBeGreaterThan(0);
    for (const key of ["product_manager", "data_analyst", "marketing_manager", "account_executive", "ux_designer"]) {
      const p = interviewProfile(key);
      expect(p.code).toBe(false);
      expect(p.weights.PROBLEM_SOLVING ?? 0).toBe(0);
      expect(p.weights.SYSTEM_DESIGN ?? 0).toBe(0);
      expect(p.areaLabels.PRACTICAL).toBe("Cases & scenarios");
    }
    expect(interviewProfile("product_manager").title).toBe("Senior Product Interviewer");
    expect(interviewProfile("product_manager").behavioural).toBe(true);
    expect(interviewProfile("data_analyst").behavioural).toBe(false);
  });

  it("a blueprint for a non-coding career never reserves a problem-solving slot, even when problems exist", () => {
    const bank: BankItem[] = (["RESUME", "PROJECTS", "FUNDAMENTALS", "ROLE", "PRACTICAL", "SYSTEM_DESIGN"] as const).flatMap((area) =>
      [1, 2, 3].map((n) => ({ id: `${area}${n}`, question: `${area} ${n}?`, skill: "x", level: 2, area })),
    );
    const pm = buildBlueprint("product_manager", 10, bank, true).areas.map((a) => a.area);
    expect(pm).not.toContain("PROBLEM_SOLVING");
    expect(pm).not.toContain("SYSTEM_DESIGN");
    expect(buildBlueprint("backend", 10, bank, true).areas.map((a) => a.area)).toContain("PROBLEM_SOLVING");
  });
});

describe("grounding", () => {
  it("a 'Resume' question must name something from the resume; generic ones move to role knowledge", () => {
    const resume = { projects: [{ name: "EV adoption study", technologies: ["SPSS"] }], experience: [{ role: "Summer intern", company: "Acme Retail" }], skills: ["Excel"] };
    const out = groundAreas([
      { area: "RESUME" as const, question: "How did you run the competitor analysis at Acme Retail?" },
      { area: "RESUME" as const, question: "How do you approach stakeholder management when departments conflict?" },
      { area: "PROJECTS" as const, question: "Walk me through your EV adoption study survey design." },
      { area: "PROJECTS" as const, question: "Tell me about a claim", claimId: "c1" },
      { area: "FUNDAMENTALS" as const, question: "What is a north-star metric?" },
    ], resume);
    expect(out.map((q) => q.area)).toEqual(["RESUME", "ROLE", "PROJECTS", "PROJECTS", "FUNDAMENTALS"]);
  });
});

describe("a Product Manager interview", () => {
  it("is run by a product interviewer, has no coding turns, and reports in product terms", async () => {
    const { agent } = await login("STUDENT", { onboard: false });
    await agent.post("/api/profile/onboarding").send({ targetRoleKey: "product_manager", explanationLocale: "en", weeklyHours: 8 });
    const resumeId = (await agent.post("/api/career/resumes").send({ text: MBA_RESUME, label: "MBA CV" })).body.data.id;
    const before = fake.calls.length;
    const start = await agent.post("/api/career/sessions").send({ resumeId, targetRole: "product_manager", durationMinutes: 15, consent: CONSENT });
    expect(start.status, JSON.stringify(start.body)).toBe(201);
    expect(start.body.data.interviewer.role).toBe("Senior Product Interviewer");
    expect(start.body.data.intro).not.toMatch(/technical interview/);
    expect(start.body.data.intro).toMatch(/Product Manager \/ APM role/);

    const bankPrompt = fake.calls.slice(before).find((c) => c.task === "interview_bank")!;
    expect(bankPrompt.system).not.toMatch(/TECHNICAL questions|CS fundamentals|SYSTEM_DESIGN \(design/);
    expect(bankPrompt.system).toMatch(/Behavioural questions are welcome/);

    const { res, kinds } = await answerAll(agent, start.body.data.id, start.body.data.current);
    expect(res.body.data.done).toBe(true);
    expect(kinds).not.toContain("CODING");
    expect(kinds).not.toContain("PROBLEM");
    const evals = fake.calls.slice(before).filter((c) => c.task === "evaluate_answer");
    expect(evals.length).toBeGreaterThan(0);
    for (const e of evals) {
      expect(e.system).not.toMatch(/senior technical interviewer|live technical interview/);
      expect(e.system).toMatch(/senior product interviewer/);
    }

    const s = (await agent.get(`/api/career/sessions/${start.body.data.id}`)).body.data;
    expect(s.interviewer.role).toBe("Senior Product Interviewer");
    const turns = await prisma.interviewTurn.findMany({ where: { sessionId: start.body.data.id } });
    expect(turns.some((t) => t.kind === "CODING" || t.kind === "PROBLEM" || t.area === "PROBLEM_SOLVING" || t.area === "SYSTEM_DESIGN")).toBe(false);
    if (s.report) {
      expect(s.report.reportName).toBe("Interview Readiness Report");
      expect(s.report.dimensionLabels.problemSolving).toBe("Case & problem solving");
      expect(s.report.disclaimer).toMatch(/Interview Readiness Report/);
    }
  });

  it("never reuses another career's Top-100 plan as the question bank", async () => {
    const { agent, id } = await login("STUDENT", { onboard: false });
    await agent.post("/api/profile/onboarding").send({ targetRoleKey: "product_manager", explanationLocale: "en", weeklyHours: 8 });
    const resumeId = (await agent.post("/api/career/resumes").send({ text: MBA_RESUME, label: "MBA CV" })).body.data.id;
    // A READY Data Analyst plan on the same resume.
    const plan = await prisma.prepPlan.create({ data: { userId: id, resumeId, targetRole: "data_analyst", title: "Data Analyst", status: "READY", progress: {}, allocation: {} } });
    await prisma.prepQuestion.createMany({
      data: Array.from({ length: 12 }, (_, i) => ({ planId: plan.id, question: `Write a SQL window function query #${i}`, skill: "SQL", category: "SKILL" as const, priority: "IMPORTANT" as const, difficulty: 2, followUpDepth: 2, probability: 0.8, rank: i + 1, why: "x", sourceType: "ROLE", sourceLabel: "Data Analyst", hint: "x" })),
    });
    const before = fake.calls.filter((c) => c.task === "interview_bank").length;
    const start = await agent.post("/api/career/sessions").send({ resumeId, targetRole: "product_manager", durationMinutes: 15, consent: CONSENT });
    expect(start.status).toBe(201);
    // A fresh product bank was written; the Data Analyst plan wasn't used.
    expect(fake.calls.filter((c) => c.task === "interview_bank").length).toBe(before + 1);
    const s = await prisma.interviewSession.findUniqueOrThrow({ where: { id: start.body.data.id } });
    expect((s.bank as { question: string }[]).some((q) => /SQL window function/.test(q.question))).toBe(false);
  });
});
