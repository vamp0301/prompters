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
  SANDBOX_DRIVER: z.enum(["process", "docker", "disabled"]).default("process"),
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
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_DIR: z.string().default("./storage"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  /** Top-100 plan generations allowed per user per rolling 24 hours (each costs ~20–25 model calls). */
  PREP_DAILY_PLAN_LIMIT: z.coerce.number().int().min(1).max(100).default(3),
  /** Interview audio is deleted automatically after this many days. */
  RECORDING_RETENTION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  RATE_LIMIT_DISABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  if (parsed.data.NODE_ENV === "production") {
    const problems = productionProblems(parsed.data, { redisUrlSet: !!process.env.REDIS_URL });
    if (problems.length) throw new Error(`Refusing to start in production:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  }
  return parsed.data;
}

/** Placeholder secrets from .env.example / docs that must never reach production. */
const EXAMPLE_SECRETS = [/^dev-only/, /^change-me/i, /^YOUR_/, /^ci-secret/];

/**
 * Settings that are fine in development but unsafe in production. Fatal, because the safe
 * alternative is always available. Exported for tests.
 */
export function productionProblems(
  e: Pick<Env, "JWT_SECRET" | "SANDBOX_DRIVER" | "STORAGE_DRIVER" | "S3_BUCKET" | "COOKIE_SECURE" | "AI_PROVIDER" | "AI_API_KEY" | "CORS_ORIGIN" | "APP_URL">,
  raw: { redisUrlSet: boolean } = { redisUrlSet: true },
) {
  const problems: string[] = [];
  if (EXAMPLE_SECRETS.some((re) => re.test(e.JWT_SECRET))) problems.push("JWT_SECRET is a development/example value — generate a real secret.");
  // The process driver is not a security boundary: untrusted code would run on the worker host.
  if (e.SANDBOX_DRIVER === "process") problems.push("SANDBOX_DRIVER=process is not allowed in production — use 'docker', or 'disabled' until the Docker sandbox is deployed.");
  if (e.STORAGE_DRIVER === "s3" && !e.S3_BUCKET) problems.push("STORAGE_DRIVER=s3 requires S3_BUCKET.");
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
export const corsOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
