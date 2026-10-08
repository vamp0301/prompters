import type { ConceptProgress, Mastery, QuizAttempt } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { turnScore } from "../career/interview.report.js";
import { jobParsedSchema, resumeParsedSchema } from "../career/schemas.js";
import { learnerPath, flattenTopics } from "../learning/path.service.js";
import { resumeSkills } from "../prep/intelligence.service.js";
import { effectiveBand, type ExperienceBand } from "../prep/ladder.js";
import { inferRole } from "../prep/profile.js";
import { TARGET_ROLES, type TargetRoleKey } from "../prep/roles.js";
import { canonicalSkill } from "../prep/text.js";
import { EVIDENCE_WEIGHT, estimateDifficulty, estimateSkillState, levelOf, type DifficultyLevel, type Observation, type SkillStateEstimate } from "./model.js";

/**
 * Everything personalization knows about one student, loaded in one pass from the records the
 * platform already keeps (quiz attempts, mastery, builds, Top-100 practice, Manisha interview turns,
 * knowledge-map explanations, resume, job description, event log). Nothing is invented: a signal
 * that doesn't exist is absent, never defaulted to a made-up value.
 */

const DAY = 86_400_000;
/** Profile goal role → Top-100 target role key. */
const GOAL_ROLE: Record<string, TargetRoleKey> = { BACKEND: "backend", FRONTEND: "frontend", FULLSTACK: "fullstack", DEVOPS: "devops", SDE: "sde", AI: "ml_engineer" };
const CODING_LEVEL: Record<string, DifficultyLevel> = { BEGINNER: "easy", INTERMEDIATE: "medium", ADVANCED: "hard" };

export async function loadStudentData(userId: string, now = new Date()) {
  const since90 = new Date(now.getTime() - 90 * DAY);
  const [profile, path, masteries, quizzes, submissions, resume, plan, prepAttempts, turns, concepts, events, maps, prereqs] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId }, select: { goalRole: true, codingLevel: true } }),
    learnerPath(userId),
    prisma.mastery.findMany({ where: { userId } }),
    prisma.quizAttempt.findMany({ where: { userId, status: { not: "IN_PROGRESS" }, finishedAt: { not: null } }, select: { topicId: true, kind: true, score: true, passed: true, startedAt: true, finishedAt: true, topic: { select: { difficulty: true } } }, orderBy: { finishedAt: "asc" } }),
    prisma.submission.findMany({ where: { userId }, select: { status: true, passedCount: true, totalCount: true, startedAt: true, completedAt: true, updatedAt: true, buildTask: { select: { id: true, slug: true, title: true, topicId: true } } } }),
    prisma.careerResume.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, parsed: true } }),
    prisma.prepPlan.findFirst({
      where: { userId, status: { in: ["READY", "RUNNING"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, targetRole: true, job: { select: { title: true, parsed: true } }, questions: { where: { rank: { gt: 0 } }, select: { id: true, question: true, skill: true, difficulty: true, probability: true, status: true, rank: true } } },
    }),
    prisma.prepAttempt.findMany({ where: { userId }, select: { questionId: true, score: true, createdAt: true, question: { select: { skill: true, difficulty: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.interviewTurn.findMany({
      // Every evaluated answer counts as soon as Manisha scores it — also in interviews still running or ended early.
      where: { session: { userId }, answeredAt: { not: null }, excluded: false },
      select: { id: true, skill: true, kind: true, level: true, skipped: true, evaluation: true, codeResult: true, durationSec: true, answeredAt: true },
      orderBy: { answeredAt: "asc" },
    }),
    prisma.conceptProgress.findMany({ where: { userId } }),
    prisma.learningEvent.findMany({ where: { userId, createdAt: { gte: since90 } }, select: { createdAt: true, eventType: true, entityId: true }, orderBy: { createdAt: "asc" } }),
    prisma.skillMap.findMany({ select: { key: true } }),
    prisma.topicPrerequisite.findMany({ select: { topicId: true, prerequisite: { select: { slug: true, title: true } } } }),
  ]);
  const latestJob = plan?.job ?? (await prisma.jobTarget.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { title: true, parsed: true } }));
  return { userId, now, profile, path, masteries, quizzes, submissions, resume, plan, prepAttempts, turns, concepts, events, mapKeys: new Set(maps.map((m) => m.key)), prereqs, latestJob };
}
export type StudentData = Awaited<ReturnType<typeof loadStudentData>>;

// ───────────────────────── career context ─────────────────────────

export interface CareerContext {
  role: TargetRoleKey;
  roleLabel: string;
  goalRole: string | null;
  band: ExperienceBand;
  experienceMonths: number;
  resumeSkills: Map<string, string>;
  jobRequired: Set<string>;
  jobPreferred: Set<string>;
  jobTitle: string | null;
  roleSkills: Set<string>;
}

export function careerContext(d: StudentData): CareerContext {
  const parsed = d.resume ? resumeParsedSchema.safeParse(d.resume.parsed) : null;
  const resume = new Map<string, string>();
  if (parsed?.success) for (const s of [...resumeSkills(parsed.data), ...parsed.data.projects.flatMap((p) => p.technologies)]) if (canonicalSkill(s)) resume.set(canonicalSkill(s), s);
  const job = d.latestJob ? jobParsedSchema.safeParse(d.latestJob.parsed) : null;
  const jobData = job?.success ? job.data : null;
  const role: TargetRoleKey = (d.plan?.targetRole as TargetRoleKey | null) ?? (d.profile?.goalRole ? GOAL_ROLE[d.profile.goalRole] : undefined) ?? (d.latestJob ? inferRole(d.latestJob.title) : "sde");
  const r = TARGET_ROLES[role];
  const months = parsed?.success ? parsed.data.totalExperienceMonths : 0;
  return {
    role,
    roleLabel: r.label,
    goalRole: d.profile?.goalRole ?? null,
    band: effectiveBand(months, jobData),
    experienceMonths: months,
    resumeSkills: resume,
    jobRequired: new Set((jobData?.requiredSkills ?? []).map(canonicalSkill)),
    jobPreferred: new Set((jobData?.preferredSkills ?? []).map(canonicalSkill)),
    jobTitle: d.latestJob?.title ?? null,
    roleSkills: new Set([...r.skills, ...r.concepts].map(canonicalSkill)),
  };
}

/** How relevant a skill is to where the student is going (0–1), and why. */
export function skillRelevance(key: string, c: CareerContext) {
  const inRole = c.roleSkills.has(key);
  const required = c.jobRequired.has(key);
  const preferred = c.jobPreferred.has(key);
  const onResume = c.resumeSkills.has(key);
  const jobRelevance = Math.max(required ? 1 : preferred ? 0.7 : 0, inRole ? 0.9 : 0, onResume ? 0.6 : 0, 0.2);
  return { jobRelevance, inRole, required, preferred, onResume };
}

// ───────────────────────── student-level features ─────────────────────────

/** Reproducible student features (same database + same `now` → same numbers). */
export function studentFeatures(d: StudentData, c: CareerContext) {
  const now = d.now.getTime();
  const within = (t: Date, days: number) => now - t.getTime() <= days * DAY;
  const activeDays = (days: number) => new Set(d.events.filter((e) => within(e.createdAt, days)).map((e) => e.createdAt.toISOString().slice(0, 10))).size;
  const scored = d.quizzes.filter((q) => q.score !== null && q.finishedAt);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const quizAcc = (days?: number) => avg(scored.filter((q) => !days || within(q.finishedAt!, days)).map((q) => q.score! / 100));
  const reviews = scored.filter((q) => q.kind === "REVIEW");
  const builds = d.submissions.filter((s) => s.totalCount > 0 || s.status !== "IN_PROGRESS");
  const interview = d.turns.map((t) => turnScore(t) / 100);
  const prep = d.prepAttempts.map((a) => a.score / 100);
  const last = d.events.at(-1)?.createdAt ?? null;
  const required = [...c.jobRequired];
  const round = (x: number | null) => (x === null ? null : Math.round(x * 1000) / 1000);
  return {
    activeDays7d: activeDays(7),
    activeDays30d: activeDays(30),
    studyConsistency: round(activeDays(30) / 30)!,
    events30d: d.events.filter((e) => within(e.createdAt, 30)).length,
    daysSinceLastActive: last ? Math.floor((now - last.getTime()) / DAY) : null,
    quizAttempts: scored.length,
    quizAccuracy: round(quizAcc()),
    quizAccuracy7d: round(quizAcc(7)),
    quizAccuracy30d: round(quizAcc(30)),
    averageQuizTimeSec: round(avg(scored.map((q) => (q.finishedAt!.getTime() - q.startedAt.getTime()) / 1000))),
    revisions30d: reviews.filter((q) => within(q.finishedAt!, 30)).length,
    revisionSuccessRate: round(avg(reviews.map((q) => (q.passed ? 1 : 0)))),
    buildsStarted: d.submissions.length,
    buildSuccessRate: round(avg(builds.map((s) => (s.status !== "IN_PROGRESS" ? 1 : 0)))),
    topicsMastered: d.masteries.filter((m) => m.status !== "LEARNING" || m.masteredAt).length,
    interviewAnswers: interview.length,
    interviewAverage: round(avg(interview)),
    prepAnswers: prep.length,
    prepAverage: round(avg(prep)),
    conceptsMastered: d.concepts.filter((x) => x.status === "MASTERED").length,
    targetRole: c.role,
    targetLevel: c.band,
    resumeSkills: c.resumeSkills.size,
    jobSkillMatch: required.length ? round(required.filter((k) => c.resumeSkills.has(k)).length / required.length) : null,
  };
}
export type StudentFeatures = ReturnType<typeof studentFeatures>;

// ───────────────────────── per-concept evidence and state ─────────────────────────

export interface ConceptState extends SkillStateEstimate {
  conceptId: string;
  label: string;
  kind: "topic" | "skill";
  /** Interview answers on this concept (0–1 average), when the student has been interviewed on it. */
  interviewAverage: number | null;
  interviewAnswers: number;
}

const quizSource = (q: Pick<QuizAttempt, "kind">): "review" | "quiz" => (q.kind === "REVIEW" ? "review" : "quiz");

export function conceptStates(d: StudentData, c: CareerContext): ConceptState[] {
  const out: ConceptState[] = [];
  const masteryByTopic = new Map<string, Mastery>(d.masteries.map((m) => [m.topicId, m]));

  // Curriculum topics: quizzes and reviews on the topic, plus builds that belong to it.
  for (const t of flattenTopics(d.path.stages)) {
    const obs: Observation[] = [
      ...d.quizzes
        .filter((q) => q.topicId === t.id && q.score !== null && q.kind !== "PLACEMENT")
        .map((q) => ({ source: quizSource(q), score: q.score! / 100, at: q.finishedAt!, weight: EVIDENCE_WEIGHT[quizSource(q)], timeSec: (q.finishedAt!.getTime() - q.startedAt.getTime()) / 1000, difficulty: q.topic?.difficulty ?? t.difficulty })),
      ...d.submissions
        .filter((s) => s.buildTask.topicId === t.id && s.totalCount > 0)
        .map((s) => ({ source: "build" as const, score: s.passedCount / s.totalCount, at: s.completedAt ?? s.updatedAt, weight: EVIDENCE_WEIGHT.build, difficulty: t.difficulty })),
    ];
    const m = masteryByTopic.get(t.id);
    if (!obs.length && !m) continue;
    const est = estimateSkillState(obs, { now: d.now, prior: 0.3, priorWeight: 1, scheduledReview: m?.nextReviewAt ?? null });
    out.push({ ...est, conceptId: `topic:${t.slug}`, label: t.title, kind: "topic", interviewAverage: null, interviewAnswers: 0 });
  }

  // Skills: the universe is the resume, the job, the target role and everything practised or interviewed on.
  const labels = new Map<string, string>();
  const add = (name: string) => {
    const k = canonicalSkill(name);
    if (k && !labels.has(k)) labels.set(k, name);
  };
  c.resumeSkills.forEach((v) => add(v));
  [...TARGET_ROLES[c.role].skills].forEach(add);
  for (const q of d.plan?.questions ?? []) add(q.skill);
  for (const t of d.turns) add(t.skill);
  for (const a of d.prepAttempts) add(a.question.skill);
  const jobData = d.latestJob ? jobParsedSchema.safeParse(d.latestJob.parsed) : null;
  if (jobData?.success) [...jobData.data.requiredSkills, ...jobData.data.preferredSkills].forEach(add);
  const conceptsBySkill = new Map<string, ConceptProgress[]>();
  for (const cp of d.concepts) conceptsBySkill.set(cp.skillKey, [...(conceptsBySkill.get(cp.skillKey) ?? []), cp]);
  for (const k of conceptsBySkill.keys()) if (!labels.has(k)) labels.set(k, k);

  for (const [key, label] of labels) {
    const interview = d.turns.filter((t) => canonicalSkill(t.skill) === key).map((t) => ({ source: "interview" as const, score: turnScore(t) / 100, at: t.answeredAt!, weight: EVIDENCE_WEIGHT.interview, timeSec: t.durationSec, difficulty: Math.min(5, t.level + 1) }));
    const obs: Observation[] = [
      ...d.prepAttempts.filter((a) => canonicalSkill(a.question.skill) === key).map((a) => ({ source: "prep" as const, score: a.score / 100, at: a.createdAt, weight: EVIDENCE_WEIGHT.prep, difficulty: a.question.difficulty })),
      ...interview,
      // Explaining a concept counts; ticking "I understand this" is a self-report, not evidence.
      ...(conceptsBySkill.get(key) ?? []).filter((cp) => cp.explainScore !== null && cp.lastExplainedAt).map((cp) => ({ source: "explain" as const, score: cp.explainScore! / 100, at: cp.lastExplainedAt!, weight: EVIDENCE_WEIGHT.explain })),
    ];
    const onResume = c.resumeSkills.has(key);
    const est = estimateSkillState(obs, { now: d.now, prior: onResume ? 0.5 : 0.3, priorWeight: 1, resumePrior: onResume });
    out.push({
      ...est,
      conceptId: `skill:${key}`,
      label,
      kind: "skill",
      interviewAverage: interview.length ? Math.round((interview.reduce((a, o) => a + o.score, 0) / interview.length) * 1000) / 1000 : null,
      interviewAnswers: interview.length,
    });
  }
  return out;
}

/** Every graded answer with a difficulty, for the difficulty model. */
export function difficultyObservations(d: StudentData): Observation[] {
  return [
    ...d.quizzes.filter((q) => q.score !== null && q.topic && q.kind !== "PLACEMENT").map((q) => ({ source: quizSource(q), score: q.score! / 100, at: q.finishedAt!, weight: 1, timeSec: (q.finishedAt!.getTime() - q.startedAt.getTime()) / 1000, difficulty: q.topic!.difficulty })),
    ...d.prepAttempts.map((a) => ({ source: "prep" as const, score: a.score / 100, at: a.createdAt, weight: 1, difficulty: a.question.difficulty })),
    ...d.turns.map((t) => ({ source: "interview" as const, score: turnScore(t) / 100, at: t.answeredAt!, weight: 1, timeSec: t.durationSec, difficulty: Math.min(5, t.level + 1) })),
  ];
}

/** Cold-start level from onboarding, else experience band. */
export function coldStartLevel(d: StudentData, c: CareerContext): DifficultyLevel {
  const fromOnboarding = d.profile?.codingLevel ? CODING_LEVEL[d.profile.codingLevel] : undefined;
  return fromOnboarding ?? (c.band === "SENIOR" ? "hard" : c.band === "MID" ? "medium" : "easy");
}

export function studentDifficulty(d: StudentData, c: CareerContext) {
  return estimateDifficulty(difficultyObservations(d), { now: d.now, coldStartHint: coldStartLevel(d, c) });
}

export { levelOf };
