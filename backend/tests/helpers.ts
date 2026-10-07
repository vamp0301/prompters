import type { Prisma, Role } from "@prisma/client";
import supertest from "supertest";
import type { Worker } from "bullmq";
import { createApp } from "../src/server/app.js";
import { prisma } from "../src/lib/prisma.js";
import { redis } from "../src/lib/redis.js";
import { startCodeWorker } from "../src/workers/code-worker.js";
import { buildSnapshot, SECTION_ORDER } from "../src/modules/learning/snapshot.js";
import { invalidateScoring } from "../src/modules/platform/scoring.js";

export const app = createApp();
let worker: Worker | undefined;

export function startWorker() {
  worker ??= startCodeWorker();
}

export async function resetDb() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
  await redis().flushdb();
  invalidateScoring();
}

let n = 0;
/** Registers a user and returns a supertest agent that keeps the session cookie. */
export async function login(role: Role = "STUDENT", opts: { language?: "JAVASCRIPT" | "PYTHON"; onboard?: boolean } = {}) {
  const agent = supertest.agent(app);
  const email = `user${++n}-${Date.now()}@test.dev`;
  const res = await agent.post("/api/auth/register").send({ name: "Test User", email, password: "Passw0rd!" });
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`);
  const id = res.body.data.id as string;
  if (role !== "STUDENT") {
    await prisma.user.update({ where: { id }, data: { role, tokenVersion: 0 } });
  }
  if (opts.onboard !== false) {
    await agent.post("/api/profile/onboarding").send({
      startLanguage: opts.language ?? "JAVASCRIPT",
      explanationLocale: "hinglish",
      goalRole: "BACKEND",
      codingLevel: "BEGINNER",
      weeklyHours: 10,
    });
  }
  return { agent, id, email };
}

const l10n = (s: string) => ({ hinglish: `${s} (hinglish)`, en: `${s} (en)` });

/** A small published curriculum: two stages, three topics, questions, a build task and a prompt card. */
export async function seedFixture() {
  const s0 = await prisma.stage.create({ data: { slug: "foundations", code: "0", title: "Foundations", description: "", order: 0, targetRoles: ["BACKEND"], status: "PUBLISHED" } });
  const s1 = await prisma.stage.create({ data: { slug: "javascript", code: "1B", title: "JavaScript", description: "", order: 1, track: "JAVASCRIPT", targetRoles: ["BACKEND"], status: "PUBLISHED" } });
  const sPy = await prisma.stage.create({ data: { slug: "python", code: "1A", title: "Python", description: "", order: 1, track: "PYTHON", targetRoles: ["BACKEND"], status: "PUBLISHED" } });
  const m0 = await prisma.module.create({ data: { stageId: s0.id, slug: "basics", title: "Basics", description: "", order: 0, status: "PUBLISHED" } });
  const m1 = await prisma.module.create({ data: { stageId: s1.id, slug: "js", title: "JS", description: "", order: 0, status: "PUBLISHED" } });
  await prisma.module.create({ data: { stageId: sPy.id, slug: "py", title: "Py", description: "", order: 0, status: "PUBLISHED" } });

  async function topic(moduleId: string, slug: string, order: number, prereqs: string[] = []) {
    const t = await prisma.topic.create({
      data: {
        moduleId, slug, title: slug.toUpperCase(), order, technicalDefinition: `${slug} definition`, quizSize: 5,
        sections: {
          create: SECTION_ORDER.map((type, i) => ({
            type, order: i, content: l10n(`${slug} ${type}`),
            codeJs: type === "CODE" ? `console.log("${slug}")` : null,
            codePython: type === "CODE" ? `print("${slug}")` : null,
          })),
        },
        visualization: { create: { kind: "FLOW", title: "Flow", steps: [{ title: "a", description: "a" }, { title: "b", description: "b" }] } },
        questions: {
          create: [
            ...Array.from({ length: 6 }, (_, i) => ({ type: "MCQ" as const, prompt: `${slug} q${i}?`, options: ["right", "wrong1", "wrong2", "wrong3"], correct: [0], explanation: "because" })),
            { type: "MULTI" as const, prompt: `${slug} multi?`, options: ["a", "b", "c"], correct: [0, 2], explanation: "because" },
            { type: "ORDER_STEPS" as const, prompt: `${slug} order?`, options: ["first", "second", "third"], explanation: "because" },
            { type: "EXPLAIN" as const, prompt: `${slug} explain?`, keywords: ["cache", "memory", "fast"], explanation: "because" },
          ],
        },
        interviewQs: { create: [{ category: "BACKEND", question: `What is ${slug}?`, short: "short", deep: "deep", commonMistake: "x", keywords: ["cache", "memory"] }] },
      },
    });
    for (const p of prereqs) {
      const pt = await prisma.topic.findUniqueOrThrow({ where: { slug: p } });
      await prisma.topicPrerequisite.create({ data: { topicId: t.id, prerequisiteId: pt.id } });
    }
    const snapshot = await buildSnapshot(t.id);
    await prisma.topicVersion.create({ data: { topicId: t.id, version: 1, snapshot: snapshot as unknown as Prisma.InputJsonValue } });
    return prisma.topic.update({ where: { id: t.id }, data: { status: "PUBLISHED", publishedVersion: 1 } });
  }

  const a = await topic(m0.id, "alpha", 0);
  const b = await topic(m0.id, "beta", 1, ["alpha"]);
  const c = await topic(m1.id, "gamma", 0);
  await prisma.topic.create({ data: { moduleId: m1.id, slug: "soon", title: "Soon", order: 1, status: "COMING_SOON" } });

  await prisma.buildTask.create({
    data: {
      slug: "alpha-build", topicId: a.id, title: "Add", description: "Add two numbers", functionName: "add",
      starterJs: "function add(a, b) {\n  // TODO\n}", starterPython: "def add(a, b):\n    pass",
      tests: [
        { name: "small", args: [1, 2], expected: 3 },
        { name: "zero", args: [0, 0], expected: 0 },
        { name: "secret", args: [40, 2], expected: 42, hidden: true },
      ],
      hints: ["concept", "step", "partial"],
      explainQuestions: [{ question: "Why does add work?", keywords: ["plus", "return"] }],
      status: "PUBLISHED",
    },
  });
  await prisma.promptCard.create({
    data: {
      slug: "alpha-prompt", topicId: a.id, title: "Alpha prompt", category: "LEARNING", task: "t", whenToUse: "w",
      template: "Explain [THING]", variables: [{ key: "THING", label: "Thing" }], whyItWorks: [], verifyChecklist: ["check"], sampleOutput: "out",
    },
  });
  await prisma.featureFlag.createMany({ data: [{ key: "PROMPT_LIBRARY", description: "", enabled: true }, { key: "AI_TUTOR", description: "", enabled: true }] });
  await prisma.assessment.create({
    data: { slug: "foundations-exam", title: "Foundations exam", kind: "STAGE_EXAM", stageId: s0.id, durationMinutes: 30, questionCount: 6, passingScore: 70, tabSwitchLimit: 1, violationPolicy: "AUTO_SUBMIT" },
  });
  return { stages: { s0, s1 }, topics: { a, b, c } };
}

/** Answers an attempt; uses the stored option order to translate correct answers into displayed indices. */
export async function answersFor(attemptId: string, mode: "correct" | "wrong" | ((i: number) => boolean)) {
  const attempt = await prisma.quizAttempt.findUniqueOrThrow({ where: { id: attemptId } });
  const questions = await prisma.question.findMany({ where: { id: { in: attempt.questionIds } } });
  const orders = attempt.optionOrders as Record<string, number[]>;
  const answers: Record<string, unknown> = {};
  attempt.questionIds.forEach((id, i) => {
    const q = questions.find((x) => x.id === id)!;
    const right = mode === "correct" ? true : mode === "wrong" ? false : mode(i);
    const order = orders[id];
    const toDisplayed = (orig: number) => order.indexOf(orig);
    const correct = (q.correct as number[] | null) ?? [];
    if (q.type === "EXPLAIN") answers[id] = right ? "Redis keeps a cache in memory so reads are very fast for the app users" : "no idea";
    else if (q.type === "ORDER_STEPS") answers[id] = right ? order.map((_, k) => toDisplayed(k)) : order.map((_, k) => toDisplayed(order.length - 1 - k));
    else if (q.type === "MULTI") answers[id] = right ? correct.map(toDisplayed) : [toDisplayed(1)];
    else answers[id] = right ? toDisplayed(correct[0]) : toDisplayed(correct[0] === 0 ? 1 : 0);
  });
  return answers;
}
