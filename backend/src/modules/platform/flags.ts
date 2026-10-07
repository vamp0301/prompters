import { createHash } from "node:crypto";
import { prisma } from "../../lib/prisma.js";

export const KNOWN_FLAGS: Record<string, string> = {
  AI_TUTOR: "AI tutor explanations on topic pages (never inside builds or tests)",
  PROMPT_LIBRARY: "Prompt library unlocked by mastery",
  MOCK_INTERVIEW: "AI mock interview rounds",
  PEER_INTERVIEW: "Peer mock interviews",
  PRACTICE_10: "Daily adaptive Practice 10 quiz",
  PLACEMENT_TEST: "Placement assessment during onboarding",
  AI_INTERVIEW: "Resume + JD analysis and the AI technical interview (Manisha)",
};

/** Deterministic per-user bucket so percentage rollouts are stable. */
function bucket(key: string, userId: string) {
  return parseInt(createHash("sha256").update(`${key}:${userId}`).digest("hex").slice(0, 8), 16) % 100;
}

export async function isEnabled(key: string, userId?: string) {
  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  if (!flag) return false;
  if (userId && flag.userIds.includes(userId)) return true;
  if (!flag.enabled) return false;
  if (flag.rolloutPercent >= 100) return true;
  return userId ? bucket(key, userId) < flag.rolloutPercent : false;
}

export async function flagsFor(userId: string) {
  const flags = await prisma.featureFlag.findMany();
  return Object.fromEntries(
    flags.map((f) => [
      f.key,
      f.userIds.includes(userId) || (f.enabled && (f.rolloutPercent >= 100 || bucket(f.key, userId) < f.rolloutPercent)),
    ]),
  );
}
