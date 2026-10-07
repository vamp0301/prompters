import type { BuildTask, Prisma, Submission } from "@prisma/client";
import { executeCode } from "../../jobs/queues.js";
import { prisma } from "../../lib/prisma.js";
import { buildHarness, parseHarnessResult, type TestCase, type TestOutcome } from "../../sandbox/harness.js";
import type { SandboxLanguage } from "../../sandbox/types.js";
import { badRequest, conflict, locked, notFound } from "../../utils/errors.js";
import { flattenTopics, learnerPath } from "../learning/path.service.js";
import { logEvent } from "../platform/events.js";
import { getScoring, independenceFromHints } from "../platform/scoring.js";
import { keywordScore } from "../platform/text.js";

type ExplainQuestion = { question: string; keywords: string[] };

async function loadTask(userId: string, slug: string) {
  const task = await prisma.buildTask.findUnique({ where: { slug }, include: { topic: { select: { id: true, slug: true, title: true } } } });
  if (!task || task.status !== "PUBLISHED") throw notFound("Build task");
  if (task.topic) {
    const { stages } = await learnerPath(userId);
    const entry = flattenTopics(stages).find((t) => t.id === task.topic!.id);
    if (!entry) throw locked("This build task belongs to a different track.");
    if (entry.state === "LOCKED") throw locked(`Unlock "${entry.title}" first to start this build.`, { missingPrerequisites: entry.missingPrerequisites });
  }
  return task;
}

const testsOf = (task: BuildTask) => task.tests as unknown as TestCase[];
const publicTests = (task: BuildTask) => testsOf(task).filter((t) => !t.hidden);

/** Never leak hidden test inputs/expected values to the browser. */
function outcomeView(outcomes: TestOutcome[], tests: TestCase[]) {
  return outcomes.map((o, i) =>
    o.hidden
      ? { name: "Hidden test", hidden: true, passed: o.passed, error: o.passed ? undefined : o.error ? "Failed (details hidden)" : "Wrong answer" }
      : { name: o.name, hidden: false, passed: o.passed, args: tests[i].args, expected: tests[i].expected, actual: o.actual, error: o.error },
  );
}

function view(task: BuildTask & { topic: { slug: string; title: string } | null }, sub: Submission | null, cfg: Awaited<ReturnType<typeof getScoring>>) {
  const hints = task.hints as string[];
  const used = sub?.hintsUsed ?? 0;
  const explain = task.explainQuestions as unknown as ExplainQuestion[];
  return {
    slug: task.slug,
    title: task.title,
    description: task.description,
    functionName: task.functionName,
    difficulty: task.difficulty,
    estMinutes: task.estMinutes,
    topic: task.topic,
    starter: { javascript: task.starterJs, python: task.starterPython },
    publicTests: publicTests(task).map(({ name, args, expected }) => ({ name, args, expected })),
    hiddenTestCount: testsOf(task).filter((t) => t.hidden).length,
    hints: { total: hints.length, revealed: hints.slice(0, used) },
    hintPenalties: cfg.hintPenalties,
    explainQuestions: sub && sub.status !== "IN_PROGRESS" ? explain.map((q) => q.question) : null,
    submission: sub && {
      language: sub.language,
      code: sub.code,
      status: sub.status,
      hintsUsed: sub.hintsUsed,
      runs: sub.runs,
      submits: sub.submits,
      passedCount: sub.passedCount,
      totalCount: sub.totalCount,
      testResult: sub.testResult,
      explainScore: sub.explainScore,
      independenceScore: sub.independenceScore ?? independenceFromHints(sub.hintsUsed, cfg),
      projectScore: sub.projectScore,
      completedAt: sub.completedAt,
    },
    ai: { chat: false, autocomplete: false },
  };
}

export async function listTasks(userId: string) {
  const [tasks, subs, { stages }] = await Promise.all([
    prisma.buildTask.findMany({ where: { status: "PUBLISHED" }, include: { topic: { select: { id: true, slug: true, title: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.submission.findMany({ where: { userId } }),
    learnerPath(userId),
  ]);
  const topics = new Map(flattenTopics(stages).map((t) => [t.id, t]));
  return tasks
    .filter((t) => !t.topic || topics.has(t.topic.id))
    .map((t) => {
      const sub = subs.find((s) => s.buildTaskId === t.id);
      const topic = t.topic ? topics.get(t.topic.id) : undefined;
      return {
        slug: t.slug,
        title: t.title,
        difficulty: t.difficulty,
        estMinutes: t.estMinutes,
        topic: t.topic && { slug: t.topic.slug, title: t.topic.title },
        stage: topic ? { slug: topic.stage.slug, title: topic.stage.title } : null,
        locked: topic?.state === "LOCKED",
        status: sub?.status ?? "NOT_STARTED",
        independenceScore: sub?.independenceScore ?? null,
        projectScore: sub?.projectScore ?? null,
      };
    });
}

export async function getTask(userId: string, slug: string) {
  const task = await loadTask(userId, slug);
  const sub = await prisma.submission.findUnique({ where: { userId_buildTaskId: { userId, buildTaskId: task.id } } });
  return view(task, sub, await getScoring());
}

async function ensureSubmission(userId: string, task: BuildTask, language: SandboxLanguage, code?: string) {
  const existing = await prisma.submission.findUnique({ where: { userId_buildTaskId: { userId, buildTaskId: task.id } } });
  if (existing) {
    if (code === undefined && existing.language === language) return existing;
    return prisma.submission.update({
      where: { id: existing.id },
      data: { language, code: code ?? (language === "javascript" ? task.starterJs : task.starterPython) },
    });
  }
  const created = await prisma.submission.create({
    data: { userId, buildTaskId: task.id, language, code: code ?? (language === "javascript" ? task.starterJs : task.starterPython) },
  });
  await logEvent(userId, "build_started", { topicId: task.topicId, meta: { task: task.slug, language } });
  return created;
}

export async function start(userId: string, slug: string, language: SandboxLanguage) {
  const task = await loadTask(userId, slug);
  const sub = await ensureSubmission(userId, task, language);
  return view(task, sub, await getScoring());
}

export async function saveCode(userId: string, slug: string, language: SandboxLanguage, code: string) {
  const task = await loadTask(userId, slug);
  await ensureSubmission(userId, task, language, code);
  return { savedAt: new Date() };
}

async function runTests(language: SandboxLanguage, code: string, task: BuildTask, tests: TestCase[]) {
  const { program, nonce } = buildHarness(language, code, task.functionName, tests);
  const raw = await executeCode({ language, code: program, env: { PROMPTERS_NONCE: nonce } });
  return parseHarnessResult(raw, nonce, tests);
}

/** "Run" executes visible tests only — quick feedback loop while building. */
export async function run(userId: string, slug: string, language: SandboxLanguage, code: string) {
  const task = await loadTask(userId, slug);
  const sub = await ensureSubmission(userId, task, language, code);
  const tests = publicTests(task);
  const r = await runTests(language, code, task, tests);
  await prisma.submission.update({ where: { id: sub.id }, data: { runs: { increment: 1 } } });
  return { output: r.userOutput, stderr: r.stderr, timedOut: r.timedOut, tests: outcomeView(r.outcomes, tests) };
}

export async function revealHint(userId: string, slug: string) {
  const task = await loadTask(userId, slug);
  const sub = await prisma.submission.findUnique({ where: { userId_buildTaskId: { userId, buildTaskId: task.id } } });
  if (!sub) throw badRequest("Start the build before asking for hints.");
  if (sub.status === "COMPLETED") throw conflict("This build is already complete.");
  const hints = task.hints as string[];
  if (sub.hintsUsed >= hints.length) throw conflict("All hints are already revealed.");
  const cfg = await getScoring();
  const updated = await prisma.submission.update({ where: { id: sub.id }, data: { hintsUsed: { increment: 1 } } });
  await logEvent(userId, "hint_used", { topicId: task.topicId, meta: { task: task.slug, level: updated.hintsUsed } });
  return {
    level: updated.hintsUsed,
    hint: hints[updated.hintsUsed - 1],
    revealed: hints.slice(0, updated.hintsUsed),
    independenceScore: independenceFromHints(updated.hintsUsed, cfg),
  };
}

/** "Submit" runs every test, including hidden ones. */
export async function submit(userId: string, slug: string, language: SandboxLanguage, code: string) {
  const task = await loadTask(userId, slug);
  const sub = await ensureSubmission(userId, task, language, code);
  const tests = testsOf(task);
  const r = await runTests(language, code, task, tests);
  const passedCount = r.outcomes.filter((o) => o.passed).length;
  const allPassed = passedCount === tests.length;
  const results = outcomeView(r.outcomes, tests);
  const updated = await prisma.submission.update({
    where: { id: sub.id },
    data: {
      submits: { increment: 1 },
      passedCount,
      totalCount: tests.length,
      testResult: { tests: results, output: r.userOutput.slice(0, 4000), stderr: r.stderr.slice(0, 4000) } as Prisma.InputJsonValue,
      status: sub.status === "COMPLETED" ? "COMPLETED" : allPassed ? "TESTS_PASSED" : "IN_PROGRESS",
    },
  });
  await logEvent(userId, "build_submitted", { topicId: task.topicId, meta: { task: task.slug, passedCount, total: tests.length } });
  const explain = task.explainQuestions as unknown as ExplainQuestion[];
  return {
    status: updated.status,
    passedCount,
    totalCount: tests.length,
    tests: results,
    output: r.userOutput,
    stderr: r.stderr,
    timedOut: r.timedOut,
    explainQuestions: allPassed ? explain.map((q) => q.question) : null,
  };
}

/** Explain-your-code: required before a build counts as complete. */
export async function explain(userId: string, slug: string, answers: string[]) {
  const task = await loadTask(userId, slug);
  const sub = await prisma.submission.findUnique({ where: { userId_buildTaskId: { userId, buildTaskId: task.id } } });
  if (!sub || sub.status === "IN_PROGRESS") throw conflict("Pass all tests before explaining your code.");
  const questions = task.explainQuestions as unknown as ExplainQuestion[];
  if (answers.length !== questions.length) throw badRequest(`Answer all ${questions.length} questions.`);

  const cfg = await getScoring();
  const feedback = questions.map((q, i) => ({ question: q.question, ...keywordScore(answers[i], q.keywords) }));
  const explainScore = Math.round(feedback.reduce((a, f) => a + f.score, 0) / feedback.length);
  const passed = explainScore >= cfg.minExplainScore;
  const independenceScore = independenceFromHints(sub.hintsUsed, cfg);
  const testsPct = sub.totalCount ? (sub.passedCount / sub.totalCount) * 100 : 0;
  const w = cfg.projectScoreWeights;
  const wSum = w.tests + w.explanation + w.independence || 1;
  const projectScore = Math.round((testsPct * w.tests + explainScore * w.explanation + independenceScore * w.independence) / wSum);
  const firstCompletion = passed && sub.status !== "COMPLETED";

  await prisma.submission.update({
    where: { id: sub.id },
    data: {
      explainAnswers: questions.map((q, i) => ({ question: q.question, answer: answers[i], score: feedback[i].score })) as Prisma.InputJsonValue,
      explainScore,
      ...(passed ? { status: "COMPLETED", independenceScore, projectScore, completedAt: sub.completedAt ?? new Date() } : {}),
    },
  });
  if (firstCompletion) await logEvent(userId, "build_completed", { topicId: task.topicId, meta: { task: task.slug, independenceScore, projectScore, hintsUsed: sub.hintsUsed } });

  return {
    passed,
    minExplainScore: cfg.minExplainScore,
    explainScore,
    feedback: feedback.map((f) => ({ question: f.question, score: f.score, missing: f.missing })),
    ...(passed
      ? {
          independenceScore,
          projectScore,
          breakdown: { tests: Math.round(testsPct), explanation: explainScore, hintsUsed: sub.hintsUsed, independence: independenceScore },
        }
      : {}),
  };
}
