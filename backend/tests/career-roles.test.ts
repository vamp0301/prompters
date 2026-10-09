import { afterAll, beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import { login, resetDb, seedFixture } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { createApp } from "../src/server/app.js";
import { refresh } from "../src/modules/personalization/engine.js";
import { generateCandidates } from "../src/modules/personalization/candidates.js";
import { careerContext, conceptStates, loadStudentData, studentDifficulty } from "../src/modules/personalization/data.js";
import { competency, roleDef } from "../src/modules/roles/taxonomy.js";
import { MAX_ACTIVE_PROFILES } from "../src/modules/roles/profiles.service.js";

/** Role-agnostic careers: profiles, onboarding and recommendations that respect the chosen career. */
const fake = new FakeAI();
const app = createApp();
const MBA_RESUME = [
  "Aditi Rao — MBA (Marketing & Strategy) candidate, IIM 2026",
  "Projects",
  "EV adoption study: market research survey of 400 respondents, segmentation and pricing recommendation. Tools: Excel, SQL.",
  "Experience",
  "Summer intern at Acme Retail for 2 months: competitor analysis and go-to-market plan for a new product line.",
  "Education",
  "BBA 2023; MBA 2026. Skills: Excel, PowerPoint, Python, SQL, market research, stakeholder management.",
].join("\n");

beforeAll(async () => {
  await resetDb();
  await seedFixture();
  await prisma.featureFlag.create({ data: { key: "AI_INTERVIEW", description: "", enabled: true } });
  setAIProvider(fake);
});
afterAll(() => setAIProvider(undefined));

type Agent = Awaited<ReturnType<typeof login>>["agent"];
const onboard = (agent: Agent, body: Record<string, unknown>) => agent.post("/api/profile/onboarding").send({ explanationLocale: "en", weeklyHours: 8, ...body });

describe("career catalogue API (public)", () => {
  it("lists careers by family and search, shows a role's framework, and classifies free text", async () => {
    const list = (await supertest(app).get("/api/roles")).body.data;
    expect(list.families).toHaveLength(8);
    expect(list.roles.length).toBeGreaterThanOrEqual(25);
    expect((await supertest(app).get("/api/roles?q=product")).body.data.roles.map((r: { key: string }) => r.key)).toEqual(expect.arrayContaining(["product_manager", "product_analyst"]));
    const pm = (await supertest(app).get("/api/roles/product_manager")).body.data;
    expect(pm.code).toBe(false);
    expect(pm.reviewed).toBe(false); // honest: curated, not practitioner-reviewed
    expect(pm.competencies.required.map((c: { name: string }) => c.name)).toContain("Product sense");
    expect((await supertest(app).get("/api/roles/astronaut")).status).toBe(404);
    const c = (await supertest(app).post("/api/roles/classify").send({ text: "APM at a fintech" })).body.data;
    expect(c.suggestions[0].key).toBe("product_manager");
  });
});

describe("onboarding", () => {
  it("a non-technical career needs no programming language and becomes the primary target role", async () => {
    const { agent } = await login("STUDENT", { onboard: false });
    const res = await onboard(agent, { targetRoleKey: "product_manager", experienceLevel: "STUDENT", targetDate: "2026-12-01" });
    expect(res.status).toBe(200);
    const roles = (await agent.get("/api/me/target-roles")).body.data;
    expect(roles).toHaveLength(1);
    expect(roles[0]).toMatchObject({ roleKey: "product_manager", primary: true, level: "STUDENT", role: { family: "product", code: false } });
  });

  it("a coding career still asks for the first language; unknown careers are rejected", async () => {
    const { agent } = await login("STUDENT", { onboard: false });
    expect((await onboard(agent, { targetRoleKey: "backend" })).status).toBe(400);
    expect((await onboard(agent, { targetRoleKey: "astronaut" })).status).toBe(400);
    expect((await onboard(agent, {})).status).toBe(400); // never silently "software engineer"
    expect((await onboard(agent, { targetRoleKey: "backend", startLanguage: "JAVASCRIPT" })).status).toBe(200);
  });

  it("older clients (goalRole) keep working and get a matching target role", async () => {
    const { agent } = await login("STUDENT", { onboard: false });
    expect((await onboard(agent, { goalRole: "FULLSTACK", codingLevel: "BEGINNER", startLanguage: "PYTHON" })).status).toBe(200);
    expect((await agent.get("/api/me/target-roles")).body.data.map((r: { roleKey: string }) => r.roleKey)).toEqual(["fullstack"]);
  });

  it("users onboarded before target roles existed get one from their goal role, once", async () => {
    const { agent, id } = await login(); // default helper onboarding (goalRole set, no profile row yet)
    await prisma.targetRoleProfile.deleteMany({ where: { userId: id } });
    await Promise.all([0, 1].map(() => agent.get("/api/me/target-roles")));
    expect(await prisma.targetRoleProfile.count({ where: { userId: id } })).toBe(1);
  });
});

describe("multiple target roles", () => {
  it("add, prevent duplicates, switch primary, archive — and only ever your own", async () => {
    const { agent } = await login("STUDENT", { onboard: false });
    await onboard(agent, { targetRoleKey: "data_analyst" });
    const pm = await agent.post("/api/me/target-roles").send({ roleKey: "product_manager", level: "JUNIOR" });
    expect(pm.status).toBe(201);
    expect(pm.body.data.primary).toBe(false);
    expect((await agent.post("/api/me/target-roles").send({ roleKey: "product_manager" })).status).toBe(409);
    expect((await agent.post("/api/me/target-roles").send({ roleKey: "astronaut" })).status).toBe(400);

    const switched = (await agent.post(`/api/me/target-roles/${pm.body.data.id}/primary`)).body.data;
    expect(switched.find((r: { primary: boolean }) => r.primary).roleKey).toBe("product_manager");
    expect(switched.filter((r: { primary: boolean }) => r.primary)).toHaveLength(1);

    // Another student can't read, change or archive it.
    const other = await login();
    expect((await other.agent.patch(`/api/me/target-roles/${pm.body.data.id}`).send({ level: "SENIOR" })).status).toBe(404);
    expect((await other.agent.post(`/api/me/target-roles/${pm.body.data.id}/primary`)).status).toBe(404);
    expect((await other.agent.delete(`/api/me/target-roles/${pm.body.data.id}`)).status).toBe(404);
    expect((await other.agent.get("/api/me/target-roles")).body.data.some((r: { id: string }) => r.id === pm.body.data.id)).toBe(false);

    // Archiving the primary promotes the other career; history is kept.
    const after = (await agent.delete(`/api/me/target-roles/${pm.body.data.id}`)).body.data;
    expect(after.map((r: { roleKey: string; primary: boolean }) => [r.roleKey, r.primary])).toEqual([["data_analyst", true]]);
    expect((await agent.get("/api/me/target-roles?all=1")).body.data).toHaveLength(2);
    // Re-adding reactivates the same profile instead of duplicating it.
    expect((await agent.post("/api/me/target-roles").send({ roleKey: "product_manager" })).body.data.id).toBe(pm.body.data.id);

    for (const roleKey of ["ux_designer", "finance_analyst", "account_executive"]) await agent.post("/api/me/target-roles").send({ roleKey });
    expect((await agent.post("/api/me/target-roles").send({ roleKey: "project_manager" })).status).toBe(409);
    expect((await agent.get("/api/me/target-roles")).body.data).toHaveLength(MAX_ACTIVE_PROFILES);
  });
});

describe("role-aware recommendations", () => {
  async function student(roleKey: string, extra: Record<string, unknown> = {}) {
    const u = await login("STUDENT", { onboard: false });
    await onboard(u.agent, { targetRoleKey: roleKey, ...extra });
    await u.agent.post("/api/career/resumes").send({ text: MBA_RESUME, label: "MBA CV" });
    await refresh(u.id);
    const recs = await prisma.recommendation.findMany({ where: { userId: u.id, status: "ACTIVE" }, orderBy: { rank: "asc" } });
    return { ...u, recs };
  }
  const skillOf = (r: { features: unknown }) => ((r.features as { conceptId?: string }).conceptId ?? "").replace(/^skill:/, "");

  it("a Product Manager gets product work — never programming topics, coding builds or code-only skills", async () => {
    const { recs, id } = await student("product_manager");
    expect(recs.length).toBeGreaterThan(0);
    // The filter acts before ranking: check every candidate, not just the top ones shown.
    const d = await loadStudentData(id);
    const ctx = careerContext(d);
    const all = generateCandidates(d, ctx, conceptStates(d, ctx), studentDifficulty(d, ctx));
    expect(all.length).toBeGreaterThan(0);
    expect(all.some((x) => x.itemType === "TOPIC" || x.itemType === "BUILD_TASK")).toBe(false);
    expect(all.some((x) => x.conceptId === "skill:python")).toBe(false); // on the resume, not in the PM framework
    expect(recs.some((r) => r.itemType === "TOPIC" || r.itemType === "BUILD_TASK")).toBe(false);
    // Python is on the resume, but the PM framework doesn't ask for it: not recommended.
    for (const r of recs) {
      const key = skillOf(r);
      if (key) expect(!competency(key)?.code || roleDef("product_manager")!.competencies.some((c) => c.key === key)).toBe(true);
    }
    expect(recs.map((r) => r.title)).toEqual(expect.arrayContaining(["Product sense"]));
    const ps = recs.find((r) => r.title === "Product sense")!;
    expect(ps.reasons).toContain("required_for_role");
    expect(ps.reasons).toContain("not_yet_practised"); // not assessed — not "you lack it"
    const profile = await prisma.targetRoleProfile.findFirstOrThrow({ where: { userId: id, primary: true } });
    expect(recs.every((r) => r.targetProfileId === profile.id)).toBe(true);
  });

  it("a Data Analyst gets an analytics path, not a software-engineering roadmap", async () => {
    const { recs } = await student("data_analyst");
    const titles = recs.map((r) => r.title);
    expect(titles.some((t) => ["SQL", "Excel", "Statistics", "KPIs", "Data cleaning"].includes(t))).toBe(true);
    for (const dev of ["Data structures & algorithms", "System design", "Node.js", "OOP"]) expect(titles).not.toContain(dev);
    expect(recs.some((r) => r.itemType === "TOPIC" || r.itemType === "BUILD_TASK")).toBe(false);
  });

  it("engineering careers keep the full developer roadmap", async () => {
    const { recs } = await student("backend", { startLanguage: "JAVASCRIPT" });
    expect(recs.some((r) => r.itemType === "TOPIC")).toBe(true);
  });

  it("switching careers supersedes the other career's recommendations", async () => {
    const { agent, id } = await student("data_analyst");
    const pm = (await agent.post("/api/me/target-roles").send({ roleKey: "product_manager", primary: true })).body.data;
    const next = await agent.get("/api/personalization/next");
    expect(next.status).toBe(200);
    const active = await prisma.recommendation.findMany({ where: { userId: id, status: "ACTIVE" } });
    expect(active.length).toBeGreaterThan(0);
    expect(active.every((r) => r.targetProfileId === pm.id)).toBe(true);
    expect(active.map((r) => r.title)).not.toContain("Window functions");
  });
});
