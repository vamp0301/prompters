import { Badge } from "@/components/ui/badge";
import type { PrepCategory, PrepPackLanguage, PrepPackVariant, PrepPriority, PrepQuestion } from "@/lib/api/types";

type Tone = "danger" | "warn" | "accent" | "info" | "neutral";

export const PRIORITY_ORDER: PrepPriority[] = ["INTENSE", "IMPORTANT", "GOOD", "MAY_BE_ASKED"];
export const PRIORITY: Record<PrepPriority, { label: string; emoji: string; tone: Tone; copy: string }> = {
  INTENSE: { label: "Intense", emoji: "🔴", tone: "danger", copy: "Very likely to be asked" },
  IMPORTANT: { label: "Important", emoji: "🟠", tone: "warn", copy: "Likely to come up" },
  GOOD: { label: "Good", emoji: "🟢", tone: "accent", copy: "Good to prepare" },
  MAY_BE_ASKED: { label: "May be asked", emoji: "⚪", tone: "neutral", copy: "Possible, depending on the interviewer" },
};

/** Display order of categories (matches the generation progress list). */
export const PREP_CATEGORY_ORDER: PrepCategory[] = ["GENERAL", "SKILL", "PROJECT", "CLAIM", "ACHIEVEMENT", "CONCEPTUAL", "SCENARIO"];
export const PREP_CATEGORY: Record<PrepCategory, { label: string; short: string; emoji: string; tone: Tone }> = {
  GENERAL: { label: "General questions", short: "General", emoji: "🟠", tone: "warn" },
  SKILL: { label: "Skill questions", short: "Skill", emoji: "🔵", tone: "info" },
  PROJECT: { label: "Project questions", short: "Project", emoji: "🟣", tone: "neutral" },
  CLAIM: { label: "Resume questions", short: "Resume claim", emoji: "📌", tone: "neutral" },
  ACHIEVEMENT: { label: "Achievement", short: "Achievement", emoji: "🟢", tone: "accent" },
  CONCEPTUAL: { label: "Conceptual", short: "Conceptual", emoji: "⚫", tone: "neutral" },
  SCENARIO: { label: "Scenario", short: "Scenario", emoji: "🛠", tone: "neutral" },
};

export const DIFFICULTY: Record<number, string> = { 1: "L1 Fundamental", 2: "L2 Practical", 3: "L3 Deep", 4: "L4 Scenario", 5: "L5 Architecture" };

export const PACK_VARIANTS: { value: PrepPackVariant; label: string; description: string }[] = [
  { value: "QUESTIONS", label: "Questions only", description: "All questions ranked by likelihood, with priority, category and skill." },
  { value: "HINTS", label: "Questions + hints", description: "Each question with a short nudge towards a strong answer." },
  { value: "GUIDE", label: "Complete preparation guide", description: "Hints, why you'll be asked, resume evidence, key points, follow-ups, skills to revise and a 7-day plan." },
];

export const PACK_LANGUAGES: { value: PrepPackLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hinglish", label: "Hinglish" },
  { value: "hi", label: "Hindi" },
];

export function QuestionBadges({ q, compact }: { q: Pick<PrepQuestion, "priority" | "category" | "skill" | "difficulty" | "probability">; compact?: boolean }) {
  const p = PRIORITY[q.priority];
  const c = PREP_CATEGORY[q.category];
  return (
    <span className="flex flex-wrap items-center gap-1">
      <Badge tone={p.tone}>
        {p.emoji} {p.label.toUpperCase()}
      </Badge>
      <Badge tone={c.tone}>
        {c.emoji} {c.short}
      </Badge>
      <Badge>{q.skill}</Badge>
      {!compact && <Badge>{DIFFICULTY[q.difficulty] ?? `L${q.difficulty}`}</Badge>}
      <span className="font-mono text-[11px] text-subtle tabular-nums" title="Likelihood an interviewer asks this">
        {Math.round(q.probability * 100)}%
      </span>
    </span>
  );
}
