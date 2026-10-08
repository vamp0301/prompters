import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/**
 * Personalization: "Your next best move" on the dashboard (baseline ranker, honestly labelled),
 * feedback, and the Top-100 "For you" order. Runs against the fake-AI stack (E2E_FAKE_AI=1 …).
 */
test.skip(!process.env.E2E_FAKE_AI, "Needs the fake-AI stack (E2E_FAKE_AI=1)");

const RESUME = "Riya Sharma — Backend developer. Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication. Backend intern at Acme for 6 months building REST APIs. 2★ CodeChef. B.Tech CSE 2026. Skills: JavaScript, Node.js, Express, MongoDB, Docker.";
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

async function axe(page: Page) {
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity));
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    const r = await (window as unknown as { axe: { run: (o: unknown) => Promise<{ violations: { id: string; nodes: { target: string[] }[] }[] }> } }).axe.run({ runOnly: ["wcag2a", "wcag2aa"] });
    return r.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  });
}

async function signUp(page: Page) {
  await page.request.post("/api/auth/register", { data: { name: "Riya Sharma", email: `nbm${Date.now()}${Math.random().toString(36).slice(2, 7)}@example.com`, password: "Password123" } });
  await page.request.post("/api/profile/onboarding", { data: { startLanguage: "JAVASCRIPT", explanationLocale: "en", goalRole: "BACKEND", codingLevel: "BEGINNER", weeklyHours: 10 } });
}

test("dashboard: your next best move, with reasons, honest engine label and 'Not now'", async ({ page }) => {
  await signUp(page);
  await page.goto("/dashboard");
  await expect(page.getByText("Your next best move")).toBeVisible({ timeout: 30_000 });
  const title = page.locator("#nbm-title");
  await expect(title).toBeVisible();
  const first = await title.textContent();
  await expect(page.getByText(/^Why:/)).toBeVisible();
  await expect(page.getByRole("list", { name: "Reasons" })).toBeVisible();
  // Never claims ML when the baseline ranked it.
  await expect(page.getByText(/Ranked by a transparent scoring formula/)).toBeVisible();
  await expect(page.getByText(/Still getting to know you/)).toBeVisible();
  for (const panel of ["Skill gaps", "Due revisions", "Interview weaknesses", "Recommended practice"]) await expect(page.getByRole("region", { name: panel })).toBeVisible();
  expect(await axe(page)).toEqual([]);

  // "Not now" dismisses it and the next one takes its place.
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(title).not.toHaveText(first ?? "", { timeout: 15_000 });

  // Following the suggestion records ACCEPTED and goes there.
  const go = page.locator("section[aria-labelledby='nbm-title'] a").first();
  const href = await go.getAttribute("href");
  await go.click();
  await page.waitForURL((u) => u.pathname + u.search === href, { timeout: 15_000 });
});

test("Top-100: 'For you' order shows why each question is suggested", async ({ page }) => {
  await signUp(page);
  const resume = await (await page.request.post("/api/career/resumes", { data: { text: RESUME } })).json();
  const plan = await (await page.request.post("/api/career/prep", { data: { resumeId: resume.data.id, targetRole: "backend" } })).json();
  const id = plan.data.id as string;
  await expect.poll(async () => (await (await page.request.get(`/api/career/prep/${id}`)).json()).data.status, { timeout: 60_000 }).toBe("READY");
  await page.goto(`/career/prep/${id}?sort=personal`);
  await expect(page.getByLabel("Order")).toHaveValue("personal");
  await expect(page.getByRole("list", { name: "Why it's suggested for you" }).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Showing 1–20 of 100")).toBeVisible();
  expect(await axe(page)).toEqual([]);
  // Deep link from a recommendation: pre-filtered by skill.
  await page.goto(`/career/prep/${id}?skill=Node.js`);
  await expect(page.getByLabel("Skill")).toHaveValue("Node.js");
});

const sql = (q: string) => execSync(`psql -qtA ${process.env.E2E_DB_URL} -c "${q.replace(/"/g, '\\"')}"`).toString().trim();

test("admin: personalization debug shows the ranker, skill state, next recommendation and why", async ({ page, browser }) => {
  test.skip(!process.env.E2E_DB_URL, "Needs E2E_DB_URL to promote an admin");
  // A student whose engine has run once (dashboard visit).
  await signUp(page);
  const me = await (await page.request.get("/api/auth/me")).json();
  await page.goto("/dashboard");
  await expect(page.getByText("Your next best move")).toBeVisible({ timeout: 30_000 });

  const ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  const admin = await ctx.newPage();
  const email = `adm${Date.now()}${Math.random().toString(36).slice(2, 6)}@example.com`;
  await admin.request.post("/api/auth/register", { data: { name: "Ops Admin", email, password: "Password123" } });
  sql(`UPDATE "User" SET role = 'ADMIN' WHERE email = '${email}'`);
  await admin.request.post("/api/auth/login", { data: { email, password: "Password123" } });

  await admin.goto("/admin/personalization");
  await expect(admin.getByRole("heading", { level: 1, name: "Personalization debug" })).toBeVisible({ timeout: 20_000 });
  await admin.getByLabel("Search by email or name").fill(me.data.email);
  await admin.getByRole("list", { name: "Students" }).getByRole("button", { name: new RegExp(me.data.email.replace(/[.+]/g, "\\$&")) }).click();
  await expect(admin.getByText("BASELINE", { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(admin.getByRole("heading", { name: "Next recommendation" })).toBeVisible();
  await expect(admin.getByText("PENDING").first()).toBeVisible();
  await expect(admin.getByRole("list", { name: "Reasons" })).toBeVisible();
  await expect(admin.getByRole("heading", { name: "Skill state" })).toBeVisible();
  expect(await axe(admin)).toEqual([]);
  // Every lookup is audited.
  expect(Number(sql(`SELECT count(*) FROM "AdminAuditLog" a JOIN "User" u ON u.id = a."actorId" WHERE u.email = '${email}' AND a.action = 'VIEWED_PERSONALIZATION'`))).toBeGreaterThan(0);
  await ctx.close();
});
