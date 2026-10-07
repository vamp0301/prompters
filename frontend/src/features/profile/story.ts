import type { ProjectDetail, ProjectSubmissionRecord } from "@/lib/api/types";

/** Trim, collapse whitespace and make sure the text ends with punctuation. */
export function sentence(s: string) {
  const t = s.trim().replace(/\s+/g, " ");
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/** First sentence of a longer answer (for the short pitch). */
export function firstSentence(s: string) {
  const t = s.trim().replace(/\s+/g, " ");
  const m = t.match(/^.+?[.!?](\s|$)/);
  return sentence(m ? m[0] : t);
}

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const stripEnd = (s: string) => s.replace(/[.!?]+$/, "");

export interface Story {
  situation: string;
  task: string;
  action: string;
  result: string;
  pitch: string;
}

/** Template-only STAR story + 30-second pitch from the learner's own submission. No AI, nothing invented. */
export function buildStory(p: ProjectDetail, s: ProjectSubmissionRecord): Story {
  const how = s.howIBuiltIt;
  const tech = p.technologies.length ? ` using ${p.technologies.join(", ")}` : "";
  const reqs = p.requirements.slice(0, 3).map(stripEnd);

  const situation = sentence(`${p.title}: ${stripEnd(p.description.trim())}`);
  const task = sentence(
    reqs.length
      ? `I had to build ${p.title}${tech}, covering requirements such as ${reqs.map(lowerFirst).join("; ")}`
      : `I had to build ${p.title}${tech} from scratch`,
  );
  const action = sentence(how.approach);
  const scores = `I explained my code with a score of ${s.explainScore}/100 and an independence score of ${s.independenceScore}/100${s.hintsUsed ? ` (${s.hintsUsed} hint${s.hintsUsed === 1 ? "" : "s"} used)` : " without using hints"}`;
  const result = [`Bug I fixed: ${sentence(how.bugFixed)}`, `Trade-off I made: ${sentence(how.tradeoff)}`, sentence(scores)].join(" ");

  const pitch = [
    sentence(`I built ${p.title}${tech} — ${lowerFirst(stripEnd(firstSentence(p.description)))}`),
    `My approach: ${firstSentence(how.approach)}`,
    `The trickiest bug was this: ${firstSentence(how.bugFixed)}`,
    `One trade-off I made: ${firstSentence(how.tradeoff)}`,
    sentence(`The code is on ${s.repoUrl}${s.liveUrl ? ` and it is live at ${s.liveUrl}` : ""}`),
  ].join(" ");

  return { situation, task, action, result, pitch };
}

export function storyToText(title: string, st: Story) {
  return [
    `${title} — STAR story`,
    "",
    `Situation: ${st.situation}`,
    `Task: ${st.task}`,
    `Action: ${st.action}`,
    `Result: ${st.result}`,
    "",
    "30-second pitch:",
    st.pitch,
  ].join("\n");
}
