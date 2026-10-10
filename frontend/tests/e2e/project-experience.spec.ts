import { expect, test } from "@playwright/test";
import { axe } from "./a11y";

/**
 * Project Experience Intelligence: every resume project becomes a module — evidence-labelled
 * overview, decisions, 20 questions, a knowledge test and editable facts. Fake-AI stack only.
 */
test.skip(!process.env.E2E_FAKE_AI, "Needs the fake-AI stack (E2E_FAKE_AI=1)");

const RESUME = "Riya Sharma — Backend developer. Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication. Backend intern at Acme for 6 months building REST APIs. 2★ CodeChef. B.Tech CSE 2026. Skills: JavaScript, Node.js, Express, MongoDB, Docker.";

test("a resume project becomes a full interview-prep module", async ({ page }) => {
  test.setTimeout(120_000);
  await page.request.post("/api/auth/register", { data: { name: "Riya Sharma", email: `pe${Date.now()}${Math.random().toString(36).slice(2, 6)}@example.com`, password: "Password123" } });
  await page.request.post("/api/profile/onboarding", { data: { startLanguage: "JAVASCRIPT", explanationLocale: "en", goalRole: "BACKEND", codingLevel: "BEGINNER", weeklyHours: 10 } });
  await page.request.post("/api/career/resumes", { data: { text: RESUME } });

  // Every project and job on the resume, each its own module.
  await page.goto("/career/projects");
  await expect(page.getByRole("heading", { level: 1, name: "My projects" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Notes API/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("link", { name: /Backend Intern @ Acme/ })).toBeVisible();
  await page.getByRole("link", { name: /Notes API/ }).click();

  // Overview: evidence labels, the project explained, architecture.
  await expect(page.getByRole("heading", { level: 1, name: "Notes API" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel("What the labels mean")).toBeVisible();
  await expect(page.getByText("Problem solved")).toBeVisible();
  await expect(page.getByText("30-second answer")).toBeVisible();
  await expect(page.getByRole("figure").first()).toBeVisible();
  await expect(page.getByText("What your resume actually says")).toBeVisible();
  expect(await axe(page)).toEqual([]);

  // Decisions: every technology, why it and not the alternative.
  await page.getByRole("tab", { name: "Decisions" }).click();
  await expect(page.getByRole("heading", { name: /Every choice: why, instead of what/ })).toBeVisible();
  await expect(page.getByRole("article", { name: "MongoDB decision" })).toContainText("Interview question");
  expect(await axe(page)).toEqual([]);

  // APIs: the integration map (own REST vs infrastructure), and failures marked as recommendations.
  await page.getByRole("tab", { name: "APIs" }).click();
  await expect(page.getByRole("heading", { name: "What this project talks to" })).toBeVisible();
  await expect(page.getByText("Own REST API", { exact: true })).toBeVisible();
  await expect(page.getByText("Infrastructure services", { exact: true })).toBeVisible();
  await expect(page.getByText("Recommended fallback").first()).toBeVisible();
  await expect(page.getByText("Measurement not provided.")).toBeVisible();
  expect(await axe(page)).toEqual([]);

  // Questions: 20 across L1–L5, each with an answer and follow-ups; claim defense.
  await page.getByRole("tab", { name: "Questions" }).click();
  await expect(page.getByText("Basic project knowledge")).toBeVisible();
  await page.locator("details summary").first().click();
  await expect(page.getByText("Why this answer").first()).toBeVisible();
  await expect(page.getByText(/Built JWT authentication for the Notes API/)).toBeVisible();

  // Facts: edit without touching the resume; the module goes stale and offers a rebuild.
  await page.getByRole("tab", { name: "Facts" }).click();
  await page.getByLabel(/^Users/).fill("Students in my college");
  await page.getByRole("button", { name: /Save 1 change/ }).click();
  await expect(page.getByRole("button", { name: /Rebuild with my facts/ })).toBeVisible();

  // Test: a quick knowledge test, one answer.
  await page.getByRole("tab", { name: "Test" }).click();
  await page.getByRole("button", { name: /Quick test/ }).click();
  await page.getByLabel("Your answer").fill("I chose this because the data model fit our access pattern and I measured the slow query first");
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Last answer" })).toBeVisible({ timeout: 20_000 });
  expect(await axe(page)).toEqual([]);

  // API interview: the full-system round starts at L1 with the endpoint drill-down.
  await page.getByRole("tab", { name: "Overview" }).click();
  await page.getByRole("tab", { name: "Test" }).click();
  await page.getByRole("list", { name: "API interview focus" }).getByRole("button", { name: "Full system" }).click();
  await expect(page.getByText(/most important endpoint/)).toBeVisible({ timeout: 20_000 });
  expect(await axe(page)).toEqual([]);
});
