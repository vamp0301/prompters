import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { login, resetDb } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";

const fake = new FakeAI();
const RESUME = "Riya Sharma — Backend developer. Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication. Backend intern at Acme for 6 months building REST APIs. B.Tech CSE 2026. Skills: JavaScript, Node.js, Express, MongoDB, Docker.";

beforeAll(async () => {
  await resetDb();
  await prisma.featureFlag.create({ data: { key: "AI_INTERVIEW", description: "", enabled: true } });
  setAIProvider(fake);
});
afterAll(() => setAIProvider(undefined));

const calls = (task: string) => fake.calls.filter((c) => c.task === task).length;

describe("Skill Intelligence: knowledge maps", () => {
  it("System Design is a curated 132-concept track anyone can open, with no AI call", async () => {
    const { agent } = await login();
    const before = fake.calls.length;
    const res = await agent.get("/api/career/knowledge/map").query({ name: "System Design" });
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.skill).toMatchObject({ name: "System Design", curated: true, source: "CURATED" });
    expect(d.stats.concepts).toBe(132);
    expect(d.map.domains.map((x: { title: string }) => x.title)).toEqual(expect.arrayContaining(["Foundation", "Networking", "Database", "Caching", "Real system design", "Advanced"]));
    // Prerequisites only point at concepts that exist in the map.
    const keys = new Set(d.map.domains.flatMap((x: { concepts: { key: string }[] }) => x.concepts.map((c) => c.key)));
    for (const dm of d.map.domains) for (const c of dm.concepts) for (const p of c.prerequisites) expect(keys.has(p)).toBe(true);
    expect(fake.calls.length).toBe(before);
    const tracks = (await agent.get("/api/career/knowledge")).body.data;
    expect(tracks.tracks[0]).toMatchObject({ name: "System Design", concepts: 132 });
  });

  it("a resume skill's map is generated once, cleaned, cached and shared; other skills are refused", async () => {
    const { agent } = await login();
    await agent.post("/api/career/resumes").send({ text: RESUME });
    const first = await agent.get("/api/career/knowledge/map").query({ name: "Node.js" });
    expect(first.status).toBe(200);
    const map = first.body.data.map;
    // Duplicate concept keys across domains are removed; empty domains dropped; unknown prerequisites dropped.
    const keys = map.domains.flatMap((x: { concepts: { key: string }[] }) => x.concepts.map((c) => c.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect(map.domains.map((x: { key: string }) => x.key)).not.toContain("dupes");
    expect(JSON.stringify(map)).not.toContain("not-in-map");
    expect(map.domains[0].concepts[1].importance).toBe("GOOD");
    expect(calls("skill_map")).toBe(1);
    expect(fake.calls.find((c) => c.task === "skill_map")!.user).toMatch(/<skill>\nNode\.js\n<\/skill>/);

    const other = await login();
    await other.agent.post("/api/career/resumes").send({ text: RESUME });
    expect((await other.agent.get("/api/career/knowledge/map").query({ name: "nodejs" })).status).toBe(200);
    expect(calls("skill_map")).toBe(1);
    // Not on the resume → no open AI endpoint.
    expect((await agent.get("/api/career/knowledge/map").query({ name: "Kubernetes" })).status).toBe(404);
  });
});

describe("Skill Intelligence: concept chapters and mastery", () => {
  it("a chapter is generated once per language, drops broken diagrams and starts progress", async () => {
    const { agent } = await login();
    await agent.post("/api/career/resumes").send({ text: RESUME });
    const before = calls("concept_chapter");
    const res = await agent.get("/api/career/knowledge/concept").query({ name: "Node.js", c: "event-loop" });
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.concept).toMatchObject({ title: "Event Loop", importance: "MUST", prerequisites: [{ key: "basics-1", title: "basics concept 1" }] });
    expect(d.content.visuals.map((v: { kind: string }) => v.kind)).toEqual(["flow", "comparison"]);
    expect(d.content.keyPoints.length).toBeGreaterThanOrEqual(3);
    expect(d.progress.status).toBe("LEARNING");
    expect(d.next).toMatchObject({ key: "async-1" });
    await agent.get("/api/career/knowledge/concept").query({ name: "Node.js", c: "event-loop" });
    expect(calls("concept_chapter")).toBe(before + 1);
    await agent.get("/api/career/knowledge/concept").query({ name: "Node.js", c: "event-loop", lang: "hinglish" });
    expect(calls("concept_chapter")).toBe(before + 2);
    expect(fake.calls.filter((c) => c.task === "concept_chapter").at(-1)!.system).toMatch(/Hinglish/);
    expect((await agent.get("/api/career/knowledge/concept").query({ name: "Node.js", c: "not-a-concept" })).status).toBe(404);
    expect((await agent.get("/api/career/knowledge/concept").query({ name: "Node.js", c: "../etc" })).status).toBe(400);
  });

  it("mastery is earned by explaining, not by clicking", async () => {
    const { agent, id } = await login();
    await agent.post("/api/career/resumes").send({ text: RESUME });
    // Explaining before the chapter exists for this concept is refused.
    expect((await agent.post("/api/career/knowledge/concept/explain").send({ name: "Node.js", c: "async-2", answer: "Something about async code here." })).status).toBe(400);
    await agent.get("/api/career/knowledge/concept").query({ name: "Node.js", c: "event-loop" });
    expect((await agent.post("/api/career/knowledge/concept/progress").send({ name: "Node.js", c: "event-loop", status: "MASTERED" })).status).toBe(400);
    expect((await agent.post("/api/career/knowledge/concept/progress").send({ name: "Node.js", c: "event-loop", status: "UNDERSTOOD" })).body.data.status).toBe("UNDERSTOOD");

    const weak = await agent.post("/api/career/knowledge/concept/explain").send({ name: "Node.js", c: "event-loop", answer: "It does async stuff with callbacks." });
    expect(weak.body.data.mastered).toBe(false);
    expect(weak.body.data.evaluation.missing).toContain("Single JS thread");
    expect(weak.body.data.progress.status).toBe("UNDERSTOOD");
    const strong = await agent.post("/api/career/knowledge/concept/explain").send({ name: "Node.js", c: "event-loop", answer: "JavaScript runs on a single thread; I/O is handed to the OS, and blocking code stalls every request." });
    expect(strong.body.data.mastered).toBe(true);
    expect(strong.body.data.progress).toMatchObject({ status: "MASTERED", explainAttempts: 2 });
    // A worse attempt later never takes mastery away.
    const later = await agent.post("/api/career/knowledge/concept/explain").send({ name: "Node.js", c: "event-loop", answer: "It does async stuff with callbacks." });
    expect(later.body.data.progress.status).toBe("MASTERED");
    expect(later.body.data.progress.explainScore).toBe(strong.body.data.score);
    expect(fake.calls.filter((c) => c.task === "concept_explain").at(-1)!.user).toMatch(/<candidate_answer>/);

    const map = (await agent.get("/api/career/knowledge/map").query({ name: "Node.js" })).body.data;
    expect(map.progress["event-loop"].status).toBe("MASTERED");
    expect(map.stats.mastered).toBe(1);
    // Progress is private to each learner.
    const other = await login();
    await other.agent.post("/api/career/resumes").send({ text: RESUME });
    expect((await other.agent.get("/api/career/knowledge/map").query({ name: "Node.js" })).body.data.progress).toEqual({});
    expect(await prisma.conceptProgress.count({ where: { userId: id } })).toBe(1);
  });
});
