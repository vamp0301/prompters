import type { BuildTask, InterviewSession, InterviewTurn, Prisma } from "@prisma/client";
import { aiJson, requireAI } from "../../ai/json.js";
import { codeExecutionEnabled, env } from "../../config/env.js";
import { executeCode } from "../../jobs/queues.js";
import { prisma } from "../../lib/prisma.js";
import { storage } from "../../lib/storage.js";
import { buildHarness, parseHarnessResult, type TestCase } from "../../sandbox/harness.js";
import { AppError, badRequest, conflict, notFound } from "../../utils/errors.js";
import { sample } from "../../utils/random.js";
import { logEvent } from "../platform/events.js";
import { prompts } from "./prompts.js";
import { codeReviewSchema, evaluationSchema, QUESTION_CATEGORIES, type BankQuestion, type CodeReview, type Evaluation } from "./schemas.js";

export const INTERVIEWER = {
  name: "Manisha",
  role: "Senior Technical Interviewer",
  company: "Prompters",
  tone: "Professional, calm, neutral, technical",
  thinkingSeconds: 30,
  answerSeconds: 120,
  codingSeconds: 900,
};

const MAX_FOLLOW_UPS = 2;
const SCREEN_SHARE_LIMIT = 3;
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"];

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

/** recording = consent to recording + AI analysis (required); storeAudio = keep answer audio afterwards (optional). */
type Consent = { recording: boolean; integrity: boolean; preparationOnly: boolean; storeAudio?: boolean; at: string };
type CodeResult = { passed: number; total: number; review?: CodeReview; tests?: { name: string; passed: boolean; hidden: boolean }[] };

// ───────────────────────── helpers ─────────────────────────

async function ownedSession(userId: string, sessionId: string) {
  const session = await prisma.interviewSession.findFirst({ where: { id: sessionId, userId }, include: { turns: { orderBy: { order: "asc" } }, match: { include: { job: true, resume: true } } } });
  if (!session) throw notFound("Interview");
  return session;
}

/** Interviews are conducted strictly in English (questions, Manisha's voice, expected answers). */
export const INTERVIEW_LANGUAGE = "en";

function intro(name: string, jobTitle: string, questions: number, minutes: number) {
  const first = name.split(" ")[0];
  return `Hi ${first}, I'm ${INTERVIEWER.name}. I'll be conducting your technical interview today for the ${jobTitle} role. I'll ask about ${questions} questions based on your resume and the job description you've provided, over about ${minutes} minutes. Please answer in English. Take your time — I'll give you sufficient time to answer each question.`;
}

function claimContext(questions: BankQuestion[], bankId: string | null, claims: { id: string; claim: string }[]) {
  const q = questions.find((x) => x.id === bankId);
  const c = q?.claimId ? claims.find((x) => x.id === q.claimId) : undefined;
  return c ? c.claim : "";
}

/** Adaptive pick: priority category first, then the level closest to how the candidate is doing, avoiding repeat skills. */
function pickNextQuestion(bank: BankQuestion[], turns: InterviewTurn[]) {
  const asked = new Set(turns.map((t) => t.bankId).filter(Boolean));
  const remaining = bank.filter((q) => !asked.has(q.id));
  if (!remaining.length) return null;
  const answered = turns.filter((t) => t.evaluation && t.kind !== "CODING");
  const recent = answered.slice(-3).map((t) => turnScore(t));
  const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 60;
  const lastRoot = [...turns].reverse().find((t) => t.kind === "QUESTION");
  const currentLevel = lastRoot?.level ?? 1;
  const targetLevel = Math.max(1, Math.min(5, avg >= 70 ? currentLevel + 1 : avg <= 40 ? currentLevel - 1 : currentLevel));
  const lastSkill = lastRoot?.skill.toLowerCase();
  const askedCount = turns.filter((t) => t.kind === "QUESTION").length;
  // Open with IMPORTANT fundamentals; later widen to every category.
  const allowed = askedCount < 3 ? ["IMPORTANT", "GOOD"] : [...QUESTION_CATEGORIES];
  const pool = remaining.filter((q) => allowed.includes(q.category));
  const candidates = (pool.length ? pool : remaining)
    .map((q) => ({
      q,
      cost: QUESTION_CATEGORIES.indexOf(q.category) * 1.5 + Math.abs(q.level - targetLevel) * 2 + (q.skill.toLowerCase() === lastSkill ? 3 : 0),
    }))
    .sort((a, b) => a.cost - b.cost);
  return candidates[0].q;
}

async function pickCodingTask(userId: string, used: string[]) {
  // With code execution disabled the interview simply continues with spoken questions.
  if (!codeExecutionEnabled()) return null;
  const tasks = await prisma.buildTask.findMany({
    where: { status: "PUBLISHED", slug: { notIn: used }, topic: { module: { slug: { in: ["dsa", "js-fundamentals", "js-intermediate", "python-fundamentals", "server-development"] } } } },
  });
  if (!tasks.length) return null;
  const done = new Set((await prisma.submission.findMany({ where: { userId, status: "COMPLETED" }, select: { buildTaskId: true } })).map((s) => s.buildTaskId));
  const fresh = tasks.filter((t) => !done.has(t.id));
  return sample(fresh.length ? fresh : tasks, 1)[0];
}

function codingQuestionText(task: BuildTask) {
  return `Here's a coding problem: **${task.title}**.\n\n${task.description}\n\nImplement \`${task.functionName}\`. Run the visible tests while you work; when you submit, hidden tests run too. Add one or two lines explaining your approach and its time complexity.`;
}

// ───────────────────────── scoring ─────────────────────────

export function turnScore(t: Pick<InterviewTurn, "kind" | "skipped" | "evaluation" | "codeResult">) {
  if (t.skipped) return 0;
  if (t.kind === "CODING") {
    const r = t.codeResult as CodeResult | null;
    if (!r || !r.total) return 0;
    const tests = (r.passed / r.total) * 100;
    const quality = r.review ? ((r.review.understanding + r.review.practical) / 2) * 10 : tests;
    return Math.round(tests * 0.6 + quality * 0.4);
  }
  const e = t.evaluation as Evaluation | null;
  if (!e) return 0;
  return Math.round((e.correctness * 0.4 + e.completeness * 0.2 + e.understanding * 0.25 + e.practical * 0.15) * 10);
}

const turnWeight = (t: InterviewTurn) => (t.kind === "CODING" ? 1.5 : t.kind === "FOLLOW_UP" ? 0.6 : 1 + (t.level - 1) * 0.15);

export function resultFor(score: number) {
  if (score >= 75) return { key: "INTERVIEW_READY", label: "Interview Ready" };
  if (score >= 55) return { key: "NEEDS_IMPROVEMENT", label: "Needs Improvement" };
  return { key: "NOT_YET_READY", label: "Not Yet Ready" };
}

async function buildReport(session: InterviewSession & { turns: InterviewTurn[] }) {
  const answered = session.turns.filter((t) => t.answeredAt);
  const wSum = answered.reduce((a, t) => a + turnWeight(t), 0);
  const readiness = wSum ? Math.round(answered.reduce((a, t) => a + turnScore(t) * turnWeight(t), 0) / wSum) : 0;
  const verdicts = answered.map((t) => {
    if (t.skipped) return "SKIPPED";
    if (t.kind === "CODING") {
      const r = t.codeResult as CodeResult | null;
      return !r?.total ? "INCORRECT" : r.passed === r.total ? "CORRECT" : r.passed > 0 ? "PARTIAL" : "INCORRECT";
    }
    const v = (t.evaluation as Evaluation | null)?.verdict;
    return v === "NO_ANSWER" ? "INCORRECT" : v ?? "INCORRECT";
  });

  const bySkill = new Map<string, { label: string; scores: number[] }>();
  for (const t of answered) {
    const key = t.skill.trim().toLowerCase();
    const entry = bySkill.get(key) ?? { label: t.skill.trim(), scores: [] };
    entry.scores.push(turnScore(t));
    bySkill.set(key, entry);
  }
  const areas = [...bySkill.values()]
    .map((a) => ({ skill: a.label, score: Math.round(a.scores.reduce((x, y) => x + y, 0) / a.scores.length), questions: a.scores.length }))
    .sort((a, b) => b.score - a.score);

  const missing = new Map<string, number>();
  for (const t of answered) for (const c of (t.evaluation as Evaluation | null)?.missingConcepts ?? []) missing.set(c, (missing.get(c) ?? 0) + 1);
  const topMissing = [...missing.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c);
  const answeredWell = areas.filter((a) => a.score >= 70).map((a) => a.skill);
  const struggled = [...new Set([...areas.filter((a) => a.score < 55).map((a) => a.skill), ...topMissing])].slice(0, 8);

  // Close the loop: map gaps to Prompters topics the learner can study next.
  const keywords = struggled.flatMap((s) => s.split(/[\s/,()-]+/)).filter((w) => w.length > 2).slice(0, 12);
  const topics = keywords.length
    ? await prisma.topic.findMany({
        where: { status: "PUBLISHED", publishedVersion: { gt: 0 }, OR: keywords.map((k) => ({ title: { contains: k, mode: "insensitive" as const } })) },
        select: { slug: true, title: true },
        take: 5,
      })
    : [];

  const events = await prisma.interviewIntegrityEvent.groupBy({ by: ["type"], where: { sessionId: session.id }, _count: true });
  const integrity = Object.fromEntries(events.map((e) => [e.type, e._count]));
  const signalCount = events.filter((e) => e.type !== "SCREEN_SHARE_RESUMED").reduce((a, e) => a + e._count, 0);
  const comm = answered.filter((t) => t.evaluation && !t.skipped).map((t) => (t.evaluation as Evaluation).communication);

  const result = resultFor(readiness);
  return {
    readiness,
    result,
    insufficientEvidence: answered.length < 5,
    counts: {
      total: answered.length,
      correct: verdicts.filter((v) => v === "CORRECT").length,
      partial: verdicts.filter((v) => v === "PARTIAL").length,
      incorrect: verdicts.filter((v) => v === "INCORRECT").length,
      skipped: verdicts.filter((v) => v === "SKIPPED").length,
    },
    communication: comm.length ? Math.round((comm.reduce((a, b) => a + b, 0) / comm.length) * 10) : null,
    areas,
    answeredWell,
    struggled,
    nextSteps: [
      ...topics.map((t) => ({ label: `Revise ${t.title}`, href: `/learn/topic/${t.slug}` })),
      ...struggled.filter((s) => !topics.some((t) => t.title.toLowerCase().includes(s.toLowerCase()))).slice(0, 3).map((s) => ({ label: `Practise interview questions on ${s}`, href: `/interviews?q=${encodeURIComponent(s)}` })),
      { label: "Retake this technical interview", href: `/career/analysis/${session.matchId}` },
    ],
    integrity: {
      signals: integrity,
      total: signalCount,
      screenShareWarnings: session.screenShareWarnings,
      status: signalCount === 0 ? "No signals" : session.screenShareWarnings > 0 || signalCount >= 3 ? "Review recommended" : "Minor signals",
    },
    disclaimer: "This Technical Readiness Report is a preparation assessment generated from your answers. It is not an automated hiring decision.",
  };
}

async function finalize(sessionId: string, status: "COMPLETED" | "ENDED_INTEGRITY" | "ABANDONED") {
  const claimed = await prisma.interviewSession.updateMany({ where: { id: sessionId, status: "IN_PROGRESS" }, data: { status, endedAt: new Date() } });
  const session = await prisma.interviewSession.findUniqueOrThrow({ where: { id: sessionId }, include: { turns: { orderBy: { order: "asc" } } } });
  if (!claimed.count) return session;
  // Drop the trailing question that was asked but never answered.
  const open = session.turns.filter((t) => !t.answeredAt);
  if (open.length) await prisma.interviewTurn.deleteMany({ where: { id: { in: open.map((t) => t.id) } } });
  const turns = session.turns.filter((t) => t.answeredAt);
  const report = await buildReport({ ...session, turns });
  const updated = await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { report: report as unknown as Prisma.InputJsonValue, readinessScore: report.readiness, result: report.result.key },
    include: { turns: { orderBy: { order: "asc" } } },
  });
  await logEvent(session.userId, "interview_completed", { meta: { sessionId, readiness: report.readiness, status } });
  return updated;
}

// ───────────────────────── public API ─────────────────────────

function turnView(t: InterviewTurn, task?: BuildTask | null) {
  return {
    id: t.id,
    order: t.order,
    kind: t.kind,
    lead: t.lead,
    question: t.question,
    skill: t.skill,
    category: t.category,
    level: t.level,
    answered: !!t.answeredAt,
    coding: task
      ? {
          functionName: task.functionName,
          starter: { javascript: task.starterJs, python: task.starterPython },
          publicTests: (task.tests as unknown as TestCase[]).filter((x) => !x.hidden).map(({ name, args, expected }) => ({ name, args, expected })),
          hiddenTestCount: (task.tests as unknown as TestCase[]).filter((x) => x.hidden).length,
        }
      : null,
    timing: { thinkingSeconds: INTERVIEWER.thinkingSeconds, answerSeconds: t.kind === "CODING" ? INTERVIEWER.codingSeconds : INTERVIEWER.answerSeconds },
  };
}

async function currentTurnView(turns: InterviewTurn[]) {
  const open = turns.find((t) => !t.answeredAt);
  if (!open) return null;
  const task = open.buildTaskSlug ? await prisma.buildTask.findUnique({ where: { slug: open.buildTaskSlug } }) : null;
  return turnView(open, task);
}

export async function startSession(userId: string, input: { matchId: string; durationMinutes: number; questionTarget: number; consent: Omit<Consent, "at"> }) {
  requireAI();
  if (!input.consent.recording || !input.consent.integrity || !input.consent.preparationOnly) throw badRequest("Please accept all three consent statements to start the interview.");
  const match = await prisma.jobMatch.findFirst({ where: { id: input.matchId, userId }, include: { job: true } });
  if (!match) throw notFound("Analysis");
  const active = await prisma.interviewSession.findFirst({ where: { userId, status: "IN_PROGRESS" } });
  if (active) {
    const stale = Date.now() - active.startedAt.getTime() > (active.durationMinutes + 30) * 60_000;
    if (!stale) throw new AppError(409, "INTERVIEW_IN_PROGRESS", "You already have an interview in progress.", { sessionId: active.id });
    await finalize(active.id, "ABANDONED");
  }
  const bank = match.questions as unknown as BankQuestion[];
  const first = pickNextQuestion(bank, []);
  if (!first) throw conflict("This analysis has no questions. Run the analysis again.");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      matchId: match.id,
      language: INTERVIEW_LANGUAGE,
      durationMinutes: input.durationMinutes,
      questionTarget: input.questionTarget,
      consent: { ...input.consent, at: new Date().toISOString() },
      turns: { create: { order: 0, kind: "QUESTION", bankId: first.id, question: first.question, skill: first.skill, category: first.category, level: first.level } },
    },
    include: { turns: true },
  });
  await logEvent(userId, "interview_started", { meta: { sessionId: session.id, job: match.job.title } });
  return {
    id: session.id,
    interviewer: INTERVIEWER,
    intro: intro(user.name, match.job.title, input.questionTarget, input.durationMinutes),
    current: turnView(session.turns[0]),
    progress: { answered: 0, target: session.questionTarget },
    endsAt: new Date(session.startedAt.getTime() + session.durationMinutes * 60_000),
  };
}

export async function getSession(userId: string, sessionId: string) {
  const session = await ownedSession(userId, sessionId);
  if (session.status === "IN_PROGRESS" && Date.now() > session.startedAt.getTime() + (session.durationMinutes + 5) * 60_000) {
    await finalize(session.id, "COMPLETED");
    return getSession(userId, sessionId);
  }
  const answered = session.turns.filter((t) => t.answeredAt);
  return {
    id: session.id,
    status: session.status,
    language: INTERVIEW_LANGUAGE,
    durationMinutes: session.durationMinutes,
    questionTarget: session.questionTarget,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    endsAt: new Date(session.startedAt.getTime() + session.durationMinutes * 60_000),
    screenShareWarnings: session.screenShareWarnings,
    interviewer: INTERVIEWER,
    job: { title: session.match.job.title, company: session.match.job.company },
    matchId: session.matchId,
    progress: { answered: answered.length, target: session.questionTarget },
    current: session.status === "IN_PROGRESS" ? await currentTurnView(session.turns) : null,
    readinessScore: session.readinessScore,
    result: session.result,
    report: session.report,
    // Transcript + evaluations are only shown once the interview is over.
    turns:
      session.status === "IN_PROGRESS"
        ? []
        : session.turns.map((t) => ({
            id: t.id,
            order: t.order,
            kind: t.kind,
            question: t.question,
            skill: t.skill,
            category: t.category,
            level: t.level,
            answerText: t.answerText,
            answerCode: t.answerCode,
            codeLanguage: t.codeLanguage,
            codeResult: t.codeResult,
            skipped: t.skipped,
            durationSec: t.durationSec,
            hasAudio: !!t.audioKey,
            evaluation: t.evaluation,
            score: turnScore(t),
          })),
  };
}

export async function runCode(userId: string, sessionId: string, turnId: string, language: "javascript" | "python", code: string) {
  const session = await ownedSession(userId, sessionId);
  if (session.status !== "IN_PROGRESS") throw conflict("This interview has ended.");
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

export async function submitAnswer(userId: string, sessionId: string, input: AnswerInput) {
  const session = await ownedSession(userId, sessionId);
  if (session.status !== "IN_PROGRESS") throw conflict("This interview has ended.");
  const turn = session.turns.find((t) => t.id === input.turnId);
  if (!turn) throw notFound("Question");
  if (turn.answeredAt) throw conflict("This question was already answered.");
  const consent = session.consent as Consent;

  // Audio is stored only with recording consent; never required.
  let audioKey: string | null = null;
  if (input.audioBase64 && consent.recording && consent.storeAudio !== false) {
    const audio = Buffer.from(input.audioBase64, "base64");
    const mime = (input.audioMime ?? "audio/webm").split(";")[0];
    if (audio.length > MAX_AUDIO_BYTES) throw badRequest("Recording is too large (max 4 MB per answer).");
    if (!AUDIO_TYPES.includes(mime)) throw badRequest("Unsupported audio format.");
    audioKey = `interviews/${userId}/${session.id}/${turn.id}.${mime.split("/")[1]}`;
    await storage().put(audioKey, audio, mime);
  }

  const bank = session.match.questions as unknown as BankQuestion[];
  const claims = session.match.claims as unknown as { id: string; claim: string }[];
  const skipped = !!input.skipped || (!input.answerText?.trim() && !input.code?.trim());
  let evaluation: Evaluation | null = null;
  let codeResult: CodeResult | null = null;
  let lead: string;

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
    lead = review.lead;
  } else if (!skipped) {
    const root = turn.kind === "FOLLOW_UP" ? session.turns.find((t) => t.id === turn.parentId) : turn;
    const depth = session.turns.filter((t) => t.parentId === (root?.id ?? turn.id)).length;
    const p = prompts.evaluate({
      question: turn.question,
      skill: turn.skill,
      level: turn.level,
      answer: input.answerText ?? "",
      context: claimContext(bank, root?.bankId ?? null, claims),
      depth,
      maxDepth: MAX_FOLLOW_UPS,
    });
    evaluation = await aiJson("evaluate_answer", p.system, p.user, evaluationSchema, 1200);
    lead = evaluation.lead;
  } else {
    lead = "No problem, let's move on.";
  }

  await prisma.interviewTurn.update({
    where: { id: turn.id },
    data: {
      answerText: input.answerText?.slice(0, 10000) ?? null,
      answerCode: input.code?.slice(0, 65536) ?? null,
      codeLanguage: input.codeLanguage ?? null,
      codeResult: (codeResult ?? undefined) as Prisma.InputJsonValue | undefined,
      evaluation: (evaluation ?? undefined) as Prisma.InputJsonValue | undefined,
      skipped,
      durationSec: input.durationSec ?? null,
      audioKey,
      audioMime: audioKey ? (input.audioMime ?? "audio/webm").split(";")[0] : null,
      answeredAt: new Date(),
    },
  });

  // ── Decide what Manisha asks next ──
  const turns = await prisma.interviewTurn.findMany({ where: { sessionId: session.id }, orderBy: { order: "asc" } });
  const answeredCount = turns.length;
  const outOfTime = Date.now() > session.startedAt.getTime() + session.durationMinutes * 60_000;
  if (answeredCount >= session.questionTarget || outOfTime) {
    const done = await finalize(session.id, "COMPLETED");
    return { done: true, lead, closing: closingLine(), sessionId: done.id };
  }

  const nextOrder = turns.length;
  const rootId = turn.kind === "FOLLOW_UP" ? turn.parentId : turn.id;
  const followUpsSoFar = turns.filter((t) => t.parentId === rootId).length;
  let next: Prisma.InterviewTurnUncheckedCreateInput | null = null;

  if (evaluation?.followUp.needed && evaluation.followUp.question && followUpsSoFar < MAX_FOLLOW_UPS && session.questionTarget - answeredCount > 1 && !/correct answer|the answer is/i.test(evaluation.followUp.question)) {
    const root = turns.find((t) => t.id === rootId)!;
    next = { sessionId: session.id, order: nextOrder, kind: "FOLLOW_UP", parentId: root.id, question: evaluation.followUp.question, lead, skill: root.skill, category: root.category, level: Math.min(5, root.level + 1) };
  } else {
    const roots = turns.filter((t) => t.kind !== "FOLLOW_UP").length;
    const codingCheckpoints = [Math.ceil(session.questionTarget * 0.35), Math.ceil(session.questionTarget * 0.7)];
    const codingDone = turns.filter((t) => t.kind === "CODING").length;
    if (codingCheckpoints.slice(codingDone).some((c) => roots >= c - 1) && codingDone < 2) {
      const task = await pickCodingTask(userId, turns.map((t) => t.buildTaskSlug).filter((x): x is string => !!x));
      if (task) next = { sessionId: session.id, order: nextOrder, kind: "CODING", question: codingQuestionText(task), lead, skill: "Problem solving", category: "IMPORTANT", level: task.difficulty + 1, buildTaskSlug: task.slug };
    }
    if (!next) {
      const q = pickNextQuestion(bank, turns);
      if (!q) {
        await finalize(session.id, "COMPLETED");
        return { done: true, lead, closing: closingLine(), sessionId: session.id };
      }
      next = { sessionId: session.id, order: nextOrder, kind: "QUESTION", bankId: q.id, question: q.question, lead, skill: q.skill, category: q.category, level: q.level };
    }
  }

  const created = await prisma.interviewTurn.create({ data: next });
  const task = created.buildTaskSlug ? await prisma.buildTask.findUnique({ where: { slug: created.buildTaskSlug } }) : null;
  return { done: false, lead, current: turnView(created, task), progress: { answered: answeredCount, target: session.questionTarget } };
}

function closingLine() {
  return "Thank you, that's the end of the interview. Your Technical Readiness Report is being prepared.";
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
