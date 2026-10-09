import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { login, resetDb, seedFixture } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { inferRole } from "../src/modules/prep/profile.js";
import { prepPrompts } from "../src/modules/prep/prompts.js";
import { prepBrief } from "../src/modules/prep/role-briefs.js";
import { validateBatch, type ValidationContext } from "../src/modules/prep/validator.js";
import { skillMatcher } from "../src/modules/prep/text.js";
import { startPrepWorker } from "../src/workers/prep-worker.js";

/** The Top-100 follows the candidate's career: different interviewer, categories and scale per family. */
const fake = new FakeAI();
const MBA_RESUME = [
  "Aditi Rao — MBA (Marketing & Strategy), IIM 2026",
  "Projects",
  "EV adoption study: market research survey of 400 respondents; segmentation and a pricing recommendation for a two-wheeler brand.",
  "Experience",
  "Summer intern at Acme Retail for 2 months: competitor analysis and a go-to-market plan for a new product line.",
  "Achievements",
  "Winner, campus case competition 2025",
  "Education",
  "BBA 2023; MBA 2026. Skills: Excel, market research, stakeholder management, product metrics, prioritization.",
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

describe("briefs", () => {
  it("engineering keeps its original technical brief; product gets a product interviewer who allows real behavioural questions", () => {
    const sw = prepPrompts.questions({ category: "GENERAL", count: 5, profile: "", target: "", avoid: [], level: "x" }).system;
    expect(sw).toMatch(/senior technical interviewer/);
    expect(sw).toMatch(/Technical only\. No HR or behavioural questions/);
    expect(sw).toMatch(/1 fundamental, 2 practical, 3 deep technical, 4 scenario, 5 architecture/);

    const pm = prepPrompts.questions({ category: "SCENARIO", count: 5, profile: "", target: "", avoid: [], level: "x", brief: prepBrief("product", false), stage: { stage: 3, brief: "", min: 4, max: 5 } }).system;
    expect(pm).toMatch(/senior product leader/);
    expect(pm).not.toMatch(/Technical only/);
    expect(pm).toMatch(/Behavioural and situational questions belong/);
    expect(pm).toMatch(/Never coding or programming questions unless the job description/);
    expect(pm).toMatch(/5 strategy, trade-offs and judgment/);
    expect(pm).not.toMatch(/SYSTEM DESIGN|DEVOPS|architecture/);
  });

  it("developer fundamentals are forced only for coding careers", () => {
    expect(prepBrief("software", true).developerFundamentals).toBe(true);
    expect(prepBrief("software", false).developerFundamentals).toBe(false); // e.g. Cybersecurity Analyst
    for (const f of ["data", "product", "business", "mba", "sales", "design", "other"] as const) expect(prepBrief(f, false).developerFundamentals).toBe(false);
  });
});

describe("validator", () => {
  const ctx = (allowBehavioural: boolean): ValidationContext => ({
    category: "SCENARIO", resumeText: MBA_RESUME, sources: new Map(), matchSkill: skillMatcher(["Stakeholder management", "Prioritization"]), accepted: [],
    fallbackSource: { type: "ROLE", label: "Product Manager", evidence: "" }, allowBehavioural,
  });
  const q = (question: string, skill: string) => ({ question, skill, category: "SCENARIO", difficulty: 4, probability: 0.7, followUpDepth: 3, why: "Common for this role.", evidence: null, hint: "Use a real example.", keyPoints: ["a", "b", "c"], followUps: ["a", "b"], sourceRef: null });

  it("real behavioural questions are kept for careers where they're core; HR filler never is", () => {
    const conflict = q("Describe a conflict with your team over feature priorities and how you resolved it.", "Stakeholder management");
    const filler = q("Tell me about yourself and your strengths.", "Prioritization");
    expect(validateBatch([conflict, filler], ctx(true)).questions.map((x) => x.question)).toEqual([conflict.question]);
    expect(validateBatch([conflict, filler], ctx(false)).questions).toEqual([]);
  });
});

describe("role inference", () => {
  it.each([
    ["Associate Product Manager", "product_manager"],
    ["Marketing Manager - FMCG", "marketing_manager"],
    ["Business Analyst", "business_analyst"],
    ["Software Engineer II", "sde"],
    ["Full Stack Developer (MERN)", "fullstack"],
  ])("%s → %s", (title, key) => expect(inferRole(title)).toBe(key));

  it("an ambiguous title falls back to the candidate's own career, not to software engineering", () => {
    expect(inferRole("Manager — Growth & Strategy team", "marketing_manager")).toBe("marketing_manager");
  });
});

describe("a Product Manager's Top-100", () => {
  it("is written by a product interviewer and never pulls in developer fundamentals", async () => {
    const { agent, id } = await login("STUDENT", { onboard: false });
    await agent.post("/api/profile/onboarding").send({ targetRoleKey: "product_manager", explanationLocale: "en", weeklyHours: 8 });
    const resumeId = (await agent.post("/api/career/resumes").send({ text: MBA_RESUME, label: "MBA CV" })).body.data.id;
    const before = fake.calls.length;
    const created = await agent.post("/api/career/prep").send({ resumeId, targetRole: "product_manager" });
    expect(created.status).toBe(201);
    const until = Date.now() + 60_000;
    let plan = (await agent.get(`/api/career/prep/${created.body.data.id}`)).body.data;
    while (plan.status !== "READY" && plan.status !== "FAILED" && Date.now() < until) {
      await new Promise((r) => setTimeout(r, 150));
      plan = (await agent.get(`/api/career/prep/${created.body.data.id}`)).body.data;
    }
    expect(plan.status).toBe("READY");

    const prompts = fake.calls.slice(before).filter((c) => c.task.startsWith("prep_") && c.task !== "prep_dedupe");
    expect(prompts.length).toBeGreaterThan(0);
    for (const p of prompts) {
      expect(p.system).toMatch(/senior product leader/);
      expect(p.system).not.toMatch(/Technical only/);
    }
    // No developer fundamentals forced into the plan's focus or skills.
    expect(prompts.some((p) => /System design: scalability|DevOps: containers|Data structures/.test(p.user))).toBe(false);
    const skills = (await prisma.prepQuestion.findMany({ where: { plan: { userId: id }, rank: { gt: 0 } }, select: { skill: true } })).map((x) => x.skill);
    expect(skills.length).toBeGreaterThan(0);
    for (const dev of ["System design", "Data structures", "Algorithms", "DevOps", "Docker"]) expect(skills).not.toContain(dev);
  });
});
