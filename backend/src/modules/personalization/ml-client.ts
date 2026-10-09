import { logger } from "../../lib/logger.js";

/**
 * The only way the API talks to the Python ML service: a fixed set of internal calls with a
 * shared token and a short timeout. The service is never exposed to the browser. Any failure
 * (not configured, down, slow, cold start) returns a reason, and the caller uses the baseline.
 */

export interface MlRankResult {
  ok: true;
  modelName: string;
  modelVersion: string;
  /** Career families the model has enough of its own data for; others keep the baseline. */
  families?: string[];
  scores: Record<string, number>;
}
export interface MlUnavailable {
  ok: false;
  /** not_configured | cold_start | timeout | unavailable | error */
  reason: string;
}

const url = () => process.env.ML_SERVICE_URL?.replace(/\/$/, "") || null;
export const mlConfigured = () => !!url();
export const ML_TIMEOUT_MS = () => Number(process.env.ML_TIMEOUT_MS ?? 800);

async function call<T>(path: string, body?: unknown): Promise<T> {
  const base = url();
  if (!base) throw Object.assign(new Error("not_configured"), { reason: "not_configured" });
  const res = await fetch(`${base}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "content-type": "application/json", "x-ml-token": process.env.ML_SERVICE_TOKEN ?? "" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(ML_TIMEOUT_MS()),
  });
  if (!res.ok) throw Object.assign(new Error(`status ${res.status}`), { reason: res.status === 503 ? "cold_start" : "error" });
  return (await res.json()) as T;
}

const reasonOf = (e: unknown) => {
  const err = e as { reason?: string; name?: string };
  if (err.reason) return err.reason;
  if (err.name === "TimeoutError" || err.name === "AbortError") return "timeout";
  return "unavailable";
};

/** P(success) per item from the trained model, or why it can't be used. */
export async function mlRank(items: { id: string; features: Record<string, number> }[]): Promise<MlRankResult | MlUnavailable> {
  try {
    const r = await call<{ model_status: string; model_name?: string; model_version?: string; families?: string[]; scores?: Record<string, number> }>("/rank", { items });
    if (r.model_status !== "trained" || !r.scores || !r.model_name || !r.model_version) return { ok: false, reason: r.model_status || "cold_start" };
    return { ok: true, modelName: r.model_name, modelVersion: r.model_version, families: Array.isArray(r.families) ? r.families : [], scores: r.scores };
  } catch (e) {
    const reason = reasonOf(e);
    if (reason !== "not_configured" && reason !== "cold_start") logger.warn({ reason }, "ML ranker unavailable; using the baseline");
    return { ok: false, reason };
  }
}

export async function mlModelInfo(): Promise<Record<string, unknown> | MlUnavailable> {
  try {
    return await call<Record<string, unknown>>("/model");
  } catch (e) {
    return { ok: false, reason: reasonOf(e) };
  }
}

export async function mlReload(): Promise<boolean> {
  try {
    await call("/reload", {});
    return true;
  } catch {
    return false;
  }
}
