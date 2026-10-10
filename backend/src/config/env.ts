import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  /** Comma-separated list of allowed browser origins. */
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  APP_URL: z.string().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  /** Not needed for ID-token sign-in; kept for a future server-side OAuth flow. */
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /**
   * process: development only (not a security boundary). docker: production sandbox.
   * disabled: no user code runs at all — the safe production choice until the Docker sandbox is deployed.
   */
  /** Unset: "disabled" in production, "process" otherwise. */
  SANDBOX_DRIVER: z.enum(["process", "docker", "disabled"]).optional(),
  SANDBOX_TIMEOUT_MS: z.coerce.number().default(4000),
  SANDBOX_MEMORY_MB: z.coerce.number().default(128),
  SANDBOX_JS_IMAGE: z.string().default("node:22-alpine"),
  SANDBOX_PY_IMAGE: z.string().default("python:3.12-alpine"),
  SANDBOX_CONCURRENCY: z.coerce.number().default(4),
  AI_PROVIDER: z.enum(["none", "gemini", "openrouter", "ollama", "huggingface"]).default("none"),
  AI_MODEL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().optional(),
  /** Comma-separated Gemini models tried when the primary is overloaded (default gemini-flash-lite-latest, gemini-3.5-flash-lite). */
  AI_FALLBACK_MODELS: z.string().optional(),
  /**
   * Where per-user files go (resume originals, PDF packs, interview audio).
   * local: STORAGE_DIR on this machine (development). s3: any S3-compatible bucket.
   * none: no file storage — resume text is still parsed and saved, PDF packs are built on download,
   * and audio recording is off. The production choice when no bucket is configured.
   */
  /** Unset: "none" in production, "local" otherwise. */
  STORAGE_DRIVER: z.enum(["local", "s3", "none"]).optional(),
  STORAGE_DIR: z.string().default("./storage"),
  /** Production only: set true when STORAGE_DIR is a persistent disk (e.g. a mounted volume), never on an ephemeral host. */
  STORAGE_LOCAL_PERSISTENT: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  /** Top-100 plan generations allowed per user per rolling 24 hours (each costs ~20–25 model calls). */
  PREP_DAILY_PLAN_LIMIT: z.coerce.number().int().min(1).max(100).default(3),
  /** Interview audio is deleted automatically after this many days. */
  RECORDING_RETENTION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  /** Offer to keep interview answer audio (with consent). Off by default; needs file storage. */
  AUDIO_RECORDING: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  /**
   * Manisha's ears and voice. "browser" uses the browser's own speech engines (free, the fallback).
   * Cloud providers are used only when selected here AND their key is set.
   */
  STT_PROVIDER: z.enum(["browser", "deepgram"]).default("browser"),
  DEEPGRAM_API_KEY: z.string().optional(),
  DEEPGRAM_MODEL: z.string().default("nova-3"),
  DEEPGRAM_LANGUAGE: z.string().default("en"),
  /** Streaming connections per student per day (one per voice answer, plus reconnects). */
  STT_USER_DAILY_TOKEN_LIMIT: z.coerce.number().int().min(0).default(150),
  TTS_PROVIDER: z.enum(["browser", "elevenlabs"]).default("browser"),
  ELEVENLABS_API_KEY: z.string().optional(),
  /** Voice to use (ElevenLabs → Voices → copy the voice ID). Required for ElevenLabs. */
  ELEVENLABS_VOICE_ID: z.string().optional(),
  ELEVENLABS_MODEL: z.string().default("eleven_flash_v2_5"),
  /** Hard caps on synthesised characters; past them Manisha falls back to the browser voice. */
  TTS_MONTHLY_CHAR_LIMIT: z.coerce.number().int().min(0).default(9000),
  TTS_USER_DAILY_CHAR_LIMIT: z.coerce.number().int().min(0).default(3000),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  /**
   * Run the background workers (Top-100 generation, PDFs, maintenance) inside the API process.
   * For hosts without a separate worker service (Render free plan). Default: separate worker process.
   */
  RUN_WORKERS_IN_API: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  /**
   * Reverse proxies in front of the API, so req.ip (rate limits) is the user's IP and not a proxy's.
   * Render alone = 1; Vercel rewrite → Render = 2.
   */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),
  RATE_LIMIT_DISABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

/** Production falls back to the safe choice when a variable is left unset; development keeps the convenient one. */
const withDefaults = schema.transform((e) => ({
  ...e,
  SANDBOX_DRIVER: e.SANDBOX_DRIVER ?? (e.NODE_ENV === "production" ? "disabled" : "process"),
  STORAGE_DRIVER: e.STORAGE_DRIVER ?? (e.NODE_ENV === "production" ? "none" : "local"),
}));

export type Env = z.infer<typeof withDefaults>;

/** Parses raw variables (process.env in the app). Exported for tests. */
export const parseEnv = (raw: Record<string, string | undefined>) => withDefaults.safeParse(raw);

function load(): Env {
  const parsed = parseEnv(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  // Render sets RENDER=true. A dashboard NODE_ENV=development (e.g. pasted from a local .env) would skip every
  // production guard below and run user code on the host, so refuse it outright.
  const host = hostProblems(parsed.data.NODE_ENV, { onRender: process.env.RENDER === "true" });
  if (host.length) throw new Error(`Refusing to start:\n${host.map((p) => `  - ${p}`).join("\n")}`);
  if (parsed.data.NODE_ENV === "production") {
    const problems = productionProblems(parsed.data, { redisUrlSet: !!process.env.REDIS_URL });
    if (problems.length) throw new Error(`Refusing to start in production:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  }
  return parsed.data;
}

/** Deployment-host checks that apply whatever NODE_ENV says. Exported for tests. */
export function hostProblems(nodeEnv: Env["NODE_ENV"], host: { onRender: boolean }) {
  return host.onRender && nodeEnv !== "production" ? [`NODE_ENV=${nodeEnv} on Render — set NODE_ENV=production (or remove it: the Docker image sets it).`] : [];
}

/** Placeholder secrets from .env.example / docs that must never reach production. */
const EXAMPLE_SECRETS = [/^dev-only/, /^change-me/i, /^YOUR_/, /^ci-secret/];

/**
 * Settings that are fine in development but unsafe in production. Fatal, because the safe
 * alternative is always available. Exported for tests.
 */
export function productionProblems(
  e: Pick<Env, "JWT_SECRET" | "SANDBOX_DRIVER" | "STORAGE_DRIVER" | "STORAGE_LOCAL_PERSISTENT" | "S3_BUCKET" | "AUDIO_RECORDING" | "COOKIE_SECURE" | "AI_PROVIDER" | "AI_API_KEY" | "CORS_ORIGIN" | "APP_URL">,
  raw: { redisUrlSet: boolean } = { redisUrlSet: true },
) {
  const problems: string[] = [];
  if (EXAMPLE_SECRETS.some((re) => re.test(e.JWT_SECRET))) problems.push("JWT_SECRET is a development/example value — generate a real secret.");
  // The process driver is not a security boundary: untrusted code would run on the worker host.
  if (e.SANDBOX_DRIVER === "process") problems.push("SANDBOX_DRIVER=process is not allowed in production — use 'docker', or 'disabled' until the Docker sandbox is deployed.");
  if (e.STORAGE_DRIVER === "s3" && !e.S3_BUCKET) problems.push("STORAGE_DRIVER=s3 requires S3_BUCKET.");
  // Hosts like Render free wipe the disk on every deploy/restart: user files would vanish silently.
  if (e.STORAGE_DRIVER === "local" && !e.STORAGE_LOCAL_PERSISTENT) {
    problems.push("STORAGE_DRIVER=local keeps user files on this server's disk — use 's3', or 'none' to run without file storage (set STORAGE_LOCAL_PERSISTENT=true only if STORAGE_DIR is a persistent volume).");
  }
  if (e.AUDIO_RECORDING && e.STORAGE_DRIVER === "none") problems.push("AUDIO_RECORDING=true needs file storage — set STORAGE_DRIVER=s3, or AUDIO_RECORDING=false.");
  if (e.COOKIE_SECURE === false) problems.push("COOKIE_SECURE=false would send session cookies over plain HTTP.");
  // A provider without a key silently turns every AI feature off — almost always a missing secret.
  if (e.AI_PROVIDER !== "none" && e.AI_PROVIDER !== "ollama" && !e.AI_API_KEY) problems.push(`AI_PROVIDER=${e.AI_PROVIDER} requires AI_API_KEY (or set AI_PROVIDER=none deliberately).`);
  // Without it the app would quietly use localhost Redis, which doesn't exist on a production host.
  if (!raw.redisUrlSet) problems.push("REDIS_URL must be set explicitly in production.");
  // Remote origins must be HTTPS; localhost is allowed (docker-compose runs the production image locally).
  const origins = [...e.CORS_ORIGIN.split(","), e.APP_URL].map((o) => o.trim()).filter(Boolean);
  for (const o of origins) {
    if (/^http:\/\//.test(o) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) problems.push(`${o} must use https:// in production.`);
  }
  return problems;
}

export const env = load();
export const isProd = env.NODE_ENV === "production";
/** False when SANDBOX_DRIVER=disabled: build tasks, playground runs and interview coding turns are off. */
export const codeExecutionEnabled = () => env.SANDBOX_DRIVER !== "disabled";
/** False when STORAGE_DRIVER=none: no per-user files are kept. */
export const fileStorageEnabled = () => env.STORAGE_DRIVER !== "none";
/** Interview answer audio is offered only when switched on AND there is somewhere to keep it. */
export const audioRecordingEnabled = () => env.AUDIO_RECORDING && fileStorageEnabled();
export const corsOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
