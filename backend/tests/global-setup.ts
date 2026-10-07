import { userInfo } from "node:os";
import { execSync } from "node:child_process";

export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? `postgresql://${userInfo().username}@localhost:5432/prompters_test?schema=public`;
  execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url, PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "test database reset" },
  });
}
