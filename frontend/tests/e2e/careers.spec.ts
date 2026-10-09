import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/** Role-agnostic onboarding and multiple careers. Fake-AI stack only. */
test.skip(!process.env.E2E_FAKE_AI, "Needs the fake-AI stack (E2E_FAKE_AI=1)");

const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
async function axe(page: Page) {
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity));
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    const r = await (window as unknown as { axe: { run: (o: unknown) => Promise<{ violations: { id: string; nodes: { target: string[] }[] }[] }> } }).axe.run({ runOnly: ["wcag2a", "wcag2aa"] });
    return r.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  });
}

test("an MBA student prepares for Product Management — no programming language asked — and adds a second career", async ({ page }) => {
  test.setTimeout(120_000);
  await page.request.post("/api/auth/register", { data: { name: "Aditi Rao", email: `cr${Date.now()}${Math.random().toString(36).slice(2, 6)}@example.com`, password: "Password123" } });
  await page.goto("/onboarding");

  // 1. The career: search by what you're aiming for; nothing is pre-selected.
  await expect(page.getByRole("heading", { name: "What role are you preparing for?" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  await page.getByLabel("Search careers").fill("product manager");
  await page.getByRole("list", { name: "Careers" }).getByRole("button", { name: /Product Manager \/ APM/ }).click();
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Continue" }).click();

  // 2. Experience — and no "first programming language" for a non-coding career.
  await expect(page.getByRole("heading", { name: "Where are you starting from?" })).toBeVisible();
  await expect(page.getByText("Your first programming language")).toHaveCount(0);
  await page.getByRole("button", { name: /Student \/ fresher/ }).click();
  await page.getByLabel("Education (optional)").fill("MBA, IIM 2026");
  await page.getByRole("button", { name: "Continue" }).click();

  // 3. Timeline, then straight to preparing (the coding placement test isn't offered).
  await expect(page.getByRole("heading", { name: "What's your timeline?" })).toBeVisible();
  await expect(page.getByText("Take the placement test")).toHaveCount(0);
  await page.getByRole("button", { name: "Start preparing" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

  // Profile: the career is primary; add a second one and switch.
  await page.goto("/profile");
  const careers = page.locator("#careers");
  await expect(careers).toContainText("Product Manager / APM", { timeout: 20_000 });
  await expect(careers).toContainText("Primary");
  await careers.getByRole("button", { name: "Add a career" }).click();
  const dialog = page.getByRole("dialog", { name: "Add a career" });
  await dialog.getByLabel("Search careers").fill("data analyst");
  await dialog.getByRole("list", { name: "Careers" }).getByRole("button", { name: /^Data Analyst/ }).click();
  expect(await axe(page)).toEqual([]);
  await dialog.getByRole("button", { name: "Add Data Analyst" }).click();
  await expect(dialog).toBeHidden();
  await expect(careers.getByRole("listitem")).toHaveCount(2);
  await careers.getByRole("listitem").filter({ hasText: "Data Analyst" }).getByRole("button", { name: "Make primary" }).click();
  await expect(careers.getByRole("listitem").filter({ hasText: "Data Analyst" })).toContainText("Primary");
  expect(await axe(page)).toEqual([]);
});

test("a coding career still asks for the first language", async ({ page }) => {
  await page.request.post("/api/auth/register", { data: { name: "Riya", email: `cc${Date.now()}${Math.random().toString(36).slice(2, 6)}@example.com`, password: "Password123" } });
  await page.goto("/onboarding");
  await page.getByLabel("Search careers").fill("backend");
  await page.getByRole("list", { name: "Careers" }).getByRole("button", { name: /Backend Developer/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Your first programming language")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  await page.getByRole("button", { name: /^Python/ }).click();
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
});
