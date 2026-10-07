import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export const SECTION_ORDER = [
  "DEFINITION",
  "ANALOGY",
  "WHY",
  "USAGE",
  "INTERNALS",
  "CODE",
  "MISTAKES",
  "DEBUGGING",
  "TRADEOFFS",
  "REAL_PROJECT",
] as const;

export interface TopicSnapshot {
  slug: string;
  title: string;
  difficulty: number;
  estMinutes: number;
  objectives: string[];
  technicalDefinition: string | null;
  module: { slug: string; title: string };
  stage: { slug: string; code: string; title: string };
  sections: { type: string; order: number; content: Record<string, string>; codeJs: string | null; codePython: string | null }[];
  visualization: { kind: string; title: string; steps: unknown } | null;
  prerequisites: { slug: string; title: string }[];
}

/** Builds the student-facing snapshot from the working (editable) tables. */
export async function buildSnapshot(topicId: string, tx: Prisma.TransactionClient = prisma): Promise<TopicSnapshot> {
  const t = await tx.topic.findUniqueOrThrow({
    where: { id: topicId },
    include: {
      module: { include: { stage: true } },
      sections: true,
      visualization: true,
      prerequisites: { include: { prerequisite: { select: { slug: true, title: true } } } },
    },
  });
  return {
    slug: t.slug,
    title: t.title,
    difficulty: t.difficulty,
    estMinutes: t.estMinutes,
    objectives: t.objectives,
    technicalDefinition: t.technicalDefinition,
    module: { slug: t.module.slug, title: t.module.title },
    stage: { slug: t.module.stage.slug, code: t.module.stage.code, title: t.module.stage.title },
    sections: t.sections
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ type: s.type, order: s.order, content: s.content as Record<string, string>, codeJs: s.codeJs, codePython: s.codePython })),
    visualization: t.visualization ? { kind: t.visualization.kind, title: t.visualization.title, steps: t.visualization.steps } : null,
    prerequisites: t.prerequisites.map((p) => p.prerequisite),
  };
}

export const completenessInclude = {
  sections: true,
  visualization: true,
  _count: {
    select: {
      questions: { where: { status: "PUBLISHED" } },
      buildTasks: { where: { status: "PUBLISHED" } },
      interviewQs: { where: { status: "PUBLISHED" } },
      promptCards: { where: { status: "PUBLISHED" } },
    },
  },
} satisfies Prisma.TopicInclude;

type TopicForCompleteness = Prisma.TopicGetPayload<{ include: typeof completenessInclude }>;

/** Required pieces for a topic to be publishable — also drives the Content Health report. */
export function completenessOf(t: TopicForCompleteness) {
  const byType = new Map(t.sections.map((s) => [s.type, s]));
  const has = (type: string, locale: string) => {
    const c = byType.get(type)?.content as Record<string, string> | undefined;
    return !!c?.[locale]?.trim();
  };
  const code = byType.get("CODE");
  const checks = [
    { key: "definition", label: "Definition", ok: has("DEFINITION", "en") && !!t.technicalDefinition, required: true },
    { key: "hinglish", label: "Hinglish", ok: SECTION_ORDER.every((s) => has(s, "hinglish")), required: true },
    { key: "english", label: "English", ok: SECTION_ORDER.every((s) => has(s, "en")), required: true },
    { key: "hindi", label: "Hindi", ok: has("DEFINITION", "hi") && has("ANALOGY", "hi"), required: false },
    { key: "why", label: "Why it exists", ok: has("WHY", "en"), required: true },
    { key: "examples", label: "Real-world examples", ok: has("USAGE", "en"), required: true },
    { key: "visual", label: "Visual", ok: !!t.visualization, required: false },
    { key: "code", label: "Code (JS + Python)", ok: !!code?.codeJs && !!code?.codePython, required: true },
    { key: "mistakes", label: "Common mistakes", ok: has("MISTAKES", "en"), required: true },
    { key: "quiz", label: `Quiz pool (≥ ${t.quizSize})`, ok: t._count.questions >= t.quizSize, required: true },
    { key: "quizPool3x", label: `Quiz pool 3× (≥ ${t.quizSize * 3})`, ok: t._count.questions >= t.quizSize * 3, required: false },
    { key: "build", label: "Build task", ok: t._count.buildTasks > 0, required: false },
    { key: "interview", label: "Interview questions", ok: t._count.interviewQs > 0, required: true },
    { key: "prompt", label: "Prompt card", ok: t._count.promptCards > 0, required: false },
  ];
  const percent = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const missingRequired = checks.filter((c) => c.required && !c.ok).map((c) => c.label);
  return { percent, checks, missingRequired, publishable: missingRequired.length === 0 };
}

export async function completeness(topicId: string) {
  return completenessOf(await prisma.topic.findUniqueOrThrow({ where: { id: topicId }, include: completenessInclude }));
}
