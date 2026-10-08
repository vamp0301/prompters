import type { InterviewSession, InterviewTurn } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AREA_LABEL, type Area, type BankItem, type Blueprint } from "./interview.blueprint.js";
import type { CodeReview, Evaluation } from "./schemas.js";

type CodeResult = { passed: number; total: number; review?: CodeReview; tests?: { name: string; passed: boolean; hidden: boolean }[] };
type Turn = Pick<InterviewTurn, "id" | "kind" | "skipped" | "evaluation" | "codeResult" | "level" | "skill" | "area" | "claimId" | "question" | "excluded" | "answeredAt">;

/** 0-100 score for one answered turn. */
export function turnScore(t: Pick<InterviewTurn, "kind" | "skipped" | "evaluation" | "codeResult">) {
  if (t.skipped) return 0;
  if (t.kind === "CODING") {
    const r = t.codeResult as CodeResult | null;
    if (!r || !r.total) return 0;
    const tests = (r.passed / r.total) * 100;
    const quality = r.review ? ((r.review.understanding + r.review.practical) / 2) * 10 : tests;
    return Math.round(tests * 0.6 + quality * 0.4);
  }
  const e = t.evaluation as Evaluation | null;
  if (!e) return 0;
  const depth = e.depth ?? e.understanding;
  const reasoning = e.reasoning ?? e.understanding;
  return Math.round((e.correctness * 0.35 + e.completeness * 0.15 + depth * 0.15 + reasoning * 0.1 + e.understanding * 0.15 + e.practical * 0.1) * 10);
}

/** Main questions and harder ones count more; follow-ups less — one bad answer can't sink the score. */
const turnWeight = (t: Pick<InterviewTurn, "kind" | "level">) => (t.kind === "CODING" || t.kind === "PROBLEM" ? 1.5 : t.kind === "FOLLOW_UP" ? 0.6 : 1 + (t.level - 1) * 0.15);

export function resultFor(score: number) {
  if (score >= 75) return { key: "INTERVIEW_READY", label: "Interview Ready" };
  if (score >= 55) return { key: "NEEDS_IMPROVEMENT", label: "Needs Improvement" };
  return { key: "NOT_YET_READY", label: "Not Yet Ready" };
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const weighted = (ts: Turn[]) => {
  const w = ts.reduce((a, t) => a + turnWeight(t), 0);
  return w ? Math.round(ts.reduce((a, t) => a + turnScore(t) * turnWeight(t), 0) / w) : null;
};

const verdictOf = (t: Turn) => {
  if (t.skipped) return "SKIPPED";
  if (t.kind === "CODING") {
    const r = t.codeResult as CodeResult | null;
    return !r?.total ? "INCORRECT" : r.passed === r.total ? "CORRECT" : r.passed > 0 ? "PARTIAL" : "INCORRECT";
  }
  const v = (t.evaluation as Evaluation | null)?.verdict;
  return v === "NO_ANSWER" || v === "UNCLEAR" || !v ? "INCORRECT" : v;
};

/** Short, readable question text for lists (coding questions keep their first line). */
const shortQuestion = (q: string) => q.split("\n")[0].replace(/\*\*/g, "").slice(0, 220);

export async function buildReport(session: InterviewSession & { turns: Turn[] }, bank: BankItem[]) {
  const answered = session.turns.filter((t) => t.answeredAt);
  const scored = answered.filter((t) => !t.excluded);
  const readiness = weighted(scored) ?? 0;
  const verdicts = scored.map(verdictOf);
  const evals = scored.filter((t) => t.evaluation && !t.skipped).map((t) => t.evaluation as Evaluation);

  // ── Dimension scores (null = no evidence for it in this interview) ──
  const inAreas = (areas: Area[]) => scored.filter((t) => t.area && areas.includes(t.area as Area));
  const dimensions = {
    overall: readiness,
    technical: avg(evals.map((e) => Math.round((e.correctness * 0.45 + e.understanding * 0.3 + (e.depth ?? e.understanding) * 0.25) * 10))),
    projectUnderstanding: weighted(inAreas(["PROJECTS", "RESUME"]).concat(scored.filter((t) => t.claimId && !["PROJECTS", "RESUME"].includes(t.area ?? "")))),
    problemSolving: weighted(scored.filter((t) => t.kind === "CODING" || t.kind === "PROBLEM" || t.area === "PROBLEM_SOLVING" || t.area === "SYSTEM_DESIGN")),
    practicalEngineering: avg(evals.map((e) => e.practical * 10)),
    communication: avg(evals.map((e) => e.communication * 10)),
  };

  // ── By skill and by area ──
  const bySkill = new Map<string, { label: string; scores: number[] }>();
  for (const t of scored) {
    const key = t.skill.trim().toLowerCase();
    const entry = bySkill.get(key) ?? { label: t.skill.trim(), scores: [] };
    entry.scores.push(turnScore(t));
    bySkill.set(key, entry);
  }
  const areas = [...bySkill.values()]
    .map((a) => ({ skill: a.label, score: avg(a.scores) ?? 0, questions: a.scores.length }))
    .sort((a, b) => b.score - a.score);
  const coverage = (session.blueprint as Blueprint | null)?.areas.map((b) => {
    const ts = inAreas([b.area]);
    return { area: b.area, label: AREA_LABEL[b.area], planned: b.target, asked: ts.filter((t) => t.kind !== "FOLLOW_UP").length, score: weighted(ts) };
  }) ?? [];

  const missing = new Map<string, number>();
  for (const e of evals) for (const c of e.missingConcepts ?? []) missing.set(c, (missing.get(c) ?? 0) + 1);
  const topMissing = [...missing.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c);
  const answeredWell = areas.filter((a) => a.score >= 70).map((a) => a.skill);
  const weakSkills = areas.filter((a) => a.score < 55).map((a) => a.skill);
  const struggled = [...new Set([...weakSkills, ...topMissing])].slice(0, 8);

  // ── Questions answered strongly / needing improvement ──
  const ranked = scored.filter((t) => !t.skipped).map((t) => ({ question: shortQuestion(t.question), skill: t.skill, score: turnScore(t) }));
  const strongQuestions = ranked.filter((r) => r.score >= 75).sort((a, b) => b.score - a.score).slice(0, 4);
  const needsWork = [...ranked.filter((r) => r.score < 55), ...scored.filter((t) => t.skipped).map((t) => ({ question: shortQuestion(t.question), skill: t.skill, score: 0 }))]
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  // ── Resume claims defended / needing a stronger explanation ──
  const byClaim = new Map<string, number[]>();
  for (const t of scored) if (t.claimId) byClaim.set(t.claimId, [...(byClaim.get(t.claimId) ?? []), turnScore(t)]);
  const claimText = (id: string) => bank.find((b) => b.claimId === id)?.claim ?? null;
  const claims = [...byClaim.entries()].map(([id, s]) => ({ claim: claimText(id), score: avg(s) ?? 0 })).filter((c): c is { claim: string; score: number } => !!c.claim);
  const claimsDefended = claims.filter((c) => c.score >= 70).map((c) => c.claim);
  const claimsToStrengthen = claims.filter((c) => c.score < 55).map((c) => c.claim);

  // ── Close the loop: Prompters topics and the candidate's own Top-100 questions ──
  const keywords = struggled.flatMap((s) => s.split(/[\s/,()-]+/)).filter((w) => w.length > 2).slice(0, 12);
  const topics = keywords.length
    ? await prisma.topic.findMany({
        where: { status: "PUBLISHED", publishedVersion: { gt: 0 }, OR: keywords.map((k) => ({ title: { contains: k, mode: "insensitive" as const } })) },
        select: { slug: true, title: true },
        take: 5,
      })
    : [];
  const plan = session.resumeId
    ? await prisma.prepPlan.findFirst({ where: { userId: session.userId, resumeId: session.resumeId, status: "READY" }, orderBy: { createdAt: "desc" }, select: { id: true } })
    : null;
  const recommendedQuestions =
    plan && weakSkills.length
      ? await prisma.prepQuestion.findMany({
          where: { planId: plan.id, OR: weakSkills.map((s) => ({ skill: { contains: s, mode: "insensitive" as const } })) },
          orderBy: { rank: "asc" },
          take: 6,
          select: { id: true, question: true, skill: true, priority: true },
        })
      : [];

  // ── Personalised 7-day revision plan, built only from this interview's gaps ──
  const revisionPlan: { day: number; focus: string; detail: string }[] = [];
  const studyItems = [...weakSkills, ...topMissing.filter((m) => !weakSkills.some((w) => w.toLowerCase() === m.toLowerCase()))].slice(0, 5);
  studyItems.forEach((item, i) => {
    const topic = topics.find((t) => t.title.toLowerCase().includes(item.toLowerCase()) || item.toLowerCase().includes(t.title.toLowerCase()));
    const missed = [...new Set(scored.filter((t) => t.skill.toLowerCase() === item.toLowerCase()).flatMap((t) => (t.evaluation as Evaluation | null)?.missingConcepts ?? []))].slice(0, 3);
    revisionPlan.push({
      day: i + 1,
      focus: item,
      detail: topic ? `Revise "${topic.title}"${missed.length ? `, then explain ${missed.join(", ")} out loud` : ""}.` : missed.length ? `Explain ${missed.join(", ")} out loud, with an example from your own work.` : `Practise two interview questions on ${item} and say the answers out loud.`,
    });
  });
  if (claimsToStrengthen.length) revisionPlan.push({ day: revisionPlan.length + 1, focus: "Project explanation", detail: `Rehearse how you'd defend: "${claimsToStrengthen[0]}" — what you did, why, and what you'd change.` });
  if (revisionPlan.length) revisionPlan.push({ day: revisionPlan.length + 1, focus: "Mock interview", detail: "Take another interview with Manisha — it will focus on these areas." });

  // ── Interviewer's assessment, written from the data (no free-form AI text) ──
  const result = resultFor(readiness);
  const assessment = [
    `${scored.length} question${scored.length === 1 ? "" : "s"} answered${answered.length > scored.length ? ` (${answered.length - scored.length} not scored because the transcript was unclear)` : ""}.`,
    answeredWell.length ? `Strongest on ${answeredWell.slice(0, 3).join(", ")}.` : "No area reached a strong score yet.",
    weakSkills.length ? `Answers on ${weakSkills.slice(0, 3).join(", ")} needed more depth${topMissing.length ? ` — missing ideas included ${topMissing.slice(0, 3).join(", ")}` : ""}.` : "",
    claimsToStrengthen.length ? `${claimsToStrengthen.length} resume claim${claimsToStrengthen.length === 1 ? "" : "s"} needed a stronger explanation.` : claimsDefended.length ? "Resume claims that came up were explained convincingly." : "",
    `Overall: ${result.label}.`,
  ].filter(Boolean).join(" ");

  // ── Integrity: indicators for context, never proof ──
  const events = await prisma.interviewIntegrityEvent.groupBy({ by: ["type"], where: { sessionId: session.id }, _count: true });
  const integrity = Object.fromEntries(events.map((e) => [e.type, e._count]));
  const signalCount = events.filter((e) => e.type !== "SCREEN_SHARE_RESUMED").reduce((a, e) => a + e._count, 0);

  return {
    readiness,
    result,
    insufficientEvidence: scored.length < 5,
    dimensions,
    counts: {
      total: scored.length,
      correct: verdicts.filter((v) => v === "CORRECT").length,
      partial: verdicts.filter((v) => v === "PARTIAL").length,
      incorrect: verdicts.filter((v) => v === "INCORRECT").length,
      skipped: verdicts.filter((v) => v === "SKIPPED").length,
      unclear: answered.length - scored.length,
    },
    communication: dimensions.communication,
    areas,
    coverage,
    answeredWell,
    struggled,
    strongQuestions,
    needsWork,
    claimsDefended,
    claimsToStrengthen,
    assessment,
    recommendedQuestions: recommendedQuestions.map((q) => ({ ...q, planId: plan!.id })),
    revisionPlan,
    nextSteps: [
      ...topics.map((t) => ({ label: `Revise ${t.title}`, href: `/learn/topic/${t.slug}` })),
      ...struggled.filter((s) => !topics.some((t) => t.title.toLowerCase().includes(s.toLowerCase()))).slice(0, 3).map((s) => ({ label: `Practise interview questions on ${s}`, href: `/interviews?q=${encodeURIComponent(s)}` })),
      { label: "Take another interview", href: session.matchId ? `/career/analysis/${session.matchId}` : "/career?tab=interview" },
    ],
    integrity: {
      signals: integrity,
      total: signalCount,
      screenShareWarnings: session.screenShareWarnings,
      status: signalCount === 0 ? "No signals" : session.screenShareWarnings > 0 || signalCount >= 3 ? "Review recommended" : "Minor signals",
    },
    disclaimer: "This Technical Readiness Report is a preparation assessment generated from your answers. It is not an automated hiring decision.",
  };
}
