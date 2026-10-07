import type { Mastery, MasteryStatus, StageTrack } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { getScoring } from "../platform/scoring.js";

export type TopicState = "COMING_SOON" | "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "MASTERED" | "NEEDS_REVIEW";

export interface PathTopic {
  id: string;
  slug: string;
  title: string;
  order: number;
  estMinutes: number;
  difficulty: number;
  hasContent: boolean;
  state: TopicState;
  missingPrerequisites: { slug: string; title: string }[];
  mastery: Pick<Mastery, "bestScore" | "status" | "nextReviewAt" | "masteredAt" | "recallScore"> | null;
}

export interface PathStage {
  id: string;
  slug: string;
  code: string;
  title: string;
  description: string;
  track: StageTrack;
  order: number;
  estHours: number;
  targetRoles: string[];
  unlocked: boolean;
  lockReason: string | null;
  passed: boolean;
  bestExamScore: number | null;
  examSlug: string | null;
  progress: { mastered: number; total: number; percent: number };
  modules: { id: string; slug: string; title: string; description: string; topics: PathTopic[] }[];
}

const MASTERED_STATES: MasteryStatus[] = ["MASTERED", "NEEDS_REVIEW"];

function loadStructure() {
  return prisma.stage.findMany({
    where: { status: { in: ["PUBLISHED", "COMING_SOON"] } },
    orderBy: [{ order: "asc" }, { track: "asc" }],
    include: {
      assessments: { where: { kind: "STAGE_EXAM", status: "PUBLISHED" }, select: { slug: true }, take: 1 },
      modules: {
        where: { status: { in: ["PUBLISHED", "COMING_SOON"] } },
        orderBy: { order: "asc" },
        include: {
          topics: {
            where: { status: { in: ["PUBLISHED", "COMING_SOON"] } },
            orderBy: { order: "asc" },
            include: { prerequisites: { include: { prerequisite: { select: { id: true, slug: true, title: true } } } } },
          },
        },
      },
    },
  });
}

const STRUCTURE_TTL_MS = 30_000;
let structureCache: { at: number; value: Promise<Awaited<ReturnType<typeof loadStructure>>> } | undefined;

/**
 * The curriculum shape (stages → modules → topics → prerequisites) is the same for
 * every learner and changes only when admins edit it, so it is cached per process.
 * Admin writes call invalidateCurriculum(); other instances refresh within 30 s.
 */
export function curriculumStructure() {
  if (!structureCache || Date.now() - structureCache.at > STRUCTURE_TTL_MS) {
    const value = loadStructure();
    structureCache = { at: Date.now(), value };
    value.catch(() => { structureCache = undefined; });
  }
  return structureCache.value;
}

export function invalidateCurriculum() {
  structureCache = undefined;
}

/**
 * Computes the learner's personal roadmap: stages for their chosen start
 * language, stage locks (stage exams) and topic locks (prerequisite graph).
 */
export async function learnerPath(userId: string) {
  const [profile, cfg, structure, masteries, progress] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    getScoring(),
    curriculumStructure(),
    prisma.mastery.findMany({ where: { userId } }),
    prisma.stageProgress.findMany({ where: { userId } }),
  ]);
  const language = profile?.startLanguage ?? null;
  const tracks: StageTrack[] = ["COMMON", ...(language ? [language] : (["PYTHON", "JAVASCRIPT"] as StageTrack[]))];
  const stages = structure.filter((s) => tracks.includes(s.track));

  const masteryByTopic = new Map(masteries.map((m) => [m.topicId, m]));
  const progressByStage = new Map(progress.map((p) => [p.stageId, p]));
  const inPath = new Set(stages.flatMap((s) => s.modules.flatMap((m) => m.topics.filter((t) => t.status === "PUBLISHED" && t.publishedVersion > 0).map((t) => t.id))));
  const isMastered = (topicId: string) => {
    const m = masteryByTopic.get(topicId);
    return !!m && (MASTERED_STATES.includes(m.status) || !!m.masteredAt);
  };

  const result: PathStage[] = [];
  let previous: { passed: boolean; title: string; hasContent: boolean } | null = null;

  for (const stage of stages) {
    const sp = progressByStage.get(stage.id);
    const contentTopics = stage.modules.flatMap((m) => m.topics).filter((t) => inPath.has(t.id));
    const masteredCount = contentTopics.filter((t) => isMastered(t.id)).length;

    let unlocked = true;
    let lockReason: string | null = null;
    if (cfg.stageGating && previous && previous.hasContent && !previous.passed) {
      unlocked = false;
      lockReason = `Pass the ${previous.title} stage exam to unlock ${stage.title}.`;
    }
    if (cfg.stageGating && previous && !previous.hasContent && result.some((s) => !s.unlocked)) {
      unlocked = false;
      lockReason = result.find((s) => !s.unlocked)?.lockReason ?? null;
    }

    const modules = stage.modules.map((mod) => ({
      id: mod.id,
      slug: mod.slug,
      title: mod.title,
      description: mod.description,
      topics: mod.topics.map((t): PathTopic => {
        const hasContent = inPath.has(t.id);
        const m = masteryByTopic.get(t.id) ?? null;
        const missing = t.prerequisites
          .map((p) => p.prerequisite)
          .filter((p) => inPath.has(p.id) && !isMastered(p.id))
          .map(({ slug, title }) => ({ slug, title }));
        let state: TopicState;
        if (!hasContent) state = "COMING_SOON";
        else if (m?.status === "NEEDS_REVIEW") state = "NEEDS_REVIEW";
        else if (isMastered(t.id)) state = "MASTERED";
        else if (!unlocked || (cfg.topicGating && missing.length > 0)) state = "LOCKED";
        else if (m && (m.attempts > 0 || m.readAt)) state = "IN_PROGRESS";
        else state = "AVAILABLE";
        return {
          id: t.id,
          slug: t.slug,
          title: t.title,
          order: t.order,
          estMinutes: t.estMinutes,
          difficulty: t.difficulty,
          hasContent,
          state,
          missingPrerequisites: missing,
          mastery: m && { bestScore: m.bestScore, status: m.status, nextReviewAt: m.nextReviewAt, masteredAt: m.masteredAt, recallScore: m.recallScore },
        };
      }),
    }));

    const passed = !!sp?.passedAt;
    result.push({
      id: stage.id,
      slug: stage.slug,
      code: stage.code,
      title: stage.title,
      description: stage.description,
      track: stage.track,
      order: stage.order,
      estHours: stage.estHours,
      targetRoles: stage.targetRoles,
      unlocked,
      lockReason,
      passed,
      bestExamScore: sp?.bestExamScore ?? null,
      examSlug: stage.assessments[0]?.slug ?? null,
      progress: {
        mastered: masteredCount,
        total: contentTopics.length,
        percent: contentTopics.length ? Math.round((masteredCount / contentTopics.length) * 100) : 0,
      },
      modules,
    });
    // Both language stages share order 1 when no language is chosen; only gate on the stage actually taken.
    if (!(language === null && stage.track !== "COMMON")) {
      previous = { passed, title: stage.title, hasContent: contentTopics.length > 0 };
    }
  }

  return { language, stages: result };
}

export function flattenTopics(stages: PathStage[]) {
  return stages.flatMap((s) => s.modules.flatMap((m) => m.topics.map((t) => ({ ...t, stage: s, module: m }))));
}

/** The next topic the learner should work on. */
export function nextTopic(stages: PathStage[]) {
  const all = flattenTopics(stages);
  return (
    all.find((t) => t.state === "IN_PROGRESS") ??
    all.find((t) => t.state === "AVAILABLE") ??
    null
  );
}
