import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { redis } from "../../lib/redis.js";
import { AppError, conflict, notFound } from "../../utils/errors.js";

/**
 * Cloud voice for Manisha: Deepgram listens (streaming speech-to-text, straight from the browser with
 * a 30-second token — the API key never leaves the server), ElevenLabs speaks (proxied here so the key
 * stays server-side and usage is capped). Either can be off; the browser's own engines are the fallback.
 * No audio or transcript passes through or is stored by this module.
 */

export interface SttProvider {
  name: "deepgram";
  /** A short-lived credential the browser uses to open one streaming connection. */
  grant(): Promise<{ token: string; expiresIn: number }>;
  /** Query string for the browser's WebSocket (model, language, endpointing…). */
  params(): Record<string, string>;
  url: string;
}

export interface TtsProvider {
  name: "elevenlabs";
  /** Streams speech for `text`; the body is passed straight through to the browser. */
  speak(text: string, signal: AbortSignal): Promise<{ body: ReadableStream<Uint8Array>; contentType: string }>;
}

const TIMEOUT_MS = 15_000;

function deepgram(): SttProvider | null {
  if (env.STT_PROVIDER !== "deepgram" || !env.DEEPGRAM_API_KEY) return null;
  const key = env.DEEPGRAM_API_KEY;
  return {
    name: "deepgram",
    url: "wss://api.deepgram.com/v1/listen",
    params: () => ({
      model: env.DEEPGRAM_MODEL,
      language: env.DEEPGRAM_LANGUAGE,
      smart_format: "true",
      interim_results: "true",
      // A pause this long ends a phrase; UtteranceEnd follows after a longer silence (end of answer).
      endpointing: "400",
      utterance_end_ms: "1500",
      vad_events: "true",
      // Keep candidates' audio out of the provider's model-improvement programme.
      mip_opt_out: "true",
    }),
    async grant() {
      const res = await fetch("https://api.deepgram.com/v1/auth/grant", {
        method: "POST",
        headers: { authorization: `Token ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ ttl_seconds: 30 }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`Deepgram grant failed (${res.status})`);
      const j = (await res.json()) as { access_token?: string; expires_in?: number };
      if (!j.access_token) throw new Error("Deepgram grant returned no token");
      return { token: j.access_token, expiresIn: j.expires_in ?? 30 };
    },
  };
}

function elevenlabs(): TtsProvider | null {
  if (env.TTS_PROVIDER !== "elevenlabs" || !env.ELEVENLABS_API_KEY || !env.ELEVENLABS_VOICE_ID) return null;
  const key = env.ELEVENLABS_API_KEY;
  const voice = encodeURIComponent(env.ELEVENLABS_VOICE_ID);
  return {
    name: "elevenlabs",
    async speak(text, signal) {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream?output_format=mp3_22050_32`, {
        method: "POST",
        headers: { "xi-api-key": key, "content-type": "application/json", accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: env.ELEVENLABS_MODEL, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
      });
      if (!res.ok || !res.body) throw new Error(`ElevenLabs failed (${res.status})`);
      return { body: res.body, contentType: res.headers.get("content-type") ?? "audio/mpeg" };
    },
  };
}

let stt: SttProvider | null | undefined;
let tts: TtsProvider | null | undefined;
/** Tests inject fakes; undefined goes back to env config. */
export function setVoiceProviders(p: { stt?: SttProvider | null; tts?: TtsProvider | null } | undefined) {
  stt = p ? (p.stt ?? null) : undefined;
  tts = p ? (p.tts ?? null) : undefined;
}
const sttProvider = () => (stt !== undefined ? stt : deepgram());
const ttsProvider = () => (tts !== undefined ? tts : elevenlabs());
/** The providers in force (for the opt-in real-provider tests). */
export const voiceProviders = () => ({ stt: sttProvider(), tts: ttsProvider() });

// ───────────────────────── usage caps ─────────────────────────

const month = () => new Date().toISOString().slice(0, 7);
const day = () => new Date().toISOString().slice(0, 10);
const monthKey = () => `voice:tts:chars:${month()}`;
const userKey = (userId: string) => `voice:tts:user:${userId}:${day()}`;

/** Reserves characters against both caps; false (and nothing reserved) when either would be exceeded. */
async function reserve(userId: string, chars: number) {
  const r = redis();
  const [m, u] = await Promise.all([r.incrby(monthKey(), chars), r.incrby(userKey(userId), chars)]);
  // First write of the period sets the expiry.
  if (m === chars) await r.expire(monthKey(), 40 * 86_400);
  if (u === chars) await r.expire(userKey(userId), 2 * 86_400);
  if (m > env.TTS_MONTHLY_CHAR_LIMIT || u > env.TTS_USER_DAILY_CHAR_LIMIT) {
    await release(userId, chars);
    return false;
  }
  return true;
}
async function release(userId: string, chars: number) {
  const r = redis();
  await Promise.all([r.decrby(monthKey(), chars), r.decrby(userKey(userId), chars)]).catch(() => undefined);
}

async function ttsAvailable() {
  if (!ttsProvider()) return false;
  // Nothing used yet this month = 0; Redis unreachable = treat as used up (never spend unmetered).
  const used = await redis()
    .get(monthKey())
    .then((v) => Number(v ?? 0))
    .catch(() => env.TTS_MONTHLY_CHAR_LIMIT);
  return used < env.TTS_MONTHLY_CHAR_LIMIT;
}

/** What the interview room should use. Cloud engines only when configured (and, for speech, under the cap). */
export async function voiceConfig() {
  return { stt: sttProvider() ? "deepgram" : "browser", tts: (await ttsAvailable()) ? "elevenlabs" : "browser" } as const;
}

// ───────────────────────── session-scoped calls ─────────────────────────

/** Voice is only for the candidate's own interview while it's open. */
async function openSession(userId: string, sessionId: string) {
  const s = await prisma.interviewSession.findFirst({ where: { id: sessionId, userId }, select: { status: true } });
  if (!s) throw notFound("Interview");
  if (s.status !== "IN_PROGRESS" && s.status !== "PAUSED") throw conflict("This interview has ended.");
}

const unavailable = (what: string) => new AppError(503, "VOICE_UNAVAILABLE", `${what} isn't available right now — using the browser instead.`);

export async function sttToken(userId: string, sessionId: string) {
  const p = sttProvider();
  if (!p) throw unavailable("Cloud transcription");
  await openSession(userId, sessionId);
  try {
    const g = await p.grant();
    logger.info({ sessionId, provider: p.name }, "voice: stt token issued");
    return { provider: p.name, url: p.url, params: p.params(), token: g.token, expiresIn: g.expiresIn };
  } catch (e) {
    logger.warn({ sessionId, err: (e as Error).message }, "voice: stt token failed");
    throw unavailable("Cloud transcription");
  }
}

export const MAX_SPEECH_CHARS = 700;

/** Starts synthesising `text`; the caller pipes the stream. Fails fast (503/429) so the browser falls back. */
export async function speech(userId: string, sessionId: string, text: string, signal: AbortSignal) {
  const p = ttsProvider();
  if (!p) throw unavailable("Manisha's cloud voice");
  await openSession(userId, sessionId);
  const chars = text.length;
  const ok = await reserve(userId, chars).catch(() => false); // Redis down → don't spend unmetered
  if (!ok) throw new AppError(429, "VOICE_QUOTA", "The voice allowance is used up — using the browser voice.");
  try {
    const out = await p.speak(text, signal);
    // Characters only — never the text itself.
    logger.info({ sessionId, provider: p.name, chars }, "voice: speech");
    return out;
  } catch (e) {
    await release(userId, chars);
    logger.warn({ sessionId, err: (e as Error).message }, "voice: speech failed");
    throw unavailable("Manisha's cloud voice");
  }
}
