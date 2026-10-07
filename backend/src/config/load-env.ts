// Loads backend/.env in development. In production, env vars come from the platform.
import { existsSync } from "node:fs";
import path from "node:path";

const file = path.resolve(process.cwd(), ".env");
if (process.env.NODE_ENV !== "production" && existsSync(file)) {
  process.loadEnvFile(file);
}
