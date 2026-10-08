import { flattenTopics } from "../learning/path.service.js";
import { canonicalSkill } from "../prep/text.js";
import { skillRelevance, type CareerContext, type ConceptState, type StudentData } from "./data.js";
import { levelOf, LEVELS, successAt, type CandidateFeatures, type DifficultyEstimate, type DifficultyLevel } from "./model.js";

/**
 * Candidate next actions, generated from the student's real state: the roadmap, due revisions,
 * prerequisite gaps, weak skills that matter for their role/job/resume, interview weaknesses,
 * unfinished builds, unpractised Top-100 questions at the right difficulty, and knowledge-map
 * concepts in progress. Each candidate carries its feature vector and machine-readable reasons,
 * all derived from those features — never written by a model.
 */

export const ACTIONS = ["LEARN_TOPIC", "TAKE_QUIZ", "REVISE_TOPIC", "REVISIT_PREREQUISITE", "PRACTICE_SKILL", "PRACTICE_QUESTION", "FINISH_BUILD", "LEARN_CONCEPT", "PRACTICE_PROJECT"] as const;
export type Action = (typeof ACTIONS)[number];

export interface Candidate {
  action: Action;
  itemType: "TOPIC" | "SKILL" | "PREP_QUESTION" | "BUILD_TASK" | "CONCEPT" | "PROJECT_SKILL";
  itemId: string;
  title: string;
  href: string;
  /** Skill or topic this is about, for grouping ("Caching"). */
  subject: string;
  conceptId: string | null;
  difficulty: DifficultyLevel | null;
  features: CandidateFeatures;
  reasons: string[];
  /** Numbers behind the reasons, used to write the explanation (never invented). */
  facts: Record<string, string | number | null>;
}

const DAY = 86_400_000;
const r3 = (x: number) => Math.round(x * 1000) / 1000;

function reasonsFor(f: CandidateFeatures, extra: string[], rel?: ReturnType<typeof skillRelevance>, state?: ConceptState) {
  const out = [...extra];
  if (state && state.attempts === 0) out.push("not_yet_practised");
  else if (f.mastery < 0.5 && f.confidence >= 0.3) out.push("low_mastery");
  if (rel?.required) out.push("in_job_description");
  else if (rel?.inRole) out.push("high_role_relevance");
  if (rel?.onResume) out.push("on_your_resume");
  if (state?.interviewAverage !== null && state?.interviewAverage !== undefined && state.interviewAverage < 0.6) out.push("interview_weakness");
  if (f.dueForReview) out.push("due_for_review");
  else if (f.forgettingRisk >= 0.5) out.push("high_forgetting_risk");
  if (f.successProbability >= 0.6) out.push("matches_your_level");
  if (f.questionImportance >= 0.8) out.push("often_asked");
  return [...new Set(out)];
}

export function generateCandidates(d: StudentData, c: CareerContext, states: ConceptState[], difficulty: DifficultyEstimate): Candidate[] {
  const now = d.now;
  const byId = new Map(states.map((s) => [s.conceptId, s]));
  const out: Candidate[] = [];
  const topics = flattenTopics(d.path.stages);
  const topicRelevance = (stageRoles: string[]) => (c.goalRole && stageRoles.includes(c.goalRole) ? 0.8 : 0.6);
  const mastered = (slug: string) => {
    const t = topics.find((x) => x.slug === slug);
    return !!t && (t.state === "MASTERED" || t.state === "NEEDS_REVIEW");
  };
  const empty = (s?: ConceptState) => ({ mastery: s?.mastery ?? 0.3, confidence: s?.confidence ?? 0, forgettingRisk: s?.forgettingRisk ?? 0 });

  // 1. Roadmap: the topic in progress (quiz if already read) and the next available ones.
  const roadmap = [...topics.filter((t) => t.state === "IN_PROGRESS"), ...topics.filter((t) => t.state === "AVAILABLE").slice(0, 2)];
  for (const t of roadmap) {
    const s = byId.get(`topic:${t.slug}`);
    const m = d.masteries.find((x) => x.topicId === t.id);
    const read = !!m?.readAt;
    const level = levelOf(t.difficulty);
    const f: CandidateFeatures = { ...empty(s), skillGap: 1 - empty(s).mastery, jobRelevance: topicRelevance(t.stage.targetRoles), prerequisiteReadiness: 1, interviewRelevance: 0, successProbability: successAt(difficulty, level), questionImportance: 0, dueForReview: 0 };
    out.push({
      action: read ? "TAKE_QUIZ" : "LEARN_TOPIC",
      itemType: "TOPIC",
      itemId: t.slug,
      title: t.title,
      href: `/learn/topic/${t.slug}`,
      subject: t.title,
      conceptId: `topic:${t.slug}`,
      difficulty: level,
      features: f,
      reasons: reasonsFor(f, ["next_in_roadmap", "prerequisites_satisfied", ...(read ? ["read_but_not_tested"] : [])], undefined, s),
      facts: { stage: t.stage.title, minutes: t.estMinutes },
    });
  }

  // 2. Revisions: due by the spaced-review schedule, or at high risk of being forgotten.
  for (const t of topics.filter((x) => x.state === "MASTERED" || x.state === "NEEDS_REVIEW")) {
    const s = byId.get(`topic:${t.slug}`);
    if (!s) continue;
    const due = (s.nextReview && s.nextReview.getTime() <= now.getTime()) || t.state === "NEEDS_REVIEW";
    if (!due && s.forgettingRisk < 0.5) continue;
    const f: CandidateFeatures = { mastery: s.mastery, confidence: s.confidence, forgettingRisk: s.forgettingRisk, skillGap: 1 - s.mastery, jobRelevance: topicRelevance(t.stage.targetRoles), prerequisiteReadiness: 1, interviewRelevance: 0, successProbability: successAt(difficulty, levelOf(t.difficulty)), questionImportance: 0, dueForReview: due ? 1 : 0 };
    out.push({
      action: "REVISE_TOPIC", itemType: "TOPIC", itemId: t.slug, title: t.title, href: "/reviews", subject: t.title, conceptId: s.conceptId,
      difficulty: levelOf(t.difficulty), features: f, reasons: reasonsFor(f, [], undefined, s),
      facts: { daysSinceSeen: s.lastSeen ? Math.floor((now.getTime() - s.lastSeen.getTime()) / DAY) : null, forgettingRisk: Math.round(s.forgettingRisk * 100) },
    });
  }

  // 3. Prerequisite gaps: a topic whose last quiz failed while one of its prerequisites is weak
  //    (not mastered, or mastered but estimated below 60% now).
  for (const t of topics) {
    const lastQuiz = d.quizzes.filter((q) => q.topicId === t.id && q.kind === "MASTERY").at(-1);
    if (!lastQuiz || lastQuiz.passed) continue;
    for (const { prerequisite: p } of d.prereqs.filter((x) => x.topicId === t.id)) {
      const s = byId.get(`topic:${p.slug}`);
      if (mastered(p.slug) && (s?.mastery ?? 1) >= 0.6) continue;
      const f: CandidateFeatures = { ...empty(s), skillGap: 1 - empty(s).mastery, jobRelevance: 0.7, prerequisiteReadiness: 1, interviewRelevance: 0, successProbability: successAt(difficulty, "easy"), questionImportance: 0, dueForReview: 0 };
      out.push({ action: "REVISIT_PREREQUISITE", itemType: "TOPIC", itemId: p.slug, title: p.title, href: `/learn/topic/${p.slug}`, subject: p.title, conceptId: `topic:${p.slug}`, difficulty: "easy", features: f, reasons: reasonsFor(f, ["prerequisite_gap"], undefined, s), facts: { blockedTopic: t.title, lastScore: lastQuiz.score } });
    }
  }

  // 4. Skills: weak (or unpractised) skills that matter for the role, the job or the resume.
  const planQuestions = d.plan?.questions ?? [];
  const attemptsByQuestion = new Map<string, number[]>();
  for (const a of d.prepAttempts) attemptsByQuestion.set(a.questionId, [...(attemptsByQuestion.get(a.questionId) ?? []), a.score / 100]);
  // A skill the student has never touched and doesn't list is only "ready" once they have foundations:
  // a beginner's first step is the roadmap, not an interview skill (curriculum prerequisites in cold start).
  const foundations = Math.min(1, d.masteries.filter((m) => m.status !== "LEARNING" || m.masteredAt).length / 10);
  for (const s of states.filter((x) => x.kind === "skill")) {
    const key = s.conceptId.slice("skill:".length);
    const rel = skillRelevance(key, c);
    if (rel.jobRelevance < 0.5 || s.mastery >= 0.75) continue;
    const interviewWeak = s.interviewAverage !== null ? 1 - s.interviewAverage : 0;
    const ready = s.attempts > 0 || rel.onResume ? 1 : r3(foundations);
    const f: CandidateFeatures = { mastery: s.mastery, confidence: s.confidence, forgettingRisk: s.forgettingRisk, skillGap: 1 - s.mastery, jobRelevance: rel.jobRelevance, prerequisiteReadiness: ready, interviewRelevance: r3(interviewWeak), successProbability: successAt(difficulty, difficulty.level), questionImportance: 0, dueForReview: s.nextReview && s.nextReview.getTime() <= now.getTime() && s.attempts > 0 ? 1 : 0 };
    const questions = planQuestions.filter((q) => canonicalSkill(q.skill) === key);
    const href = d.plan && questions.length ? `/career/prep/${d.plan.id}?skill=${encodeURIComponent(questions[0].skill)}` : `/career/skills/map?name=${encodeURIComponent(s.label)}`;
    out.push({
      action: "PRACTICE_SKILL", itemType: "SKILL", itemId: key, title: s.label, href, subject: s.label, conceptId: s.conceptId, difficulty: difficulty.level, features: f,
      reasons: reasonsFor(f, [], rel, s),
      facts: { mastery: Math.round(s.mastery * 100), evidence: s.attempts, interviewAverage: s.interviewAverage === null ? null : Math.round(s.interviewAverage * 100), role: c.roleLabel, job: c.jobTitle },
    });

    // 5. One Top-100 question in that skill, at the student's level (or a step up/down when their recent answers say so).
    const target = difficulty.trend === "increase" ? LEVELS[Math.min(2, LEVELS.indexOf(difficulty.level) + 1)] : difficulty.trend === "decrease" ? LEVELS[Math.max(0, LEVELS.indexOf(difficulty.level) - 1)] : difficulty.level;
    const q = questions
      .filter((x) => x.status !== "CONFIDENT" && !(attemptsByQuestion.get(x.id) ?? []).some((v) => v >= 0.7))
      .sort((a, b) => Math.abs(LEVELS.indexOf(levelOf(a.difficulty)) - LEVELS.indexOf(target)) - Math.abs(LEVELS.indexOf(levelOf(b.difficulty)) - LEVELS.indexOf(target)) || b.probability - a.probability)[0];
    if (q && d.plan) {
      const level = levelOf(q.difficulty);
      const qf: CandidateFeatures = { ...f, successProbability: successAt(difficulty, level), questionImportance: q.probability };
      const shift = target !== difficulty.level ? [difficulty.trend === "increase" ? "increase_difficulty" : "decrease_difficulty"] : [];
      out.push({ action: "PRACTICE_QUESTION", itemType: "PREP_QUESTION", itemId: q.id, title: q.question, href: `/career/prep/${d.plan.id}?skill=${encodeURIComponent(q.skill)}`, subject: s.label, conceptId: s.conceptId, difficulty: level, features: qf, reasons: reasonsFor(qf, shift, rel, s), facts: { rank: q.rank, importance: Math.round(q.probability * 100) } });
    }
  }

  // 6. Unfinished builds.
  for (const sub of d.submissions.filter((x) => x.status === "IN_PROGRESS")) {
    const idleDays = Math.floor((now.getTime() - sub.updatedAt.getTime()) / DAY);
    const f: CandidateFeatures = { mastery: 0.5, confidence: 0, forgettingRisk: 0, skillGap: 0.5, jobRelevance: 0.7, prerequisiteReadiness: 1, interviewRelevance: 0, successProbability: sub.totalCount ? sub.passedCount / sub.totalCount : 0.5, questionImportance: 0, dueForReview: 0 };
    out.push({ action: "FINISH_BUILD", itemType: "BUILD_TASK", itemId: sub.buildTask.slug, title: sub.buildTask.title, href: `/workspace/${sub.buildTask.slug}`, subject: sub.buildTask.title, conceptId: null, difficulty: null, features: f, reasons: ["unfinished_build"], facts: { passed: sub.passedCount, total: sub.totalCount, idleDays } });
  }

  // 7. Knowledge-map concepts the student started but hasn't proven yet.
  for (const cp of d.concepts.filter((x) => x.status === "LEARNING" || (x.status === "UNDERSTOOD" && (x.explainScore ?? 0) < 75))) {
    const s = byId.get(`skill:${cp.skillKey}`);
    const rel = skillRelevance(cp.skillKey, c);
    const f: CandidateFeatures = { mastery: s?.mastery ?? 0.3, confidence: s?.confidence ?? 0, forgettingRisk: 0, skillGap: 1 - (s?.mastery ?? 0.3), jobRelevance: rel.jobRelevance, prerequisiteReadiness: 1, interviewRelevance: s?.interviewAverage != null ? r3(1 - s.interviewAverage) : 0, successProbability: successAt(difficulty, difficulty.level), questionImportance: 0, dueForReview: 0 };
    out.push({ action: "LEARN_CONCEPT", itemType: "CONCEPT", itemId: `${cp.skillKey}/${cp.conceptKey}`, title: cp.conceptKey.replace(/-/g, " "), href: `/career/skills/concept?name=${encodeURIComponent(s?.label ?? cp.skillKey)}&c=${encodeURIComponent(cp.conceptKey)}`, subject: s?.label ?? cp.skillKey, conceptId: `skill:${cp.skillKey}`, difficulty: null, features: f, reasons: reasonsFor(f, ["started_not_proven"], rel, s), facts: { explainScore: cp.explainScore } });
  }

  // 8. Project weaknesses: a skill the student struggled with in THEIR OWN project's knowledge test.
  const projectSkill = new Map<string, { projectId: string; project: string; skill: string; key: string; scores: number[] }>();
  for (const a of d.projectAnswers) {
    const key = canonicalSkill(a.skill);
    if (!key || a.skill === "Resume claim") continue;
    const k = `${a.projectId}:${key}`;
    const e = projectSkill.get(k) ?? { projectId: a.projectId, project: a.project.name, skill: a.skill, key, scores: [] };
    e.scores.push(a.score / 100);
    projectSkill.set(k, e);
  }
  for (const [itemId, e] of projectSkill) {
    // The latest few answers decide whether it is still weak.
    const recent = e.scores.slice(-3);
    const avg = recent.reduce((x, y) => x + y, 0) / recent.length;
    if (avg >= 0.5) continue;
    const s = byId.get(`skill:${e.key}`);
    const rel = skillRelevance(e.key, c);
    const f: CandidateFeatures = { mastery: s?.mastery ?? avg, confidence: s?.confidence ?? 0, forgettingRisk: s?.forgettingRisk ?? 0, skillGap: r3(1 - avg), jobRelevance: Math.max(rel.jobRelevance, 0.7), prerequisiteReadiness: 1, interviewRelevance: r3(1 - avg), successProbability: successAt(difficulty, difficulty.level), questionImportance: 0, dueForReview: 0 };
    out.push({
      action: "PRACTICE_PROJECT", itemType: "PROJECT_SKILL", itemId, title: `Review ${e.skill} before your next ${e.project} interview`, href: `/career/projects/${e.projectId}?tab=gaps`, subject: e.skill, conceptId: `skill:${e.key}`, difficulty: difficulty.level, features: f,
      reasons: reasonsFor(f, ["project_weakness"], rel, s),
      facts: { project: e.project, projectScore: Math.round(avg * 100), answers: recent.length },
    });
  }

  // One candidate per (action, item).
  const seen = new Set<string>();
  return out.filter((x) => (seen.has(`${x.action}:${x.itemId}`) ? false : (seen.add(`${x.action}:${x.itemId}`), true)));
}
