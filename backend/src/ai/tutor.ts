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

export async function translateText(text: string, target: "hinglish" | "hi" | "en") {
  const system = `Translate educational programming content. ${LOCALE_INSTRUCTION[target]} Preserve Markdown, code blocks and inline code exactly. Output only the translation.`;
  return requireProvider().complete(system, text, { maxTokens: 1500 });
}
