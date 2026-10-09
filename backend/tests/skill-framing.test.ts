import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { login, resetDb, seedFixture } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { conceptPrompt, explainPrompt, frame, mapPrompt, PROFESSIONAL_SWAPS } from "../src/modules/career/knowledge.service.js";
import { skillFraming } from "../src/modules/career/skill-framing.js";

/** Learning content follows the competency: no code and no software framing for non-coding careers. */
const fake = new FakeAI();
beforeAll(async () => {
  await resetDb();
  await seedFixture();
  await prisma.featureFlag.create({ data: { key: "AI_INTERVIEW", description: "", enabled: true } });
  setAIProvider(fake);
});
afterAll(() => setAIProvider(undefined));

describe("framing", () => {
  it.each([
    ["Product sense", "professional"],
    ["Market segmentation", "professional"],
    ["Excel", "professional"],
    ["Figma", "professional"],
    ["Negotiation", "professional"],
    ["Node.js", "technical"],
    ["SQL", "technical"],
    ["AWS", "technical"],
    ["HTTP", "technical"],
    ["Some skill we don't know", "technical"],
  ])("%s → %s", (skill, framing) => expect(skillFraming(skill)).toBe(framing));

  it("every professional swap still matches the technical prompts, and the result has no software framing left", () => {
    const ctx = { skill: "Product sense", domain: "Core", concept: { key: "c", title: "C", difficulty: 2, frequency: 3, importance: "MUST" as const, prerequisites: [], objective: "o", covers: [] }, related: [], allTitles: [], previous: [] };
    const technical = [mapPrompt("X").system, conceptPrompt(ctx as never, "en").system, explainPrompt("X", "C", ["a"], "b").system].join("\n");
    for (const [from] of PROFESSIONAL_SWAPS) expect(technical, from).toContain(from);
    const pro = [frame(mapPrompt("X"), "professional"), frame(conceptPrompt(ctx as never, "en"), "professional"), frame(explainPrompt("X", "C", ["a"], "b"), "professional")].map((p) => p.system).join("\n");
    for (const bad of ["software skill", "engineering student", "RFCs", "2 Developer", "technical interviewer", "nginx upstream"]) expect(pro).not.toContain(bad);
    expect(frame(mapPrompt("X"), "technical").system).toBe(mapPrompt("X").system); // technical unchanged
  });
});

describe("a Product Manager's learning content", () => {
  it("opens guides and maps for the career's competencies (not only resume skills), framed professionally, with no code", async () => {
    const { agent } = await login("STUDENT", { onboard: false });
    await agent.post("/api/profile/onboarding").send({ targetRoleKey: "product_manager", explanationLocale: "en", weeklyHours: 8 });
    // No resume mentions "Product sense": the career makes it the student's skill.
    const before = fake.calls.length;
    const guide = await agent.get("/api/career/skills/guide?name=Product%20sense&lang=en");
    expect(guide.status, JSON.stringify(guide.body)).toBe(200);
    expect(guide.body.data.content.implementation).toBeDefined();
    expect(guide.body.data.content.implementation.code).toBeNull();
    const guideCall = fake.calls.slice(before).find((c) => c.task === "skill_guide")!;
    expect(guideCall.system).toMatch(/ONE professional skill or competency/);
    expect(guideCall.system).toMatch(/implementation\.code MUST be null/);

    const map = await agent.get("/api/career/knowledge/map?name=Product%20sense");
    expect(map.status, JSON.stringify(map.body)).toBe(200);
    const mapCall = fake.calls.slice(before).find((c) => c.task === "skill_map")!;
    expect(mapCall.system).toMatch(/ONE professional skill or competency/);
    const stored = await prisma.skillMap.findUniqueOrThrow({ where: { key: "product sense" } });
    expect((stored.content as { _framing?: string })._framing).toBe("professional");

    // A skill that isn't on the resume and isn't in any of their careers stays closed.
    expect((await agent.get("/api/career/skills/guide?name=Kubernetes&lang=en")).status).toBe(404);
  });
});
