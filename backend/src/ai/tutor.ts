import { AppError } from "../utils/errors.js";
import { aiProvider } from "./provider.js";

const LOCALE_INSTRUCTION: Record<string, string> = {
  hinglish:
    "Reply in Hinglish: Hindi written in Roman script mixed naturally with English technical words, the way a friendly Indian senior explains things. Use simple words, short sentences and an everyday Indian analogy.",
  en: "Reply in simple, plain English. Short sentences. Explain any jargon the first time you use it.",
  hi: "Reply in simple Hindi (Devanagari). Keep technical terms in English.",
};

function requireProvider() {
  const p = aiProvider();
  if (!p) throw new AppError(503, "AI_UNAVAILABLE", "The AI tutor is not configured on this server.");
  return p;
}

export async function explainTopic(input: {
  topicTitle: string;
  question: string;
  locale: string;
  level: string;
  recentMistakes: string[];
  goal: string;
}) {
  const system = [
    "You are the Prompters tutor for Indian engineering students. You explain concepts; you never write complete solutions to build tasks, projects or test questions.",
    LOCALE_INSTRUCTION[input.locale] ?? LOCALE_INSTRUCTION.hinglish,
    `Student level: ${input.level}. Goal: ${input.goal}.`,
    "Answer with these headings: Simple Explanation, Example, Visual Idea, Try It, Interview Answer (the interview answer in clear technical English, 2-3 sentences).",
    "Keep it under 300 words. Never invent APIs or facts; say so if you are unsure.",
  ].join("\n");
  const user = [
    `Topic: ${input.topicTitle}`,
    input.recentMistakes.length ? `Questions the student recently got wrong:\n- ${input.recentMistakes.slice(0, 5).join("\n- ")}` : "",
    `Student's question: ${input.question}`,
  ].filter(Boolean).join("\n\n");
  return requireProvider().complete(system, user, { maxTokens: 700 });
}

export async function translateText(text: string, target: "hinglish" | "hi" | "en") {
  const system = `Translate educational programming content. ${LOCALE_INSTRUCTION[target]} Preserve Markdown, code blocks and inline code exactly. Output only the translation.`;
  return requireProvider().complete(system, text, { maxTokens: 1500 });
}
