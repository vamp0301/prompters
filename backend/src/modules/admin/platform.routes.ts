import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { currentUser, requireRole } from "../../middleware/auth.js";
import { badRequest, notFound } from "../../utils/errors.js";
import { handler, pageParams, param, parse } from "../../utils/http.js";
import { audit } from "../platform/audit.js";
import { KNOWN_FLAGS } from "../platform/flags.js";
import { DEFAULT_SCORING, getScoring, invalidateScoring, scoringSchema } from "../platform/scoring.js";
import { toCsv } from "./content.routes.js";
import { translateText } from "../../ai/tutor.js";
import { SECTION_ORDER } from "../learning/snapshot.js";

export function platformRoutes() {
  const r = Router();
  const superAdmin = requireRole("SUPER_ADMIN");
  const admin = requireRole("ADMIN");

  // ─────────────── Users ───────────────
  r.get("/users", admin, handler(async (req) => {
    const { skip, take, page, pageSize } = pageParams(req.query, 25);
    const where: Prisma.UserWhereInput = {};
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q) where.OR = [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }];
    if (typeof req.query.role === "string" && req.query.role) where.role = req.query.role as Prisma.EnumRoleFilter["equals"];
    if (typeof req.query.status === "string" && req.query.status) where.status = req.query.status as Prisma.EnumUserStatusFilter["equals"];
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take, orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, role: true, status: true, createdAt: true, lastActiveAt: true,
          profile: { select: { startLanguage: true, goalRole: true } },
          readiness: { orderBy: { createdAt: "desc" }, take: 1, select: { score: true } },
          _count: { select: { masteries: { where: { masteredAt: { not: null } } } } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }));

  r.get("/users/export.csv", superAdmin, async (req, res, next) => {
    try {
      const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, lastActiveAt: true } });
      await audit(currentUser(req).id, "EXPORTED_USERS", "User", null, undefined, { count: users.length });
      res.setHeader("content-type", "text/csv; charset=utf-8");
      res.setHeader("content-disposition", 'attachment; filename="prompters-users.csv"');
      res.send(toCsv(["id", "name", "email", "role", "status", "createdAt", "lastActiveAt"], users.map((u) => [u.id, u.name, u.email, u.role, u.status, u.createdAt.toISOString(), u.lastActiveAt?.toISOString() ?? ""])));
    } catch (e) { next(e); }
  });

  r.get("/users/:id", admin, handler(async (req) => {
    const user = await prisma.user.findUnique({
      where: { id: param(req, "id") },
      select: {
        id: true, name: true, email: true, role: true, status: true, createdAt: true, lastActiveAt: true, googleId: true,
        profile: true,
        masteries: { include: { topic: { select: { slug: true, title: true } } }, orderBy: { updatedAt: "desc" } },
        quizAttempts: { orderBy: { startedAt: "desc" }, take: 30, select: { id: true, kind: true, score: true, passed: true, flagged: true, integrityScore: true, startedAt: true, topic: { select: { title: true } }, assessment: { select: { title: true } }, _count: { select: { integrityEvents: true } } } },
        submissions: { include: { buildTask: { select: { slug: true, title: true } } }, orderBy: { updatedAt: "desc" } },
        projectSubmissions: { include: { project: { select: { title: true } } } },
        readiness: { orderBy: { createdAt: "asc" }, select: { score: true, createdAt: true } },
        events: { orderBy: { createdAt: "desc" }, take: 50 },
        applications: true,
      },
    });
    if (!user) throw notFound("User");
    return { ...user, googleId: !!user.googleId };
  }));

  r.patch("/users/:id/role", superAdmin, handler(async (req) => {
    const me = currentUser(req);
    const { role } = parse(z.object({ role: z.enum(["STUDENT", "AUTHOR", "ADMIN", "SUPER_ADMIN"]) }), req.body);
    if (param(req, "id") === me.id) throw badRequest("You can't change your own role.");
    const before = await prisma.user.findUnique({ where: { id: param(req, "id") }, select: { id: true, role: true } });
    if (!before) throw notFound("User");
    const user = await prisma.user.update({ where: { id: before.id }, data: { role, tokenVersion: { increment: 1 } }, select: { id: true, role: true } });
    await audit(me.id, "CHANGED_ROLE", "User", user.id, before, user);
    return user;
  }));

  r.post("/users/:id/status", admin, handler(async (req) => {
    const me = currentUser(req);
    const { status } = parse(z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }), req.body);
    if (param(req, "id") === me.id) throw badRequest("You can't suspend yourself.");
    const before = await prisma.user.findUnique({ where: { id: param(req, "id") }, select: { id: true, status: true, role: true } });
    if (!before) throw notFound("User");
    if (before.role === "SUPER_ADMIN" && me.role !== "SUPER_ADMIN") throw badRequest("Only a Super Admin can suspend a Super Admin.");
    // Bumping tokenVersion signs the user out everywhere immediately.
    const user = await prisma.user.update({ where: { id: before.id }, data: { status, tokenVersion: { increment: 1 } }, select: { id: true, status: true } });
    await audit(me.id, status === "SUSPENDED" ? "SUSPENDED_USER" : "REACTIVATED_USER", "User", user.id, before, user);
    return user;
  }));

  r.post("/users/:id/revoke-sessions", admin, handler(async (req) => {
    const user = await prisma.user.update({ where: { id: param(req, "id") }, data: { tokenVersion: { increment: 1 } }, select: { id: true } });
    await audit(currentUser(req).id, "REVOKED_SESSIONS", "User", user.id);
    return { revoked: true };
  }));

  /** Resets one topic's mastery (e.g. after a confirmed integrity issue). Attempts history is kept. */
  r.post("/users/:id/reset-topic", superAdmin, handler(async (req) => {
    const { topicId, reason } = parse(z.object({ topicId: z.string(), reason: z.string().min(5).max(500) }), req.body);
    const before = await prisma.mastery.findUnique({ where: { userId_topicId: { userId: param(req, "id"), topicId } } });
    if (!before) throw notFound("Mastery");
    await prisma.mastery.delete({ where: { userId_topicId: { userId: before.userId, topicId } } });
    await audit(currentUser(req).id, "RESET_TOPIC_PROGRESS", "User", before.userId, before, { topicId, reason });
    return { reset: true };
  }));

  // ─────────────── Feature flags ───────────────
  r.get("/feature-flags", admin, handler(async () => {
    const rows = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
    const known = Object.entries(KNOWN_FLAGS).filter(([k]) => !rows.some((r2) => r2.key === k)).map(([key, description]) => ({ key, description, enabled: false, rolloutPercent: 100, userIds: [], updatedAt: null }));
    return [...rows, ...known];
  }));

  r.put("/feature-flags/:key", superAdmin, handler(async (req) => {
    const key = param(req, "key");
    if (!/^[A-Z0-9_]{2,60}$/.test(key)) throw badRequest("Flag keys use UPPER_SNAKE_CASE.");
    const data = parse(z.object({ description: z.string().max(300).optional(), enabled: z.boolean(), rolloutPercent: z.number().int().min(0).max(100).default(100), userIds: z.array(z.string()).max(1000).default([]) }), req.body);
    const before = await prisma.featureFlag.findUnique({ where: { key } });
    const flag = await prisma.featureFlag.upsert({
      where: { key },
      create: { key, description: data.description ?? KNOWN_FLAGS[key] ?? key, enabled: data.enabled, rolloutPercent: data.rolloutPercent, userIds: data.userIds },
      update: { ...data, description: data.description ?? before?.description },
    });
    await audit(currentUser(req).id, "UPDATED_FEATURE_FLAG", "FeatureFlag", key, before, flag);
    return flag;
  }));

  // ─────────────── Scoring ───────────────
  r.get("/scoring", admin, handler(async () => ({
    active: await getScoring(),
    defaults: DEFAULT_SCORING,
    versions: await prisma.scoringConfig.findMany({ orderBy: { version: "desc" }, take: 30 }),
  })));

  r.post("/scoring", superAdmin, handler(async (req, res) => {
    const { config, note } = parse(z.object({ config: scoringSchema, note: z.string().max(300).optional() }), req.body);
    const last = await prisma.scoringConfig.findFirst({ orderBy: { version: "desc" } });
    const before = await getScoring();
    const row = await prisma.$transaction(async (tx) => {
      await tx.scoringConfig.updateMany({ where: { active: true }, data: { active: false } });
      return tx.scoringConfig.create({ data: { version: (last?.version ?? 0) + 1, config, active: true, createdById: currentUser(req).id, note } });
    });
    invalidateScoring();
    await audit(currentUser(req).id, "UPDATED_SCORING", "ScoringConfig", row.id, before, config);
    res.status(201);
    return row;
  }));

  r.post("/scoring/:version/activate", superAdmin, handler(async (req) => {
    const version = Number(param(req, "version"));
    const target = await prisma.scoringConfig.findUnique({ where: { version } });
    if (!target) throw notFound("Scoring version");
    await prisma.$transaction([
      prisma.scoringConfig.updateMany({ where: { active: true }, data: { active: false } }),
      prisma.scoringConfig.update({ where: { version }, data: { active: true } }),
    ]);
    invalidateScoring();
    await audit(currentUser(req).id, "ACTIVATED_SCORING_VERSION", "ScoringConfig", target.id, undefined, { version });
    return { active: version };
  }));

  // ─────────────── Audit & integrity ───────────────
  r.get("/audit-logs", superAdmin, handler(async (req) => {
    const { skip, take, page, pageSize } = pageParams(req.query, 50);
    const where: Prisma.AdminAuditLogWhereInput = {};
    if (typeof req.query.entityType === "string" && req.query.entityType) where.entityType = req.query.entityType;
    if (typeof req.query.entityId === "string" && req.query.entityId) where.entityId = req.query.entityId;
    if (typeof req.query.action === "string" && req.query.action) where.action = { contains: req.query.action.toUpperCase() };
    const [items, total] = await Promise.all([
      prisma.adminAuditLog.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include: { actor: { select: { email: true, name: true } } } }),
      prisma.adminAuditLog.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }));

  r.get("/integrity", admin, handler(async (req) => {
    const { skip, take, page, pageSize } = pageParams(req.query, 25);
    const where: Prisma.QuizAttemptWhereInput = { OR: [{ flagged: true }, { integrityEvents: { some: {} } }] };
    const [items, total, byType] = await Promise.all([
      prisma.quizAttempt.findMany({
        where, skip, take, orderBy: { startedAt: "desc" },
        select: {
          id: true, kind: true, score: true, passed: true, flagged: true, integrityScore: true, startedAt: true, finishedAt: true,
          user: { select: { id: true, name: true, email: true } },
          assessment: { select: { title: true } },
          integrityEvents: { orderBy: { createdAt: "asc" }, select: { type: true, createdAt: true } },
        },
      }),
      prisma.quizAttempt.count({ where }),
      prisma.integrityEvent.groupBy({ by: ["type"], _count: true }),
    ]);
    return { items, total, page, pageSize, byType: byType.map((b) => ({ type: b.type, count: b._count })) };
  }));

  // ─────────────── Translations ───────────────
  r.get("/translations", requireRole("AUTHOR"), handler(async () => {
    const topics = await prisma.topic.findMany({
      where: { status: { not: "ARCHIVED" }, sections: { some: {} } },
      select: { id: true, slug: true, title: true, status: true, sections: { select: { type: true, content: true } } },
      orderBy: { title: "asc" },
    });
    const locales = ["hinglish", "en", "hi"];
    return topics.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      status: t.status,
      coverage: Object.fromEntries(locales.map((l) => [l, Math.round((t.sections.filter((s) => !!(s.content as Record<string, string>)[l]?.trim()).length / SECTION_ORDER.length) * 100)])),
    }));
  }));

  /** Drafts a translation with the configured AI provider; an author reviews it before saving. */
  r.post("/translations/draft", requireRole("AUTHOR"), handler(async (req) => {
    const { text, target } = parse(z.object({ text: z.string().min(1).max(20000), target: z.enum(["hinglish", "hi", "en"]) }), req.body);
    return { draft: await translateText(text, target) };
  }));

  return r;
}
