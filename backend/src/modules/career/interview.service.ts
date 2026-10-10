import { Prisma, type BuildTask, type InterviewSession, type InterviewTurn } from "@prisma/client";
import { aiJson, requireAI } from "../../ai/json.js";
import { audioRecordingEnabled, codeExecutionEnabled, env } from "../../config/env.js";
import { executeCode } from "../../jobs/queues.js";
import { prisma } from "../../lib/prisma.js";
import { storage } from "../../lib/storage.js";
import { buildHarness, parseHarnessResult, type TestCase } from "../../sandbox/harness.js";
import { AppError, badRequest, conflict, notFound } from "../../utils/errors.js";
import { sample } from "../../utils/random.js";
import { logEvent } from "../platform/events.js";
import { recordAnswerEvaluated, recordFollowUp } from "../personalization/interview-signals.js";
import { computeReadiness } from "../readiness/readiness.service.js";
import { isTargetRole, targetRole, type TargetRoleKey } from "../prep/roles.js";
import { inferRole } from "../prep/profile.js";
import { interviewProfile } from "./interview-roles.js";
import {
  buildBlueprint, fromMatchBank, fromPrepPlan, groundAreas, nextArea, normalizeQuestion, pickQuestion, QUESTIONS_FOR_DURATION,
  type Area, type BankItem, type Blueprint, type Difficulty,
} from "./interview.blueprint.js";
import { buildReport, turnScore } from "./interview.report.js";
import { prompts } from "./prompts.js";
import { codeReviewSchema, evaluationSchema, roleBankSchema, type BankQuestion, type CodeReview, type Evaluation } from "./schemas.js";

export { resultFor, turnScore } from "./interview.report.js";

export const INTERVIEWER = {
  name: "Manisha",
  role: "Senior Technical Interviewer",
  company: "Prompters",
  tone: "Professional, calm, neutral, technical",
  thinkingSeconds: 30,
  answerSeconds: 120,
  problemSeconds: 300,
  codingSeconds: 900,
};

const MAX_FOLLOW_UPS = 2;
const SCREEN_SHARE_LIMIT = 3;
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"];
/** A paused interview can be resumed for a day; after that it closes with the answers given. */
const PAUSE_LIMIT_MS = 24 * 60 * 60 * 1000;
/** An answer stuck "being evaluated" this long (crash, timeout) can be submitted again. */
const STALE_SUBMIT_MS = 120_000;

export const INTERVIEW_INTEGRITY_EVENTS = [
  "TAB_HIDDEN",
  "WINDOW_BLUR",
  "FULLSCREEN_EXIT",
  "SCREEN_SHARE_STOPPED",
  "SCREEN_SHARE_RESUMED",
  "MIC_DISCONNECTED",
  "CAMERA_DISCONNECTED",
  "COPY",
  "PASTE",
  "LARGE_PASTE",
  "CUT",
] as const;
export type InterviewIntegrityType = (typeof INTERVIEW_INTEGRITY_EVENTS)[number];
/** Server-detected signal: the answer tried to steer the interviewer instead of answering. */
const PROMPT_MANIPULATION = "PROMPT_MANIPULATION";
const MANIPULATION_RE = /(ignore|disregard|forget)\s+(all\s+|your\s+|the\s+|previous\s+|prior\s+)*(instructions|rules|prompt)|system prompt|reveal (your|the) (instructions|prompt|rubric|scoring)|give me (the )?(correct )?answer|tell me the (correct )?answer|(give|award) (me )?(full|maximum|10\/10) marks|you are now|act as (an?|the) /i;

/**
 * analysis = consent to AI analysis of the answers (required). Audio recording is separate and optional:
 * recordAudio is the candidate's in-interview choice ("Allow recording" / "Continue without recording").
 * Older clients sent recording=true to mean analysis + recording, with storeAudio to keep the audio.
 */
type Consent = { analysis?: boolean; recording?: boolean; integrity: boolean; preparationOnly: boolean; storeAudio?: boolean; recordAudio?: boolean; recordAudioAt?: string; at: string };
const analysisConsented = (c: Pick<Consent, "analysis" | "recording">) => c.analysis ?? c.recording === true;
/** Audio is kept only when the candidate explicitly allowed it. */
export const audioAllowed = (c: Consent) => (c.recordAudio !== undefined ? c.recordAudio : c.analysis === undefined && c.recording === true && c.storeAudio !== false);
type CodeResult = { passed: number; total: number; review?: CodeReview; tests?: { name: string; passed: boolean; hidden: boolean }[] };

/** Interviews are conducted strictly in English (questions, Manisha's voice, expected answers). */
export const INTERVIEW_LANGUAGE = "en";

// Manisha's spoken acknowledgements are fixed and neutral: the model's own wording is never used, so
// nothing said during the interview can coach the candidate or reveal how an answer was judged.
const NEUTRAL_NEXT = ["Okay.", "Understood.", "Thank you.", "Okay, let's move to the next topic.", "Got it.", "Alright."];
const NEUTRAL_FOLLOW = ["Let's go one level deeper.", "Can you explain that further?", "Okay. Let's go a little deeper on that."];
const REPEAT_LEAD = "I didn't catch that clearly. Could you repeat your answer?";
const lead = (list: string[], n: number) => list[n % list.length];

// ───────────────────────── helpers ─────────────────────────

const sessionInclude = {
  turns: { orderBy: { order: "asc" } },
  match: { include: { job: true, resume: true } },
  targetRoleProfile: { select: { id: true, userId: true, roleKey: true, status: true } },
} satisfies Prisma.InterviewSessionInclude;
type FullSession = Prisma.InterviewSessionGetPayload<{ include: typeof sessionInclude }>;

async function ownedSession(userId: string, sessionId: string): Promise<FullSession> {
  const session = await prisma.interviewSession.findFirst({ where: { id: sessionId, userId }, include: sessionInclude });
  if (!session) throw notFound("Interview");
  assertCareer(session);
  return session;
}

/**
 * A session linked to a career must stay consistent with it: same owner, same role. Checked on every
 * access (answers, follow-ups, pause/resume, report, audio, delete) — never trust the link blindly.
 */
function assertCareer(s: FullSession) {
  if (!s.targetRoleProfileId) return;
  const p = s.targetRoleProfile;
  if (!p || p.userId !== s.userId || p.roleKey !== s.targetRole) throw new AppError(409, "CAREER_MISMATCH", "This interview no longer matches its career profile.");
}

/** Interviews that share a career with this one: the same profile, or (older sessions) the same role. */
const sameCareer = (s: { targetRoleProfileId: string | null; targetRole: string | null }): Prisma.InterviewSessionWhereInput =>
  s.targetRoleProfileId ? { targetRoleProfileId: s.targetRoleProfileId } : s.targetRole ? { targetRole: s.targetRole } : {};

/**
 * The career a new interview belongs to. An explicit profile must be the user's own, active, and
 * of the interview's role. Without one, only the user's profile for exactly that role is used —
 * never the primary career as a guess.
 */
async function careerFor(userId: string, roleKey: string, profileId?: string) {
  if (profileId) {
    const p = await prisma.targetRoleProfile.findFirst({ where: { id: profileId, userId }, select: { id: true, roleKey: true, status: true } });
    if (!p) throw notFound("Career profile");
    if (p.status !== "ACTIVE") throw conflict("Reactivate this career before interviewing for it.");
    if (p.roleKey !== roleKey) throw badRequest("The career profile and the interview's role don't match.");
    return p.id;
  }
  const p = await prisma.targetRoleProfile.findUnique({ where: { userId_roleKey: { userId, roleKey } }, select: { id: true, status: true } });
  return p?.status === "ACTIVE" ? p.id : null;
}

/** The interview's question bank: its own snapshot, or (older sessions) the analysis bank. */
function bankOf(session: Pick<InterviewSession, "bank"> & { match: { questions: unknown; claims: unknown } | null }): BankItem[] {
  if (session.bank) return session.bank as unknown as BankItem[];
  if (session.match) return fromMatchBank(session.match.questions as BankQuestion[], session.match.claims as { id: string; claim: string }[]);
  return [];
}

const roleLabel = (s: Pick<InterviewSession, "targetRole">) => (s.targetRole && isTargetRole(s.targetRole) ? targetRole(s.targetRole)!.label : "Software Engineer");
const titleOf = (s: Pick<InterviewSession, "targetRole"> & { match: { job: { title: string; company: string | null } } | null }) => ({
  title: s.match?.job.title ?? roleLabel(s),
  company: s.match?.job.company ?? null,
});
const endsAtOf = (s: Pick<InterviewSession, "startedAt" | "durationMinutes" | "pausedMs">) => new Date(s.startedAt.getTime() + s.durationMinutes * 60_000 + s.pausedMs);
const aiBudget = (s: Pick<InterviewSession, "questionTarget">) => s.questionTarget * 2 + 8;

function intro(name: string, title: string, questions: number, minutes: number, withJob: boolean, noun = "technical interview") {
  const first = name.split(" ")[0];
  return `Hi ${first}, I'm ${INTERVIEWER.name}. I'll be conducting your ${noun} today for the ${title} role. I'll ask about ${questions} questions based on your resume${withJob ? " and the job description you've provided" : ""}, over about ${minutes} minutes. Please answer in English. Take your time — I'll give you enough time for each question.`;
}

function closingLine(roleKey?: string | null) {
  return `Thank you, that's the end of the interview. Your ${interviewProfile(roleKey).reportName} is being prepared.`;
}

/** Manisha's title follows the career being interviewed for. */
const interviewerFor = (roleKey: string | null | undefined) => ({ ...INTERVIEWER, role: interviewProfile(roleKey).title, tone: interviewProfile(roleKey).code ? INTERVIEWER.tone : "Professional, calm, neutral" });

async function dsaTasks(used: string[]) {
  return prisma.buildTask.findMany({
    where: { status: "PUBLISHED", slug: { notIn: used }, topic: { module: { slug: { in: ["dsa", "js-fundamentals", "js-intermediate", "python-fundamentals", "server-development"] } } } },
  });
}

/** A coding task when code can run; otherwise the same problem as an explain-your-approach question. */
async function pickProblem(userId: string, used: string[]): Promise<{ task: BuildTask; kind: "CODING" | "PROBLEM" } | null> {
  const tasks = await dsaTasks(used);
  if (!tasks.length) return null;
  const done = new Set((await prisma.submission.findMany({ where: { userId, status: "COMPLETED" }, select: { buildTaskId: true } })).map((s) => s.buildTaskId));
  const fresh = tasks.filter((t) => !done.has(t.id));
  const task = sample(fresh.length ? fresh : tasks, 1)[0];
  return { task, kind: codeExecutionEnabled() ? "CODING" : "PROBLEM" };
}

function problemText(task: BuildTask, kind: "CODING" | "PROBLEM") {
  return kind === "CODING"
    ? `Here's a coding problem: **${task.title}**.\n\n${task.description}\n\nImplement \`${task.functionName}\`. Run the visible tests while you work; when you submit, hidden tests run too. Add one or two lines explaining your approach and its time complexity.`
    : `Here's a problem: **${task.title}**.\n\n${task.description}\n\nYou don't need to run any code. Walk me through how you would solve it: your approach step by step (pseudocode is welcome), its time and space complexity, and the edge cases you'd handle.`;
}

async function hasProblems() {
  return (await prisma.buildTask.count({ where: { status: "PUBLISHED", topic: { module: { slug: { in: ["dsa", "js-fundamentals", "js-intermediate", "python-fundamentals", "server-development"] } } } } })) > 0;
}

// ───────────────────────── question bank for role-only interviews ─────────────────────────

async function roleBank(userId: string, resumeId: string, role: TargetRoleKey, focus: string[]): Promise<{ bank: BankItem[]; aiCalls: number }> {
  const claims = await prisma.resumeClaim.findMany({ where: { resumeId }, select: { id: true, claim: true } });
  const claimMap = new Map(claims.map((c) => [c.id, c.claim]));
  // Reuse the candidate's own Top 100 for this resume and role when it exists — no AI call needed.
  // Only a plan for THIS career: another career's questions must never leak into the interview.
  const plan = await prisma.prepPlan.findFirst({ where: { userId, resumeId, status: "READY", jobId: null, targetRole: role }, orderBy: { createdAt: "desc" }, select: { id: true } });
  const profile = interviewProfile(role);
  if (plan) {
    const qs = await prisma.prepQuestion.findMany({ where: { planId: plan.id, rank: { gt: 0 } }, orderBy: { rank: "asc" }, take: 100, select: { id: true, question: true, skill: true, category: true, difficulty: true, claimId: true, why: true } });
    if (qs.length >= 10) return { bank: fromPrepPlan(qs, claimMap, profile.code), aiCalls: 0 };
  }
  const resume = await prisma.careerResume.findUniqueOrThrow({ where: { id: resumeId }, select: { parsed: true } });
  const short = claims.slice(0, 20).map((c, i) => ({ id: `c${i + 1}`, claim: c.claim, dbId: c.id }));
  const r = targetRole(role)!;
  const p = prompts.roleBank({ role: r.label, skills: r.skills, concepts: r.concepts, resume: resume.parsed, claims: short, focus, profile });
  const out = await aiJson("interview_bank", p.system, p.user, roleBankSchema, 6000, { timeoutMs: 90_000 });
  const seen = new Set<string>();
  const bank = out.questions
    .filter((q) => {
      const k = normalizeQuestion(q.question);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((q, i): BankItem => {
      const c = q.claimId ? short.find((x) => x.id === q.claimId) : undefined;
      return { id: `g${i + 1}`, question: q.question, skill: q.skill, level: q.level, area: q.area as Area, claimId: c?.dbId ?? null, claim: c?.claim ?? null, why: q.why };
    });
  return { bank: groundAreas(bank, resume.parsed), aiCalls: 1 };
}

/**
 * What the candidate's earlier interviews on this resume FOR THIS CAREER tell us: weak skills to
 * revisit, questions not to repeat. A Data Analyst interview never steers a Product Manager one.
 */
async function history(userId: string, resumeId: string | null, career: { targetRoleProfileId: string | null; targetRole: string | null }) {
  const previous = await prisma.interviewSession.findMany({
    where: { userId, ...(resumeId ? { resumeId } : {}), ...sameCareer(career), status: { in: ["COMPLETED", "ENDED_INTEGRITY", "ABANDONED"] } },
    orderBy: { startedAt: "desc" },
    take: 5,
    select: { report: true, turns: { select: { question: true } } },
  });
  const focus = [...new Set(previous.flatMap((s) => ((s.report as { struggled?: string[] } | null)?.struggled ?? []).slice(0, 4)))].slice(0, 6);
  const asked = new Set(previous.flatMap((s) => s.turns.map((t) => normalizeQuestion(t.question))));
  return { focus, asked };
}

// ───────────────────────── lifecycle ─────────────────────────

async function finalize(sessionId: string, status: "COMPLETED" | "ENDED_INTEGRITY" | "ABANDONED") {
  const claimed = await prisma.interviewSession.updateMany({ where: { id: sessionId, status: { in: ["IN_PROGRESS", "PAUSED"] } }, data: { status, endedAt: new Date(), pausedAt: null } });
  const session = await prisma.interviewSession.findUniqueOrThrow({ where: { id: sessionId }, include: sessionInclude });
  if (!claimed.count) return session;
  // Drop the trailing question that was asked but never answered.
  const open = session.turns.filter((t) => !t.answeredAt);
  if (open.length) await prisma.interviewTurn.deleteMany({ where: { id: { in: open.map((t) => t.id) } } });
  const turns = session.turns.filter((t) => t.answeredAt);
  const report = await buildReport({ ...session, turns }, bankOf(session));

  // Readiness before vs after, and why it moved compared with the previous interview.
  const blueprint = session.blueprint as Blueprint | null;
  const after = await computeReadiness(session.userId).then((r) => r.score).catch(() => null);
  // Compared with the previous interview for the SAME career only.
  const previous = await prisma.interviewSession.findFirst({
    where: { userId: session.userId, id: { not: sessionId }, ...sameCareer(session), status: { in: ["COMPLETED", "ENDED_INTEGRITY"] }, readinessScore: { not: null }, startedAt: { lt: session.startedAt } },
    orderBy: { startedAt: "desc" },
    select: { report: true },
  });
  const prevDims = (previous?.report as { dimensions?: Record<string, number | null> } | null)?.dimensions ?? null;
  const DIM_LABEL: Record<string, string> = { technical: "Technical depth", projectUnderstanding: "Project explanation", problemSolving: "Problem solving", practicalEngineering: "Practical engineering", communication: "Communication" };
  const changes = prevDims
    ? Object.entries(DIM_LABEL).map(([k, label]) => ({ label, before: prevDims[k] ?? null, now: (report.dimensions as Record<string, number | null>)[k] ?? null })).filter((d) => d.before !== null && d.now !== null)
    : [];
  const readinessChange = {
    before: blueprint?.readinessBefore ?? null,
    after,
    improved: changes.filter((d) => d.now! - d.before! >= 5).map((d) => d.label),
    declined: changes.filter((d) => d.before! - d.now! >= 5).map((d) => d.label),
  };

  const updated = await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { report: { ...report, readinessChange } as unknown as Prisma.InputJsonValue, readinessScore: report.readiness, result: report.result.key },
    include: sessionInclude,
  });
  await logEvent(session.userId, "interview_completed", { meta: { sessionId, readiness: report.readiness, status } });
  return updated;
}

/** Closes sessions that ran out of time or were left paused too long. Returns true when it closed one. */
async function expireIfNeeded(session: FullSession) {
  if (session.status === "IN_PROGRESS" && Date.now() > endsAtOf(session).getTime() + 5 * 60_000) {
    await finalize(session.id, "COMPLETED");
    return true;
  }
  if (session.status === "PAUSED" && session.pausedAt && Date.now() - session.pausedAt.getTime() > PAUSE_LIMIT_MS) {
    await finalize(session.id, "ABANDONED");
    return true;
  }
  return false;
}

// ───────────────────────── public API ─────────────────────────

function turnView(t: InterviewTurn, task?: BuildTask | null) {
  const seconds = t.kind === "CODING" ? INTERVIEWER.codingSeconds : t.kind === "PROBLEM" ? INTERVIEWER.problemSeconds : INTERVIEWER.answerSeconds;
  return {
    id: t.id,
    order: t.order,
    kind: t.kind,
    lead: t.lead,
    question: t.question,
    skill: t.skill,
    category: t.category,
    area: t.area,
    level: t.level,
    answered: !!t.answeredAt,
    /** An answer saved before the AI could evaluate it (restored after a refresh or a failed attempt). */
    savedAnswer: !t.answeredAt && !t.submittedAt ? t.answerText : null,
    coding:
      task && t.kind === "CODING"
        ? {
            functionName: task.functionName,
            starter: { javascript: task.starterJs, python: task.starterPython },
            publicTests: (task.tests as unknown as TestCase[]).filter((x) => !x.hidden).map(({ name, args, expected }) => ({ name, args, expected })),
            hiddenTestCount: (task.tests as unknown as TestCase[]).filter((x) => x.hidden).length,
          }
        : null,
    timing: { thinkingSeconds: INTERVIEWER.thinkingSeconds, answerSeconds: seconds },
  };
}

async function currentTurnView(turns: InterviewTurn[]) {
  const open = turns.find((t) => !t.answeredAt);
  if (!open) return null;
  const task = open.buildTaskSlug ? await prisma.buildTask.findUnique({ where: { slug: open.buildTaskSlug } }) : null;
  return turnView(open, task);
}

export interface StartInput {
  matchId?: string;
  resumeId?: string;
  targetRole?: string;
  /** The career this interview prepares for (must be the user's own and of the same role). */
  targetRoleProfileId?: string;
  difficulty?: Difficulty;
  durationMinutes: number;
  questionTarget?: number;
  consent: Omit<Consent, "at">;
}

export async function startSession(userId: string, input: StartInput) {
  requireAI();
  if (!analysisConsented(input.consent) || !input.consent.integrity || !input.consent.preparationOnly) throw badRequest("Please accept all three consent statements to start the interview.");

  const active = await prisma.interviewSession.findFirst({ where: { userId, status: { in: ["IN_PROGRESS", "PAUSED"] } }, include: sessionInclude });
  if (active && !(await expireIfNeeded(active))) {
    const stale = active.status === "IN_PROGRESS" && Date.now() - endsAtOf(active).getTime() > 30 * 60_000;
    if (!stale) throw new AppError(409, "INTERVIEW_IN_PROGRESS", "You already have an interview in progress.", { sessionId: active.id });
    await finalize(active.id, "ABANDONED");
  }

  const difficulty: Difficulty = input.difficulty ?? "STANDARD";
  const questionTarget = input.questionTarget ?? QUESTIONS_FOR_DURATION[input.durationMinutes] ?? Math.round(input.durationMinutes / 2.2);
  let matchId: string | null = null;
  let resumeId: string;
  let roleKey: TargetRoleKey;
  let title: string;
  let bank: BankItem[];
  let aiCalls = 0;

  if (input.matchId) {
    const match = await prisma.jobMatch.findFirst({ where: { id: input.matchId, userId }, include: { job: true } });
    if (!match) throw notFound("Analysis");
    matchId = match.id;
    resumeId = match.resumeId;
    title = match.job.title;
    // The job's career decides the interview style (falls back to the student's primary career).
    const primary = await prisma.targetRoleProfile.findFirst({ where: { userId, status: "ACTIVE" }, orderBy: [{ primary: "desc" }, { createdAt: "asc" }], select: { roleKey: true } });
    if (input.targetRoleProfileId) {
      const chosen = await prisma.targetRoleProfile.findFirst({ where: { id: input.targetRoleProfileId, userId }, select: { roleKey: true } });
      if (!chosen) throw notFound("Career profile");
      roleKey = chosen.roleKey;
    } else roleKey = inferRole(match.job.title, primary?.roleKey ?? null);
    bank = fromMatchBank(match.questions as unknown as BankQuestion[], match.claims as unknown as { id: string; claim: string }[], interviewProfile(roleKey).code);
  } else {
    // A career profile alone is enough: its role is the interview's role.
    if (!input.targetRole && input.targetRoleProfileId) {
      const p = await prisma.targetRoleProfile.findFirst({ where: { id: input.targetRoleProfileId, userId }, select: { roleKey: true } });
      if (!p) throw notFound("Career profile");
      input = { ...input, targetRole: p.roleKey };
    }
    if (!input.resumeId || !input.targetRole) throw badRequest("Choose a resume and a target role, or start from a job-match analysis.");
    if (!isTargetRole(input.targetRole)) throw badRequest("Unknown target role.");
    const resume = await prisma.careerResume.findFirst({ where: { id: input.resumeId, userId }, select: { id: true } });
    if (!resume) throw notFound("Resume");
    resumeId = resume.id;
    roleKey = input.targetRole;
    title = targetRole(roleKey)!.label;
    bank = [];
  }

  const targetRoleProfileId = await careerFor(userId, roleKey, input.targetRoleProfileId);
  const past = await history(userId, resumeId, { targetRoleProfileId, targetRole: roleKey });
  if (!matchId) {
    const built = await roleBank(userId, resumeId, roleKey!, past.focus);
    bank = built.bank;
    aiCalls = built.aiCalls;
  }
  if (bank.length < 3) throw conflict("There aren't enough questions for an interview yet. Run the analysis again or generate your Top 100 first.");

  // Coding/problem turns only for careers that involve coding.
  const problemsAvailable = interviewProfile(roleKey).code && (await hasProblems());
  const blueprint = buildBlueprint(roleKey ?? "fullstack", questionTarget, bank, problemsAvailable);
  blueprint.readinessBefore = await computeReadiness(userId).then((r) => r.score).catch(() => null);

  const ctx = { bank, turns: [], blueprint, difficulty, focusAreas: past.focus, previouslyAsked: past.asked, score: turnScore };
  // Open with something from the candidate's own resume when possible — that's how real interviews start.
  const opener = pickQuestion(ctx, bank.some((q) => q.area === "PROJECTS") ? "PROJECTS" : bank.some((q) => q.area === "RESUME") ? "RESUME" : nextArea(ctx, (a) => bank.some((q) => q.area === a)));
  if (!opener) throw conflict("This analysis has no questions. Run the analysis again.");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      matchId,
      resumeId,
      targetRole: roleKey,
      targetRoleProfileId,
      difficulty,
      bank: bank as unknown as Prisma.InputJsonValue,
      blueprint: blueprint as unknown as Prisma.InputJsonValue,
      focusAreas: past.focus,
      aiCalls,
      language: INTERVIEW_LANGUAGE,
      durationMinutes: input.durationMinutes,
      questionTarget,
      consent: { ...input.consent, at: new Date().toISOString() },
      turns: { create: { order: 0, kind: "QUESTION", bankId: opener.id, question: opener.question, skill: opener.skill, category: opener.area, area: opener.area, claimId: opener.claimId ?? null, level: opener.level } },
    },
    include: { turns: true },
  });
  await logEvent(userId, "interview_started", { meta: { sessionId: session.id, job: title, mode: matchId ? "job" : "role", difficulty } });
  return {
    id: session.id,
    interviewer: interviewerFor(roleKey),
    intro: intro(user.name, title, questionTarget, input.durationMinutes, !!matchId, interviewProfile(roleKey).interviewNoun),
    current: turnView(session.turns[0]),
    progress: { answered: 0, target: session.questionTarget },
    endsAt: endsAtOf(session),
  };
}

export async function getSession(userId: string, sessionId: string): Promise<Awaited<ReturnType<typeof sessionView>>> {
  const session = await ownedSession(userId, sessionId);
  if (await expireIfNeeded(session)) return getSession(userId, sessionId);
  return sessionView(session);
}

async function sessionView(session: FullSession) {
  const answered = session.turns.filter((t) => t.answeredAt);
  const live = session.status === "IN_PROGRESS" || session.status === "PAUSED";
  return {
    id: session.id,
    status: session.status,
    language: INTERVIEW_LANGUAGE,
    mode: session.matchId ? "JOB" : "ROLE",
    targetRoleProfileId: session.targetRoleProfileId,
    difficulty: session.difficulty,
    targetRole: session.targetRole,
    durationMinutes: session.durationMinutes,
    questionTarget: session.questionTarget,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    pausedAt: session.pausedAt,
    endsAt: endsAtOf(session),
    screenShareWarnings: session.screenShareWarnings,
    interviewer: interviewerFor(session.targetRole),
    job: titleOf(session),
    matchId: session.matchId,
    resumeId: session.resumeId,
    /** null = not asked yet; the room asks before the first voice answer. false while recording is off on this server. */
    recordAudio: !audioRecordingEnabled() ? false : (session.consent as Consent).recordAudio ?? ((session.consent as Consent).analysis === undefined ? audioAllowed(session.consent as Consent) : null),
    progress: { answered: answered.length, target: session.questionTarget },
    current: live ? await currentTurnView(session.turns) : null,
    readinessScore: session.readinessScore,
    result: session.result,
    report: session.report,
    // Transcript + evaluations are only shown once the interview is over.
    turns: live
      ? []
      : session.turns.map((t) => ({
          id: t.id,
          order: t.order,
          kind: t.kind,
          question: t.question,
          skill: t.skill,
          category: t.category,
          area: t.area,
          level: t.level,
          answerText: t.answerText,
          answerCode: t.answerCode,
          codeLanguage: t.codeLanguage,
          codeResult: t.codeResult,
          skipped: t.skipped,
          excluded: t.excluded,
          durationSec: t.durationSec,
          hasAudio: !!t.audioKey,
          evaluation: t.evaluation,
          score: turnScore(t),
        })),
  };
}

/** The candidate's answer to "Your answer audio may be recorded…" — recording is never required. */
export async function setRecordingConsent(userId: string, sessionId: string, allow: boolean) {
  if (allow && !audioRecordingEnabled()) {
    throw new AppError(503, "RECORDING_DISABLED", "Audio recording is turned off on this server. Answer by voice or text as usual — your transcript is kept and counts the same.");
  }
  const session = await ownedSession(userId, sessionId);
  if (session.status !== "IN_PROGRESS" && session.status !== "PAUSED") throw conflict("This interview has ended.");
  const consent = { ...(session.consent as Consent), recordAudio: allow, recordAudioAt: new Date().toISOString() };
  await prisma.interviewSession.update({ where: { id: sessionId }, data: { consent: consent as unknown as Prisma.InputJsonValue } });
  return { recordAudio: allow };
}

export async function pauseSession(userId: string, sessionId: string) {
  const session = await ownedSession(userId, sessionId);
  if (await expireIfNeeded(session)) throw conflict("This interview has ended.");
  if (session.status !== "IN_PROGRESS") throw conflict("Only an interview in progress can be paused.");
  await prisma.interviewSession.updateMany({ where: { id: sessionId, status: "IN_PROGRESS" }, data: { status: "PAUSED", pausedAt: new Date() } });
  return getSession(userId, sessionId);
}

export async function resumeSession(userId: string, sessionId: string) {
  const session = await ownedSession(userId, sessionId);
  if (await expireIfNeeded(session)) throw conflict("This interview was paused for more than a day, so it has been closed. Your report covers the answers you gave.");
  if (session.status === "IN_PROGRESS") return getSession(userId, sessionId);
  if (session.status !== "PAUSED" || !session.pausedAt) throw conflict("This interview has ended.");
  const pausedFor = Date.now() - session.pausedAt.getTime();
  await prisma.interviewSession.updateMany({ where: { id: sessionId, status: "PAUSED" }, data: { status: "IN_PROGRESS", pausedAt: null, pausedMs: { increment: pausedFor } } });
  return getSession(userId, sessionId);
}

export async function runCode(userId: string, sessionId: string, turnId: string, language: "javascript" | "python", code: string) {
  const session = await ownedSession(userId, sessionId);
  if (session.status !== "IN_PROGRESS") throw conflict("This interview isn't running.");
  const turn = session.turns.find((t) => t.id === turnId && !t.answeredAt && t.kind === "CODING");
  if (!turn?.buildTaskSlug) throw notFound("Coding question");
  const task = await prisma.buildTask.findUniqueOrThrow({ where: { slug: turn.buildTaskSlug } });
  const tests = (task.tests as unknown as TestCase[]).filter((t) => !t.hidden);
  const { program, nonce } = buildHarness(language, code, task.functionName, tests);
  const r = parseHarnessResult(await executeCode({ language, code: program, env: { PROMPTERS_NONCE: nonce } }), nonce, tests);
  return {
    output: r.userOutput,
    stderr: r.stderr,
    timedOut: r.timedOut,
    tests: r.outcomes.map((o, i) => ({ name: o.name, passed: o.passed, args: tests[i].args, expected: tests[i].expected, actual: o.actual, error: o.error })),
  };
}

export interface AnswerInput {
  turnId: string;
  answerText?: string;
  skipped?: boolean;
  durationSec?: number;
  audioBase64?: string;
  audioMime?: string;
  code?: string;
  codeLanguage?: "javascript" | "python";
}

/** What the client needs after an answer: the next question, or the end. */
async function nextState(sessionId: string, leadText: string | null, replay = false) {
  const session = await prisma.interviewSession.findUniqueOrThrow({ where: { id: sessionId }, include: sessionInclude });
  assertCareer(session);
  const answered = session.turns.filter((t) => t.answeredAt).length;
  if (session.status !== "IN_PROGRESS" && session.status !== "PAUSED") return { done: true, lead: leadText ?? "Okay.", closing: closingLine(session.targetRole), sessionId, replay };
  const current = await currentTurnView(session.turns);
  if (!current) return { done: true, lead: leadText ?? "Okay.", closing: closingLine(session.targetRole), sessionId, replay };
  return { done: false, lead: current.lead ?? leadText ?? "Okay.", current, progress: { answered, target: session.questionTarget }, replay };
}

/** One AI call charged to the session; refuses once the session's budget is spent. */
async function chargeAi(sessionId: string, budget: number) {
  const r = await prisma.interviewSession.updateMany({ where: { id: sessionId, aiCalls: { lt: budget } }, data: { aiCalls: { increment: 1 } } });
  return r.count > 0;
}

export async function submitAnswer(userId: string, sessionId: string, input: AnswerInput) {
  const session = await ownedSession(userId, sessionId);
  if (await expireIfNeeded(session)) return nextState(sessionId, null);
  const turn = session.turns.find((t) => t.id === input.turnId);
  if (!turn) throw notFound("Question");
  // A repeated request for an answer we already processed returns the same next step (idempotent).
  if (turn.answeredAt) return nextState(sessionId, null, true);
  if (session.status === "PAUSED") throw conflict("This interview is paused. Resume it to continue.");
  if (session.status !== "IN_PROGRESS") throw conflict("This interview has ended.");
  const consent = session.consent as Consent;
  const skipped = !!input.skipped || (!input.answerText?.trim() && !input.code?.trim());

  // Claim the turn: saves the answer first (so it survives an AI failure) and blocks a concurrent duplicate.
  const claimed = await prisma.interviewTurn.updateMany({
    where: { id: turn.id, answeredAt: null, OR: [{ submittedAt: null }, { submittedAt: { lt: new Date(Date.now() - STALE_SUBMIT_MS) } }] },
    data: {
      submittedAt: new Date(),
      answerText: input.answerText?.slice(0, 10000) ?? null,
      answerCode: input.code?.slice(0, 65536) ?? null,
      codeLanguage: input.codeLanguage ?? null,
      durationSec: input.durationSec ?? null,
    },
  });
  if (!claimed.count) throw new AppError(409, "ANSWER_PROCESSING", "Your answer is already being processed.");

  // Audio is stored only with recording consent, and only while recording is on; never required.
  let audioKey: string | null = turn.audioKey;
  if (input.audioBase64 && audioRecordingEnabled() && audioAllowed(consent)) {
    const audio = Buffer.from(input.audioBase64, "base64");
    const mime = (input.audioMime ?? "audio/webm").split(";")[0];
    if (audio.length > MAX_AUDIO_BYTES || !AUDIO_TYPES.includes(mime)) {
      await prisma.interviewTurn.update({ where: { id: turn.id }, data: { submittedAt: null } });
      throw badRequest(audio.length > MAX_AUDIO_BYTES ? "Recording is too large (max 4 MB per answer)." : "Unsupported audio format.");
    }
    audioKey = `interviews/${userId}/${session.id}/${turn.id}.${mime.split("/")[1]}`;
    await storage().put(audioKey, audio, mime);
  }

  if (!skipped && input.answerText && MANIPULATION_RE.test(input.answerText)) {
    await prisma.interviewIntegrityEvent.create({ data: { sessionId, type: PROMPT_MANIPULATION, meta: { turnId: turn.id } } });
  }

  const bank = bankOf(session);
  const budget = aiBudget(session);
  let evaluation: Evaluation | null = null;
  let codeResult: CodeResult | null = null;
  try {
    if (!skipped && !(await chargeAi(session.id, budget))) {
      // Budget spent (should not happen in a normal interview): close gracefully with what we have.
      await prisma.interviewTurn.update({ where: { id: turn.id }, data: { submittedAt: null } });
      await finalize(session.id, "COMPLETED");
      return nextState(sessionId, "Thank you.");
    }
    if (turn.kind === "CODING" && !skipped) {
      const task = await prisma.buildTask.findUniqueOrThrow({ where: { slug: turn.buildTaskSlug! } });
      const tests = task.tests as unknown as TestCase[];
      const language = input.codeLanguage ?? "javascript";
      const { program, nonce } = buildHarness(language, input.code ?? "", task.functionName, tests);
      const r = parseHarnessResult(await executeCode({ language, code: program, env: { PROMPTERS_NONCE: nonce } }), nonce, tests);
      const passed = r.outcomes.filter((o) => o.passed).length;
      const p = prompts.reviewCode({ problem: task.description, language, code: input.code ?? "", passed, total: tests.length, explanation: input.answerText ?? "" });
      const review = await aiJson("review_code", p.system, p.user, codeReviewSchema, 1200);
      codeResult = { passed, total: tests.length, review, tests: r.outcomes.map((o) => ({ name: o.hidden ? "Hidden test" : o.name, passed: o.passed, hidden: o.hidden })) };
    } else if (!skipped) {
      const root = turn.kind === "FOLLOW_UP" || turn.kind === "REPEAT" ? session.turns.find((t) => t.id === turn.parentId) ?? turn : turn;
      const depth = session.turns.filter((t) => t.parentId === root.id && t.kind === "FOLLOW_UP").length;
      const claim = turn.claimId ? bank.find((b) => b.claimId === turn.claimId)?.claim ?? "" : "";
      const p = prompts.evaluate({ question: turn.question, skill: turn.skill, level: turn.level, answer: input.answerText ?? "", context: claim, depth, maxDepth: MAX_FOLLOW_UPS, profile: interviewProfile(session.targetRole) });
      evaluation = await aiJson("evaluate_answer", p.system, p.user, evaluationSchema, 1500, { timeoutMs: 45_000 });
    }
  } catch (e) {
    // Never lose the answer: release the claim (the text stays saved on the turn) so the client can retry.
    await prisma.interviewTurn.update({ where: { id: turn.id }, data: { submittedAt: null, audioKey } });
    if (e instanceof AppError && e.status < 500 && !e.code.startsWith("AI")) throw e;
    throw new AppError(503, "AI_RETRY", "Manisha couldn't process that answer just now. Your answer is saved — try again, continue later, or end the interview.");
  }

  const unclear = evaluation?.verdict === "UNCLEAR";
  await prisma.interviewTurn.update({
    where: { id: turn.id },
    data: {
      codeResult: (codeResult ?? undefined) as Prisma.InputJsonValue | undefined,
      evaluation: (evaluation ?? undefined) as Prisma.InputJsonValue | undefined,
      skipped,
      // An unclear transcript is not a wrong answer: it isn't scored.
      excluded: unclear,
      audioKey,
      audioMime: audioKey ? (input.audioMime ?? turn.audioMime ?? "audio/webm").split(";")[0] : null,
      answeredAt: new Date(),
    },
  });
  // Structured signal for personalization (scores only; never blocks the interview).
  recordAnswerEvaluated(userId, turn, { evaluation, codeResult: codeResult ?? null, skipped, excluded: unclear }, session.turns);

  // ── Decide what Manisha asks next ──
  const turns = await prisma.interviewTurn.findMany({ where: { sessionId: session.id }, orderBy: { order: "asc" } });
  const counted = turns.filter((t) => !t.excluded).length;
  const outOfTime = Date.now() > endsAtOf(session).getTime();
  if ((counted >= session.questionTarget && !unclear) || outOfTime) {
    await finalize(session.id, "COMPLETED");
    return nextState(session.id, "Thank you.");
  }

  const nextOrder = turns.length;
  const rootId = turn.kind === "FOLLOW_UP" || turn.kind === "REPEAT" ? turn.parentId ?? turn.id : turn.id;
  const root = turns.find((t) => t.id === rootId) ?? turn;
  const followUpsSoFar = turns.filter((t) => t.parentId === rootId && t.kind === "FOLLOW_UP").length;
  const base = { sessionId: session.id, order: nextOrder };
  let next: Prisma.InterviewTurnUncheckedCreateInput | null = null;

  const followUp = evaluation?.followUp.question?.trim();
  if (unclear && turn.kind !== "REPEAT") {
    // Ask the same question again, once — don't score a broken transcript as a failure.
    next = { ...base, kind: "REPEAT", parentId: rootId, question: turn.question, lead: REPEAT_LEAD, skill: turn.skill, category: turn.category, area: turn.area, claimId: turn.claimId, level: turn.level };
  } else if (
    evaluation?.followUp.needed &&
    followUp &&
    followUp.length >= 12 &&
    followUpsSoFar < MAX_FOLLOW_UPS &&
    session.questionTarget - counted > 1 &&
    !/correct answer|the answer is|you should have|actually,? it|that'?s (wrong|incorrect|right|correct)/i.test(followUp)
  ) {
    next = { ...base, kind: "FOLLOW_UP", parentId: root.id, question: followUp, lead: lead(NEUTRAL_FOLLOW, nextOrder), skill: root.skill, category: root.category, area: root.area, claimId: root.claimId, level: Math.min(5, root.level + 1) };
  } else {
    const blueprint = (session.blueprint as Blueprint | null) ?? buildBlueprint(session.targetRole ?? "fullstack", session.questionTarget, bank, false);
    const past = await history(userId, session.resumeId, session);
    const ctx = { bank, turns, blueprint, difficulty: session.difficulty as Difficulty, focusAreas: session.focusAreas, previouslyAsked: past.asked, score: turnScore };
    const area = nextArea(ctx, (a) => (a === "PROBLEM_SOLVING" ? true : bank.some((q) => q.area === a && !turns.some((t) => t.bankId === q.id))));
    if (area === "PROBLEM_SOLVING") {
      const problem = await pickProblem(userId, turns.map((t) => t.buildTaskSlug).filter((x): x is string => !!x));
      if (problem) {
        const level = Math.min(5, problem.task.difficulty + (session.difficulty === "HARD" ? 2 : 1));
        next = { ...base, kind: problem.kind, question: problemText(problem.task, problem.kind), lead: lead(NEUTRAL_NEXT, nextOrder), skill: "Problem solving", category: "PROBLEM_SOLVING", area: "PROBLEM_SOLVING", level, buildTaskSlug: problem.task.slug };
      }
    }
    if (!next) {
      const q = pickQuestion(ctx, area === "PROBLEM_SOLVING" ? null : area);
      if (!q) {
        await finalize(session.id, "COMPLETED");
        return nextState(session.id, "Thank you.");
      }
      next = { ...base, kind: "QUESTION", bankId: q.id, question: q.question, lead: lead(NEUTRAL_NEXT, nextOrder), skill: q.skill, category: q.area, area: q.area, claimId: q.claimId ?? null, level: q.level };
    }
  }

  try {
    const created = await prisma.interviewTurn.create({ data: next });
    if (created.kind === "FOLLOW_UP") recordFollowUp(userId, created);
  } catch (e) {
    // Another request already created the next turn (unique session+order): just return it.
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
  }
  return nextState(session.id, null);
}

export async function logIntegrity(userId: string, sessionId: string, events: { type: InterviewIntegrityType; meta?: Record<string, unknown> }[]) {
  const session = await ownedSession(userId, sessionId);
  if (session.status !== "IN_PROGRESS") return { warning: session.screenShareWarnings, ended: session.status === "ENDED_INTEGRITY" };
  await prisma.interviewIntegrityEvent.createMany({ data: events.map((e) => ({ sessionId, type: e.type, meta: (e.meta ?? undefined) as Prisma.InputJsonValue | undefined })) });
  const stops = events.filter((e) => e.type === "SCREEN_SHARE_STOPPED").length;
  if (!stops) return { warning: session.screenShareWarnings, ended: false };
  const updated = await prisma.interviewSession.update({ where: { id: sessionId }, data: { screenShareWarnings: { increment: stops } } });
  if (updated.screenShareWarnings >= SCREEN_SHARE_LIMIT) {
    await finalize(sessionId, "ENDED_INTEGRITY");
    return { warning: updated.screenShareWarnings, ended: true, limit: SCREEN_SHARE_LIMIT };
  }
  return { warning: updated.screenShareWarnings, ended: false, limit: SCREEN_SHARE_LIMIT };
}

export async function endSession(userId: string, sessionId: string) {
  await ownedSession(userId, sessionId);
  await finalize(sessionId, "COMPLETED");
  return getSession(userId, sessionId);
}

/** Interview history with per-dimension scores, oldest first, for the progress comparison. */
export async function interviewHistory(userId: string, targetRoleProfileId?: string) {
  if (targetRoleProfileId && !(await prisma.targetRoleProfile.findFirst({ where: { id: targetRoleProfileId, userId }, select: { id: true } }))) throw notFound("Career profile");
  const sessions = await prisma.interviewSession.findMany({
    where: { userId, ...(targetRoleProfileId ? { targetRoleProfileId } : {}) },
    orderBy: { startedAt: "desc" },
    select: {
      id: true, status: true, readinessScore: true, result: true, startedAt: true, endedAt: true, matchId: true, targetRole: true, targetRoleProfileId: true, difficulty: true, durationMinutes: true, report: true,
      match: { select: { job: { select: { title: true, company: true } } } },
    },
  });
  return sessions.map(({ report, ...s }) => ({
    ...s,
    role: s.match?.job.title ?? (s.targetRole && isTargetRole(s.targetRole) ? targetRole(s.targetRole)!.label : "Technical interview"),
    dimensions: (report as { dimensions?: Record<string, number | null> } | null)?.dimensions ?? null,
  }));
}

export async function audioFor(userId: string, sessionId: string, turnId: string) {
  const session = await ownedSession(userId, sessionId);
  const turn = session.turns.find((t) => t.id === turnId);
  if (!turn?.audioKey) throw notFound("Recording");
  const obj = await storage().get(turn.audioKey);
  if (!obj) throw notFound("Recording");
  return obj;
}

/** Deletes every stored recording of a session (retention control). Transcript and scores stay. */
export async function deleteRecordings(userId: string, sessionId: string) {
  const session = await ownedSession(userId, sessionId);
  const keys = session.turns.map((t) => t.audioKey).filter((k): k is string => !!k);
  await Promise.all(keys.map((k) => storage().delete(k).catch(() => undefined)));
  await prisma.interviewTurn.updateMany({ where: { sessionId }, data: { audioKey: null, audioMime: null } });
  return { deleted: keys.length };
}

export async function deleteSession(userId: string, sessionId: string) {
  await deleteRecordings(userId, sessionId);
  await prisma.interviewSession.delete({ where: { id: sessionId } });
  return { deleted: true };
}

/** Deletes audio older than RECORDING_RETENTION_DAYS. Runs daily in the worker. */
export async function purgeExpiredRecordings() {
  const cutoff = new Date(Date.now() - env.RECORDING_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const turns = await prisma.interviewTurn.findMany({ where: { audioKey: { not: null }, answeredAt: { lt: cutoff } }, select: { id: true, audioKey: true }, take: 5000 });
  await Promise.all(turns.map((t) => storage().delete(t.audioKey!).catch(() => undefined)));
  await prisma.interviewTurn.updateMany({ where: { id: { in: turns.map((t) => t.id) } }, data: { audioKey: null, audioMime: null } });
  return turns.length;
}

/** Before deleting a resume/analysis, remove the audio files its interviews stored. */
export async function deleteAudioForMatches(matchIds: string[]) {
  const turns = await prisma.interviewTurn.findMany({ where: { audioKey: { not: null }, session: { matchId: { in: matchIds } } }, select: { audioKey: true } });
  await Promise.all(turns.map((t) => storage().delete(t.audioKey!).catch(() => undefined)));
}

/** Same, for interviews tied directly to a resume (role-only interviews). */
export async function deleteAudioForResume(resumeId: string) {
  const turns = await prisma.interviewTurn.findMany({ where: { audioKey: { not: null }, session: { resumeId } }, select: { audioKey: true } });
  await Promise.all(turns.map((t) => storage().delete(t.audioKey!).catch(() => undefined)));
}
