import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/**
 * Skill Intelligence: knowledge maps → concept chapters → explain → mastery. Chapters are AI-written,
 * so this runs against the fake-AI stack (E2E_FAKE_AI=1 E2E_BASE_URL=…).
 */
test.skip(!process.env.E2E_FAKE_AI, "Needs the fake-AI stack (E2E_FAKE_AI=1)");

const RESUME = "Riya Sharma — Backend developer. Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication. Backend intern at Acme for 6 months building REST APIs. B.Tech CSE 2026. Skills: JavaScript, Node.js, Express, MongoDB, Docker.";
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

async function axe(page: Page) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    const r = await (window as unknown as { axe: { run: (o: unknown) => Promise<{ violations: { id: string }[] }> } }).axe.run({ runOnly: ["wcag2a", "wcag2aa"] });
    return r.violations.map((v) => v.id);
  });
}

async function signUp(page: Page) {
  await page.request.post("/api/auth/register", { data: { name: "Riya Sharma", email: `kn${Date.now()}${Math.random().toString(36).slice(2, 6)}@example.com`, password: "Password123" } });
  await page.request.post("/api/profile/onboarding", { data: { startLanguage: "JAVASCRIPT", explanationLocale: "en", goalRole: "BACKEND", codingLevel: "BEGINNER", weeklyHours: 10 } });
  await page.request.post("/api/career/resumes", { data: { text: RESUME } });
}

test("System Design track → concept chapter → modes → explain → mastered on the map", async ({ page }) => {
  await signUp(page);
  await page.goto("/career/skills");
  await page.getByRole("link", { name: /System Design/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "System Design" })).toBeVisible();
  await expect(page.getByText("132", { exact: true })).toBeVisible();
  expect(await axe(page)).toEqual([]);

  // Filter to must-know concepts only.
  await page.getByRole("tab", { name: /Must know/ }).click();
  await expect(page.getByRole("link", { name: /Consensus/ })).toHaveCount(0);
  await page.getByRole("link", { name: /Load Balancers/ }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Load Balancers" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Builds on:")).toBeVisible();
  await expect(page.getByRole("figure").first()).toContainText("What this shows:");
  expect(await axe(page)).toEqual([]);

  await page.getByRole("tab", { name: /Visual/ }).click();
  await expect(page.getByRole("figure")).toHaveCount(2);
  await page.getByRole("tab", { name: /Code/ }).click();
  await expect(page.getByText("Prints now, then later.")).toBeVisible();
  await page.getByRole("tab", { name: /Interview/ }).click();
  await page.getByRole("button", { name: /Show hint/ }).first().click();
  await expect(page.getByText("Think queues.")).toBeVisible();
  await page.getByRole("button", { name: /Reveal step 1/ }).click();

  await page.getByRole("tab", { name: /Explain/ }).click();
  await page.getByRole("button", { name: /Start 60-second/ }).click();
  await page.getByLabel("Your explanation").fill("It does async stuff with callbacks somehow.");
  await page.getByRole("button", { name: "Check my explanation" }).click();
  await expect(page.getByText(/Not yet — 75\+ masters this concept/)).toBeVisible();
  await page.getByLabel("Your explanation").fill("JavaScript runs on a single thread; I/O is handed off, and blocking code stalls every request.");
  await page.getByRole("button", { name: "Check my explanation" }).click();
  await expect(page.getByText(/Mastered — that's an interview-ready explanation/)).toBeVisible();

  await page.getByRole("link", { name: /System Design map/ }).click();
  await expect(page.getByText(/1% · 0 understood/)).toBeVisible();
});

test("resume skill: knowledge map with 'I understand this', and other skills are not open", async ({ page }) => {
  await signUp(page);
  await page.goto("/career/skills");
  await page.getByRole("link", { name: "Node.js" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Node.js" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("link", { name: /Event Loop/ }).click();
  await page.getByRole("button", { name: "I understand this" }).click();
  await expect(page.getByRole("button", { name: "Mark as still learning" })).toBeVisible();
  const res = await page.request.get("/api/career/knowledge/map?name=Kubernetes");
  expect(res.status()).toBe(404);
});
