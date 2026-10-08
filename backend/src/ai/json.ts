import type { ZodType, ZodTypeDef } from "zod";
import { AppError } from "../utils/errors.js";
import { logger } from "../lib/logger.js";
import { aiProvider } from "./provider.js";

export function requireAI() {
  const p = aiProvider();
  if (!p) throw new AppError(503, "AI_UNAVAILABLE", "AI analysis isn't configured yet — an admin needs to add a Gemini API key.");
  return p;
}

function extractJson(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : raw).trim();
  const start = body.search(/[[{]/);
  return JSON.parse(start > 0 ? body.slice(start) : body);
}

/**
 * Asks the model for JSON and validates it with zod. One retry with the
 * validation error fed back; then a friendly 502 — never a half-parsed result.
 */
export async function aiJson<T>(task: string, system: string, user: string, schema: ZodType<T, ZodTypeDef, unknown>, maxTokens = 2500, opts: { timeoutMs?: number; fast?: boolean } = {}): Promise<T> {
  const ai = requireAI();
  const sys = `[task:${task}]\n${system}\nRespond with a single JSON value only. No prose, no markdown fences.`;
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt = attempt === 0 ? user : `${user}\n\nYour previous reply was invalid (${lastError.slice(0, 400)}). Return corrected JSON only.`;
    const raw = await ai.complete(sys, prompt, { json: true, maxTokens, timeoutMs: opts.timeoutMs, fast: opts.fast });
    try {
      const parsed = schema.safeParse(extractJson(raw));
      if (parsed.success) return parsed.data;
      lastError = JSON.stringify(parsed.error.issues.slice(0, 5));
    } catch (e) {
      lastError = e instanceof Error ? e.message : "not JSON";
    }
  }
  logger.warn({ task, error: lastError.slice(0, 1500) }, "AI output failed schema validation twice");
  throw new AppError(502, "AI_BAD_OUTPUT", "The AI returned something we couldn't use. Please try again.");
}

/** Keeps untrusted documents (resume, JD, answers) clearly fenced inside prompts. */
export const fence = (label: string, text: string) => `<${label}>\n${text.replace(new RegExp(`</?${label}>`, "gi"), "")}\n</${label}>`;
