import { env } from "../config/env.js";

/**
 * Embeddings for meaning-based search, kept separate from text generation. One interface so a
 * provider can be swapped (e.g. Hugging Face) without touching retrieval. Vectors are L2-normalised,
 * so cosine similarity is a plain dot product. Documents and queries must use the same model and
 * dimensions — the index stores both and is rebuilt when they change.
 */
export interface EmbeddingProvider {
  readonly name: string;
  readonly model: string;
  readonly dimensions: number;
  embedDocuments(texts: { text: string; title?: string }[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

/** Typed failures so callers can fall back (keyword search) or stop a batch (rate limit) cleanly. */
export class EmbeddingError extends Error {
  constructor(
    message: string,
    public readonly kind: "rate_limited" | "unavailable" | "bad_response" | "timeout",
    public readonly status?: number,
  ) {
    super(message);
  }
}

export const EMBEDDING_DIMENSIONS = 768;
const GEMINI_MODEL = "gemini-embedding-001";
/** Gemini's batch limit. */
export const MAX_BATCH = 100;

export function normalize(v: number[]) {
  const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

export class GeminiEmbeddings implements EmbeddingProvider {
  readonly name = "gemini";
  readonly model = GEMINI_MODEL;
  readonly dimensions = EMBEDDING_DIMENSIONS;
  constructor(
    private apiKey: string,
    private baseUrl = "https://generativelanguage.googleapis.com/v1beta",
  ) {}

  private async post(path: string, body: unknown, timeoutMs: number) {
    const res = await fetch(`${this.baseUrl}/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    }).catch((e: unknown) => {
      throw e instanceof Error && e.name === "TimeoutError" ? new EmbeddingError("Embedding request timed out", "timeout") : new EmbeddingError("Embedding service unreachable", "unavailable");
    });
    if (res.status === 429) throw new EmbeddingError("Embedding quota or rate limit reached", "rate_limited", 429);
    if (!res.ok) throw new EmbeddingError(`Embedding service error ${res.status}`, "unavailable", res.status);
    return (await res.json()) as Record<string, unknown>;
  }

  private check(values: unknown): number[] {
    if (!Array.isArray(values) || values.length !== this.dimensions || !values.every((x) => typeof x === "number" && Number.isFinite(x))) {
      throw new EmbeddingError(`Expected ${this.dimensions} numbers from the embedding model`, "bad_response");
    }
    // Truncated (Matryoshka) Gemini vectors are not unit length: normalise for cosine = dot product.
    return normalize(values as number[]);
  }

  async embedDocuments(texts: { text: string; title?: string }[]) {
    if (!texts.length) return [];
    if (texts.length > MAX_BATCH) throw new EmbeddingError(`At most ${MAX_BATCH} texts per batch`, "bad_response");
    const data = await this.post(
      `models/${this.model}:batchEmbedContents`,
      {
        requests: texts.map((t) => ({ model: `models/${this.model}`, content: { parts: [{ text: t.text }] }, taskType: "RETRIEVAL_DOCUMENT", ...(t.title ? { title: t.title } : {}), outputDimensionality: this.dimensions })),
      },
      60_000,
    );
    const out = (data.embeddings as { values?: unknown }[] | undefined) ?? [];
    if (out.length !== texts.length) throw new EmbeddingError("Embedding count doesn't match the inputs", "bad_response");
    return out.map((e) => this.check(e.values));
  }

  /** Short timeout: a student is waiting, and keyword search is the fallback. */
  async embedQuery(text: string) {
    const data = await this.post(`models/${this.model}:embedContent`, { content: { parts: [{ text }] }, taskType: "RETRIEVAL_QUERY", outputDimensionality: this.dimensions }, 8_000);
    return this.check((data.embedding as { values?: unknown } | undefined)?.values);
  }
}

let provider: EmbeddingProvider | null | undefined;

/** Tests inject a deterministic provider; pass undefined to go back to env config. */
export function setEmbeddingProvider(p: EmbeddingProvider | null | undefined) {
  provider = p;
}

/** The configured provider, or null when semantic search is off (EMBEDDINGS_PROVIDER=none or no key). */
export function embeddingProvider(): EmbeddingProvider | null {
  if (provider !== undefined) return provider;
  provider = env.EMBEDDINGS_PROVIDER === "gemini" && env.AI_API_KEY ? new GeminiEmbeddings(env.AI_API_KEY) : null;
  return provider;
}
