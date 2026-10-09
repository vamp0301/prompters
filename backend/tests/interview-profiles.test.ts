import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { login, resetDb, seedFixture, startWorker } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";

/** Interviews belong to a career profile: never linked to the wrong one, never read across careers. */
const fake = new FakeAI();
const CONSENT = { recording: true, integrity: true, preparationOnly: true };
const RESUME = "Aditi Rao — MBA (Marketing & Strategy), IIM 2026. EV adoption study: market research survey of 400 respondents. Sales dashboard in Power BI from a 50k-row Excel dataset; cleaned data and built KPIs with SQL. Summer intern at Acme Retail: competitor analysis and go-to-market plan. Skills: Excel, SQL, Power BI, market research.";
const WEAK = "not sure";
type Agent = Awaited<ReturnType<typeof login>>["agent"];

beforeAll(async () => {
  await resetDb();
  await seedFixture();
  await prisma.featureFlag.create({ data: { key: "AI_INTERVIEW", description: "", enabled: true } });
  setAIProvider(fake);
  startWorker();
});
afterAll(() => setAIProvider(undefined));

async function student(roles: string[]) {
  const u = await login("STUDENT", { onboard: false });
  await u.agent.post("/api/profile/onboarding").send({ targetRoleKey: roles[0], explanationLocale: "en", weeklyHours: 8 });
  for (const r of roles.slice(1)) await u.agent.post("/api/me/target-roles").send({ roleKey: r });
  const profiles = (await u.agent.get("/api/me/target-roles")).body.data as { id: string; roleKey: string }[];
  const resumeId = (await u.agent.post("/api/career/resumes").send({ text: RESUME, label: "CV" })).body.data.id as string;
  return { ...u, resumeId, profile: (k: string) => profiles.find((p) => p.roleKey === k)!.id };
}
const start = (agent: Agent, body: Record<string, unknown>) => agent.post("/api/career/sessions").send({ durationMinutes: 15, consent: CONSENT, ...body });
async function finish(agent: Agent, id: string, first: { id: string }, answer: string) {
  let current: { id: string } | null = first;
  for (let i = 0; i < 30 && current; i++) {
    const res: { status: number; body: { data: { done: boolean; current: { id: string } | null } } } = await agent.post(`/api/career/sessions/${id}/answer`).send({ turnId: current.id, answerText: answer });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    current = res.body.data.done ? null : res.body.data.current;
  }
}

describe("migration backfill", () => {
  it("links historical sessions only when unambiguous, and is idempotent", async () => {
    const sql = readFileSync(path.join(__dirname, "../prisma/migrations/20261017090000_interview_profiles/migration.sql"), "utf8");
    const backfill = sql.slice(sql.indexOf(`UPDATE "InterviewSession"`)).trim().replace(/;$/, "");
    const a = await student(["product_manager"]);
    const b = await login(); // a different user, no profile for product_manager
    const aPm = a.profile("product_manager");
    const mk = (userId: string, targetRole: string | null) => prisma.interviewSession.create({ data: { userId, targetRole, consent: {}, status: "COMPLETED" } });
    const linked = await mk(a.id, "product_manager"); // A has a PM profile → linked
    const noProfile = await mk(a.id, "data_analyst"); // A has no Data Analyst profile → stays null
    const legacyMatch = await mk(a.id, null); // old job-match session with no stored role → stays null
    const otherUser = await mk(b.id, "product_manager"); // B has no PM profile → null (never A's, though A has one)
    await prisma.$executeRawUnsafe(backfill);
    await prisma.$executeRawUnsafe(backfill); // safe to run again
    const get = async (id: string) => (await prisma.interviewSession.findUniqueOrThrow({ where: { id } })).targetRoleProfileId;
    expect(await get(linked.id)).toBe(aPm);
    expect(await get(noProfile.id)).toBeNull();
    expect(await get(legacyMatch.id)).toBeNull();
    expect(await get(otherUser.id)).toBeNull();
  });
});

describe("creating an interview for a career", () => {
  it("links the user's own profile of the same role; rejects someone else's, a mismatched role, or an archived career", async () => {
    const s = await student(["product_manager", "data_analyst"]);
    const pm = s.profile("product_manager");
    const da = s.profile("data_analyst");

    // Explicit profile; the role can come from it.
    const byProfile = await start(s.agent, { resumeId: s.resumeId, targetRoleProfileId: pm });
    expect(byProfile.status, JSON.stringify(byProfile.body)).toBe(201);
    let row = await prisma.interviewSession.findUniqueOrThrow({ where: { id: byProfile.body.data.id } });
    expect(row).toMatchObject({ targetRoleProfileId: pm, targetRole: "product_manager" });
    await s.agent.post(`/api/career/sessions/${row.id}/end`);

    // Role only: the user's profile for exactly that role.
    const byRole = await start(s.agent, { resumeId: s.resumeId, targetRole: "data_analyst" });
    row = await prisma.interviewSession.findUniqueOrThrow({ where: { id: byRole.body.data.id } });
    expect(row.targetRoleProfileId).toBe(da);
    await s.agent.post(`/api/career/sessions/${row.id}/end`);

    // A role the user has no career for: no profile (never the primary as a guess).
    const noCareer = await start(s.agent, { resumeId: s.resumeId, targetRole: "marketing_manager" });
    row = await prisma.interviewSession.findUniqueOrThrow({ where: { id: noCareer.body.data.id } });
    expect(row.targetRoleProfileId).toBeNull();
    await s.agent.post(`/api/career/sessions/${row.id}/end`);

    expect((await start(s.agent, { resumeId: s.resumeId, targetRole: "data_analyst", targetRoleProfileId: pm })).status).toBe(400);
    const other = await student(["product_manager"]);
    expect((await start(s.agent, { resumeId: s.resumeId, targetRoleProfileId: other.profile("product_manager") })).status).toBe(404);
    await s.agent.delete(`/api/me/target-roles/${da}`);
    expect((await start(s.agent, { resumeId: s.resumeId, targetRole: "data_analyst", targetRoleProfileId: da })).status).toBe(409);
  });

  it("a session whose career link no longer matches is refused on every access", async () => {
    const s = await student(["product_manager"]);
    const res = await start(s.agent, { resumeId: s.resumeId, targetRoleProfileId: s.profile("product_manager") });
    const id = res.body.data.id as string;
    const other = await student(["product_manager"]);
    // Simulate corruption/tampering: point the session at another user's profile.
    await prisma.interviewSession.update({ where: { id }, data: { targetRoleProfileId: other.profile("product_manager") } });
    expect((await s.agent.get(`/api/career/sessions/${id}`)).status).toBe(409);
    expect((await s.agent.post(`/api/career/sessions/${id}/answer`).send({ turnId: res.body.data.current.id, answerText: "x" })).status).toBe(409);
    expect((await s.agent.post(`/api/career/sessions/${id}/pause`)).status).toBe(409);
    expect((await other.agent.get(`/api/career/sessions/${id}`)).status).toBe(404); // still not theirs
  });
});

describe("switching careers", () => {
  it("a Data Analyst interview never steers a Product Manager interview, and history filters by career", async () => {
    const s = await student(["data_analyst", "product_manager"]);
    const da = s.profile("data_analyst");
    const pm = s.profile("product_manager");

    const first = await start(s.agent, { resumeId: s.resumeId, targetRoleProfileId: da });
    await finish(s.agent, first.body.data.id, first.body.data.current, WEAK);
    const daRow = await prisma.interviewSession.findUniqueOrThrow({ where: { id: first.body.data.id } });
    const struggled = (daRow.report as { struggled?: string[] }).struggled ?? [];
    expect(struggled.length).toBeGreaterThan(0);

    // The PM interview carries none of the Data Analyst weak areas or comparison.
    const second = await start(s.agent, { resumeId: s.resumeId, targetRoleProfileId: pm });
    const pmRow = await prisma.interviewSession.findUniqueOrThrow({ where: { id: second.body.data.id } });
    expect(pmRow.focusAreas).toEqual([]);
    await finish(s.agent, second.body.data.id, second.body.data.current, WEAK);
    const pmReport = (await prisma.interviewSession.findUniqueOrThrow({ where: { id: second.body.data.id } })).report as { readinessChange?: { improved: string[]; declined: string[] } };
    expect([...(pmReport.readinessChange?.improved ?? []), ...(pmReport.readinessChange?.declined ?? [])]).toEqual([]);

    // A second Data Analyst interview does carry the Data Analyst weak areas.
    const third = await start(s.agent, { resumeId: s.resumeId, targetRoleProfileId: da });
    const daAgain = await prisma.interviewSession.findUniqueOrThrow({ where: { id: third.body.data.id } });
    expect(daAgain.focusAreas.length).toBeGreaterThan(0);
    expect(daAgain.focusAreas.every((f) => struggled.includes(f))).toBe(true);
    await s.agent.post(`/api/career/sessions/${third.body.data.id}/end`);

    const daHistory = (await s.agent.get(`/api/career/sessions?targetRoleProfileId=${da}`)).body.data as { id: string; targetRoleProfileId: string }[];
    expect(daHistory.map((h) => h.id).sort()).toEqual([first.body.data.id, third.body.data.id].sort());
    expect(daHistory.every((h) => h.targetRoleProfileId === da)).toBe(true);
    const all = (await s.agent.get("/api/career/sessions")).body.data;
    expect(all).toHaveLength(3); // unfiltered history is unchanged (public contract)
    const stranger = await student(["data_analyst"]);
    expect((await stranger.agent.get(`/api/career/sessions?targetRoleProfileId=${da}`)).status).toBe(404);
  });
});
