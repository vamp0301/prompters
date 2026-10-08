import type { PrepCategory, PrepPriority, PrepQuestion, Prisma } from "@prisma/client";
import { aiJson } from "../../ai/json.js";
import { enqueuePrep } from "../../jobs/prep-queue.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { storage } from "../../lib/storage.js";
import { AppError, conflict, notFound } from "../../utils/errors.js";
import { logEvent } from "../platform/events.js";
import { resumeParsedSchema } from "../career/schemas.js";
import { PREP_CATEGORIES } from "./allocation.js";
import { COLORS, createDoc, footer, keepTogether, rule, toBuffer, write, type Doc } from "./pdf.js";
import { prepPrompts } from "./prompts.js";
import { translationSchema } from "./schemas.js";

export const PACK_VARIANTS = ["QUESTIONS", "HINTS", "GUIDE", "TOPICS"] as const;
export const PACK_LANGUAGES = ["en", "hinglish", "hi"] as const;
export type PackVariant = (typeof PACK_VARIANTS)[number];
export type PackLanguage = (typeof PACK_LANGUAGES)[number];

type Localized = { question: string; hint: string; why: string; keyPoints: string[]; followUps: string[] };

// ───────────────────────── API-facing ─────────────────────────

export async function requestPack(userId: string, planId: string, variant: PackVariant, language: PackLanguage) {
  const plan = await prisma.prepPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw notFound("Preparation plan");
  if (plan.status !== "READY") throw conflict("Your questions are still being prepared.");
  // Practice progress is printed in the pack, so a pack is reused only until the next practice attempt.
  const lastAttempt = await prisma.prepAttempt.findFirst({ where: { userId, question: { planId } }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  const reusable = await prisma.prepPack.findFirst({
    where: { planId, variant, language, status: { in: ["QUEUED", "RUNNING", "READY"] }, ...(lastAttempt ? { createdAt: { gt: lastAttempt.createdAt } } : {}) },
    orderBy: { createdAt: "desc" },
  });
  if (reusable) return reusable;
  const pack = await prisma.prepPack.create({ data: { planId, userId, variant, language } });
  await enqueuePrep({ kind: "pack", packId: pack.id });
  await logEvent(userId, "prep_pack_requested", { meta: { planId, variant, language } });
  return pack;
}

export async function packFile(userId: string, planId: string, packId: string) {
  const pack = await prisma.prepPack.findFirst({ where: { id: packId, planId, userId }, include: { plan: { select: { title: true } } } });
  if (!pack) throw notFound("Interview pack");
  if (pack.status !== "READY" || !pack.storageKey) throw conflict("This pack isn't ready yet.");
  const obj = await storage().get(pack.storageKey);
  if (!obj) throw notFound("Interview pack");
  const slug = pack.plan.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "interview";
  return { body: obj.body, fileName: `prompters-${slug}-${pack.variant.toLowerCase()}-${pack.language}.pdf` };
}

export async function deletePackFiles(planIds: string[]) {
  const packs = await prisma.prepPack.findMany({ where: { planId: { in: planIds }, storageKey: { not: null } }, select: { storageKey: true } });
  await Promise.all(packs.map((p) => storage().delete(p.storageKey!).catch(() => undefined)));
}

// ───────────────────────── translation ─────────────────────────

const TRANSLATE_BATCH = 10;

function localized(q: PrepQuestion, language: PackLanguage): Localized | null {
  if (language === "en") return { question: q.question, hint: q.hint, why: q.why, keyPoints: q.keyPoints, followUps: q.followUps };
  const t = (q.translations as Record<string, Localized> | null)?.[language];
  return t?.question ? t : null;
}

type TranslatedItem = Localized & { id: string };

/**
 * One AI call for a batch. Items use short positional ids ("1", "2"…) rather than database ids,
 * which models sometimes mangle; anything still missing is retried on its own before giving up.
 */
async function translateBatch(batch: PrepQuestion[], language: Exclude<PackLanguage, "en">, retryMissing = true): Promise<Map<string, TranslatedItem>> {
  const p = prepPrompts.translate(language, batch.map((q, k) => ({ id: String(k + 1), question: q.question, hint: q.hint, why: q.why, keyPoints: q.keyPoints, followUps: q.followUps })));
  const out = await aiJson(`translate_${language}`, p.system, p.user, translationSchema, 8000, { timeoutMs: 120_000, fast: true });
  const byLocal = new Map(out.items.map((t) => [String(t.id).trim(), t]));
  const result = new Map<string, TranslatedItem>();
  const missing: PrepQuestion[] = [];
  batch.forEach((q, k) => {
    const t = byLocal.get(String(k + 1));
    if (t?.question?.trim()) result.set(q.id, t);
    else missing.push(q);
  });
  if (missing.length && retryMissing) {
    for (const q of missing) {
      const one = await translateBatch([q], language, false);
      const t = one.get(q.id);
      if (t) result.set(q.id, t);
    }
  }
  return result;
}

/** Translates whatever isn't cached yet, in small batches, and stores it on each question. */
async function ensureTranslations(questions: PrepQuestion[], language: Exclude<PackLanguage, "en">) {
  const missing = questions.filter((q) => !localized(q, language));
  for (let i = 0; i < missing.length; i += TRANSLATE_BATCH) {
    const batch = missing.slice(i, i + TRANSLATE_BATCH);
    const byId = await translateBatch(batch, language);
    for (const q of batch) {
      const t = byId.get(q.id);
      if (!t) throw new AppError(502, "AI_BAD_OUTPUT", "Translation came back incomplete. Please try again.");
      const translations = { ...((q.translations as object) ?? {}), [language]: { question: t.question, hint: t.hint, why: t.why, keyPoints: t.keyPoints, followUps: t.followUps } };
      await prisma.prepQuestion.update({ where: { id: q.id }, data: { translations: translations as Prisma.InputJsonValue } });
      q.translations = translations as Prisma.JsonValue;
    }
  }
}

// ───────────────────────── rendering ─────────────────────────

const L = {
  en: {
    subtitle: "Personalised Technical Interview Preparation",
    candidate: "Candidate", target: "Target", prepared: "Prepared", edition: "Edition",
    variants: { QUESTIONS: "Questions only", HINTS: "Questions + hints", GUIDE: "Complete preparation guide", TOPICS: "Topic-wise preparation guide" },
    byTopic: "Your preparation, topic by topic", topicWord: "Topic", startWith: "Start with", revise: "Revise these points", fromResume: "From your resume",
    yourPractice: "Your practice so far", notPractised: "Not practised yet", moreTopics: "More topics", contents: "Topics in this pack",
    how: "These questions were generated from YOUR resume and target. They are ranked by how likely an interviewer is to ask them. Prepare the INTENSE ones first.",
    summary: "At a glance", top: "Your Top {n} Interview Questions", byCategory: "Questions by category",
    hint: "Hint", why: "Why you'll be asked", evidence: "From your resume", keyPoints: "A strong answer covers", followUps: "Likely follow-ups",
    focus: "Skills to revise first", plan: "7-day preparation plan", questionsWord: "questions", practiced: "practised", avg: "avg score",
    day: "Day", mock: "Mock interview with Manisha — revisit every question you couldn't answer confidently.",
    planIntro: "Work through the questions in rank order, grouped by skill. Say every answer out loud in English.",
  },
  hinglish: {
    subtitle: "Personalised Technical Interview Preparation",
    candidate: "Candidate", target: "Target", prepared: "Prepared", edition: "Edition",
    variants: { QUESTIONS: "Sirf questions", HINTS: "Questions + hints", GUIDE: "Complete preparation guide", TOPICS: "Topic-wise preparation guide" },
    byTopic: "Aapki preparation, topic ke hisaab se", topicWord: "Topic", startWith: "Yahan se shuru karein", revise: "Ye points revise karein", fromResume: "Aapke resume se",
    yourPractice: "Ab tak ki practice", notPractised: "Abhi practice nahi ki", moreTopics: "Aur topics", contents: "Is pack ke topics",
    how: "Ye questions AAPKE resume aur target ke basis par banaye gaye hain, aur is order mein rank kiye gaye hain ki interviewer inhe kitna likely poochega. Pehle INTENSE wale prepare kijiye.",
    summary: "Ek nazar mein", top: "Aapke Top {n} Interview Questions", byCategory: "Category ke hisaab se questions",
    hint: "Hint", why: "Ye kyun poocha jayega", evidence: "Aapke resume se", keyPoints: "Strong answer mein ye cover karein", followUps: "Possible follow-ups",
    focus: "Pehle ye skills revise karein", plan: "7-din ka preparation plan", questionsWord: "questions", practiced: "practice kiye", avg: "avg score",
    day: "Din", mock: "Manisha ke saath mock interview — jo questions confidently nahi aaye, unhe dobara dekhiye.",
    planIntro: "Questions ko rank order mein, skill ke hisaab se group karke padhiye. Har answer English mein bol kar practice kijiye.",
  },
  hi: {
    subtitle: "व्यक्तिगत तकनीकी इंटरव्यू तैयारी",
    candidate: "उम्मीदवार", target: "लक्ष्य", prepared: "तैयार किया गया", edition: "संस्करण",
    variants: { QUESTIONS: "केवल प्रश्न", HINTS: "प्रश्न + संकेत", GUIDE: "संपूर्ण तैयारी गाइड", TOPICS: "विषय-वार तैयारी गाइड" },
    byTopic: "आपकी तैयारी, विषय के अनुसार", topicWord: "विषय", startWith: "यहाँ से शुरू करें", revise: "इन बातों को दोहराएँ", fromResume: "आपके resume से",
    yourPractice: "अब तक का अभ्यास", notPractised: "अभी अभ्यास नहीं किया", moreTopics: "अन्य विषय", contents: "इस पैक के विषय",
    how: "ये प्रश्न आपके resume और लक्ष्य के आधार पर बनाए गए हैं, और इस क्रम में रखे गए हैं कि interviewer इन्हें कितनी संभावना से पूछेगा। पहले INTENSE प्रश्न तैयार करें।",
    summary: "एक नज़र में", top: "आपके शीर्ष {n} इंटरव्यू प्रश्न", byCategory: "श्रेणी के अनुसार प्रश्न",
    hint: "संकेत", why: "यह क्यों पूछा जाएगा", evidence: "आपके resume से", keyPoints: "एक अच्छे उत्तर में ये बातें हों", followUps: "संभावित follow-up प्रश्न",
    focus: "पहले इन skills को दोहराएँ", plan: "7-दिन की तैयारी योजना", questionsWord: "प्रश्न", practiced: "अभ्यास किए", avg: "औसत स्कोर",
    day: "दिन", mock: "Manisha के साथ mock interview — जो प्रश्न आत्मविश्वास से नहीं आए, उन्हें दोबारा देखें।",
    planIntro: "प्रश्नों को रैंक के क्रम में, skill के अनुसार समूह बनाकर पढ़ें। हर उत्तर English में बोलकर अभ्यास करें।",
  },
} as const;

const CATEGORY_NAME: Record<PrepCategory, string> = { GENERAL: "General", SKILL: "Skill", PROJECT: "Project", CLAIM: "Resume claim", ACHIEVEMENT: "Achievement", CONCEPTUAL: "Conceptual", SCENARIO: "Scenario" };
const PRIORITY_NAME: Record<PrepPriority, string> = { INTENSE: "INTENSE", IMPORTANT: "IMPORTANT", GOOD: "GOOD", MAY_BE_ASKED: "MAY BE ASKED" };

interface SkillFocus {
  skill: string;
  count: number;
  intense: number;
  practiced: number;
  avg: number | null;
}

/** More INTENSE questions, more questions overall and weaker practice scores → revise sooner. */
const focusWeight = (f: SkillFocus) => f.intense * 3 + f.count + (f.avg === null ? 0 : (100 - f.avg) / 10);

/** Skills ordered by how much of the bank depends on them and how weak practice has been. */
export function skillFocus(questions: (PrepQuestion & { bestScore: number | null })[]): SkillFocus[] {
  const by = new Map<string, SkillFocus & { scores: number[] }>();
  for (const q of questions) {
    const key = q.skill.trim();
    const f = by.get(key.toLowerCase()) ?? { skill: key, count: 0, intense: 0, practiced: 0, avg: null, scores: [] };
    f.count++;
    if (q.priority === "INTENSE") f.intense++;
    if (q.bestScore !== null) {
      f.practiced++;
      f.scores.push(q.bestScore);
    }
    by.set(key.toLowerCase(), f);
  }
  return [...by.values()]
    .map(({ scores, ...f }) => ({ ...f, avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null }))
    .sort((a, b) => focusWeight(b) - focusWeight(a));
}

/** Deterministic 7-day plan: days 1–5 split the ranked bank by skill, day 6 project/claim deep-dives, day 7 mock interview. */
export function sevenDayPlan(questions: PrepQuestion[]) {
  const anchored = questions.filter((q) => q.category === "PROJECT" || q.category === "CLAIM" || q.category === "ACHIEVEMENT");
  const rest = questions.filter((q) => !anchored.includes(q));
  const bySkill = new Map<string, PrepQuestion[]>();
  for (const q of rest) bySkill.set(q.skill, [...(bySkill.get(q.skill) ?? []), q]);
  const groups = [...bySkill.entries()].sort((a, b) => Math.min(...a[1].map((q) => q.rank)) - Math.min(...b[1].map((q) => q.rank)));
  const days: { skills: string[]; ranks: number[] }[] = Array.from({ length: 5 }, () => ({ skills: [], ranks: [] }));
  const per = Math.ceil(rest.length / 5);
  let d = 0;
  for (const [skill, qs] of groups) {
    if (days[d].ranks.length >= per && d < 4) d++;
    days[d].skills.push(skill);
    days[d].ranks.push(...qs.map((q) => q.rank));
  }
  return { days, deepDive: anchored.map((q) => q.rank).sort((a, b) => a - b) };
}

type RankedQuestion = PrepQuestion & { bestScore: number | null };

export interface TopicGroup {
  topic: string;
  questions: RankedQuestion[];
  intense: number;
  practiced: number;
  avg: number | null;
}

/** The most common spelling of a topic; on a tie, the one with more capitals ("JWT" over "jwt"). */
function topicLabel(spellings: string[]) {
  const n = new Map<string, number>();
  for (const x of spellings) n.set(x, (n.get(x) ?? 0) + 1);
  const caps = (x: string) => (x.match(/[A-Z]/g) ?? []).length;
  return [...n.entries()].sort((a, b) => b[1] - a[1] || caps(b[0]) - caps(a[0]))[0][0];
}

/**
 * Splits the bank by topic (the question's skill), most important topic first. Topics with a
 * single question are gathered into one "more topics" group so the pack doesn't fragment.
 */
export function topicGroups(questions: RankedQuestion[], moreLabel = "More topics"): TopicGroup[] {
  const by = new Map<string, RankedQuestion[]>();
  for (const q of [...questions].sort((a, b) => a.rank - b.rank)) {
    const key = q.skill.trim().toLowerCase();
    by.set(key, [...(by.get(key) ?? []), q]);
  }
  const make = (topic: string, qs: RankedQuestion[]): TopicGroup => {
    const scores = qs.flatMap((q) => (q.bestScore === null ? [] : [q.bestScore]));
    return { topic, questions: qs, intense: qs.filter((q) => q.priority === "INTENSE").length, practiced: scores.length, avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null };
  };
  const groups: TopicGroup[] = [];
  const singles: RankedQuestion[] = [];
  for (const qs of by.values()) {
    if (qs.length >= 2) groups.push(make(topicLabel(qs.map((q) => q.skill.trim())), qs));
    else singles.push(...qs);
  }
  groups.sort((a, b) => focusWeight({ ...b, count: b.questions.length, skill: b.topic }) - focusWeight({ ...a, count: a.questions.length, skill: a.topic }));
  if (singles.length) groups.push(make(moreLabel, singles.sort((a, b) => a.rank - b.rank)));
  return groups;
}

/** The most repeated key points across a topic's questions — what to revise before anything else. */
export function topRevisionPoints(qs: { keyPoints: string[] }[], limit = 6) {
  const count = new Map<string, { text: string; n: number }>();
  for (const q of qs) {
    for (const k of new Set(q.keyPoints.map((x) => x.trim()).filter(Boolean))) {
      const key = k.toLowerCase();
      count.set(key, { text: count.get(key)?.text ?? k, n: (count.get(key)?.n ?? 0) + 1 });
    }
  }
  return [...count.values()].sort((a, b) => b.n - a.n).slice(0, limit).map((x) => x.text);
}

const ranksText = (ranks: number[]) => ranks.sort((a, b) => a - b).map((r) => `#${r}`).join(", ");

function questionBlock(doc: Doc, q: PrepQuestion, t: Localized, packVariant: PackVariant, l: (typeof L)[PackLanguage]) {
  // Inside a topic section the revision points are already summarised, so each question shows its hint only.
  const variant = packVariant === "TOPICS" ? "HINTS" : packVariant;
  keepTogether(doc, variant === "QUESTIONS" ? 48 : 110);
  const meta = `${PRIORITY_NAME[q.priority]} · ${CATEGORY_NAME[q.category]} · ${q.skill} · L${q.difficulty} · ${Math.round(q.probability * 100)}%`;
  doc.font("bold").fontSize(8).fillColor(COLORS[q.priority]).text(meta, doc.page.margins.left, doc.y);
  write(doc, `${q.rank}. ${t.question}`, { size: 10.5, bold: true, gap: 0.2 });
  if (variant !== "QUESTIONS") write(doc, `${l.hint}: ${t.hint}`, { size: 9, color: COLORS.muted, indent: 12, gap: 0.15 });
  if (variant === "GUIDE") {
    write(doc, `${l.why}: ${t.why}`, { size: 9, color: COLORS.muted, indent: 12, gap: 0.15 });
    if (q.evidence) write(doc, `${l.evidence}: “${q.evidence}”`, { size: 9, color: COLORS.muted, indent: 12, gap: 0.15 });
    write(doc, `${l.keyPoints}:`, { size: 9, bold: true, indent: 12 });
    for (const k of t.keyPoints) write(doc, `•  ${k}`, { size: 9, indent: 22 });
    if (t.followUps.length) {
      write(doc, `${l.followUps}:`, { size: 9, bold: true, indent: 12 });
      for (const f of t.followUps) write(doc, `–  ${f}`, { size: 9, color: COLORS.muted, indent: 22 });
    }
  }
  doc.moveDown(variant === "QUESTIONS" ? 0.5 : 0.8);
}

export async function renderPack(input: {
  candidate: string;
  title: string;
  variant: PackVariant;
  language: PackLanguage;
  questions: (PrepQuestion & { bestScore: number | null })[];
  date?: Date;
}) {
  const l = L[input.language];
  const qs = [...input.questions].sort((a, b) => a.rank - b.rank);
  const doc = createDoc({ title: `Prompters — ${input.title}`, author: input.candidate });

  // Cover
  doc.moveDown(4);
  write(doc, "PROMPTERS", { size: 12, bold: true, color: COLORS.accent, gap: 0.3 });
  write(doc, l.subtitle, { size: 24, bold: true, gap: 1.5 });
  const date = (input.date ?? new Date()).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  for (const [k, v] of [[l.candidate, input.candidate], [l.target, input.title], [l.prepared, date], [l.edition, l.variants[input.variant]]]) {
    write(doc, k, { size: 9, color: COLORS.subtle });
    write(doc, v, { size: 13, bold: true, gap: 0.6 });
  }
  rule(doc, 1.2);
  write(doc, l.how, { size: 10, color: COLORS.muted, gap: 1 });
  write(doc, l.summary, { size: 12, bold: true, gap: 0.3 });
  const priorities: PrepPriority[] = ["INTENSE", "IMPORTANT", "GOOD", "MAY_BE_ASKED"];
  write(doc, priorities.map((p) => `${PRIORITY_NAME[p]} ${qs.filter((q) => q.priority === p).length}`).join("   ·   "), { size: 10, gap: 0.2 });
  write(doc, PREP_CATEGORIES.filter((c) => qs.some((q) => q.category === c)).map((c) => `${CATEGORY_NAME[c]} ${qs.filter((q) => q.category === c).length}`).join("   ·   "), { size: 10, color: COLORS.muted });

  const loc = (q: PrepQuestion) => localized(q, input.language) ?? localized(q, "en")!;
  if (input.variant === "TOPICS") {
    renderTopics(doc, qs, loc, l);
  } else {
    // Ranked Top N
    doc.addPage();
    write(doc, l.top.replace("{n}", String(qs.length)), { size: 16, bold: true, gap: 0.6 });
    for (const q of qs) questionBlock(doc, q, loc(q), input.variant, l);
  }

  // Category index
  doc.addPage();
  write(doc, l.byCategory, { size: 14, bold: true, gap: 0.5 });
  for (const c of PREP_CATEGORIES) {
    const inCat = qs.filter((q) => q.category === c);
    if (!inCat.length) continue;
    write(doc, `${CATEGORY_NAME[c]} (${inCat.length})`, { size: 10, bold: true });
    write(doc, ranksText(inCat.map((q) => q.rank)), { size: 9, color: COLORS.muted, gap: 0.5 });
  }

  if (input.variant === "GUIDE") {
    rule(doc, 1);
    write(doc, l.focus, { size: 14, bold: true, gap: 0.4 });
    for (const f of skillFocus(qs).slice(0, 12)) {
      const practice = f.practiced ? ` · ${f.practiced} ${l.practiced}, ${l.avg} ${f.avg}%` : "";
      write(doc, `•  ${f.skill} — ${f.count} ${l.questionsWord}${f.intense ? ` (${f.intense} INTENSE)` : ""}${practice}`, { size: 10, gap: 0.1 });
    }
    doc.moveDown(0.6);
  }
  if (input.variant === "GUIDE" || input.variant === "TOPICS") {
    keepTogether(doc, 200);
    write(doc, l.plan, { size: 14, bold: true, gap: 0.3 });
    write(doc, l.planIntro, { size: 9.5, color: COLORS.muted, gap: 0.4 });
    const plan = sevenDayPlan(qs);
    plan.days.forEach((d, i) => {
      if (!d.ranks.length) return;
      write(doc, `${l.day} ${i + 1}: ${d.skills.slice(0, 6).join(", ")}${d.skills.length > 6 ? "…" : ""}`, { size: 10, bold: true });
      write(doc, ranksText(d.ranks), { size: 9, color: COLORS.muted, gap: 0.3 });
    });
    if (plan.deepDive.length) {
      write(doc, `${l.day} 6: ${CATEGORY_NAME.PROJECT} / ${CATEGORY_NAME.CLAIM} / ${CATEGORY_NAME.ACHIEVEMENT}`, { size: 10, bold: true });
      write(doc, ranksText(plan.deepDive), { size: 9, color: COLORS.muted, gap: 0.3 });
    }
    write(doc, `${l.day} 7: ${l.mock}`, { size: 10, bold: true });
  }

  footer(doc, `Prompters · ${input.candidate} · ${input.title}`);
  return toBuffer(doc);
}

/** Topic-wise edition: a contents page, then per topic a personal prep box followed by its questions. */
function renderTopics(doc: Doc, qs: RankedQuestion[], loc: (q: PrepQuestion) => Localized, l: (typeof L)[PackLanguage]) {
  const groups = topicGroups(qs, l.moreTopics);
  doc.addPage();
  write(doc, l.byTopic, { size: 16, bold: true, gap: 0.5 });
  write(doc, l.contents, { size: 10, bold: true, color: COLORS.muted, gap: 0.2 });
  groups.forEach((g, i) => {
    write(doc, `${i + 1}.  ${g.topic} — ${g.questions.length} ${l.questionsWord}${g.intense ? ` · ${g.intense} INTENSE` : ""}`, { size: 10, gap: 0.1 });
  });

  groups.forEach((g, i) => {
    doc.addPage();
    write(doc, `${l.topicWord} ${i + 1}`, { size: 9, color: COLORS.subtle });
    write(doc, g.topic, { size: 18, bold: true, gap: 0.1 });
    write(doc, `${g.questions.length} ${l.questionsWord}${g.intense ? ` · ${g.intense} INTENSE` : ""}`, { size: 9.5, color: COLORS.muted, gap: 0.5 });

    // Personal prep box, computed from this candidate's own questions, evidence and practice.
    const first = g.questions.filter((q) => q.priority === "INTENSE" || q.priority === "IMPORTANT").slice(0, 3);
    write(doc, `${l.startWith}:  ${ranksText((first.length ? first : g.questions.slice(0, 3)).map((q) => q.rank))}`, { size: 10, bold: true, gap: 0.3 });
    const points = topRevisionPoints(g.questions.map(loc));
    if (points.length) {
      write(doc, `${l.revise}:`, { size: 10, bold: true });
      for (const p of points) write(doc, `•  ${p}`, { size: 9.5, indent: 10 });
      doc.moveDown(0.3);
    }
    const evidence = [...new Set(g.questions.map((q) => q.evidence.trim()).filter(Boolean))].slice(0, 2);
    if (evidence.length) {
      write(doc, `${l.fromResume}:`, { size: 10, bold: true });
      for (const e of evidence) write(doc, `“${e}”`, { size: 9.5, color: COLORS.muted, indent: 10 });
      doc.moveDown(0.3);
    }
    write(doc, `${l.yourPractice}: ${g.practiced ? `${g.practiced}/${g.questions.length} ${l.practiced} · ${l.avg} ${g.avg}%` : l.notPractised}`, { size: 9.5, color: COLORS.muted });
    rule(doc, 0.9);
    for (const q of g.questions) questionBlock(doc, q, loc(q), "TOPICS", l);
  });
}

// ───────────────────────── worker ─────────────────────────

export async function runPack(packId: string) {
  const pack = await prisma.prepPack.findUnique({ where: { id: packId }, include: { plan: { include: { resume: true, user: { select: { name: true } } } } } });
  if (!pack || pack.status === "READY") return;
  await prisma.prepPack.update({ where: { id: pack.id }, data: { status: "RUNNING", error: null } });
  try {
    const questions = await prisma.prepQuestion.findMany({ where: { planId: pack.planId }, orderBy: { rank: "asc" }, include: { attempts: { select: { score: true } } } });
    const language = pack.language as PackLanguage;
    if (language !== "en") await ensureTranslations(questions, language);
    const parsed = resumeParsedSchema.safeParse(pack.plan.resume.parsed);
    const pdf = await renderPack({
      candidate: (parsed.success && parsed.data.name) || pack.plan.user.name,
      title: pack.plan.title,
      variant: pack.variant as PackVariant,
      language,
      questions: questions.map(({ attempts, ...q }) => ({ ...q, bestScore: attempts.length ? Math.max(...attempts.map((a) => a.score)) : null })),
    });
    const key = `prep-packs/${pack.userId}/${pack.id}.pdf`;
    await storage().put(key, pdf, "application/pdf");
    await prisma.prepPack.update({ where: { id: pack.id }, data: { status: "READY", storageKey: key, completedAt: new Date() } });
  } catch (e) {
    logger.error({ err: e, packId }, "Prep pack failed");
    await prisma.prepPack.update({ where: { id: packId }, data: { status: "FAILED", error: e instanceof AppError ? e.message : "Couldn't build the PDF. Please try again." } });
  }
}
