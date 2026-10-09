import type { PrepCategory } from "@prisma/client";
import type { FamilyKey } from "../roles/catalogue.js";
import type { ExperienceBand } from "./ladder.js";

/**
 * How Top-100 questions are written for each career family: who asks them, what each category
 * means, what the difficulty levels mean, and whether behavioural questions belong. The software
 * brief is the original wording, unchanged; other families get their own.
 */
export interface PrepBrief {
  persona: string;
  /** The scope rule (what kinds of questions are in or out). */
  scope: string;
  /** Behavioural/situational questions are core for this family (generic HR filler never is). */
  allowBehavioural: boolean;
  /** What difficulty 1–5 means. */
  scale: string;
  categories: Record<PrepCategory, string>;
  bands: Record<ExperienceBand, string>;
  stages: Record<1 | 2 | 3, string>;
  /** Extra CONCEPTUAL focus beyond the role's own fundamentals. */
  conceptualExtra: string[];
  scenarios: (experienced: boolean) => string[];
  /** Forces developer fundamentals, system design and DevOps into the plan. */
  developerFundamentals: boolean;
  /** Example wording inside the shared rules. */
  examples: { depth: string; why: string; skill: string; core: string };
}

const SHARED: Pick<PrepBrief["categories"], "SKILL" | "CLAIM"> = {
  SKILL:
    "SKILL-BASED questions that test one specific skill the candidate lists (or the job requires). Spread them across the candidate's skills in proportion to how prominent each is on the resume; if the job requires a skill the resume lacks, a few questions may test it (say so in why). sourceRef: the project/experience ref where the skill was used, or null.",
  CLAIM:
    "RESUME-CLAIM questions that drill into ONE specific claim and make the candidate prove it: how exactly they did it, the numbers behind it, what went wrong, what they'd do differently. Quote or paraphrase the claim. sourceRef: the claim's C# ref (required).",
};

const SOFTWARE: PrepBrief = {
  persona: "You are a senior technical interviewer at an Indian product company preparing ONE candidate for THEIR interview. You write the questions an interviewer who has read THIS resume is most likely to ask.",
  scope: "- Technical only. No HR or behavioural questions (no 'tell me about yourself', strengths/weaknesses, salary, '5 years').",
  allowBehavioural: false,
  scale: "1 fundamental, 2 practical, 3 deep technical, 4 scenario, 5 architecture",
  categories: {
    GENERAL: "GENERAL technical questions that are commonly asked for this role at this candidate's level, tied to their stack (HTTP, REST, Git, OOP, DBMS, the language they use…). sourceRef: null.",
    SKILL: SHARED.SKILL,
    PROJECT: "PROJECT DEEP-DIVE questions about ONE specific project or job from the resume: why they chose a technology, how a feature was implemented, data model, trade-offs, failure handling, scaling, what they would change. Name the project in the question. sourceRef: the project's P# or experience E# ref (required).",
    CLAIM: "RESUME-CLAIM questions that drill into ONE specific claim and make the candidate prove it: how exactly they built it, the numbers behind it, what broke, what they'd do differently. Quote or paraphrase the claim. sourceRef: the claim's C# ref (required).",
    ACHIEVEMENT: "ACHIEVEMENT-BASED technical questions that verify ONE listed achievement or certification (e.g. a CodeChef/LeetCode rating → an algorithm question at that level; a hackathon → what they built and the hardest technical problem; an AWS certificate → an AWS question). sourceRef: the A# ref (required).",
    CONCEPTUAL: "CONCEPTUAL questions about the fundamentals underneath the candidate's stack — why and how things work (event loop, indexing internals, ACID, closures, garbage collection, HTTP caching…). Include system design fundamentals (scalability, caching, load balancing, consistency) and DevOps fundamentals (containers, CI/CD, observability). Follow the FOCUS list. sourceRef: null or the project where it matters.",
    SCENARIO: "SCENARIO questions, mostly SYSTEM DESIGN and DEVOPS applied to the candidate's own projects: how they would scale it, cache it, split it, queue work or survive a traffic spike; how they would containerise, deploy, roll back, monitor and alert on it; plus realistic debugging situations ('Your API's p95 latency doubled after a release — how do you investigate?'). Follow the FOCUS list. sourceRef: a P#/E# ref when it is about their project, else null.",
  },
  bands: {
    STUDENT: "an ENTRY-LEVEL candidate (student / fresher). Interviewers check fundamentals (DSA, OOP, DBMS, OS, networking, the role's core skills) and whether the candidate can explain their own projects. Do not ask about leading teams, owning large production systems or architecture far beyond their projects.",
    JUNIOR: "a JUNIOR developer (up to 2 years). Interviewers expect working knowledge: writing and debugging production code, testing, how their stack works under the hood, and the fundamentals.",
    MID: "a MID-LEVEL developer (2–5 years). Interviewers expect ownership of features in production: design trade-offs, performance, data modelling, reliability, security and code quality — and still check fundamentals quickly.",
    SENIOR: "a SENIOR engineer (5+ years). Interviewers expect the SUPERSET: everything a junior must know (asked quickly), plus architecture, scaling, failure modes, observability, security, migrations and the technical reasoning behind major decisions.",
  },
  stages: {
    1: "STAGE 1 · BASICS — difficulty 1-2 only: practical fundamentals and how-to questions. ONE focused question each, at most 25 words, with no second part (no '…, and how…'), and only a short mention of the project. Answerable in 1-2 minutes. No system design or architecture.",
    2: "STAGE 2 · CORE — difficulty 3 only: how it works under the hood, why it behaves that way, comparisons, and debugging one specific problem.",
    3: "STAGE 3 · ADVANCED — difficulty 4-5 only: scenarios, failure handling, scaling, design and trade-offs — ideally applied to the candidate's own projects.",
  },
  conceptualExtra: ["System design: scalability, caching, load balancing", "DevOps: containers, CI/CD, monitoring"],
  scenarios: (experienced) =>
    experienced
      ? ["System design: scale one of your projects to 100× users", "System design: caching and database bottlenecks", "DevOps: a failed deployment / rollback", "DevOps: production incident — logs, metrics, alerts", "Debugging a slow API in your stack", "Security: a vulnerability found in production", "Performance: profiling a hot path", "Architecture: splitting or migrating a service safely"]
      : ["Debugging a bug in one of your projects", "System design basics: what changes when your project gets 10× more users", "Choosing between two approaches in your project", "DevOps basics: deploying your project and reading its logs", "Debugging a slow API in your stack"],
  developerFundamentals: true,
  examples: {
    depth: "definition → understanding → implementation → debugging → trade-off → real-world → architecture",
    why: "'You list JWT auth in WhatsApp CRM'",
    skill: "'Node.js', 'JWT', 'MongoDB indexing'",
    core: "core-stack",
  },
};

interface FamilyFlavour {
  interviewer: string;
  fundamentals: string;
  scenarios: [string[], string[]];
  achievements: string;
  allowBehavioural: boolean;
}

const FLAVOUR: Record<Exclude<FamilyKey, "software">, FamilyFlavour> = {
  data: {
    interviewer: "a senior analytics lead who hires data and BI analysts",
    fundamentals: "SQL (joins, aggregation, window functions), statistics and probability, data cleaning and quality, KPIs, and choosing the right chart",
    scenarios: [
      ["A KPI on a dashboard looks wrong — how do you check the data?", "Sales dropped last week — which data do you look at first?", "Explaining an analysis to a non-technical manager", "Cleaning a messy dataset from one of your projects"],
      ["Diagnosing a 20% drop in a core metric end to end", "Designing an A/B test and deciding when to stop it", "Building a dashboard leadership actually uses", "Two data sources disagree — reconciling them", "Recommending a business decision from incomplete data"],
    ],
    achievements: "e.g. a certification → a question in that tool or method; a competition → the approach and what they learned",
    allowBehavioural: false,
  },
  product: {
    interviewer: "a senior product leader who hires product managers and analysts",
    fundamentals: "product sense, user research, prioritisation frameworks, product metrics (north-star, funnels, retention), experiments and roadmapping",
    scenarios: [
      ["Prioritising three features with limited engineering time", "Choosing the success metric for a feature in one of your projects", "A user complaint pattern — what do you do next?", "Explaining a trade-off to a stakeholder"],
      ["A core metric dropped 15% overnight — diagnose it", "Design a product for a new user segment", "Engineering and sales disagree on the roadmap — resolve it", "Launch plan and guardrail metrics for a risky feature", "Deciding to kill or double down on a feature"],
    ],
    achievements: "e.g. a case competition → their approach and recommendation; a product they launched → users, metrics and what they would change",
    allowBehavioural: true,
  },
  business: {
    interviewer: "a senior consultant or business-analysis lead who runs case interviews",
    fundamentals: "structured problem solving, market sizing, profitability, business frameworks (and their limits), requirements and process analysis",
    scenarios: [
      ["Estimate the market size of a product you know", "A client's profit fell — how do you structure it?", "Mapping the current process for a workflow you worked on", "Turning a stakeholder request into clear requirements"],
      ["Market entry case for a mid-size company", "Profitability case with conflicting data", "Recommending one of three strategic options to a CEO", "A project where the requirements kept changing — what would you do differently?", "Building a business case with uncertain numbers"],
    ],
    achievements: "e.g. a case competition win → structure, assumptions and recommendation; a certification → a question in that method",
    allowBehavioural: true,
  },
  mba: {
    interviewer: "a senior manager in this function (marketing, finance, HR or operations) who hires MBA graduates",
    fundamentals: "the function's core concepts, frameworks and metrics, applied to real businesses",
    scenarios: [
      ["Applying a core framework of the role to a company you know", "A metric of the function is off target — first steps", "A decision you made in your internship or project — the reasoning", "Explaining a functional concept to a non-specialist"],
      ["A full functional case (e.g. a campaign underperformed, a cash crunch, an attrition spike, stock-outs)", "Choosing between two strategies with trade-offs", "Measuring whether an initiative worked", "Handling a conflict between functions", "Planning the first 90 days in the role"],
    ],
    achievements: "e.g. a live project or competition → approach, numbers and what they'd change; a certification (CFA, SHRM…) → a question in that body of knowledge",
    allowBehavioural: true,
  },
  sales: {
    interviewer: "a sales or customer-success leader who hires for this role",
    fundamentals: "the sales or customer-success process, discovery, objection handling, negotiation, pipeline and retention metrics",
    scenarios: [
      ["Role-play: open a discovery call for a product you know", "A prospect says 'it's too expensive' — respond", "Prioritising a week of leads", "A customer is unhappy with onboarding — first steps"],
      ["A large deal has stalled for a month — unblock it", "Negotiating with procurement without discounting away the margin", "Forecasting a quarter you might miss", "Saving an at-risk renewal", "Expanding an account with a new stakeholder"],
    ],
    achievements: "e.g. a target they beat → how, and the numbers; a certification → a question on that method",
    allowBehavioural: true,
  },
  design: {
    interviewer: "a design lead who hires UI/UX and product designers",
    fundamentals: "user research methods, usability heuristics, information architecture, interaction and visual design, accessibility and design systems",
    scenarios: [
      ["Walk through one design from your portfolio: problem to outcome", "Critique a common flow (e.g. checkout or sign-up)", "Choosing a research method for a question", "Making one of your designs accessible"],
      ["Stakeholders give conflicting feedback on your design — resolve it", "Designing with no time for research", "A launched design hurt a metric — what now?", "Scaling a design system across teams", "Trade-off between user needs and business goals"],
    ],
    achievements: "e.g. a design competition or case study → process, rationale and impact",
    allowBehavioural: true,
  },
  other: {
    interviewer: "a senior practitioner who hires for this role",
    fundamentals: "the role's core methods, tools and metrics (for example planning and risk, forecasting and inventory, or channels and campaign measurement)",
    scenarios: [
      ["A plan in one of your projects slipped — what did or would you do?", "Choosing the metric that shows the work is succeeding", "Explaining your work to a stakeholder", "Using the role's main tool for a common task"],
      ["A critical deadline is at risk — recover it", "A sudden spike or shortage (demand, traffic, stock) — respond", "A campaign's return is falling — diagnose and fix", "Balancing cost, time and quality under pressure", "Setting up reporting leadership trusts"],
    ],
    achievements: "e.g. a certification (PMP, Google Ads, APICS…) → a question in that body of knowledge",
    allowBehavioural: true,
  },
};

const GENERIC_SCALE = "1 fundamental concept, 2 applied / how-to, 3 deep reasoning and why, 4 realistic case or scenario, 5 strategy, trade-offs and judgment";

function brief(family: Exclude<FamilyKey, "software">): PrepBrief {
  const f = FLAVOUR[family];
  return {
    persona: `You are ${f.interviewer}, preparing ONE candidate for THEIR interview. You write the questions an interviewer who has read THIS resume is most likely to ask.`,
    scope: f.allowBehavioural
      ? "- Role questions only: concepts, cases and the candidate's own experience. Behavioural and situational questions belong when they test the role's competencies — tie them to the candidate's real experience (answerable with STAR). Never generic HR filler ('tell me about yourself', strengths/weaknesses, salary, '5 years', hobbies). Never coding or programming questions unless the job description explicitly requires them."
      : "- Role questions only (concepts, analysis, cases and the candidate's own work). No HR or behavioural filler ('tell me about yourself', strengths/weaknesses, salary, '5 years'). Write SQL or formulas only where the role uses them; no general programming questions unless the job description requires them.",
    allowBehavioural: f.allowBehavioural,
    scale: GENERIC_SCALE,
    categories: {
      GENERAL: `GENERAL questions commonly asked for this role at this candidate's level — ${f.fundamentals}. sourceRef: null.`,
      SKILL: SHARED.SKILL,
      PROJECT: "PROJECT DEEP-DIVE questions about ONE specific project, internship or job from the resume: the problem, why they chose that approach, what they personally did, the data or evidence they used, trade-offs, results, and what they would change. Name the project in the question. sourceRef: the project's P# or experience E# ref (required).",
      CLAIM: SHARED.CLAIM,
      ACHIEVEMENT: `ACHIEVEMENT-BASED questions that verify ONE listed achievement or certification (${f.achievements}). sourceRef: the A# ref (required).`,
      CONCEPTUAL: `CONCEPTUAL questions on the fundamentals of the role — why and how they work, when they fail, and how to apply them: ${f.fundamentals}. Follow the FOCUS list. sourceRef: null or the project where it matters.`,
      SCENARIO: "SCENARIO and CASE questions: realistic situations in this role, ideally applied to the candidate's own projects or experience. Follow the FOCUS list. sourceRef: a P#/E# ref when it is about their experience, else null.",
    },
    bands: {
      STUDENT: "an ENTRY-LEVEL candidate (student / fresher). Interviewers check the role's core concepts and whether the candidate can explain their own projects, internships and coursework. Do not ask about leading large teams or owning large budgets.",
      JUNIOR: "an EARLY-CAREER candidate (up to 2 years). Interviewers expect the role's methods applied day to day, with real examples from their work.",
      MID: "an EXPERIENCED candidate (2–5 years). Interviewers expect ownership, measurable outcomes, trade-offs and stakeholder handling — and still check fundamentals quickly.",
      SENIOR: "a SENIOR candidate (5+ years). Interviewers expect the SUPERSET: fundamentals (asked quickly) plus strategy, leading people, setting direction and the judgment behind major decisions.",
    },
    stages: {
      1: "STAGE 1 · BASICS — difficulty 1-2 only: core concepts and how-to questions. ONE focused question each, at most 25 words, with no second part (no '…, and how…'), and only a short mention of the project. Answerable in 1-2 minutes. No complex cases.",
      2: "STAGE 2 · CORE — difficulty 3 only: why things work the way they do, comparisons, and applying a method to one specific situation.",
      3: "STAGE 3 · ADVANCED — difficulty 4-5 only: cases, trade-offs, judgment and strategy — ideally applied to the candidate's own experience.",
    },
    conceptualExtra: [],
    scenarios: (experienced) => f.scenarios[experienced ? 1 : 0],
    developerFundamentals: false,
    examples: {
      depth: "definition → understanding → application → analysis → trade-off → real-world → strategy and judgment",
      why: "'You list a 400-respondent market survey in your EV study'",
      skill: "'Prioritization', 'Product metrics', 'Market sizing'",
      core: "core-role",
    },
  };
}

/** Software careers keep the engineering brief; DSA/system design/DevOps are forced only where coding applies (not e.g. Cybersecurity Analyst). */
export function prepBrief(family: FamilyKey, code: boolean): PrepBrief {
  return family === "software" ? { ...SOFTWARE, developerFundamentals: code } : brief(family);
}
