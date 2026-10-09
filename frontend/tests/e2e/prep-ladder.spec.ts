import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/**
 * Top-100 difficulty ladder: questions pitched at the candidate's experience, published step by
 * step (Basics → Core → Advanced), paged on the server, a fresh set on regenerate, and a flow
 * diagram in every skill overview. Runs against the fake-AI stack (E2E_FAKE_AI=1 E2E_BASE_URL=…).
 */
test.skip(!process.env.E2E_FAKE_AI, "Needs the fake-AI stack (E2E_FAKE_AI=1)");

const RESUME = "Riya Sharma — Backend developer. Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication. Backend intern at Acme for 6 months building REST APIs. 2★ CodeChef. B.Tech CSE 2026. Skills: JavaScript, Node.js, Express, MongoDB, Docker.";
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

async function axe(page: Page) {
  // Check colours once entrance animations (page fade, chips) have finished; infinite spinners are ignored.
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity));
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    const r = await (window as unknown as { axe: { run: (o: unknown) => Promise<{ violations: { id: string; nodes: { target: string[]; failureSummary?: string }[] }[] }> } }).axe.run({ runOnly: ["wcag2a", "wcag2aa"] });
    // Rule id plus the first offending elements, so a failure says where.
    return r.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => `${n.target.join(" ")} — ${(n.failureSummary ?? "").split("\n").slice(1, 2).join("").trim()}`).join(" | ")}`);
  });
}

/** Signs up, adds a resume and generates a Top-100 plan for a target role; returns the plan id once READY. */
async function readyPlan(page: Page, role = "backend") {
  await page.request.post("/api/auth/register", { data: { name: "Riya Sharma", email: `lad${Date.now()}${Math.random().toString(36).slice(2, 7)}@example.com`, password: "Password123" } });
  await page.request.post("/api/profile/onboarding", { data: { startLanguage: "JAVASCRIPT", explanationLocale: "en", goalRole: "BACKEND", codingLevel: "BEGINNER", weeklyHours: 10 } });
  const resume = await (await page.request.post("/api/career/resumes", { data: { text: RESUME } })).json();
  const plan = await (await page.request.post("/api/career/prep", { data: { resumeId: resume.data.id, targetRole: role } })).json();
  const id = plan.data.id as string;
  await expect.poll(async () => (await (await page.request.get(`/api/career/prep/${id}`)).json()).data.status, { timeout: 60_000 }).toBe("READY");
  return id;
}

test("the Top 100 climbs step by step: pages, stage tabs, order, search and practice", async ({ page }) => {
  const id = await readyPlan(page);
  await page.goto(`/career/prep/${id}`);
  await expect(page.getByRole("heading", { level: 1, name: "Your Top 100 Interview Questions" })).toBeVisible();
  await expect(page.getByText(/Pitched at: Student \/ fresher/)).toBeVisible();

  // Opens step by step at Step 1 (Easy), 10 per page, then moves to the next step.
  const steps = page.getByRole("navigation", { name: "Difficulty steps" });
  await expect(steps.getByRole("button", { name: /Step 1\s*Easy/ })).toHaveAttribute("aria-current", "step");
  await expect(page.getByText(/^Showing 1–\d+ of \d+ \(filtered from 100\)$/)).toBeVisible();
  const stepPages = page.getByRole("navigation", { name: "Question pages" });
  const last = stepPages.getByRole("button", { name: /^Page \d+$/ }).last();
  if (await last.count()) await last.click();
  await page.getByRole("button", { name: /^Next: Step 2/ }).click();
  await expect(steps.getByRole("button", { name: /Step 2\s*Basic/ })).toHaveAttribute("aria-current", "step");
  expect(await axe(page)).toEqual([]);
  await steps.getByRole("button", { name: /All levels/ }).click();

  await expect(page.getByRole("heading", { name: "Step 1 · Basics" })).toBeVisible();
  await expect(page.getByText("Showing 1–20 of 100")).toBeVisible();
  expect(await axe(page)).toEqual([]);

  const pages = page.getByRole("navigation", { name: "Question pages" });
  await pages.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Showing 21–40 of 100")).toBeVisible();
  await expect(pages.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  // The last page reaches the hardest step.
  await pages.getByRole("button", { name: "Page 5" }).click();
  await expect(page.getByText("Showing 81–100 of 100")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Step 3 · Advanced" })).toBeVisible();

  // Stage tab: only the Advanced step (a student's plan has 15), and filters reset paging.
  await page.getByRole("tab", { name: /3\. Advanced/ }).click();
  await expect(page.getByText("Showing 1–15 of 15 (filtered from 100)")).toBeVisible();
  await page.getByRole("tab", { name: /All steps/ }).click();
  await expect(page.getByText("Showing 1–20 of 100")).toBeVisible();

  // Most-likely order drops the step headings; search is server-side.
  await page.getByLabel("Order").selectOption("likely");
  await expect(page.getByRole("heading", { name: "Step 1 · Basics" })).toHaveCount(0);
  await page.getByLabel("Order").selectOption("ladder");
  await page.getByRole("textbox", { name: "Search" }).fill("MongoDB");
  await expect(page.getByText(/filtered from 100/)).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByText("Showing 1–20 of 100")).toBeVisible();

  // A question opens with its hint and practice (loaded with the question, not the list).
  await page.getByRole("button", { name: /TOP 01/ }).click();
  await expect(page.getByRole("dialog", { name: "Interview question" })).toBeVisible();
  await page.keyboard.press("Escape");

  // By topic still groups the whole plan.
  await page.getByRole("tab", { name: "By topic" }).click();
  await expect(page.getByText(/Showing 100 of 100/)).toBeVisible();
});

test("regenerating gives a fresh set", async ({ page }) => {
  const id = await readyPlan(page, "sde");
  await page.goto(`/career/prep/${id}`);
  await page.getByRole("button", { name: "Regenerate" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Regenerate" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/career/prep/") && !u.pathname.endsWith(id), { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Your Top 100 Interview Questions" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Fresh set: none of these questions were in your previous plan for this target.")).toBeVisible();
});

test("while generating: the resume is read, the ladder fills, and Basics can be practised early", async ({ page }) => {
  const id = await readyPlan(page);
  const real = (await (await page.request.get(`/api/career/prep/${id}`)).json()).data;
  const running = {
    ...real,
    status: "RUNNING",
    completedAt: null,
    published: 50,
    progress: {
      ...real.progress,
      stages: [
        { stage: 1, label: "Basics", target: 50, done: 50, published: 50, state: "done" },
        { stage: 2, label: "Core", target: 35, done: 12, published: 0, state: "running" },
        { stage: 3, label: "Advanced", target: 15, done: 0, published: 0, state: "pending" },
      ],
      ranking: { state: "pending" },
    },
  };
  let reading = true;
  // The plan endpoint is replayed in two moments of a real run: resume being read, then Basics published.
  await page.route(`**/api/career/prep/${id}`, (route) =>
    route.fulfill({
      json: {
        success: true,
        data: reading ? { ...running, published: 0, progress: { ...running.progress, resume: { state: "running" }, skills: { state: "pending" }, projects: { state: "pending" }, level: undefined, stages: undefined } } : running,
      },
    }),
  );
  await page.goto(`/career/prep/${id}`);
  await expect(page.getByText("Reading your resume…")).toBeVisible();
  await expect(page.getByText(/Looking for/)).toBeVisible();
  await page.screenshot({ path: "test-results/prep-reading.png", fullPage: true });

  reading = false;
  await expect(page.getByText("Found on your resume")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("listitem").filter({ hasText: /^Node\.js$/ }).first()).toBeVisible();
  const ladder = page.getByRole("list", { name: "Question ladder" });
  await expect(ladder).toContainText("50 ready to practise");
  await expect(ladder).toContainText("writing & checking · 12/35");
  await expect(page.getByRole("heading", { name: "Start practising" })).toBeVisible();
  // Practising starts at Step 1 (Easy) while harder steps are still being written.
  await expect(page.getByRole("navigation", { name: "Difficulty steps" }).getByRole("button", { name: /Step 1\s*Easy/ })).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("button", { name: /TOP \d+/ }).first()).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/prep-generating.png", fullPage: true });
});

test("every skill overview shows how the skill flows, as a diagram", async ({ page }) => {
  await readyPlan(page);
  await page.goto("/career/skills/guide?name=Node.js");
  await expect(page.getByRole("heading", { name: "How it flows" })).toBeVisible({ timeout: 30_000 });
  const figure = page.getByRole("figure").first();
  await expect(figure).toContainText("Request arrives");
  await expect(figure).toContainText("What this shows:");
  expect(await axe(page)).toEqual([]);
});
