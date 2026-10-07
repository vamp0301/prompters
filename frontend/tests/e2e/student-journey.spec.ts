import { expect, test } from "@playwright/test";

test("register → onboard → roadmap → topic → quiz → result", async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`;
  await page.goto("/register");
  await page.getByLabel("Name").fill("E2E Student");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Passw0rd!");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "Where are you starting from?" })).toBeVisible();
  await page.getByRole("button", { name: /Never coded/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /^JavaScript/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Start from the beginning/ }).click();

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText("Readiness score")).toBeVisible();

  await page.goto("/learn/topic/binary-bits-bytes");
  await expect(page.getByRole("heading", { level: 1, name: "Binary, bits and bytes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Explain like I'm new/ })).toBeVisible();

  await page.getByRole("button", { name: "Start quiz" }).click();
  await expect(page).toHaveURL(/\/quiz\//);
  await page.getByRole("button", { name: /^Submit$/ }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText(/Not yet|mastered|Passed/)).toBeVisible();
});

test("locked stage explains why", async ({ page }) => {
  const email = `e2e-lock-${Date.now()}@test.dev`;
  await page.request.post("/api/auth/register", { data: { name: "Lock", email, password: "Passw0rd!" } });
  await page.request.post("/api/profile/onboarding", { data: { startLanguage: "PYTHON", explanationLocale: "en", goalRole: "BACKEND", codingLevel: "ZERO", weeklyHours: 5 } });
  await page.goto("/learn/backend");
  await expect(page.getByText(/stage exam to unlock/i)).toBeVisible();
});
