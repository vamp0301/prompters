/* Generic CRUD over Prisma delegates needs loose typing in one place. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router, type Request } from "express";
import { z, type ZodTypeAny } from "zod";
import type { Prisma, Role } from "@prisma/client";
import { executeCode } from "../../jobs/queues.js";
import { prisma } from "../../lib/prisma.js";
import { currentUser, requireRole } from "../../middleware/auth.js";
import { buildHarness, parseHarnessResult, type TestCase } from "../../sandbox/harness.js";
import { badRequest, notFound } from "../../utils/errors.js";
import { handler, pageParams, param, parse } from "../../utils/http.js";
import { audit } from "../platform/audit.js";
import { INTERVIEW_CATEGORIES } from "../interview/interview.routes.js";

const status = z.enum(["DRAFT", "REVIEW", "PUBLISHED", "COMING_SOON", "ARCHIVED"]);
const slug = z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const QUESTION_TYPES = ["MCQ", "MULTI", "PREDICT_OUTPUT", "SPOT_BUG", "FILL_CODE", "SCENARIO", "ORDER_STEPS", "EXPLAIN"] as const;

export const questionSchema = z
  .object({
    topicId: z.string(),
    type: z.enum(QUESTION_TYPES),
    difficulty: z.number().int().min(1).max(3).default(1),
    prompt: z.string().trim().min(5).max(4000),
    code: z.string().max(8000).nullable().optional(),
    codeLanguage: z.enum(["javascript", "python"]).nullable().optional(),
    options: z.array(z.string().min(1).max(1000)).max(10).nullable().optional(),
    correct: z.array(z.number().int().min(0)).max(10).nullable().optional(),
    keywords: z.array(z.string().min(1).max(80)).max(15).default([]),
    explanation: z.string().trim().min(5).max(4000),
    tags: z.array(z.string().max(40)).max(10).default([]),
    points: z.number().int().min(1).max(10).default(1),
    status: status.default("PUBLISHED"),
  })
  .superRefine((q, ctx) => {
    const n = q.options?.length ?? 0;
    if (q.type === "EXPLAIN") {
      if (q.keywords.length < 2) ctx.addIssue({ code: "custom", path: ["keywords"], message: "Explain questions need at least 2 keywords." });
      return;
    }
    if (n < 2) ctx.addIssue({ code: "custom", path: ["options"], message: "Add at least 2 options." });
    if (q.type === "ORDER_STEPS") return;
    const c = q.correct ?? [];
    if (c.length === 0) ctx.addIssue({ code: "custom", path: ["correct"], message: "Mark the correct option." });
    if (c.some((i) => i >= n)) ctx.addIssue({ code: "custom", path: ["correct"], message: "Correct index is out of range." });
    if (q.type !== "MULTI" && c.length > 1) ctx.addIssue({ code: "custom", path: ["correct"], message: "Only MULTI questions can have several correct options." });
  });

const testCase = z.object({ name: z.string().min(1).max(120), args: z.array(z.unknown()), expected: z.unknown(), hidden: z.boolean().optional() });
const explainQ = z.object({ question: z.string().min(5).max(500), keywords: z.array(z.string().min(1).max(80)).min(1).max(10) });

const buildTaskSchema = z.object({
  slug,
  topicId: z.string().nullable().optional(),
  title: z.string().trim().min(3).max(160),
  description: z.string().min(10).max(10000),
  functionName: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
  starterJs: z.string().max(10000),
  starterPython: z.string().max(10000),
  tests: z.array(testCase).min(1).max(50),
  hints: z.array(z.string().min(1).max(3000)).length(3),
  explainQuestions: z.array(explainQ).min(1).max(6),
  difficulty: z.number().int().min(1).max(3).default(1),
  estMinutes: z.number().int().min(1).max(600).default(20),
  status: status.default("DRAFT"),
});

const projectSchema = z.object({
  slug,
  rung: z.number().int().min(1).max(100),
  title: z.string().trim().min(3).max(160),
  description: z.string().min(10).max(10000),
  skills: z.array(z.string().max(60)).max(20).default([]),
  technologies: z.array(z.string().max(60)).max(20).default([]),
  requirements: z.array(z.string().min(1).max(500)).max(30),
  milestones: z.array(z.object({ title: z.string().min(1).max(160), description: z.string().max(2000) })).min(1).max(20),
  explainQuestions: z.array(explainQ).min(1).max(8),
  hints: z.array(z.string().min(1).max(3000)).max(3).default([]),
  stageSlug: z.string().nullable().optional(),
  difficulty: z.number().int().min(1).max(3).default(1),
  status: status.default("DRAFT"),
});

const promptSchema = z.object({
  slug,
  topicId: z.string(),
  title: z.string().trim().min(3).max(160),
  category: z.enum(["LEARNING", "DEBUGGING", "CODE_REVIEW", "TESTING", "SECURITY", "SQL", "OPTIMIZATION", "DOCKER", "CICD", "SYSTEM_DESIGN", "RESUME", "INTERVIEW", "PROJECT_PLANNING"]),
  task: z.string().min(5).max(1000),
  whenToUse: z.string().min(5).max(1000),
  template: z.string().min(10).max(10000),
  variables: z.array(z.object({ key: z.string().regex(/^[A-Z0-9_]+$/), label: z.string().max(120) })).max(20),
  whyItWorks: z.array(z.object({ part: z.string().max(300), why: z.string().max(1000) })).max(20),
  verifyChecklist: z.array(z.string().max(500)).min(1).max(20),
  sampleOutput: z.string().max(10000),
  status: status.default("DRAFT"),
});

const interviewSchema = z.object({
  topicId: z.string().nullable().optional(),
  category: z.enum(INTERVIEW_CATEGORIES),
  question: z.string().trim().min(5).max(1000),
  short: z.string().min(5).max(2000),
  deep: z.string().min(5).max(10000),
  followUps: z.array(z.string().max(500)).max(10).default([]),
  commonMistake: z.string().max(2000).default(""),
  keywords: z.array(z.string().max(80)).max(15).default([]),
  difficulty: z.number().int().min(1).max(3).default(1),
  roles: z.array(z.enum(["BACKEND", "FRONTEND", "FULLSTACK", "DEVOPS", "SDE", "AI"])).default([]),
  status: status.default("PUBLISHED"),
});

const assessmentSchema = z.object({
  slug,
  title: z.string().trim().min(3).max(160),
  description: z.string().max(2000).nullable().optional(),
  kind: z.enum(["STAGE_EXAM", "MOCK_TEST", "PLACEMENT", "PRACTICE"]),
  stageId: z.string().nullable().optional(),
  topicSlugs: z.array(z.string()).max(200).default([]),
  durationMinutes: z.number().int().min(1).max(300),
  questionCount: z.number().int().min(1).max(200),
  passingScore: z.number().int().min(0).max(100),
  maxAttempts: z.number().int().min(1).max(100).nullable().optional(),
  tabSwitchLimit: z.number().int().min(0).max(50),
  violationPolicy: z.enum(["LOG", "FLAG", "AUTO_SUBMIT"]),
  blockClipboard: z.boolean(),
  requireFullscreen: z.boolean(),
  status: status.default("DRAFT"),
});

interface CrudConfig {
  path: string;
  entity: string;
  delegate: any;
  schema: ZodTypeAny;
  partial: ZodTypeAny;
  search: string[];
  write: Role;
  include?: object;
  orderBy?: object;
  filters?: (req: Request) => object;
}

/** Standard list / get / create / update / archive endpoints with audit logging. */
function crud(r: Router, c: CrudConfig) {
  const read = requireRole("AUTHOR");
  const write = requireRole(c.write);

  r.get(`/${c.path}`, read, handler(async (req) => {
    const { skip, take, page, pageSize } = pageParams(req.query, 25);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const where: any = { ...(c.filters?.(req) ?? {}) };
    if (q) where.OR = c.search.map((f) => ({ [f]: { contains: q, mode: "insensitive" } }));
    if (typeof req.query.status === "string" && req.query.status) where.status = req.query.status;
    const [items, total] = await Promise.all([
      c.delegate.findMany({ where, skip, take, include: c.include, orderBy: c.orderBy ?? { createdAt: "desc" } }),
      c.delegate.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }));

  r.get(`/${c.path}/:id`, read, handler(async (req) => {
    const row = await c.delegate.findUnique({ where: { id: param(req, "id") }, include: c.include });
    if (!row) throw notFound(c.entity);
    return row;
  }));

  r.post(`/${c.path}`, write, handler(async (req, res) => {
    const row = await c.delegate.create({ data: parse(c.schema, req.body) });
    await audit(currentUser(req).id, `CREATED_${c.entity.toUpperCase()}`, c.entity, row.id, undefined, row);
    res.status(201);
    return row;
  }));

  r.patch(`/${c.path}/:id`, write, handler(async (req) => {
    const before = await c.delegate.findUnique({ where: { id: param(req, "id") } });
    if (!before) throw notFound(c.entity);
    const data = parse(c.partial, req.body);
    // Re-validate the merged record so partial edits can't break invariants.
    parse(c.schema, { ...before, ...data });
    const row = await c.delegate.update({ where: { id: before.id }, data });
    await audit(currentUser(req).id, `UPDATED_${c.entity.toUpperCase()}`, c.entity, row.id, before, row);
    return row;
  }));

  r.post(`/${c.path}/:id/archive`, write, handler(async (req) => {
    const before = await c.delegate.findUnique({ where: { id: param(req, "id") } });
    if (!before) throw notFound(c.entity);
    const row = await c.delegate.update({ where: { id: before.id }, data: { status: "ARCHIVED" } });
    await audit(currentUser(req).id, `ARCHIVED_${c.entity.toUpperCase()}`, c.entity, row.id, { status: before.status }, { status: "ARCHIVED" });
    return row;
  }));
}

// ───────────────────────── CSV ─────────────────────────

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (header: string[], rows: unknown[][]) => [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");

const QUESTION_COLUMNS = ["topicSlug", "type", "difficulty", "prompt", "code", "codeLanguage", "options", "correct", "keywords", "explanation", "tags"];
const list = (v: string) => v.split("|").map((x) => x.trim()).filter(Boolean);

export function contentRoutes() {
  const r = Router();

  crud(r, {
    path: "questions", entity: "Question", delegate: prisma.question, schema: questionSchema, partial: (questionSchema as any).innerType().partial(),
    search: ["prompt"], write: "AUTHOR", include: { topic: { select: { slug: true, title: true } } },
    filters: (req) => (typeof req.query.topicId === "string" && req.query.topicId ? { topicId: req.query.topicId } : {}),
  });
  crud(r, {
    path: "build-tasks", entity: "BuildTask", delegate: prisma.buildTask, schema: buildTaskSchema, partial: buildTaskSchema.partial(),
    search: ["title", "slug"], write: "AUTHOR", include: { topic: { select: { slug: true, title: true } }, _count: { select: { submissions: true } } },
  });
  crud(r, {
    path: "projects", entity: "Project", delegate: prisma.project, schema: projectSchema, partial: projectSchema.partial(),
    search: ["title", "slug"], write: "ADMIN", orderBy: { rung: "asc" }, include: { _count: { select: { submissions: true } } },
  });
  crud(r, {
    path: "prompts", entity: "PromptCard", delegate: prisma.promptCard, schema: promptSchema, partial: promptSchema.partial(),
    search: ["title", "task"], write: "AUTHOR", include: { topic: { select: { slug: true, title: true } }, _count: { select: { favorites: true, ratings: true } } },
  });
  crud(r, {
    path: "interviews", entity: "InterviewQuestion", delegate: prisma.interviewQuestion, schema: interviewSchema, partial: interviewSchema.partial(),
    search: ["question"], write: "AUTHOR", include: { topic: { select: { slug: true, title: true } } },
    filters: (req) => (typeof req.query.category === "string" && req.query.category ? { category: req.query.category } : {}),
  });
  crud(r, {
    path: "assessments", entity: "Assessment", delegate: prisma.assessment, schema: assessmentSchema, partial: assessmentSchema.partial(),
    search: ["title", "slug"], write: "ADMIN", include: { stage: { select: { slug: true, title: true } }, _count: { select: { attempts: true } } },
  });

  // Bump the prompt version whenever its template changes.
  r.post("/prompts/:id/new-version", requireRole("AUTHOR"), handler(async (req) => {
    const before = await prisma.promptCard.findUnique({ where: { id: param(req, "id") } });
    if (!before) throw notFound("Prompt");
    const row = await prisma.promptCard.update({ where: { id: before.id }, data: { version: { increment: 1 } } });
    await audit(currentUser(req).id, "VERSIONED_PROMPTCARD", "PromptCard", row.id, { version: before.version }, { version: row.version });
    return row;
  }));

  /** Checks a build task's tests against a reference solution before publishing. */
  r.post("/build-tasks/:id/validate", requireRole("AUTHOR"), handler(async (req) => {
    const task = await prisma.buildTask.findUnique({ where: { id: param(req, "id") } });
    if (!task) throw notFound("Build task");
    const body = parse(z.object({ language: z.enum(["javascript", "python"]), code: z.string().max(65536) }), req.body);
    const tests = task.tests as unknown as TestCase[];
    const { program, nonce } = buildHarness(body.language, body.code, task.functionName, tests);
    const raw = await executeCode({ language: body.language, code: program, env: { PROMPTERS_NONCE: nonce } });
    const result = parseHarnessResult(raw, nonce, tests);
    return { allPassed: result.outcomes.every((o) => o.passed), outcomes: result.outcomes, stderr: result.stderr };
  }));

  // ─────────── Bulk questions (CSV) ───────────
  r.get("/questions-export.csv", requireRole("AUTHOR"), async (req, res, next) => {
    try {
      const rows = await prisma.question.findMany({ where: { status: { not: "ARCHIVED" } }, include: { topic: { select: { slug: true } } }, orderBy: { createdAt: "asc" } });
      const csv = toCsv(QUESTION_COLUMNS, rows.map((q) => [
        q.topic.slug, q.type, q.difficulty, q.prompt, q.code ?? "", q.codeLanguage ?? "",
        ((q.options as string[] | null) ?? []).join("|"), ((q.correct as number[] | null) ?? []).join("|"),
        q.keywords.join("|"), q.explanation, q.tags.join("|"),
      ]));
      res.setHeader("content-type", "text/csv; charset=utf-8");
      res.setHeader("content-disposition", 'attachment; filename="prompters-questions.csv"');
      res.send(csv);
    } catch (e) { next(e); }
  });

  /** Validates every row; with commit=true inserts all rows in one transaction or none. */
  r.post("/questions-import", requireRole("AUTHOR"), handler(async (req) => {
    const { csv, commit } = parse(z.object({ csv: z.string().min(1).max(5_000_000), commit: z.boolean().default(false) }), req.body);
    const rows = parseCsv(csv);
    const header = rows.shift()?.map((h) => h.trim()) ?? [];
    const missingCols = QUESTION_COLUMNS.filter((c) => !header.includes(c));
    if (missingCols.length) throw badRequest(`Missing columns: ${missingCols.join(", ")}`);
    const topics = new Map((await prisma.topic.findMany({ select: { id: true, slug: true } })).map((t) => [t.slug, t.id]));

    const valid: Prisma.QuestionCreateManyInput[] = [];
    const invalid: { row: number; errors: string[] }[] = [];
    const warnings: { row: number; message: string }[] = [];
    rows.forEach((cells, i) => {
      const rec = Object.fromEntries(header.map((h, j) => [h, (cells[j] ?? "").trim()]));
      const topicId = topics.get(rec.topicSlug);
      if (!topicId) return invalid.push({ row: i + 2, errors: [`Unknown topic "${rec.topicSlug}"`] });
      const parsed = questionSchema.safeParse({
        topicId,
        type: rec.type,
        difficulty: Number(rec.difficulty) || 1,
        prompt: rec.prompt,
        code: rec.code || null,
        codeLanguage: rec.codeLanguage || null,
        options: rec.options ? list(rec.options) : null,
        correct: rec.correct ? list(rec.correct).map(Number) : null,
        keywords: list(rec.keywords),
        explanation: rec.explanation,
        tags: list(rec.tags),
      });
      if (!parsed.success) return invalid.push({ row: i + 2, errors: parsed.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`) });
      if (!parsed.data.explanation.includes(" ")) warnings.push({ row: i + 2, message: "Very short explanation" });
      valid.push(parsed.data as Prisma.QuestionCreateManyInput);
    });

    let inserted = 0;
    if (commit) {
      if (invalid.length) throw badRequest("Fix invalid rows before importing. Nothing was imported.", { invalid });
      inserted = (await prisma.$transaction(async (tx) => tx.question.createMany({ data: valid }))).count;
      await audit(currentUser(req).id, "BULK_IMPORTED_QUESTIONS", "Question", null, undefined, { count: inserted });
    }
    return { valid: valid.length, invalid, warnings, committed: commit, inserted };
  }));

  return r;
}
