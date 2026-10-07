import { defineConfig, devices } from "@playwright/test";

/** E2E needs the API (port 4000) + worker running; `npm run dev` is started automatically. */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  // Registration deliberately hashes with bcrypt (12 rounds, pure JS); with desktop + mobile running in
  // parallel on one machine a register → onboarding hop can take 3–4 s, right at the 5 s default.
  expect: { timeout: 10_000 },
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000", trace: "retain-on-failure" },
  webServer: process.env.E2E_BASE_URL ? undefined : { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
