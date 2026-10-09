import type { TargetRoleProfile } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { badRequest, conflict, notFound } from "../../utils/errors.js";
import { logEvent } from "../platform/events.js";
import { EXPERIENCE_BANDS, type ExperienceBand } from "../prep/ladder.js";
import { roleDef, taxonomy } from "./taxonomy.js";

/**
 * Target-role profiles: one per career a user is preparing for. Every query is scoped to the
 * authenticated user; profiles of other users are indistinguishable from missing ones (404).
 */

export const MAX_ACTIVE_PROFILES = 5;
/** Profile goalRole (older onboarding) → role key. */
export const LEGACY_GOAL_ROLE: Record<string, string> = { BACKEND: "backend", FRONTEND: "frontend", FULLSTACK: "fullstack", DEVOPS: "devops", SDE: "sde", AI: "ml_engineer" };
/** Older onboarding's coding level → experience band (a fair default; the user can change it). */
const LEVEL_FROM_CODING: Record<string, ExperienceBand> = { ZERO: "STUDENT", BEGINNER: "STUDENT", INTERMEDIATE: "JUNIOR", ADVANCED: "MID" };

export interface ProfileInput {
  roleKey: string;
  level?: ExperienceBand;
  jobId?: string | null;
  timeline?: Date | null;
  primary?: boolean;
}

function view(p: TargetRoleProfile & { job?: { id: string; title: string; company: string | null } | null }) {
  const r = roleDef(p.roleKey);
  return {
    id: p.id,
    roleKey: p.roleKey,
    role: r ? { key: r.key, name: r.name, family: r.family, familyName: r.familyName, code: r.code, reviewed: r.reviewed } : null,
    level: p.level,
    job: p.job ? { id: p.job.id, title: p.job.title, company: p.job.company } : null,
    timeline: p.timeline,
    primary: p.primary,
    status: p.status,
    taxonomyVersion: p.taxonomyVersion,
    createdAt: p.createdAt,
  };
}
export type ProfileView = ReturnType<typeof view>;

const include = { job: { select: { id: true, title: true, company: true } } } as const;

async function ownedJob(userId: string, jobId: string | null | undefined) {
  if (!jobId) return null;
  const job = await prisma.jobTarget.findFirst({ where: { id: jobId, userId }, select: { id: true } });
  if (!job) throw notFound("Job description");
  return job.id;
}

/** Users onboarded before role profiles get one from their old goal role, once. */
async function ensureLegacyProfile(userId: string) {
  if (await prisma.targetRoleProfile.count({ where: { userId } })) return;
  const profile = await prisma.userProfile.findUnique({ where: { userId }, select: { goalRole: true, codingLevel: true, targetDate: true } });
  const roleKey = profile?.goalRole ? LEGACY_GOAL_ROLE[profile.goalRole] : undefined;
  if (!roleKey || !roleDef(roleKey)) return;
  await prisma.targetRoleProfile
    .create({ data: { userId, roleKey, level: LEVEL_FROM_CODING[profile?.codingLevel ?? ""] ?? "STUDENT", timeline: profile?.targetDate ?? null, primary: true, taxonomyVersion: taxonomy().version } })
    .catch(() => undefined); // a concurrent request created it
}

export async function listProfiles(userId: string, opts: { includeArchived?: boolean } = {}) {
  await ensureLegacyProfile(userId);
  const rows = await prisma.targetRoleProfile.findMany({
    where: { userId, ...(opts.includeArchived ? {} : { status: "ACTIVE" }) },
    orderBy: [{ primary: "desc" }, { createdAt: "asc" }],
    include,
    take: 20,
  });
  return rows.map(view);
}

export async function primaryProfile(userId: string) {
  await ensureLegacyProfile(userId);
  const p = await prisma.targetRoleProfile.findFirst({ where: { userId, status: "ACTIVE" }, orderBy: [{ primary: "desc" }, { createdAt: "asc" }], include });
  return p ? view(p) : null;
}

export async function getProfile(userId: string, id: string) {
  const p = await prisma.targetRoleProfile.findFirst({ where: { id, userId }, include });
  if (!p) throw notFound("Target role");
  return p;
}

/** Adds a career (or reactivates an archived one). The first active profile is primary. */
export async function addProfile(userId: string, input: ProfileInput) {
  const role = roleDef(input.roleKey);
  if (!role || !role.active) throw badRequest("Unknown target role.");
  if (input.level && !EXPERIENCE_BANDS.includes(input.level)) throw badRequest("Unknown experience level.");
  const jobId = await ownedJob(userId, input.jobId);
  await ensureLegacyProfile(userId);
  const existing = await prisma.targetRoleProfile.findUnique({ where: { userId_roleKey: { userId, roleKey: role.key } } });
  if (existing?.status === "ACTIVE") throw conflict(`You're already preparing for ${role.name}.`);
  const active = await prisma.targetRoleProfile.count({ where: { userId, status: "ACTIVE" } });
  if (active >= MAX_ACTIVE_PROFILES) throw conflict(`You can prepare for up to ${MAX_ACTIVE_PROFILES} careers at once. Archive one first.`);
  const primary = input.primary || active === 0;
  const profile = await prisma.$transaction(async (tx) => {
    if (primary) await tx.targetRoleProfile.updateMany({ where: { userId, primary: true }, data: { primary: false } });
    const data = { level: input.level ?? "STUDENT", jobId, timeline: input.timeline ?? null, primary, status: "ACTIVE", taxonomyVersion: taxonomy().version };
    return existing
      ? tx.targetRoleProfile.update({ where: { id: existing.id }, data, include })
      : tx.targetRoleProfile.create({ data: { userId, roleKey: role.key, ...data }, include });
  });
  await logEvent(userId, "target_role_added", { meta: { roleKey: role.key, family: role.family, level: profile.level, primary } });
  return view(profile);
}

/**
 * "This is the career I'm preparing for now": adds it, or updates and re-activates the existing
 * profile for that role, and makes it primary. Used by onboarding.
 */
export async function chooseCareer(userId: string, input: Omit<ProfileInput, "primary">) {
  await ensureLegacyProfile(userId);
  const existing = await prisma.targetRoleProfile.findUnique({ where: { userId_roleKey: { userId, roleKey: input.roleKey } } });
  if (existing?.status !== "ACTIVE") return addProfile(userId, { ...input, primary: true });
  await prisma.targetRoleProfile.update({ where: { id: existing.id }, data: { level: input.level ?? existing.level, timeline: input.timeline ?? existing.timeline } });
  await setPrimary(userId, existing.id);
  return view(await getProfile(userId, existing.id));
}

export async function updateProfile(userId: string, id: string, patch: { level?: ExperienceBand; jobId?: string | null; timeline?: Date | null }) {
  const p = await getProfile(userId, id);
  if (patch.level && !EXPERIENCE_BANDS.includes(patch.level)) throw badRequest("Unknown experience level.");
  const jobId = patch.jobId === undefined ? undefined : await ownedJob(userId, patch.jobId);
  const updated = await prisma.targetRoleProfile.update({ where: { id: p.id }, data: { level: patch.level, jobId, timeline: patch.timeline }, include });
  return view(updated);
}

export async function setPrimary(userId: string, id: string) {
  const p = await getProfile(userId, id);
  if (p.status !== "ACTIVE") throw conflict("Reactivate this career before making it primary.");
  await prisma.$transaction([
    prisma.targetRoleProfile.updateMany({ where: { userId, primary: true }, data: { primary: false } }),
    prisma.targetRoleProfile.update({ where: { id: p.id }, data: { primary: true } }),
  ]);
  await logEvent(userId, "target_role_primary", { meta: { roleKey: p.roleKey } });
  return listProfiles(userId);
}

/** Archiving keeps its history (plans, interviews, evidence); another active career becomes primary. */
export async function archiveProfile(userId: string, id: string) {
  const p = await getProfile(userId, id);
  await prisma.$transaction(async (tx) => {
    await tx.targetRoleProfile.update({ where: { id: p.id }, data: { status: "ARCHIVED", primary: false } });
    await tx.recommendation.updateMany({ where: { userId, targetProfileId: p.id, status: "ACTIVE" }, data: { status: "EXPIRED" } });
    if (p.primary) {
      const next = await tx.targetRoleProfile.findFirst({ where: { userId, status: "ACTIVE" }, orderBy: { createdAt: "asc" } });
      if (next) await tx.targetRoleProfile.update({ where: { id: next.id }, data: { primary: true } });
    }
  });
  await logEvent(userId, "target_role_archived", { meta: { roleKey: p.roleKey } });
  return listProfiles(userId);
}
