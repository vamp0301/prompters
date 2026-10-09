import { canonicalSkill } from "../prep/text.js";
import { findCompetency, taxonomy } from "../roles/taxonomy.js";

/**
 * How learning content for a skill is framed. "technical": the original software-skill prompts
 * (code examples where they fit). "professional": competencies of non-coding careers — product
 * sense, segmentation, negotiation, Excel, Figma… — taught through methods, cases and measures,
 * never code. Skills outside the taxonomy keep the technical framing (unchanged behaviour).
 */
export type Framing = "technical" | "professional";

export function skillFraming(skill: string): Framing {
  const c = canonicalSkill(skill) ? findCompetency(skill) : null;
  if (!c || c.code) return "technical";
  const key = c.key;
  if (c.kind !== "TOOL" && c.kind !== "TECHNICAL") return "professional";
  // A tool or technical topic that only non-software careers use (Excel, Figma, CRM) is professional.
  const usedBySoftware = [...taxonomy().roles.values()].some((r) => r.family === "software" && r.competencies.some((x) => x.key === key));
  return usedBySoftware ? "technical" : "professional";
}

/** Level names for chapters (the level-check questions). */
export const LEVEL_NAMES: Record<Framing, string[]> = {
  technical: ["Beginner", "Developer", "Production", "System design", "Interview"],
  professional: ["Beginner", "Practitioner", "Applied", "Strategy", "Interview"],
};
