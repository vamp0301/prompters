import { describe, expect, it } from "vitest";

/**
 * Real-provider evaluation for three careers — Backend (coding), Data Analyst, Product Manager —
 * through the app's own prompts, schemas and provider (with its retries and fallbacks).
 *
 *   REAL_AI=1 npm run test:real-ai        (needs AI_PROVIDER=gemini and AI_API_KEY in the environment)
 *
 * About 10 model calls. Checks are deliberately about properties a real interviewer would care
 * about (composition, grounding, rubric ordering, follow-up relevance) — not exact wording.
 */
const enabled = process.env.REAL_AI === "1" && !!process.env.AI_API_KEY && process.env.AI_PROVIDER !== "none";
const suite = enabled ? describe : describe.skip;
if (!enabled) console.warn("Real-AI tests skipped: set REAL_AI=1 with AI_PROVIDER and AI_API_KEY in the environment.");

const CAREERS = {
  backend: {
    resume: { name: "Riya Sharma", projects: [{ name: "Notes API", description: "REST API for notes with JWT auth and MongoDB", technologies: ["Node.js", "Express", "MongoDB", "JWT"] }], experience: [{ role: "Backend intern", company: "Acme", description: "Built REST APIs for 6 months" }], skills: ["JavaScript", "Node.js", "MongoDB"] },
    anchors: /notes api|acme|internship|jwt|mongodb|express|node|rest api/i,
    question: "In your Notes API, how did you store and validate the JWT, and what happens when it expires?",
    strong: "I issued a short-lived access token signed with a secret, sent it in an HTTP-only cookie so scripts can't read it, verified the signature and expiry in middleware on every request, and used a refresh token with rotation so an expired access token triggers a silent refresh; a stolen refresh token is detected because it was already rotated.",
  },
  data_analyst: {
    resume: { name: "Rahul Verma", projects: [{ name: "Sales dashboard", description: "Power BI dashboard of monthly sales from a 50,000-row Excel dataset; cleaned data and built KPIs with SQL", technologies: ["Excel", "Power BI", "SQL"] }], experience: [{ role: "MIS intern", company: "Shopco", description: "Weekly MIS reports in Excel for 3 months" }], skills: ["SQL", "Excel", "Power BI"] },
    anchors: /sales dashboard|shopco|internship|mis report|power bi|excel|sql|kpi|50,?000/i,
    question: "In your sales dashboard, how did you handle duplicate and missing rows before calculating monthly revenue?",
    strong: "I first profiled the 50,000 rows: counted duplicates on order id plus line number and removed exact duplicates with a GROUP BY check, then looked at missing values by column — missing region I filled from the customer master with a join, missing amounts I excluded and reported separately so revenue wasn't silently understated. I reconciled the cleaned monthly totals against finance's numbers before publishing.",
  },
  product_manager: {
    resume: { name: "Aditi Rao", projects: [{ name: "EV adoption study", description: "Market research survey of 400 respondents; segmentation and pricing recommendation for a two-wheeler brand", technologies: ["Excel", "SPSS"] }], experience: [{ role: "Summer intern", company: "Acme Retail", description: "Competitor analysis and go-to-market plan for a new product line" }], skills: ["Excel", "market research", "stakeholder management"] },
    anchors: /ev adoption|acme retail|internship|survey|segment|pricing|go-to-market|two-wheeler|spss/i,
    question: "In your EV adoption study, how did you decide which customer segment to recommend targeting first?",
    strong: "I compared segments on size, willingness to pay and how well our two-wheeler solved their main job — daily commuting cost. Urban commuters were smaller than students but had higher willingness to pay and lower churn risk, so I recommended them first, with a pilot metric of test-ride-to-booking conversion and a guardrail on discount depth so we didn't buy share unprofitably.",
  },
} as const;

/** General-programming terms a non-coding interview should not lean on. */
const DEV = /\b(code|coding|algorithm|data structure|big-?o|time complexity|javascript|api endpoint|docker|kubernetes|leetcode|system design)\b/i;
const WEAK = "Not sure, I think it depends on the situation.";

/**
 * Grounding: every question in the RESUME / PROJECTS areas must name something the resume actually
 * contains (and there must be a few of them). Concept, role and case questions are about the
 * profession, not the resume, so they aren't expected to quote it.
 */
function expectGrounded(qs: { area: string; question: string }[], anchors: RegExp) {
  const resumeQs = qs.filter((q) => q.area === "RESUME" || q.area === "PROJECTS");
  expect(resumeQs.length).toBeGreaterThanOrEqual(3);
  // "Walk me through your background" is the candidate's own story — grounded too.
  const ungrounded = resumeQs.filter((q) => !anchors.test(q.question) && !/\byour (own )?background\b/i.test(q.question));
  expect(ungrounded, ungrounded.map((q) => q.question).join(" | ")).toHaveLength(0);
}

suite("real AI — role-specific interviews", async () => {
  const { aiJson } = await import("../src/ai/json.js");
  const { setAIProvider, aiProvider } = await import("../src/ai/provider.js");
  const { prompts } = await import("../src/modules/career/prompts.js");
  const { roleBankSchema, evaluationSchema } = await import("../src/modules/career/schemas.js");
  const { interviewProfile } = await import("../src/modules/career/interview-roles.js");
  const { targetRole } = await import("../src/modules/prep/roles.js");
  const { groundAreas } = await import("../src/modules/career/interview.blueprint.js");
  type Area = import("../src/modules/career/interview.blueprint.js").Area;
  setAIProvider(undefined); // the configured provider, with its real fallbacks

  const bank = async (key: keyof typeof CAREERS) => {
    const r = targetRole(key)!;
    const p = prompts.roleBank({ role: r.label, skills: r.skills, concepts: r.concepts, resume: CAREERS[key].resume, claims: [], focus: [], profile: interviewProfile(key) });
    // As the app uses it: the model's bank, then the app's deterministic grounding of areas.
    return groundAreas((await aiJson("interview_bank", p.system, p.user, roleBankSchema, 6000, { timeoutMs: 120_000 })).questions as { area: Area; question: string; claimId?: string | null }[], CAREERS[key].resume);
  };
  const score = (e: { correctness: number; completeness: number; depth: number; reasoning: number; understanding: number; practical: number; communication: number }) =>
    e.correctness + e.completeness + e.depth + e.reasoning + e.understanding + e.practical + e.communication;
  const evaluate = async (key: keyof typeof CAREERS, answer: string) => {
    const p = prompts.evaluate({ question: CAREERS[key].question, skill: "x", level: 3, answer, context: "", depth: 0, maxDepth: 2, profile: interviewProfile(key) });
    return aiJson("evaluate_answer", p.system, p.user, evaluationSchema, 1500, { timeoutMs: 60_000 });
  };

  it("Product Manager: product questions only, grounded in the resume, with behavioural questions", async () => {
    const qs = await bank("product_manager");
    expect(qs.length).toBeGreaterThanOrEqual(15);
    const dev = qs.filter((q) => DEV.test(q.question));
    expect(dev, dev.map((q) => q.question).join(" | ")).toHaveLength(0);
    expect(qs.some((q) => q.area === "SYSTEM_DESIGN")).toBe(false);
    expectGrounded(qs, CAREERS.product_manager.anchors);
    expect(qs.some((q) => /stakeholder|disagree|conflict|convince|team/i.test(q.question))).toBe(true);
  });

  it("Data Analyst: analytics questions, grounded, no general programming", async () => {
    const qs = await bank("data_analyst");
    expect(qs.length).toBeGreaterThanOrEqual(15);
    const analytic = qs.filter((q) => /sql|data|dashboard|kpi|metric|excel|power bi|statistic|query|join|aggregat|clean|report|trend/i.test(q.question));
    expect(analytic.length / qs.length).toBeGreaterThanOrEqual(0.6);
    expect(qs.filter((q) => /\b(algorithm|data structure|big-?o|docker|kubernetes|leetcode|system design)\b/i.test(q.question))).toHaveLength(0);
    expectGrounded(qs, CAREERS.data_analyst.anchors);
  });

  it("Backend: a technical interview grounded in the candidate's projects", async () => {
    const qs = await bank("backend");
    expect(qs.length).toBeGreaterThanOrEqual(15);
    expect(new Set(qs.map((q) => q.area)).size).toBeGreaterThanOrEqual(4);
    expectGrounded(qs, CAREERS.backend.anchors);
  });

  it.each(["backend", "data_analyst", "product_manager"] as const)("%s: the rubric ranks a strong answer above a vague one, and the follow-up probes the answer", async (key) => {
    const strong = await evaluate(key, CAREERS[key].strong);
    const weak = await evaluate(key, WEAK);
    expect(score(strong)).toBeGreaterThan(score(weak) + 15);
    expect(weak.verdict).not.toBe("CORRECT");
    expect(weak.followUp.needed).toBe(true);
    const fq = weak.followUp.question ?? "";
    expect(fq.length).toBeGreaterThan(10);
    // Probes rather than teaches: no revealed answer.
    expect(fq).not.toMatch(/the correct answer|the answer is|you should have/i);
  });

  it("recovers from malformed model output (one retry, then a valid result)", async () => {
    const real = aiProvider()!;
    let calls = 0;
    setAIProvider({ name: "flaky", complete: async (s: string, u: string, o?: object) => (++calls === 1 ? '{"questions": [ {"broken' : real.complete(s, u, o)) });
    try {
      const p = prompts.evaluate({ question: CAREERS.product_manager.question, skill: "x", level: 3, answer: CAREERS.product_manager.strong, context: "", depth: 0, maxDepth: 2, profile: interviewProfile("product_manager") });
      const e = await aiJson("evaluate_answer", p.system, p.user, evaluationSchema, 1500, { timeoutMs: 60_000 });
      expect(calls).toBe(2);
      expect(e.correctness).toBeGreaterThanOrEqual(0);
    } finally {
      setAIProvider(undefined);
    }
  });
});
