/**
 * Seeds the full curriculum skeleton plus all authored content.
 * Idempotent: existing stages/modules/topics are updated only in metadata, and a
 * topic that is already published is never overwritten (admin edits win).
 * Run with `npm run db:seed`.
 */
import "../../src/config/load-env.js";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import bcrypt from "bcryptjs";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../src/lib/prisma.js";
import { buildSnapshot, SECTION_ORDER } from "../../src/modules/learning/snapshot.js";
import { DEFAULT_SCORING } from "../../src/modules/platform/scoring.js";
import { KNOWN_FLAGS } from "../../src/modules/platform/flags.js";
import { curriculum } from "./content/curriculum.js";
import type { SeedTopicContent } from "./content/types.js";
import { extraInterviewQuestions, projects } from "./extras.js";

const here = path.dirname(fileURLToPath(import.meta.url));

async function loadContent(): Promise<Map<string, SeedTopicContent>> {
  const dir = path.join(here, "content");
  const files = (await readdir(dir)).filter((f) => /^stage.*\.ts$/.test(f));
  const map = new Map<string, SeedTopicContent>();
  for (const f of files) {
    const mod = (await import(pathToFileURL(path.join(dir, f)).href)) as { topics: SeedTopicContent[] };
    for (const t of mod.topics) {
      if (map.has(t.slug)) throw new Error(`Duplicate content for ${t.slug} (${f})`);
      map.set(t.slug, t);
    }
  }
  return map;
}

function interviewCategory(stageSlug: string, moduleSlug: string, topicSlug: string) {
  if (stageSlug === "foundations") return "FOUNDATIONS";
  if (stageSlug === "python" || stageSlug === "javascript") return "LANGUAGE";
  if (moduleSlug === "dsa") return "DSA";
  if (moduleSlug === "cs-fundamentals") {
    if (topicSlug.startsWith("os-")) return "OS";
    if (topicSlug.startsWith("net-")) return "NETWORKS";
    if (topicSlug.startsWith("dbms-")) return "DBMS";
    return "OOP";
  }
  if (stageSlug === "frontend") return "FRONTEND";
  if (moduleSlug === "security") return "SECURITY";
  if (stageSlug === "backend") return moduleSlug === "databases" ? "DBMS" : "BACKEND";
  if (stageSlug === "system-design") return "SYSTEM_DESIGN";
  return "PROJECTS";
}

async function seedTopicContent(db: PrismaClient, topicId: string, c: SeedTopicContent, category: string) {
  await db.$transaction(async (tx) => {
    await tx.topic.update({
      where: { id: topicId },
      data: { estMinutes: c.estMinutes, difficulty: c.difficulty, objectives: c.objectives, technicalDefinition: c.technicalDefinition },
    });
    await tx.topicSection.deleteMany({ where: { topicId } });
    await tx.topicSection.createMany({
      data: c.sections.map((s) => ({
        topicId,
        type: s.type,
        order: SECTION_ORDER.indexOf(s.type as (typeof SECTION_ORDER)[number]),
        content: s.content,
        codeJs: s.codeJs ?? null,
        codePython: s.codePython ?? null,
      })),
    });
    await tx.visualization.deleteMany({ where: { topicId } });
    if (c.visualization) {
      await tx.visualization.create({ data: { topicId, kind: c.visualization.kind, title: c.visualization.title, steps: c.visualization.steps } });
    }
    await tx.question.deleteMany({ where: { topicId } });
    await tx.question.createMany({
      data: c.questions.map((q) => ({
        topicId,
        type: q.type,
        difficulty: q.difficulty,
        prompt: q.prompt,
        code: q.code ?? null,
        codeLanguage: q.codeLanguage ?? null,
        options: q.options ?? undefined,
        correct: q.type === "ORDER_STEPS" || q.type === "EXPLAIN" ? undefined : q.correct,
        keywords: q.keywords ?? [],
        explanation: q.explanation,
        tags: q.tags ?? [],
      })),
    });
    await tx.interviewQuestion.deleteMany({ where: { topicId } });
    await tx.interviewQuestion.createMany({
      data: c.interview.map((q) => ({
        topicId,
        category,
        question: q.question,
        short: q.short,
        deep: q.deep,
        followUps: q.followUps,
        commonMistake: q.commonMistake,
        keywords: q.keywords,
        difficulty: q.difficulty,
        roles: q.roles,
      })),
    });
  });

  if (c.buildTask) {
    const b = c.buildTask;
    const data = {
      topicId,
      title: b.title,
      description: b.description,
      functionName: b.functionName,
      starterJs: b.starterJs,
      starterPython: b.starterPython,
      tests: b.tests as Prisma.InputJsonValue,
      hints: b.hints,
      explainQuestions: b.explainQuestions,
      estMinutes: b.estMinutes,
      difficulty: c.difficulty,
      status: "PUBLISHED" as const,
    };
    await db.buildTask.upsert({ where: { slug: `${c.slug}-build` }, create: { slug: `${c.slug}-build`, ...data }, update: data });
  }
  if (c.promptCard) {
    const p = c.promptCard;
    const data = {
      topicId,
      title: p.title,
      category: p.category,
      task: p.task,
      whenToUse: p.whenToUse,
      template: p.template,
      variables: p.variables,
      whyItWorks: p.whyItWorks,
      verifyChecklist: p.verifyChecklist,
      sampleOutput: p.sampleOutput,
      status: "PUBLISHED" as const,
    };
    await db.promptCard.upsert({ where: { slug: `${c.slug}-prompt` }, create: { slug: `${c.slug}-prompt`, ...data }, update: data });
  }
}

async function main() {
  const content = await loadContent();
  const known = new Set(curriculum.flatMap((s) => s.modules.flatMap((m) => m.topics.map(([slug]) => slug))));
  for (const slug of content.keys()) if (!known.has(slug)) throw new Error(`Content for unknown topic slug "${slug}"`);

  const topicIds = new Map<string, string>();
  const newlySeeded: string[] = [];
  let skipped = 0;

  for (const s of curriculum) {
    const stage = await prisma.stage.upsert({
      where: { slug: s.slug },
      create: { slug: s.slug, code: s.code, title: s.title, description: s.description, track: s.track, order: s.order, estHours: s.estHours, targetRoles: s.targetRoles, status: "PUBLISHED" },
      update: { code: s.code, title: s.title, description: s.description, track: s.track, order: s.order, estHours: s.estHours, targetRoles: s.targetRoles },
    });
    for (const [mi, m] of s.modules.entries()) {
      const mod = await prisma.module.upsert({
        where: { slug: m.slug },
        create: { slug: m.slug, stageId: stage.id, title: m.title, description: m.description, order: mi, status: "PUBLISHED" },
        update: { stageId: stage.id, title: m.title, description: m.description, order: mi },
      });
      for (const [ti, [slug, title]] of m.topics.entries()) {
        const c = content.get(slug);
        const existing = await prisma.topic.findUnique({ where: { slug } });
        const topic = existing
          ? await prisma.topic.update({ where: { id: existing.id }, data: { moduleId: mod.id, order: ti, title } })
          : await prisma.topic.create({ data: { slug, title, moduleId: mod.id, order: ti, status: c ? "DRAFT" : "COMING_SOON" } });
        topicIds.set(slug, topic.id);
        if (!c) continue;
        if (existing && existing.publishedVersion > 0) {
          skipped++;
          continue;
        }
        await seedTopicContent(prisma, topic.id, c, interviewCategory(s.slug, m.slug, slug));
        newlySeeded.push(slug);
      }
    }
  }

  // Prerequisites after every topic exists.
  for (const [slug, c] of content) {
    const topicId = topicIds.get(slug)!;
    if (!newlySeeded.includes(slug)) continue;
    await prisma.topicPrerequisite.deleteMany({ where: { topicId } });
    const prereqIds = c.prerequisites.map((p) => topicIds.get(p)).filter((x): x is string => !!x && x !== topicId);
    await prisma.topicPrerequisite.createMany({ data: prereqIds.map((prerequisiteId) => ({ topicId, prerequisiteId })), skipDuplicates: true });
  }

  // Publish v1 snapshots of newly seeded topics.
  for (const slug of newlySeeded) {
    const topicId = topicIds.get(slug)!;
    const snapshot = await buildSnapshot(topicId);
    await prisma.topicVersion.upsert({
      where: { topicId_version: { topicId, version: 1 } },
      create: { topicId, version: 1, snapshot: snapshot as unknown as Prisma.InputJsonValue, note: "Initial seed" },
      update: { snapshot: snapshot as unknown as Prisma.InputJsonValue },
    });
    await prisma.topic.update({ where: { id: topicId }, data: { status: "PUBLISHED", publishedVersion: 1 } });
  }

  // General interview bank (HR, projects, system design).
  for (const q of extraInterviewQuestions) {
    const exists = await prisma.interviewQuestion.findFirst({ where: { question: q.question, topicId: null } });
    if (!exists) await prisma.interviewQuestion.create({ data: q });
  }

  // Project ladder.
  for (const p of projects) {
    await prisma.project.upsert({ where: { slug: p.slug }, create: p, update: p });
  }

  // Stage exams for every stage with content, plus mock tests.
  const stages = await prisma.stage.findMany();
  for (const s of stages) {
    const hasContent = await prisma.question.count({ where: { topic: { module: { stageId: s.id }, status: "PUBLISHED" } } });
    if (!hasContent) continue;
    const data = {
      title: `Stage ${s.code} exam: ${s.title}`,
      description: `Timed exam across every ${s.title} topic. Pass to unlock the next stage.`,
      kind: "STAGE_EXAM" as const,
      stageId: s.id,
      durationMinutes: 30,
      questionCount: 20,
      passingScore: DEFAULT_SCORING.stageExamPassingScore,
      tabSwitchLimit: 3,
      violationPolicy: "FLAG" as const,
      blockClipboard: true,
      requireFullscreen: true,
      status: "PUBLISHED" as const,
    };
    await prisma.assessment.upsert({ where: { slug: `${s.slug}-exam` }, create: { slug: `${s.slug}-exam`, ...data }, update: data });
  }
  const withQuestions = async (slugs: string[]) =>
    (await prisma.topic.findMany({ where: { slug: { in: slugs }, questions: { some: {} } }, select: { slug: true } })).map((t) => t.slug);
  const backendSlugs = curriculum.find((s) => s.slug === "backend")!.modules.flatMap((m) => m.topics.map(([slug]) => slug));
  const dsaSlugs = curriculum.find((s) => s.slug === "programming-core")!.modules.find((m) => m.slug === "dsa")!.topics.map(([slug]) => slug);
  const foundationSlugs = curriculum.find((s) => s.slug === "foundations")!.modules.flatMap((m) => m.topics.map(([slug]) => slug));
  const mocks = [
    { slug: "backend-developer-assessment", title: "Backend Developer Assessment", description: "Company-style test: DSA, HTTP, databases, security and backend architecture.", topicSlugs: await withQuestions([...backendSlugs, ...dsaSlugs]), durationMinutes: 60, questionCount: 40, passingScore: 65 },
    { slug: "campus-online-assessment", title: "Campus Online Assessment", description: "Placement-style OA mixing DSA patterns and CS/web fundamentals.", topicSlugs: await withQuestions([...dsaSlugs, ...foundationSlugs]), durationMinutes: 45, questionCount: 30, passingScore: 60 },
  ];
  for (const m of mocks) {
    if (!m.topicSlugs.length) continue;
    const data = { ...m, kind: "MOCK_TEST" as const, tabSwitchLimit: 2, violationPolicy: "AUTO_SUBMIT" as const, blockClipboard: true, requireFullscreen: true, status: "PUBLISHED" as const };
    await prisma.assessment.upsert({ where: { slug: m.slug }, create: data, update: data });
  }

  // Platform settings.
  const flagDefaults: Record<string, boolean> = { AI_TUTOR: true, PROMPT_LIBRARY: true, PRACTICE_10: true, PLACEMENT_TEST: true, AI_INTERVIEW: true, MOCK_INTERVIEW: false, PEER_INTERVIEW: false };
  for (const [key, description] of Object.entries(KNOWN_FLAGS)) {
    await prisma.featureFlag.upsert({ where: { key }, create: { key, description, enabled: flagDefaults[key] ?? false }, update: { description } });
  }
  if (!(await prisma.scoringConfig.findFirst())) {
    await prisma.scoringConfig.create({ data: { version: 1, config: DEFAULT_SCORING, active: true, note: "Defaults from PRD" } });
  }

  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  if (email && password) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: { email, name: "Super Admin", role: "SUPER_ADMIN", passwordHash: await bcrypt.hash(password, 12), profile: { create: { onboardedAt: new Date(), startLanguage: "JAVASCRIPT", goalRole: "FULLSTACK" } } },
      });
      console.log(`Created super admin ${email}`);
    }
  }

  const counts = {
    topics: await prisma.topic.count(),
    published: await prisma.topic.count({ where: { status: "PUBLISHED" } }),
    comingSoon: await prisma.topic.count({ where: { status: "COMING_SOON" } }),
    questions: await prisma.question.count(),
    buildTasks: await prisma.buildTask.count(),
    prompts: await prisma.promptCard.count(),
    interview: await prisma.interviewQuestion.count(),
    projects: await prisma.project.count(),
    assessments: await prisma.assessment.count(),
  };
  console.log(`Seeded ${newlySeeded.length} topics (${skipped} already published, left untouched).`, counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
