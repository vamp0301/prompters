import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { canonicalSkill } from "../prep/text.js";
import {
  CODE_ASSESSMENTS, COMMON_RUBRIC, COMPETENCIES, FAMILIES, FAMILY_PROFILES, ROLES, TAXONOMY_VERSION,
  type Area, type AssessmentType, type CompetencyKind, type FamilyKey, type RubricDim,
} from "./catalogue.js";

/**
 * The career taxonomy, as the rest of the app sees it. Source of truth: the database (CareerRole,
 * Competency, RoleCompetency, CompetencyPrerequisite). The built-in catalogue seeds it and is used
 * until the database has been loaded, so every lookup here is synchronous and always answers.
 */

export type Importance = "REQUIRED" | "PREFERRED" | "OPTIONAL";
export const IMPORTANCE_WEIGHT: Record<Importance, number> = { REQUIRED: 1, PREFERRED: 0.6, OPTIONAL: 0.3 };

export interface Competency {
  key: string;
  name: string;
  kind: CompetencyKind;
  description: string;
  assessments: AssessmentType[];
  code: boolean;
  aliases: string[];
  prereqs: string[];
}
export interface RoleCompetency extends Competency {
  importance: Importance;
  weight: number;
}
export interface Role {
  key: string;
  family: FamilyKey;
  familyName: string;
  name: string;
  description: string;
  aliases: string[];
  specializations: string[];
  /** Whether coding tasks may appear at all for this role. */
  code: boolean;
  areas: Area[];
  rubric: RubricDim[];
  assessments: AssessmentType[];
  domain: string | null;
  version: number;
  active: boolean;
  /** Reviewed by a practitioner of the profession. False for the built-in catalogue. */
  reviewed: boolean;
  competencies: RoleCompetency[];
}
export interface Taxonomy {
  version: number;
  source: "catalogue" | "database";
  roles: Map<string, Role>;
  competencies: Map<string, Competency>;
}

const keyOf = (name: string) => canonicalSkill(name) || name.toLowerCase();

function fromCatalogue(): Taxonomy {
  const competencies = new Map<string, Competency>();
  for (const [name, d] of Object.entries(COMPETENCIES)) {
    competencies.set(keyOf(name), { key: keyOf(name), name, kind: d.kind, description: d.description, assessments: d.assessments, code: !!d.code, aliases: d.aliases ?? [], prereqs: (d.prereqs ?? []).map(keyOf) });
  }
  const roles = new Map<string, Role>();
  for (const r of ROLES) {
    const fam = FAMILY_PROFILES[r.family];
    const code = r.code ?? fam.code;
    const seen = new Set<string>();
    const comps: RoleCompetency[] = [];
    for (const [list, importance] of [[r.required, "REQUIRED"], [r.preferred, "PREFERRED"], [r.optional ?? [], "OPTIONAL"]] as const) {
      for (const name of list) {
        const c = competencies.get(keyOf(name));
        if (!c) throw new Error(`Role ${r.key}: unknown competency "${name}"`);
        if (seen.has(c.key)) continue;
        seen.add(c.key);
        comps.push({ ...c, importance, weight: IMPORTANCE_WEIGHT[importance] });
      }
    }
    roles.set(r.key, {
      key: r.key, family: r.family, familyName: FAMILIES[r.family].name, name: r.name, description: r.description, aliases: r.aliases, specializations: r.specializations ?? [],
      code, areas: r.areas ?? fam.areas, rubric: [...COMMON_RUBRIC, ...fam.rubric],
      assessments: fam.assessments.filter((a) => code || !CODE_ASSESSMENTS.has(a)), domain: r.domain ?? null, version: TAXONOMY_VERSION, active: true, reviewed: false, competencies: comps,
    });
  }
  return { version: TAXONOMY_VERSION, source: "catalogue", roles, competencies };
}

let current: Taxonomy = fromCatalogue();
let loadedAt = 0;
const RELOAD_MS = 10 * 60_000;

/** Current taxonomy (database copy once loaded; the built-in catalogue before that). */
export const taxonomy = () => current;
export const builtInTaxonomy = fromCatalogue;

export function roleDef(key: string | null | undefined): Role | null {
  return key ? (current.roles.get(key) ?? null) : null;
}
export const isRoleKey = (key: string | null | undefined): key is string => !!roleDef(key)?.active;
export function competency(key: string) {
  return current.competencies.get(key) ?? null;
}

const aliasIndex = new WeakMap<Taxonomy, Map<string, Competency>>();
/** A competency by name, canonical key or any alias ("market segmentation" → Segmentation). */
export function findCompetency(name: string): Competency | null {
  const key = keyOf(name);
  const direct = current.competencies.get(key);
  if (direct) return direct;
  let index = aliasIndex.get(current);
  if (!index) {
    index = new Map();
    for (const c of current.competencies.values()) for (const a of c.aliases) index.set(keyOf(a), c);
    aliasIndex.set(current, index);
  }
  return index.get(key) ?? null;
}
export function listRoles(filter: { family?: FamilyKey; q?: string } = {}) {
  const q = filter.q?.trim().toLowerCase();
  return [...current.roles.values()]
    .filter((r) => r.active && (!filter.family || r.family === filter.family))
    .filter((r) => !q || [r.name, r.familyName, ...r.aliases, ...r.specializations].some((t) => t.toLowerCase().includes(q)))
    .sort((a, b) => (a.family === b.family ? a.name.localeCompare(b.name) : Object.keys(FAMILIES).indexOf(a.family) - Object.keys(FAMILIES).indexOf(b.family)));
}

// ───────────────────────── classification ─────────────────────────

const words = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9+#&/ ]+/g, " ").replace(/\s+/g, " ").trim()} `;

/**
 * Suggests roles for a free-text target ("APM at a fintech", "MBA marketing", "data analyst").
 * Deterministic: alias and name matches, longest first. `ambiguous` means the caller must ask —
 * nothing silently defaults to software engineering.
 */
export function classifyRole(text: string, limit = 5): { suggestions: { key: string; name: string; family: FamilyKey; score: number }[]; ambiguous: boolean } {
  const t = words(text);
  if (!t.trim()) return { suggestions: [], ambiguous: true };
  const scored = [...current.roles.values()].filter((r) => r.active).map((r) => {
    let score = 0;
    for (const term of [r.name, ...r.aliases]) {
      const w = words(term);
      if (t.includes(w)) score = Math.max(score, w.trim().length >= 4 ? 1 + w.trim().length / 40 : 0.6);
    }
    return { key: r.key, name: r.name, family: r.family, score: Math.round(score * 100) / 100 };
  });
  const suggestions = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  const [top, second] = suggestions;
  const ambiguous = !top || (!!second && second.score >= top.score * 0.92);
  return { suggestions, ambiguous };
}

// ───────────────────────── database ─────────────────────────

/** Writes the built-in catalogue to the database when it is newer (idempotent; never deletes). */
export async function syncTaxonomy() {
  const have = await prisma.careerRole.aggregate({ _min: { version: true }, _count: true });
  const builtIn = fromCatalogue();
  if (have._count >= builtIn.roles.size && (have._min.version ?? 0) >= TAXONOMY_VERSION) return { synced: false };
  await prisma.$transaction(async (tx) => {
    for (const c of builtIn.competencies.values()) {
      const data = { name: c.name, kind: c.kind, description: c.description, assessments: c.assessments, code: c.code, aliases: c.aliases, version: TAXONOMY_VERSION };
      await tx.competency.upsert({ where: { key: c.key }, create: { key: c.key, ...data }, update: data });
    }
    for (const c of builtIn.competencies.values())
      for (const p of c.prereqs) await tx.competencyPrerequisite.upsert({ where: { competencyKey_prerequisiteKey: { competencyKey: c.key, prerequisiteKey: p } }, create: { competencyKey: c.key, prerequisiteKey: p }, update: {} });
    for (const r of builtIn.roles.values()) {
      const data = { family: r.family, name: r.name, description: r.description, aliases: r.aliases, specializations: r.specializations, code: r.code, areas: r.areas as object[], rubric: r.rubric as object[], assessments: r.assessments, domain: r.domain, version: TAXONOMY_VERSION, reviewed: r.reviewed };
      await tx.careerRole.upsert({ where: { key: r.key }, create: { key: r.key, ...data }, update: data });
      for (const c of r.competencies)
        await tx.roleCompetency.upsert({ where: { roleKey_competencyKey: { roleKey: r.key, competencyKey: c.key } }, create: { roleKey: r.key, competencyKey: c.key, importance: c.importance, weight: c.weight }, update: { importance: c.importance, weight: c.weight } });
    }
  }, { timeout: 120_000 });
  logger.info({ version: TAXONOMY_VERSION, roles: builtIn.roles.size, competencies: builtIn.competencies.size }, "Career taxonomy synced to the database");
  return { synced: true };
}

/** Reads the database taxonomy into memory (falls back to the built-in catalogue if empty). */
export async function loadTaxonomy(): Promise<Taxonomy> {
  const [roles, comps, prereqs] = await Promise.all([
    prisma.careerRole.findMany({ include: { competencies: true } }),
    prisma.competency.findMany(),
    prisma.competencyPrerequisite.findMany(),
  ]);
  if (!roles.length) {
    current = fromCatalogue();
    loadedAt = Date.now();
    return current;
  }
  const competencies = new Map<string, Competency>();
  for (const c of comps)
    competencies.set(c.key, { key: c.key, name: c.name, kind: c.kind as CompetencyKind, description: c.description, assessments: c.assessments as AssessmentType[], code: c.code, aliases: c.aliases, prereqs: prereqs.filter((p) => p.competencyKey === c.key).map((p) => p.prerequisiteKey) });
  const map = new Map<string, Role>();
  for (const r of roles) {
    const family = (r.family in FAMILIES ? r.family : "other") as FamilyKey;
    const order: Importance[] = ["REQUIRED", "PREFERRED", "OPTIONAL"];
    const rc = r.competencies
      .map((x) => {
        const c = competencies.get(x.competencyKey);
        return c ? { ...c, importance: x.importance as Importance, weight: x.weight } : null;
      })
      .filter((x): x is RoleCompetency => !!x)
      .sort((a, b) => order.indexOf(a.importance) - order.indexOf(b.importance));
    map.set(r.key, {
      key: r.key, family, familyName: FAMILIES[family].name, name: r.name, description: r.description, aliases: r.aliases, specializations: r.specializations, code: r.code,
      areas: r.areas as unknown as Area[], rubric: r.rubric as unknown as RubricDim[], assessments: r.assessments as AssessmentType[], domain: r.domain, version: r.version, active: r.active, reviewed: r.reviewed, competencies: rc,
    });
  }
  current = { version: Math.max(...roles.map((r) => r.version)), source: "database", roles: map, competencies };
  loadedAt = Date.now();
  return current;
}

/** Startup: seed if needed, then load. Never blocks the app from starting. */
export async function initTaxonomy() {
  try {
    await syncTaxonomy();
    await loadTaxonomy();
  } catch (err) {
    logger.warn({ err }, "Career taxonomy: using the built-in catalogue (database unavailable)");
  }
  setInterval(() => void refreshTaxonomyIfStale(), RELOAD_MS).unref();
}

/** Re-reads the database copy at most every 10 minutes (admin edits appear without a restart). */
export async function refreshTaxonomyIfStale() {
  if (Date.now() - loadedAt < RELOAD_MS) return;
  await loadTaxonomy().catch((err) => logger.warn({ err }, "Career taxonomy reload failed"));
}
