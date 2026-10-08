import type { Candidate } from "./candidates.js";

/**
 * Turns machine-readable reasons into one or two plain sentences, using only the numbers behind
 * them. No model writes these, so an explanation can never claim something the data doesn't say.
 */

export const REASON_LABEL: Record<string, string> = {
  low_mastery: "Low mastery",
  not_yet_practised: "Not practised yet",
  in_job_description: "In your job description",
  high_role_relevance: "Core for your target role",
  on_your_resume: "On your resume",
  interview_weakness: "Weak in your interview",
  due_for_review: "Due for review",
  high_forgetting_risk: "Likely to be forgotten",
  matches_your_level: "Right difficulty for you",
  often_asked: "Often asked",
  next_in_roadmap: "Next on your roadmap",
  prerequisites_satisfied: "Prerequisites done",
  read_but_not_tested: "Read, not tested",
  prerequisite_gap: "Prerequisite gap",
  unfinished_build: "Unfinished build",
  started_not_proven: "Started, not proven",
  increase_difficulty: "Ready for harder",
  decrease_difficulty: "Step back a level",
  project_weakness: "Weak in your project interview",
};

const ACTION_VERB: Record<Candidate["action"], string> = {
  LEARN_TOPIC: "Start learning",
  TAKE_QUIZ: "Take the quiz",
  REVISE_TOPIC: "Revise",
  REVISIT_PREREQUISITE: "Revisit",
  PRACTICE_SKILL: "Practise",
  PRACTICE_QUESTION: "Answer",
  FINISH_BUILD: "Finish the build",
  LEARN_CONCEPT: "Prove you understand",
  PRACTICE_PROJECT: "Review, then re-test",
};

export const actionLabel = (a: Candidate["action"]) => ACTION_VERB[a];

export function explain(c: Pick<Candidate, "action" | "subject" | "reasons" | "facts">) {
  const f = c.facts;
  const has = (r: string) => c.reasons.includes(r);
  const parts: string[] = [];
  switch (c.action) {
    case "LEARN_TOPIC":
      parts.push(`${c.subject} is next on your roadmap${f.stage ? ` (${f.stage})` : ""} and its prerequisites are done.`);
      break;
    case "TAKE_QUIZ":
      parts.push(`You've read ${c.subject} but haven't passed its quiz yet — testing it is what makes it stick.`);
      break;
    case "REVISE_TOPIC":
      parts.push(
        has("due_for_review")
          ? `${c.subject} is due for review${f.daysSinceSeen !== null && f.daysSinceSeen !== undefined ? ` — last practised ${f.daysSinceSeen} day${f.daysSinceSeen === 1 ? "" : "s"} ago` : ""}.`
          : `There's a ${f.forgettingRisk}% chance you've started forgetting ${c.subject}.`,
      );
      break;
    case "REVISIT_PREREQUISITE":
      parts.push(`Your last ${f.blockedTopic} quiz scored ${f.lastScore ?? "below the pass mark"}${typeof f.lastScore === "number" ? "%" : ""}; ${c.subject} underneath it looks weak.`);
      break;
    case "PRACTICE_SKILL":
    case "PRACTICE_QUESTION":
    case "LEARN_CONCEPT": {
      const evidence = typeof f.evidence === "number" && f.evidence > 0 ? `${f.mastery}% from ${f.evidence} answer${f.evidence === 1 ? "" : "s"}` : null;
      if (has("interview_weakness") && f.interviewAverage !== null && f.interviewAverage !== undefined) parts.push(`Your interview answers on ${c.subject} averaged ${f.interviewAverage}%.`);
      else if (has("low_mastery") && evidence) parts.push(`${c.subject} is one of your weaker areas (${evidence}).`);
      else if (has("not_yet_practised")) parts.push(`You haven't practised ${c.subject} yet.`);
      if (has("in_job_description")) parts.push(`It's required in ${f.job ? `the ${f.job} job description` : "your job description"}.`);
      else if (has("high_role_relevance")) parts.push(`It's core for a ${f.role ?? "your target"} role.`);
      if (c.action === "PRACTICE_QUESTION") {
        if (has("increase_difficulty")) parts.push("Your recent answers say you're ready for a harder one.");
        if (has("decrease_difficulty")) parts.push("This one is a step easier, to rebuild confidence.");
        if (has("often_asked")) parts.push(`Interviewers ask it often (likelihood ${f.importance}%).`);
      }
      if (c.action === "LEARN_CONCEPT") parts.push(f.explainScore !== null && f.explainScore !== undefined ? `Your last explanation scored ${f.explainScore}/100 — 75 proves it.` : "Explaining it in 60 seconds proves it.");
      break;
    }
    case "PRACTICE_PROJECT":
      parts.push(`In your ${f.project} knowledge test, ${c.subject} answers averaged ${f.projectScore}%.`);
      parts.push(`Review it, then re-test the project — interviewers who pick ${f.project} will drill into it.`);
      break;
    case "FINISH_BUILD":
      parts.push(`You started ${c.subject}${f.total ? ` and pass ${f.passed}/${f.total} tests` : ""}${typeof f.idleDays === "number" && f.idleDays > 0 ? `; untouched for ${f.idleDays} day${f.idleDays === 1 ? "" : "s"}` : ""}.`);
      break;
  }
  return parts.join(" ");
}
