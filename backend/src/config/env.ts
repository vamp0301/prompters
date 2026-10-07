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
  SANDBOX_DRIVER: z.enum(["process", "docker"]).default("process"),
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
  if (parsed.data.NODE_ENV === "production" && parsed.data.JWT_SECRET.startsWith("dev-only")) {
    throw new Error("Refusing to start in production with the development JWT_SECRET");
  }
  return parsed.data;
}

export const env = load();
export const isProd = env.NODE_ENV === "production";
export const corsOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
