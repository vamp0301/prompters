import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../lib/logger.js";

export interface CompleteOptions {
  maxTokens?: number;
  json?: boolean;
  /** Background jobs (e.g. batch question generation) allow longer calls than request handlers. */
  timeoutMs?: number;
  /** Simple extraction/translation: prefer the fast model (Gemini: first fallback, e.g. Flash-Lite). */
  fast?: boolean;
}

export interface AIProvider {
  readonly name: string;
  complete(system: string, user: string, opts?: CompleteOptions): Promise<string>;
}

const DEFAULTS: Record<string, { baseUrl: string; model: string }> = {
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.3-70b-instruct:free" },
  ollama: { baseUrl: "http://localhost:11434/v1", model: "llama3.1" },
  huggingface: { baseUrl: "https://router.huggingface.co/v1", model: "meta-llama/Llama-3.1-8B-Instruct" },
  gemini: { baseUrl: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-flash-latest" },
};

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Free-tier models regularly answer 429/503 ("high demand") for a few seconds. Request
 * handlers retry once; background jobs (longer timeout) back off up to three times. Timeouts are
 * not retried on the same model.
 */
async function postJson(url: string, body: unknown, headers: Record<string, string>, timeoutMs = 30_000) {
  const delays = timeoutMs > 30_000 ? [3_000, 8_000, 15_000] : [1_500];
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    }).catch((e: unknown) => (e instanceof Error && e.name === "TimeoutError" ? ("timeout" as const) : null));
    // A model that didn't answer within the timeout is hung, not briefly busy: waiting on it again only
    // doubles the delay (and can outlast the web proxy), so move straight to the next model.
    if (res === "timeout") {
      const err = new AppError(502, "AI_UPSTREAM_ERROR", "The AI service is taking too long to respond. Please try again in a minute.");
      Object.assign(err, { overloaded: true, timedOut: true });
      throw err;
    }
    if (res?.ok) return res.json() as Promise<Record<string, unknown>>;
    // A daily quota can't recover by waiting: give up on this model at once so the caller can fall back.
    if (res?.status === 429 && /PerDay/i.test(await res.text().catch(() => ""))) {
      const err = new AppError(502, "AI_UPSTREAM_ERROR", "The AI service has reached its daily limit. Please try again later.");
      Object.assign(err, { overloaded: true, quotaExhausted: true });
      throw err;
    }
    const retryable = !res || RETRYABLE.has(res.status);
    if (!retryable || attempt >= delays.length) {
      const err = new AppError(502, "AI_UPSTREAM_ERROR", "The AI service is busy or unavailable right now. Please try again in a minute.");
      // 404 = model retired for this key; also worth falling back from.
      (err as AppError & { overloaded?: boolean }).overloaded = retryable || res?.status === 404;
      throw err;
    }
    const retryAfter = Number(res?.headers.get("retry-after"));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 20_000) : delays[attempt]);
  }
}

/** OpenAI-compatible chat completions: OpenRouter, Ollama, Hugging Face router. */
export class OpenAICompatible implements AIProvider {
  constructor(readonly name: string, private baseUrl: string, private model: string, private apiKey?: string) {}
  async complete(system: string, user: string, opts: CompleteOptions = {}) {
    const data = await postJson(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
        max_tokens: opts.maxTokens ?? 800,
        temperature: 0.4,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      },
      this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {},
      opts.timeoutMs,
    );
    const choices = data.choices as { message?: { content?: string } }[] | undefined;
    return choices?.[0]?.message?.content?.trim() ?? "";
  }
}

/** Tries the primary model, then each fallback, when a model is overloaded or retired. */
export class Gemini implements AIProvider {
  readonly name = "gemini";
  /** Models out of daily quota (1 h) or hanging (5 min) are skipped instead of being retried on every call. */
  private exhaustedUntil = new Map<string, number>();
  constructor(private baseUrl: string, private models: string[], private apiKey: string) {}
  async complete(system: string, user: string, opts: CompleteOptions = {}) {
    let last: unknown;
    const now = Date.now();
    // Fast tasks try the lighter model first (several times quicker for plain extraction); the
    // primary model remains the fallback, so quality never depends on the lite model alone.
    const ordered = opts.fast && this.models.length > 1 ? [this.models[1], this.models[0], ...this.models.slice(2)] : this.models;
    const usable = ordered.filter((m) => (this.exhaustedUntil.get(m) ?? 0) < now);
    for (const model of usable.length ? usable : ordered) {
      try {
        const data = await postJson(
          `${this.baseUrl}/models/${model}:generateContent`,
          {
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig: { maxOutputTokens: opts.maxTokens ?? 800, temperature: 0.4, ...(opts.json ? { responseMimeType: "application/json" } : {}) },
          },
          { "x-goog-api-key": this.apiKey },
          opts.timeoutMs,
        );
        const candidates = data.candidates as { content?: { parts?: { text?: string }[] }; finishReason?: string }[] | undefined;
        // A cut-off answer is almost always invalid JSON; record why so it isn't mistaken for a bad prompt.
        if (candidates?.[0]?.finishReason === "MAX_TOKENS") logger.warn({ model, maxTokens: opts.maxTokens }, "Gemini stopped at the output-token limit");
        return candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
      } catch (e) {
        last = e;
        if ((e as { quotaExhausted?: boolean }).quotaExhausted) this.exhaustedUntil.set(model, Date.now() + 60 * 60_000);
        // A hung model is skipped for a few minutes so other requests don't each wait out its timeout.
        else if ((e as { timedOut?: boolean }).timedOut) this.exhaustedUntil.set(model, Date.now() + 5 * 60_000);
        if (!(e as { overloaded?: boolean }).overloaded) throw e;
      }
    }
    throw last;
  }
}

let provider: AIProvider | null | undefined;

/** Tests inject a deterministic provider; pass undefined to go back to env config. */
export function setAIProvider(p: AIProvider | null | undefined) {
  provider = p;
}

/** Returns null when no provider is configured — the core platform never depends on AI. */
export function aiProvider(): AIProvider | null {
  if (provider !== undefined) return provider;
  const kind = env.AI_PROVIDER;
  if (kind === "none") return (provider = null);
  const d = DEFAULTS[kind];
  const baseUrl = env.AI_BASE_URL ?? d.baseUrl;
  const model = env.AI_MODEL ?? d.model;
  if (kind === "gemini") {
    if (!env.AI_API_KEY) return (provider = null);
    const fallbacks = (env.AI_FALLBACK_MODELS ?? "gemini-flash-lite-latest,gemini-3.5-flash-lite").split(",").map((m) => m.trim()).filter((m) => m && m !== model);
    return (provider = new Gemini(baseUrl, [model, ...fallbacks], env.AI_API_KEY));
  }
  if (kind !== "ollama" && !env.AI_API_KEY) return (provider = null);
  return (provider = new OpenAICompatible(kind, baseUrl, model, env.AI_API_KEY));
}
