import { expect, test } from "@playwright/test";
import { axe } from "./a11y";

/** Adding another resume: from the dashboard's pinned note, from Career AI's resume bar and the Top-100 card. */
test.skip(!process.env.E2E_FAKE_AI, "Needs the fake-AI stack (E2E_FAKE_AI=1)");

const RESUME = "Riya Sharma — Backend developer. Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication. Backend intern at Acme for 6 months building REST APIs. B.Tech CSE 2026. Skills: JavaScript, Node.js, Express, MongoDB, Docker.";
const NEW_RESUME = `${RESUME} Also built a Campaign scheduler with Redis and BullMQ, and a GenAI interview assistant with Gemini.`;

test("a new resume can be added from the dashboard note and from Career AI", async ({ page }) => {
  test.setTimeout(120_000);
  await page.request.post("/api/auth/register", { data: { name: "Riya Sharma", email: `ru${Date.now()}${Math.random().toString(36).slice(2, 6)}@example.com`, password: "Password123" } });
  await page.request.post("/api/profile/onboarding", { data: { startLanguage: "JAVASCRIPT", explanationLocale: "en", goalRole: "BACKEND", codingLevel: "BEGINNER", weeklyHours: 10 } });
  await page.request.post("/api/career/resumes", { data: { text: RESUME, label: "First CV" } });

  // Dashboard: a pinned sticky note shows the current resume and links to the upload.
  await page.goto("/dashboard");
  const note = page.locator(".note-yellow", { hasText: "Updated your resume?" });
  await expect(note).toBeVisible({ timeout: 20_000 });
  await expect(note).toContainText("Current: First CV");
  expect(await axe(page)).toEqual([]);
  await note.getByRole("link", { name: "Add new resume" }).click();

  // Career AI opens straight into the upload dialog.
  await expect(page).toHaveURL(/\/career\?addResume=1/);
  const dialog = page.getByRole("dialog", { name: "Add a new resume" });
  await expect(dialog).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await dialog.getByRole("tab", { name: "Paste text" }).click();
  await dialog.getByLabel("Resume text").fill(NEW_RESUME);
  await dialog.getByRole("button", { name: "Add resume" }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
  const bar = page.getByRole("region", { name: "Your resume" });
  await expect(bar).toContainText("2 resumes");

  // The bar's button opens the same dialog on any tab; Escape closes it.
  await page.getByRole("tab", { name: "My projects" }).click();
  await bar.getByRole("button", { name: "Add new resume" }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  // "Manage resumes" goes to the full list (Job match tab).
  await bar.getByRole("button", { name: "Manage resumes" }).click();
  await expect(page.getByRole("button", { name: "Delete resume First CV" })).toBeVisible();

  // Top-100 tab: a new resume can be added next to the resume picker.
  await page.getByRole("tab", { name: "Top 100 prep" }).click();
  await expect(page.getByRole("button", { name: "New resume", exact: true })).toBeVisible();
});
