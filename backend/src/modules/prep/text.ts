/** Pure text helpers for resume sectioning, evidence matching, skill mapping and duplicate detection. */

export type SectionKind = "SUMMARY" | "EXPERIENCE" | "PROJECT" | "SKILL" | "ACHIEVEMENT" | "EDUCATION" | "CERTIFICATION" | "OTHER";

export interface Section {
  index: number;
  heading: string;
  kind: SectionKind;
  text: string;
}

const HEADINGS: [SectionKind, RegExp][] = [
  ["SUMMARY", /^(professional\s+)?(summary|profile|objective|about( me)?|career objective)$/],
  ["EXPERIENCE", /^(work\s+|professional\s+|relevant\s+)?(experience|employment( history)?|internships?|work history|positions? of responsibility)$/],
  ["PROJECT", /^(academic\s+|personal\s+|key\s+|major\s+|selected\s+|technical\s+)?projects?( work)?$/],
  ["SKILL", /^(technical\s+|key\s+|core\s+)?(skills|skill set|technologies|tech stack|tools( (and|&) technologies)?|competencies)$/],
  ["ACHIEVEMENT", /^(achievements?|accomplishments?|awards?( (and|&) achievements?)?|honou?rs( (and|&) awards)?|competitive programming|extra[- ]?curricular( activities)?|hackathons?|open[- ]source( contributions?)?)$/],
  ["EDUCATION", /^(education(al)?( background| qualifications?)?|academics?|academic background)$/],
  ["CERTIFICATION", /^(certifications?|certificates?|licen[cs]es( (and|&) certifications)?|courses?)$/],
];

/** Classifies a line as a section heading (short, no sentence punctuation, matches a known heading). */
export function headingKind(line: string): SectionKind | null {
  const t = line.trim().replace(/[:：\-–—|•]+$/, "").trim().toLowerCase();
  if (!t || t.length > 40 || /[.,;]/.test(t)) return null;
  for (const [kind, re] of HEADINGS) if (re.test(t)) return kind;
  return null;
}

/** PDF text → ordered sections. Falls back to one OTHER section when no headings are recognised. */
export function sectionize(text: string): Section[] {
  const lines = text.split(/\r?\n/);
  const sections: Section[] = [];
  let current: Section = { index: 0, heading: "Header", kind: "SUMMARY", text: "" };
  for (const line of lines) {
    const kind = headingKind(line);
    if (kind) {
      if (current.text.trim()) sections.push({ ...current, text: current.text.trim() });
      current = { index: 0, heading: line.trim().replace(/[:：]+$/, ""), kind, text: "" };
    } else {
      current.text += `${line}\n`;
    }
  }
  if (current.text.trim()) sections.push({ ...current, text: current.text.trim() });
  if (sections.length <= 1) return [{ index: 0, heading: "Resume", kind: "OTHER", text: text.trim() }];
  return sections.map((s, i) => ({ ...s, index: i }));
}

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOP = new Set(
  "a an the and or of to in on for with without by at from as is are was were be been it its this that these those you your yours how what why when where which who whom do does did can could would should will shall may might into about over under than then there their them they we our i me my explain describe tell walk through".split(
    " ",
  ),
);

/** Light stemming so "indexes"/"index" and "handling"/"handle" count as the same word. */
const stem = (w: string) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w);

export const contentTokens = (s: string) => new Set(normalize(s).split(" ").filter((w) => w.length > 1 && !STOP.has(w)).map(stem));

export function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * True when `evidence` really comes from the resume: either a normalised substring, or
 * at least 75% of its meaningful words appear in the resume (tolerates PDF line breaks).
 */
export function evidenceInResume(evidence: string, resumeText: string) {
  const ev = normalize(evidence);
  if (ev.length < 8) return false;
  const doc = normalize(resumeText);
  if (doc.includes(ev)) return true;
  const words = ev.split(" ").filter((w) => w.length > 2);
  if (words.length < 3) return false;
  const docWords = new Set(doc.split(" "));
  return words.filter((w) => docWords.has(w)).length / words.length >= 0.75;
}

const ALIASES: Record<string, string> = {
  node: "nodejs",
  "node js": "nodejs",
  "node.js": "nodejs",
  nodejs: "nodejs",
  express: "expressjs",
  "express js": "expressjs",
  expressjs: "expressjs",
  react: "reactjs",
  "react js": "reactjs",
  reactjs: "reactjs",
  next: "nextjs",
  "next js": "nextjs",
  nextjs: "nextjs",
  js: "javascript",
  ts: "typescript",
  mongo: "mongodb",
  "mongo db": "mongodb",
  postgres: "postgresql",
  psql: "postgresql",
  k8s: "kubernetes",
  "rest api": "rest",
  "rest apis": "rest",
  "restful apis": "rest",
  "restful api": "rest",
  restful: "rest",
  "machine learning": "ml",
  "deep learning": "dl",
  dsa: "data structures algorithms",
  "data structures": "data structures algorithms",
  algorithms: "data structures algorithms",
  "amazon web services": "aws",
  "ci cd": "cicd",
  "c plus plus": "c++",
  cpp: "c++",
};

/** Canonical key for a skill name ("Node.js", "node js", "NodeJS" → "nodejs"). */
export function canonicalSkill(skill: string) {
  const n = normalize(skill.replace(/\.js\b/gi, "js"));
  return ALIASES[n] ?? n.replace(/\s+js$/, "js");
}

/**
 * Builds a matcher for a set of skills. A question skill maps when its canonical form
 * equals a known skill or contains one as a whole word ("MongoDB indexing" → mongodb).
 */
export function skillMatcher(skills: Iterable<string>) {
  const known = new Map<string, string>();
  for (const s of skills) if (s.trim()) known.set(canonicalSkill(s), s.trim());
  return (skill: string): string | null => {
    const c = canonicalSkill(skill);
    if (!c) return null;
    if (known.has(c)) return known.get(c)!;
    const words = ` ${c} `;
    for (const [k, label] of known) {
      if (k.length >= 2 && (words.includes(` ${k} `) || ` ${k} `.includes(words))) return label;
    }
    // Multi-word skills: every word of the known skill appears ("data structures algorithms" ⊂ "algorithms data structures").
    const cw = new Set(c.split(" "));
    for (const [k, label] of known) {
      const kw = k.split(" ");
      if (kw.length > 1 && kw.every((w) => cw.has(w))) return label;
    }
    return null;
  };
}

const resumeLines = (resumeText: string) =>
  resumeText
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s•●▪◦\-–*]+/, "").trim())
    .filter((l) => l.length >= 15);

/**
 * Evidence shown as "from your resume" must be the candidate's own words. Returns the
 * text unchanged when it is literally in the resume (ignoring case/punctuation/line
 * breaks), otherwise the resume line that best supports it, otherwise "".
 */
export function verbatimEvidence(text: string, resumeText: string) {
  const t = text.trim();
  if (!t) return "";
  const n = normalize(t);
  if (n.length >= 8 && normalize(resumeText).includes(n)) return t;
  const want = contentTokens(t);
  let best = "";
  let bestShared = 0;
  for (const line of resumeLines(resumeText)) {
    const tokens = contentTokens(line);
    let shared = 0;
    for (const w of tokens) if (want.has(w)) shared++;
    if (shared > bestShared && shared >= 3 && shared / tokens.size >= 0.4) {
      best = line;
      bestShared = shared;
    }
  }
  return best;
}
