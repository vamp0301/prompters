import { userInfo } from "node:os";
// Tests always use a local throwaway database and Redis — never the Neon/Upstash URLs in .env.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? `postgresql://${userInfo().username}@localhost:5432/prompters_test?schema=public`;
process.env.DIRECT_URL = process.env.DATABASE_URL;
process.env.REDIS_URL = process.env.TEST_REDIS_URL ?? "redis://localhost:6379/15";
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-1234";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.SANDBOX_DRIVER = "process";
process.env.AI_PROVIDER = "none";
process.env.RATE_LIMIT_DISABLED = "true";
process.env.STORAGE_DRIVER = "local";
process.env.STORAGE_DIR = `${process.env.TMPDIR ?? "/tmp"}/prompters-test-storage`;
