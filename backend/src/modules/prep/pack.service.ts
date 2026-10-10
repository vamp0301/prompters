import type { PrepCategory, PrepPriority, PrepQuestion, Prisma } from "@prisma/client";
import { aiJson } from "../../ai/json.js";
import { fileStorageEnabled } from "../../config/env.js";
import { enqueuePrep } from "../../jobs/prep-queue.js";
import { LockBusyError, withLock } from "../../lib/lock.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { storage } from "../../lib/storage.js";
import { AppError, conflict, notFound } from "../../utils/errors.js";
import { logEvent } from "../platform/events.js";
import { resumeParsedSchema } from "../career/schemas.js";
import { PREP_CATEGORIES } from "./allocation.js";
import { barChart, COLORS, drawMark, contentWidth, createDoc, flowChart, footer, heading, keepTogether, PALETTE, pill, rule, stackedBar, stepFlow, textAt, textHeight, toBuffer, write, type Doc } from "./pdf.js";
import { prepPrompts } from "./prompts.js";
import { translationSchema } from "./schemas.js";

export const PACK_VARIANTS = ["QUESTIONS", "HINTS", "GUIDE", "TOPICS"] as const;
export const PACK_LANGUAGES = ["en", "hinglish", "hi"] as const;
export type PackVariant = (typeof PACK_VARIANTS)[number];
export type PackLanguage = (typeof PACK_LANGUAGES)[number];

type Localized = { question: string; hint: string; why: string; keyPoints: string[]; followUps: string[] };

// ───────────────────────── API-facing ─────────────────────────

export async function requestPack(userId: string, planId: string, variant: PackVariant, language: PackLanguage) {
  // Check-then-create below: one request at a time per plan, so a double-click makes one PDF.
  return withLock(`lock:prep-pack:${userId}:${planId}`, 15_000, () => requestPackLocked(userId, planId, variant, language), 5_000).catch((e) => {
    if (e instanceof LockBusyError) throw conflict("Your PDF is already being requested. Try again in a moment.");
    throw e;
  });
}

async function requestPackLocked(userId: string, planId: string, variant: PackVariant, language: PackLanguage) {
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
  if (pack.status !== "READY") throw conflict("This pack isn't ready yet.");
  // Without file storage (or if a stored copy is gone) the PDF is rebuilt from the saved plan and translations.
  const stored = pack.storageKey ? await storage().get(pack.storageKey) : null;
  const body = stored?.body ?? (await buildPdf(pack.id));
  const slug = pack.plan.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "interview";
  return { body, fileName: `prompters-${slug}-${pack.variant.toLowerCase()}-${pack.language}.pdf` };
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
    priorityMix: "Priority mix", categoryMix: "Question types", howTo: "How to prepare with this pack", skillsChart: "Questions per skill",
    flow: [
      ["Read the question", "Start with the INTENSE ones"],
      ["Recall the key points", "Use the hint only if stuck"],
      ["Answer out loud", "In English, 1–2 minutes"],
      ["Practise in Prompters", "Get a score and feedback"],
      ["Mock interview", "With Manisha, before the real one"],
    ],
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
    priorityMix: "Priority ka mix", categoryMix: "Question ke types", howTo: "Is pack se kaise prepare karein", skillsChart: "Har skill ke questions",
    flow: [
      ["Question padhiye", "INTENSE wale pehle"],
      ["Key points yaad kijiye", "Atakne par hi hint dekhiye"],
      ["Bol kar answer dijiye", "English mein, 1–2 minute"],
      ["Prompters par practice", "Score aur feedback paiye"],
      ["Mock interview", "Manisha ke saath, asli interview se pehle"],
    ],
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
    priorityMix: "प्राथमिकता का मिश्रण", categoryMix: "प्रश्नों के प्रकार", howTo: "इस पैक से तैयारी कैसे करें", skillsChart: "हर skill के प्रश्न",
    flow: [
      ["प्रश्न पढ़ें", "पहले INTENSE प्रश्न"],
      ["मुख्य बातें याद करें", "अटकें तभी संकेत देखें"],
      ["बोलकर उत्तर दें", "English में, 1–2 मिनट"],
      ["Prompters पर अभ्यास", "स्कोर और feedback पाएँ"],
      ["Mock interview", "Manisha के साथ, असली interview से पहले"],
    ],
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
  keepTogether(doc, variant === "QUESTIONS" ? 56 : 120);
  const left = doc.page.margins.left;
  const top = doc.y;
  const page = doc.page;
  const pw = pill(doc, PRIORITY_NAME[q.priority], left, top, COLORS[q.priority]);
  textAt(doc, `${CATEGORY_NAME[q.category]} · ${q.skill} · L${q.difficulty} · ${Math.round(q.probability * 100)}%`, { x: left + pw + 7, y: top + 1.5, width: contentWidth(doc) - pw - 7, size: 7.5, color: COLORS.subtle });
  doc.y = top + 17;
  write(doc, `${q.rank}. ${t.question}`, { size: 10.5, bold: true, gap: 0.2 });
  if (variant !== "QUESTIONS") write(doc, `${l.hint}: ${t.hint}`, { size: 9, color: COLORS.muted, indent: 12, gap: 0.15 });
  if (variant === "GUIDE") {
    write(doc, `${l.why}: ${t.why}`, { size: 9, color: COLORS.muted, indent: 12, gap: 0.15 });
    if (q.evidence) write(doc, `${l.evidence}: “${q.evidence}”`, { size: 9, color: COLORS.accent, indent: 12, gap: 0.15 });
    write(doc, `${l.keyPoints}:`, { size: 9, bold: true, indent: 12 });
    for (const k of t.keyPoints) write(doc, `•  ${k}`, { size: 9, indent: 22 });
    if (t.followUps.length) {
      write(doc, `${l.followUps}:`, { size: 9, bold: true, indent: 12 });
      for (const f of t.followUps) write(doc, `–  ${f}`, { size: 9, color: COLORS.muted, indent: 22 });
    }
  }
  // A priority-coloured bar down the left edge of the block (when it stayed on one page).
  if (doc.page === page) doc.save().roundedRect(left - 12, top, 3, doc.y - top, 1.5).fill(COLORS[q.priority]).restore();
  doc.moveDown(variant === "QUESTIONS" ? 0.6 : 0.9);
}

/** Cover: dark brand panel, the candidate's details as cards, charts of the bank and the prep flow. */
function cover(doc: Doc, input: { candidate: string; title: string; variant: PackVariant; date?: Date }, qs: RankedQuestion[], l: (typeof L)[PackLanguage]) {
  const x = 40;
  const w = doc.page.width - 80;
  const panelH = 178;
  doc.save().roundedRect(x, 40, w, panelH, 10).fill(COLORS.ink).restore();
  doc.save().roundedRect(x, 40, w, panelH, 10).clip().circle(x + w - 40, 70, 90).fillOpacity(0.12).fill(COLORS.accent).restore();
  drawMarkLight(doc, x + 24, 62);
  doc.font("bold").fontSize(13).fillColor(COLORS.paper).text("PROMPTERS", x + 70, 72, { lineBreak: false, characterSpacing: 3 });
  const ty = textAt(doc, l.subtitle, { x: x + 24, y: 118, width: w - 48, size: 21, bold: true, color: COLORS.paper });
  pill(doc, l.variants[input.variant], x + 24, Math.min(ty + 8, 40 + panelH - 26), COLORS.accent, 8);

  // Details as a 2 × 2 grid of cards
  const date = (input.date ?? new Date()).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const cards: [string, string][] = [[l.candidate, input.candidate], [l.target, input.title], [l.prepared, date], [l.edition, l.variants[input.variant]]];
  const left = doc.page.margins.left;
  const cw = (contentWidth(doc) - 12) / 2;
  let y = 40 + panelH + 18;
  for (let r = 0; r < 2; r++) {
    const pair = cards.slice(r * 2, r * 2 + 2);
    const h = Math.max(...pair.map(([, v]) => textHeight(doc, v, cw - 20, 11.5, true))) + 30;
    pair.forEach(([k, v], i) => {
      const cx = left + i * (cw + 12);
      doc.save().roundedRect(cx, y, cw, h, 6).fill(COLORS.card).restore();
      doc.save().rect(cx, y + 6, 3, h - 12).fill(PALETTE[r * 2 + i]).restore();
      textAt(doc, k, { x: cx + 12, y: y + 8, width: cw - 20, size: 7.5, color: COLORS.subtle });
      textAt(doc, v, { x: cx + 12, y: y + 20, width: cw - 20, size: 11.5, bold: true, color: COLORS.ink });
    });
    y += h + 10;
  }
  doc.y = y + 4;
  doc.x = left;
  write(doc, l.how, { size: 9, color: COLORS.muted, gap: 0.8 });

  const priorities: PrepPriority[] = ["INTENSE", "IMPORTANT", "GOOD", "MAY_BE_ASKED"];
  heading(doc, `${l.summary} — ${l.priorityMix}`, { size: 11 });
  stackedBar(doc, priorities.map((p) => ({ label: PRIORITY_NAME[p], value: qs.filter((q) => q.priority === p).length, color: COLORS[p] })));
  heading(doc, l.categoryMix, { size: 11 });
  barChart(doc, PREP_CATEGORIES.filter((c) => qs.some((q) => q.category === c)).map((c, i) => ({ label: CATEGORY_NAME[c], value: qs.filter((q) => q.category === c).length, color: PALETTE[i % PALETTE.length] })), { labelWidth: 96 });
  doc.moveDown(0.4);
  heading(doc, l.howTo, { size: 11 });
  flowChart(doc, l.flow.map(([title, body]) => ({ title, body })));
}

/** The mark in light colours, for the dark cover panel. */
function drawMarkLight(doc: Doc, x: number, y: number) {
  drawMark(doc, x, y, 40, { body: COLORS.paper, foot: "#9bc29a" });
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
  const doc = createDoc({ title: `Prompters — ${input.title}`, author: input.candidate, header: `${input.candidate} · ${input.title}` });
  cover(doc, input, qs, l);

  const loc = (q: PrepQuestion) => localized(q, input.language) ?? localized(q, "en")!;
  if (input.variant === "TOPICS") {
    renderTopics(doc, qs, loc, l);
  } else {
    // Ranked Top N
    doc.addPage();
    heading(doc, l.top.replace("{n}", String(qs.length)), { size: 16 });
    doc.moveDown(0.3);
    for (const q of qs) questionBlock(doc, q, loc(q), input.variant, l);
  }

  // Category index
  doc.addPage();
  heading(doc, l.byCategory);
  barChart(
    doc,
    PREP_CATEGORIES.filter((c) => qs.some((q) => q.category === c)).map((c, i) => {
      const inCat = qs.filter((q) => q.category === c);
      return { label: CATEGORY_NAME[c], value: inCat.length, color: PALETTE[i % PALETTE.length], note: ranksText(inCat.map((q) => q.rank)) };
    }),
    { labelWidth: 96 },
  );

  if (input.variant === "GUIDE") {
    doc.moveDown(0.8);
    heading(doc, l.focus);
    barChart(
      doc,
      skillFocus(qs).slice(0, 12).map((f, i) => ({
        label: f.skill,
        value: f.count,
        color: f.intense ? COLORS.INTENSE : PALETTE[i % PALETTE.length],
        note: [f.intense ? `${f.intense} INTENSE` : "", f.practiced ? `${f.practiced} ${l.practiced}, ${l.avg} ${f.avg}%` : ""].filter(Boolean).join(" · ") || undefined,
      })),
    );
  }
  if (input.variant === "GUIDE" || input.variant === "TOPICS") {
    doc.moveDown(0.8);
    keepTogether(doc, 220);
    heading(doc, l.plan);
    write(doc, l.planIntro, { size: 9, color: COLORS.muted, gap: 0.6 });
    const plan = sevenDayPlan(qs);
    const steps: { label: string; title: string; detail?: string }[] = [];
    plan.days.forEach((d, i) => {
      if (d.ranks.length) steps.push({ label: `${l.day} ${i + 1}`, title: `${d.skills.slice(0, 6).join(", ")}${d.skills.length > 6 ? "…" : ""}`, detail: ranksText(d.ranks) });
    });
    if (plan.deepDive.length) steps.push({ label: `${l.day} 6`, title: `${CATEGORY_NAME.PROJECT} / ${CATEGORY_NAME.CLAIM} / ${CATEGORY_NAME.ACHIEVEMENT}`, detail: ranksText(plan.deepDive) });
    steps.push({ label: `${l.day} 7`, title: l.mock });
    stepFlow(doc, steps);
  }

  footer(doc, `Prompters · ${input.candidate} · ${input.title}`);
  return toBuffer(doc);
}

/** Topic-wise edition: a contents page, then per topic a personal prep box followed by its questions. */
function renderTopics(doc: Doc, qs: RankedQuestion[], loc: (q: PrepQuestion) => Localized, l: (typeof L)[PackLanguage]) {
  const groups = topicGroups(qs, l.moreTopics);
  doc.addPage();
  heading(doc, l.byTopic, { size: 16 });
  write(doc, l.contents, { size: 9, bold: true, color: COLORS.muted, gap: 0.4 });
  barChart(
    doc,
    groups.map((g, i) => ({ label: `${i + 1}. ${g.topic}`, value: g.questions.length, color: g.intense ? COLORS.INTENSE : PALETTE[i % PALETTE.length], note: g.intense ? `${g.intense} INTENSE` : undefined })),
    { labelWidth: 150 },
  );

  groups.forEach((g, i) => {
    doc.addPage();
    write(doc, `${l.topicWord} ${i + 1}`, { size: 9, color: COLORS.subtle });
    heading(doc, g.topic, { size: 18, color: g.intense ? COLORS.INTENSE : PALETTE[i % PALETTE.length] });
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

/** Renders a pack from the database. Non-English packs need their translations saved first (ensureTranslations). */
async function buildPdf(packId: string, opts: { translate?: boolean } = {}) {
  const pack = await prisma.prepPack.findUniqueOrThrow({ where: { id: packId }, include: { plan: { include: { resume: true, user: { select: { name: true } } } } } });
  const questions = await prisma.prepQuestion.findMany({ where: { planId: pack.planId, rank: { gt: 0 } }, orderBy: { rank: "asc" }, include: { attempts: { select: { score: true } } } });
  const language = pack.language as PackLanguage;
  if (opts.translate && language !== "en") await ensureTranslations(questions, language);
  const parsed = resumeParsedSchema.safeParse(pack.plan.resume.parsed);
  return renderPack({
    candidate: (parsed.success && parsed.data.name) || pack.plan.user.name,
    title: pack.plan.title,
    variant: pack.variant as PackVariant,
    language,
    questions: questions.map(({ attempts, ...q }) => ({ ...q, bestScore: attempts.length ? Math.max(...attempts.map((a) => a.score)) : null })),
  });
}

export async function runPack(packId: string) {
  const pack = await prisma.prepPack.findUnique({ where: { id: packId } });
  if (!pack) return;
  const { count } = await prisma.prepPack.updateMany({ where: { id: pack.id, status: "QUEUED" }, data: { status: "RUNNING", error: null } });
  if (!count) return; // a duplicate or stale job: someone else has it, or it's done
  try {
    // Rendering here also proves the pack builds, even when it isn't kept (STORAGE_DRIVER=none).
    const pdf = await buildPdf(pack.id, { translate: true });
    let key: string | null = null;
    if (fileStorageEnabled()) {
      key = `prep-packs/${pack.userId}/${pack.id}.pdf`;
      await storage().put(key, pdf, "application/pdf");
    }
    await prisma.prepPack.update({ where: { id: pack.id }, data: { status: "READY", storageKey: key, completedAt: new Date() } });
  } catch (e) {
    logger.error({ err: e, packId }, "Prep pack failed");
    await prisma.prepPack.update({ where: { id: packId }, data: { status: "FAILED", error: e instanceof AppError ? e.message : "Couldn't build the PDF. Please try again." } });
  }
}
