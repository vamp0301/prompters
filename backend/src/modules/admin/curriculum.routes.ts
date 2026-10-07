import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { executeCode } from "../../jobs/queues.js";
import { prisma } from "../../lib/prisma.js";
import { currentUser, hasRole, requireRole } from "../../middleware/auth.js";
import { AppError, badRequest, conflict, forbidden, notFound } from "../../utils/errors.js";
import { handler, pageParams, param, parse } from "../../utils/http.js";
import { audit } from "../platform/audit.js";
import { buildSnapshot, completeness, completenessInclude, completenessOf, SECTION_ORDER, type TopicSnapshot } from "../learning/snapshot.js";

const status = z.enum(["DRAFT", "REVIEW", "PUBLISHED", "COMING_SOON", "ARCHIVED"]);
const slug = z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes.");
const l10n = z.object({ hinglish: z.string().max(20000).default(""), en: z.string().max(20000).default(""), hi: z.string().max(20000).optional() }).catchall(z.string().max(20000));

const stageSchema = z.object({
  slug,
  code: z.string().trim().min(1).max(8),
  title: z.string().trim().min(2).max(120),
  description: z.string().max(1000).default(""),
  track: z.enum(["COMMON", "PYTHON", "JAVASCRIPT"]).default("COMMON"),
  order: z.number().int().min(0).max(1000),
  estHours: z.number().int().min(0).max(2000).default(0),
  targetRoles: z.array(z.string()).default([]),
  icon: z.string().max(40).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  status: status.default("DRAFT"),
});
const moduleSchema = z.object({
  stageId: z.string(),
  slug,
  title: z.string().trim().min(2).max(120),
  description: z.string().max(1000).default(""),
  order: z.number().int().min(0).max(1000),
  difficulty: z.number().int().min(1).max(3).default(1),
  status: status.default("DRAFT"),
});
const topicSchema = z.object({
  moduleId: z.string(),
  slug,
  title: z.string().trim().min(2).max(160),
  order: z.number().int().min(0).max(1000),
  difficulty: z.number().int().min(1).max(3).default(1),
  estMinutes: z.number().int().min(1).max(600).default(15),
  objectives: z.array(z.string().max(300)).max(12).default([]),
  technicalDefinition: z.string().max(1000).nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  quizSize: z.number().int().min(3).max(30).default(5),
  prerequisites: z.array(z.string()).max(20).optional(),
});
const sectionsSchema = z.object({
  sections: z
    .array(
      z.object({
        type: z.enum(SECTION_ORDER),
        content: l10n,
        codeJs: z.string().max(20000).nullable().optional(),
        codePython: z.string().max(20000).nullable().optional(),
      }),
    )
    .max(SECTION_ORDER.length),
});
const vizSchema = z.object({
  kind: z.enum(["FLOW", "TIMELINE", "STACK", "QUEUE", "TREE", "GRAPH", "NETWORK", "REQUEST_RESPONSE", "CODE_EXECUTION", "CUSTOM_STEPS"]),
  title: z.string().trim().min(2).max(160),
  steps: z
    .array(z.object({ title: z.string().min(1).max(160), description: z.string().max(1000), highlight: z.string().max(80).optional(), durationMs: z.number().int().min(300).max(20000).optional() }))
    .min(2)
    .max(20),
});

async function setPrerequisites(tx: Prisma.TransactionClient, topicId: string, slugs: string[]) {
  const prereqs = await tx.topic.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
  const missing = slugs.filter((s) => !prereqs.some((p) => p.slug === s));
  if (missing.length) throw badRequest(`Unknown prerequisite topics: ${missing.join(", ")}`);
  if (prereqs.some((p) => p.id === topicId)) throw badRequest("A topic cannot be its own prerequisite.");
  await tx.topicPrerequisite.deleteMany({ where: { topicId } });
  await tx.topicPrerequisite.createMany({ data: prereqs.map((p) => ({ topicId, prerequisiteId: p.id })) });
}

/** Runs every code sample; broken samples block publishing (content-integrity rule). */
async function verifyCodeSamples(topicId: string) {
  const sections = await prisma.topicSection.findMany({ where: { topicId, OR: [{ codeJs: { not: null } }, { codePython: { not: null } }] } });
  const failures: { section: string; language: string; error: string }[] = [];
  for (const s of sections) {
    for (const [language, code] of [["javascript", s.codeJs], ["python", s.codePython]] as const) {
      if (!code) continue;
      const r = await executeCode({ language, code });
      if (r.exitCode !== 0 || r.timedOut) failures.push({ section: s.type, language, error: (r.timedOut ? "Timed out" : r.stderr).slice(0, 500) });
    }
  }
  return failures;
}

export async function publishTopic(actorId: string, actorRole: Parameters<typeof hasRole>[0], topicId: string, opts: { override?: boolean; note?: string }) {
  const before = await prisma.topic.findUniqueOrThrow({ where: { id: topicId } });
  const check = await completeness(topicId);
  const codeFailures = await verifyCodeSamples(topicId);
  if ((!check.publishable || codeFailures.length) && !opts.override) {
    throw new AppError(422, "NOT_PUBLISHABLE", "This topic is missing required content.", { missing: check.missingRequired, codeFailures });
  }
  if (opts.override && !hasRole(actorRole, "SUPER_ADMIN")) throw forbidden("Only a Super Admin can override publish validation.");
  const version = before.publishedVersion + 1;
  await prisma.$transaction(async (tx) => {
    const snapshot = await buildSnapshot(topicId, tx);
    await tx.topicVersion.create({ data: { topicId, version, snapshot: snapshot as unknown as Prisma.InputJsonValue, publishedById: actorId, note: opts.note } });
    await tx.topic.update({ where: { id: topicId }, data: { status: "PUBLISHED", publishedVersion: version } });
  });
  await audit(actorId, opts.override ? "PUBLISHED_TOPIC_OVERRIDE" : "PUBLISHED_TOPIC", "Topic", topicId, { version: before.publishedVersion }, { version, note: opts.note, missing: check.missingRequired });
  return { version, completeness: check, codeFailures };
}

export function curriculumRoutes() {
  const r = Router();
  const author = requireRole("AUTHOR");
  const admin = requireRole("ADMIN");

  // ─────────────── Stages ───────────────
  r.get("/stages", author, handler(async () =>
    prisma.stage.findMany({ orderBy: [{ order: "asc" }, { track: "asc" }], include: { _count: { select: { modules: true } } } })));

  r.post("/stages", admin, handler(async (req, res) => {
    const data = parse(stageSchema, req.body);
    const stage = await prisma.stage.create({ data });
    await audit(currentUser(req).id, "CREATED_STAGE", "Stage", stage.id, undefined, stage);
    res.status(201);
    return stage;
  }));

  r.patch("/stages/:id", admin, handler(async (req) => {
    const before = await prisma.stage.findUnique({ where: { id: param(req, "id") } });
    if (!before) throw notFound("Stage");
    const stage = await prisma.stage.update({ where: { id: before.id }, data: parse(stageSchema.partial(), req.body) });
    await audit(currentUser(req).id, "UPDATED_STAGE", "Stage", stage.id, before, stage);
    return stage;
  }));

  // ─────────────── Modules ───────────────
  r.get("/modules", author, handler(async (req) =>
    prisma.module.findMany({
      where: typeof req.query.stageId === "string" ? { stageId: req.query.stageId } : {},
      orderBy: [{ stage: { order: "asc" } }, { order: "asc" }],
      include: { stage: { select: { slug: true, title: true, code: true } }, _count: { select: { topics: true } } },
    })));

  r.post("/modules", admin, handler(async (req, res) => {
    const mod = await prisma.module.create({ data: parse(moduleSchema, req.body) });
    await audit(currentUser(req).id, "CREATED_MODULE", "Module", mod.id, undefined, mod);
    res.status(201);
    return mod;
  }));

  r.patch("/modules/:id", admin, handler(async (req) => {
    const before = await prisma.module.findUnique({ where: { id: param(req, "id") } });
    if (!before) throw notFound("Module");
    const mod = await prisma.module.update({ where: { id: before.id }, data: parse(moduleSchema.partial(), req.body) });
    await audit(currentUser(req).id, "UPDATED_MODULE", "Module", mod.id, before, mod);
    return mod;
  }));

  r.post("/modules/:id/duplicate", admin, handler(async (req, res) => {
    const src = await prisma.module.findUnique({ where: { id: param(req, "id") } });
    if (!src) throw notFound("Module");
    const copy = await prisma.module.create({
      data: { stageId: src.stageId, slug: `${src.slug}-copy-${Date.now().toString(36)}`, title: `${src.title} (copy)`, description: src.description, order: src.order + 1, difficulty: src.difficulty, status: "DRAFT" },
    });
    await audit(currentUser(req).id, "DUPLICATED_MODULE", "Module", copy.id, { from: src.id }, copy);
    res.status(201);
    return copy;
  }));

  /** Publishes every publishable topic in a module; reports the ones that were skipped. */
  r.post("/modules/:id/publish", admin, handler(async (req) => {
    const me = currentUser(req);
    const mod = await prisma.module.findUnique({ where: { id: param(req, "id") }, include: { topics: { where: { status: { in: ["DRAFT", "REVIEW"] } } } } });
    if (!mod) throw notFound("Module");
    const published: string[] = [];
    const skipped: { slug: string; missing: unknown }[] = [];
    for (const t of mod.topics) {
      try {
        await publishTopic(me.id, me.role, t.id, {});
        published.push(t.slug);
      } catch (e) {
        skipped.push({ slug: t.slug, missing: e instanceof AppError ? e.details : String(e) });
      }
    }
    await prisma.module.update({ where: { id: mod.id }, data: { status: "PUBLISHED" } });
    await audit(me.id, "PUBLISHED_MODULE", "Module", mod.id, undefined, { published, skipped });
    return { published, skipped };
  }));

  // ─────────────── Topics ───────────────
  r.get("/topics", author, handler(async (req) => {
    const { skip, take, page, pageSize } = pageParams(req.query, 25);
    const where: Prisma.TopicWhereInput = {};
    if (typeof req.query.q === "string" && req.query.q.trim()) {
      where.OR = [{ title: { contains: req.query.q.trim(), mode: "insensitive" } }, { slug: { contains: req.query.q.trim(), mode: "insensitive" } }];
    }
    if (typeof req.query.status === "string" && req.query.status) where.status = req.query.status as Prisma.EnumContentStatusFilter["equals"];
    if (typeof req.query.moduleId === "string" && req.query.moduleId) where.moduleId = req.query.moduleId;
    if (typeof req.query.stageId === "string" && req.query.stageId) where.module = { stageId: req.query.stageId };
    const [items, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        skip,
        take,
        orderBy: [{ module: { stage: { order: "asc" } } }, { module: { order: "asc" } }, { order: "asc" }],
        include: { ...completenessInclude, module: { select: { title: true, stage: { select: { code: true, title: true } } } } },
      }),
      prisma.topic.count({ where }),
    ]);
    return {
      items: items.map((t) => {
        const c = completenessOf(t);
        return {
          id: t.id, slug: t.slug, title: t.title, status: t.status, publishedVersion: t.publishedVersion, updatedAt: t.updatedAt,
          module: t.module, completeness: c.percent, missing: c.missingRequired,
          counts: t._count,
        };
      }),
      total, page, pageSize,
    };
  }));

  r.get("/topics/:id", author, handler(async (req) => {
    const topic = await prisma.topic.findUnique({
      where: { id: param(req, "id") },
      include: {
        sections: { orderBy: { order: "asc" } },
        visualization: true,
        module: { include: { stage: true } },
        prerequisites: { include: { prerequisite: { select: { slug: true, title: true } } } },
        versions: { orderBy: { version: "desc" }, select: { version: true, createdAt: true, publishedById: true, note: true } },
        questions: { orderBy: { createdAt: "asc" } },
        buildTasks: { select: { id: true, slug: true, title: true, status: true } },
        promptCards: { select: { id: true, slug: true, title: true, status: true } },
        interviewQs: { select: { id: true, question: true, status: true } },
      },
    });
    if (!topic) throw notFound("Topic");
    const publishers = await prisma.user.findMany({
      where: { id: { in: topic.versions.map((v) => v.publishedById).filter((x): x is string => !!x) } },
      select: { id: true, name: true, email: true },
    });
    return {
      ...topic,
      versions: topic.versions.map((v) => ({ ...v, publishedBy: publishers.find((p) => p.id === v.publishedById) ?? null })),
      completeness: await completeness(topic.id),
    };
  }));

  r.post("/topics", author, handler(async (req, res) => {
    const { prerequisites, ...data } = parse(topicSchema, req.body);
    const topic = await prisma.$transaction(async (tx) => {
      const t = await tx.topic.create({ data: { ...data, status: "DRAFT" } });
      if (prerequisites) await setPrerequisites(tx, t.id, prerequisites);
      return t;
    });
    await audit(currentUser(req).id, "CREATED_TOPIC", "Topic", topic.id, undefined, topic);
    res.status(201);
    return topic;
  }));

  r.patch("/topics/:id", author, handler(async (req) => {
    const before = await prisma.topic.findUnique({ where: { id: param(req, "id") } });
    if (!before) throw notFound("Topic");
    const { prerequisites, ...data } = parse(topicSchema.partial(), req.body);
    const topic = await prisma.$transaction(async (tx) => {
      const t = await tx.topic.update({ where: { id: before.id }, data });
      if (prerequisites) await setPrerequisites(tx, t.id, prerequisites);
      return t;
    });
    await audit(currentUser(req).id, "UPDATED_TOPIC", "Topic", topic.id, before, { ...topic, prerequisites });
    return topic;
  }));

  r.put("/topics/:id/sections", author, handler(async (req) => {
    const topicId = param(req, "id");
    const { sections } = parse(sectionsSchema, req.body);
    const before = await prisma.topicSection.findMany({ where: { topicId } });
    await prisma.$transaction(
      sections.map((s) =>
        prisma.topicSection.upsert({
          where: { topicId_type: { topicId, type: s.type } },
          create: { topicId, type: s.type, order: SECTION_ORDER.indexOf(s.type), content: s.content, codeJs: s.codeJs ?? null, codePython: s.codePython ?? null },
          update: { content: s.content, codeJs: s.codeJs ?? null, codePython: s.codePython ?? null },
        }),
      ),
    );
    await prisma.topic.update({ where: { id: topicId }, data: { updatedAt: new Date() } });
    await audit(currentUser(req).id, "UPDATED_TOPIC_SECTIONS", "Topic", topicId, before, sections);
    return { saved: sections.length, completeness: await completeness(topicId) };
  }));

  r.put("/topics/:id/visualization", author, handler(async (req) => {
    const topicId = param(req, "id");
    const before = await prisma.visualization.findUnique({ where: { topicId } });
    if (req.body === null || req.body?.remove === true) {
      if (before) await prisma.visualization.delete({ where: { topicId } });
      await audit(currentUser(req).id, "REMOVED_VISUALIZATION", "Topic", topicId, before);
      return null;
    }
    const data = parse(vizSchema, req.body);
    const viz = await prisma.visualization.upsert({ where: { topicId }, create: { topicId, ...data }, update: data });
    await audit(currentUser(req).id, "UPDATED_VISUALIZATION", "Topic", topicId, before, viz);
    return viz;
  }));

  r.get("/topics/:id/completeness", author, handler(async (req) => completeness(param(req, "id"))));

  /** "View as student" — renders the working copy before it is published. */
  r.get("/topics/:id/preview", author, handler(async (req) => buildSnapshot(param(req, "id"))));

  r.post("/topics/:id/status", author, handler(async (req) => {
    const { status: next } = parse(z.object({ status: z.enum(["DRAFT", "REVIEW"]) }), req.body);
    const before = await prisma.topic.findUnique({ where: { id: param(req, "id") } });
    if (!before) throw notFound("Topic");
    if (before.status === "PUBLISHED") throw conflict("This topic is live. Edit its content and publish again to create a new version, or unpublish it first.");
    const topic = await prisma.topic.update({ where: { id: before.id }, data: { status: next } });
    await audit(currentUser(req).id, `MOVED_TO_${next}`, "Topic", topic.id, { status: before.status }, { status: topic.status });
    return topic;
  }));

  r.post("/topics/:id/publish", admin, handler(async (req) => {
    const me = currentUser(req);
    const body = parse(z.object({ override: z.boolean().optional(), note: z.string().max(300).optional() }), req.body ?? {});
    return publishTopic(me.id, me.role, param(req, "id"), body);
  }));

  r.post("/topics/:id/unpublish", admin, handler(async (req) => {
    const before = await prisma.topic.findUnique({ where: { id: param(req, "id") } });
    if (!before) throw notFound("Topic");
    // Stays on the roadmap as "coming soon"; learner history is untouched.
    const topic = await prisma.topic.update({ where: { id: before.id }, data: { status: "COMING_SOON" } });
    await audit(currentUser(req).id, "UNPUBLISHED_TOPIC", "Topic", topic.id, { status: before.status }, { status: topic.status });
    return topic;
  }));

  r.post("/topics/:id/archive", admin, handler(async (req) => {
    const before = await prisma.topic.findUnique({ where: { id: param(req, "id") } });
    if (!before) throw notFound("Topic");
    const topic = await prisma.topic.update({ where: { id: before.id }, data: { status: "ARCHIVED" } });
    await audit(currentUser(req).id, "ARCHIVED_TOPIC", "Topic", topic.id, { status: before.status }, { status: topic.status });
    return topic;
  }));

  r.post("/topics/:id/duplicate", author, handler(async (req, res) => {
    const src = await prisma.topic.findUnique({ where: { id: param(req, "id") }, include: { sections: true, visualization: true, prerequisites: true } });
    if (!src) throw notFound("Topic");
    const copy = await prisma.topic.create({
      data: {
        moduleId: src.moduleId,
        slug: `${src.slug}-copy-${Date.now().toString(36)}`,
        title: `${src.title} (copy)`,
        order: src.order + 1,
        difficulty: src.difficulty,
        estMinutes: src.estMinutes,
        objectives: src.objectives,
        technicalDefinition: src.technicalDefinition,
        tags: src.tags,
        quizSize: src.quizSize,
        status: "DRAFT",
        sections: { create: src.sections.map(({ type, order, content, codeJs, codePython }) => ({ type, order, content: content as Prisma.InputJsonValue, codeJs, codePython })) },
        visualization: src.visualization ? { create: { kind: src.visualization.kind, title: src.visualization.title, steps: src.visualization.steps as Prisma.InputJsonValue } } : undefined,
        prerequisites: { create: src.prerequisites.map((p) => ({ prerequisiteId: p.prerequisiteId })) },
      },
    });
    await audit(currentUser(req).id, "DUPLICATED_TOPIC", "Topic", copy.id, { from: src.id }, { slug: copy.slug });
    res.status(201);
    return copy;
  }));

  r.get("/topics/:id/versions/:version", author, handler(async (req) => {
    const v = await prisma.topicVersion.findUnique({ where: { topicId_version: { topicId: param(req, "id"), version: Number(param(req, "version")) } } });
    if (!v) throw notFound("Version");
    return v;
  }));

  /** Copies an old published version back into the working copy (publish again to make it live). */
  r.post("/topics/:id/versions/:version/restore", admin, handler(async (req) => {
    const topicId = param(req, "id");
    const v = await prisma.topicVersion.findUnique({ where: { topicId_version: { topicId, version: Number(param(req, "version")) } } });
    if (!v) throw notFound("Version");
    const s = v.snapshot as unknown as TopicSnapshot;
    await prisma.$transaction(async (tx) => {
      await tx.topic.update({
        where: { id: topicId },
        data: { title: s.title, difficulty: s.difficulty, estMinutes: s.estMinutes, objectives: s.objectives, technicalDefinition: s.technicalDefinition },
      });
      await tx.topicSection.deleteMany({ where: { topicId } });
      await tx.topicSection.createMany({
        data: s.sections.map((sec) => ({ topicId, type: sec.type, order: sec.order, content: sec.content, codeJs: sec.codeJs, codePython: sec.codePython })),
      });
      await tx.visualization.deleteMany({ where: { topicId } });
      if (s.visualization) await tx.visualization.create({ data: { topicId, kind: s.visualization.kind, title: s.visualization.title, steps: s.visualization.steps as Prisma.InputJsonValue } });
      await setPrerequisites(tx, topicId, s.prerequisites.map((p) => p.slug));
    });
    await audit(currentUser(req).id, "RESTORED_TOPIC_VERSION", "Topic", topicId, undefined, { restoredVersion: v.version });
    return { restored: v.version };
  }));

  r.post("/topics/:id/verify-code", author, handler(async (req) => {
    const failures = await verifyCodeSamples(param(req, "id"));
    return { ok: failures.length === 0, failures };
  }));

  r.delete("/topics/:id", admin, handler(async () => {
    throw conflict("Topics are never hard-deleted (learner history depends on them). Archive instead.");
  }));

  return r;
}
