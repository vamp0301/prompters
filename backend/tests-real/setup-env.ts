// Credentials come from the environment (or backend/.env when present). Values are never printed.
import { existsSync } from "node:fs";
import path from "node:path";

const file = path.resolve(__dirname, "../.env");
if ((process.env.REAL_AI === "1" || process.env.REAL_VOICE === "1") && existsSync(file)) process.loadEnvFile(file);
process.env.NODE_ENV = "test";
