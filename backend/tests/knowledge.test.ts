import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { login, resetDb } from "./helpers.js";
import { FakeAI } from "./fake-ai.js";
import { setAIProvider } from "../src/ai/provider.js";
import { prisma } from "../src/lib/prisma.js";
import { chapterContext, meaningful, mentions, repairDiagram, tidyDiagram, validateChapter } from "../src/modules/career/knowledge.validate.js";
import { conceptSchema } from "../src/modules/career/knowledge.schemas.js";
import { CURATED_MAPS } from "../src/modules/career/knowledge.curated.js";

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
    expect(d.content.visuals.map((v: { kind: string }) => v.kind)).toEqual(["architecture", "comparison"]);
    expect(d.content.visuals[0].alt).toMatch(/Event Loop/);
    expect(d.content._v).toBe(2);
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

describe("Skill Intelligence: chapter validator", () => {
  const open = (agent: Awaited<ReturnType<typeof login>>["agent"], c: string, lang = "en") => agent.get("/api/career/knowledge/concept").query({ name: "System Design", c, lang });

  it("gives the model the concept's structured context and a strict scope rule", async () => {
    const { agent } = await login();
    expect((await open(agent, "load-balancers")).status).toBe(200);
    const call = fake.calls.filter((c) => c.task === "concept_chapter").at(-1)!;
    expect(call.system).toMatch(/SCOPE RULE: teach ONLY the given concept/);
    expect(call.user).toMatch(/<concept>\nLoad Balancers\n<\/concept>/);
    expect(call.user).toMatch(/Domain: Networking/);
    expect(call.user).toMatch(/Must cover: Single server bottleneck; Request routing; Round robin/);
    expect(call.user).toMatch(/Health checks/);
    expect(call.user).toMatch(/Prerequisites: HTTP/);
    expect(call.user).toMatch(/Related concepts \(mention only as related\): .*Reverse Proxy/);
  });

  it("rejects a mixed-scope draft, retries with the reasons, and stores only the good chapter", async () => {
    const { agent } = await login();
    fake.badChapters = ["mixed"];
    const before = calls("concept_chapter");
    const res = await open(agent, "cdn");
    expect(res.status).toBe(200);
    expect(calls("concept_chapter")).toBe(before + 2);
    const retry = fake.calls.filter((c) => c.task === "concept_chapter").at(-1)!;
    expect(retry.user).toMatch(/previous draft was rejected/);
    expect(retry.user).toMatch(/Mixed scope|must be about "CDN"/);
    expect(res.body.data.content.oneLine).toMatch(/CDN/);
  });

  it("two bad drafts → an honest error and nothing cached", async () => {
    const { agent } = await login();
    fake.badChapters = ["no-visual", "no-visual"];
    const res = await open(agent, "sharding");
    expect(res.status).toBe(502);
    expect(res.body.error.message).toMatch(/couldn't write a good enough chapter/);
    expect(await prisma.skillConcept.count({ where: { conceptKey: "sharding" } })).toBe(0);
    fake.badChapters = [];
  });

  it("missing required subtopics are rejected", async () => {
    const { agent } = await login();
    fake.badChapters = ["missing-covers"];
    const before = calls("concept_chapter");
    expect((await open(agent, "replication")).status).toBe(200);
    expect(calls("concept_chapter")).toBe(before + 2);
    expect(fake.calls.filter((c) => c.task === "concept_chapter").at(-1)!.user).toMatch(/Missing required subtopics/);
  });

  it("unrelated code is removed, never shown, with an honest note", async () => {
    const { agent } = await login();
    fake.badChapters = ["unrelated-code"];
    const d = (await open(agent, "cap-theorem")).body.data;
    expect(d.content.code).toBeNull();
    expect(d.content.codeNote).toBe("Code is not the best way to understand this concept.");
    expect(JSON.stringify(d.content)).not.toMatch(/lru_cache/);
  });

  it("chapters written under an older contract are rewritten once", async () => {
    const { agent } = await login();
    await prisma.skillConcept.create({ data: { skillKey: "system design", conceptKey: "dns", locale: "en", title: "DNS", content: { oneLine: "old" } } });
    const before = calls("concept_chapter");
    const d = (await open(agent, "dns")).body.data;
    expect(d.content._v).toBe(2);
    expect(calls("concept_chapter")).toBe(before + 1);
    await open(agent, "dns");
    expect(calls("concept_chapter")).toBe(before + 1);
  });

  it("diagram checks: too few parts and inconsistent references are not 'meaningful'; bad highlights are removed", () => {
    const base = { title: "t", objective: "o", alt: "a" };
    expect(meaningful({ ...base, kind: "flow", steps: [{ label: "A" }, { label: "B" }] })).toBe(false);
    expect(meaningful({ ...base, kind: "flow", steps: [{ label: "Request" }, { label: "Check cache" }, { label: "Return" }] })).toBe(true);
    expect(meaningful({ ...base, kind: "timeline", actors: ["Client", "Server", "DB"], events: [{ from: "Client", to: "Cache", label: "get" }] })).toBe(false);
    // A highlight that points at a missing component is removed, not rendered.
    const fixes: string[] = [];
    const tidy = tidyDiagram({ ...base, kind: "architecture", layers: [{ nodes: [{ label: "Users" }] }, { nodes: [{ label: "LB" }, { label: "S1" }] }], walkthrough: [{ label: "x", highlight: "Database" }, { label: "y", highlight: "LB" }] }, fixes);
    expect(tidy.walkthrough).toEqual([{ label: "x" }, { label: "y", highlight: "LB" }]);
    expect(fixes.length).toBe(1);
    // Actor names that differ only in case are matched; an undeclared one is declared when there is room.
    const tl = repairDiagram({ ...base, kind: "timeline", actors: ["Client", "Server"], events: [{ from: "client", to: "Server", label: "GET" }, { from: "Server", to: "Database", label: "read" }] });
    expect(meaningful(tl)).toBe(true);
    expect(mentions("Clients reach the load balancer first", "Load Balancers")).toBe(true);
    expect(mentions("Clients reach the server", "Load Balancers")).toBe(false);
    expect(mentions("Layer 4 vs Layer 7 load balancing", "L4 vs L7")).toBe(true);
  });

  it("the skill guide stays a skill-level overview, separate from concept chapters, and drops unrelated code", async () => {
    const { agent } = await login();
    await agent.post("/api/career/resumes").send({ text: RESUME.replace("Docker.", "Docker, System Design.") });
    const g = await agent.get("/api/career/skills/guide").query({ name: "Docker" });
    expect(g.status).toBe(200);
    const guideCall = fake.calls.filter((c) => c.task === "skill_guide").at(-1)!;
    expect(guideCall.system).toMatch(/SKILL-LEVEL OVERVIEW/);
    expect(guideCall.system).toMatch(/For disciplines and broad subjects \(System Design, DSA/);
    expect(guideCall.system).not.toMatch(/SCOPE RULE/);
  });
  it("chapter schema tolerates real model output: missing diagram kind, over-long text, one broken diagram", async () => {
    const fixture = JSON.parse(await new FakeAI().complete("[task:concept_chapter]", "<concept>\nLoad Balancers\n</concept>"));
    fixture.visuals = [
      { title: "Request flow", layers: [{ nodes: [{ label: "Client" }] }, { nodes: [{ label: "Load Balancer" }] }, { nodes: [{ label: "Server A" }, { label: "Server B" }] }] },
      { kind: "timeline", title: "Broken", actors: ["A"] },
      { kind: "Flow", title: "Handshake", walkthrough: [{ label: "Client GET with Upgrade" }, { label: "Server 101 response" }, { label: "Frames flow" }] },
    ];
    fixture.deepDives = [{ title: "Routing algorithms compared: round robin, weighted round robin, least connections, IP hash, and when each one fits best in practice", body: "x", points: [] }];
    const r = conceptSchema.safeParse(fixture);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.visuals.map((v) => v.kind)).toEqual(["architecture", "flow"]);
    expect(r.data.visuals[1]).toMatchObject({ steps: [{ label: "Client GET with Upgrade" }, { label: "Server 101 response" }, { label: "Frames flow" }] });
    expect(r.data.deepDives[0].title.length).toBeLessThanOrEqual(120);
    expect(r.data.deepDives[0].title.endsWith("…")).toBe(true);
    // Levels written as words map to their number.
    const lv = conceptSchema.safeParse({ ...fixture, levels: [{ level: "Beginner", question: "q1", hint: "h" }, { level: "Level 3", question: "q2", hint: "h" }, { level: "Interview", question: "q3", hint: "h" }] });
    expect(lv.success && lv.data.levels.map((l) => l.level)).toEqual([1, 3, 5]);
  });
  it("rejects unsourced statistics, percentage gains and named-company internals; allows plain mechanisms", async () => {
    const ctx = chapterContext(CURATED_MAPS["system design"].content, "System Design", "load-balancers");
    const good = conceptSchema.parse(JSON.parse(await new FakeAI().complete("[task:concept_chapter]", `<concept>\nLoad Balancers\n</concept>\nMust cover: ${ctx.concept.covers.join("; ")}`)));
    expect(validateChapter(good, ctx).ok).toBe(true);
    for (const claim of ["Used by 70% of Fortune 500 companies.", "Cuts latency by 60% in most setups.", "Netflix uses this internally to route all traffic.", "Over 2 million developers rely on it."]) {
      const v = validateChapter({ ...good, advantages: [...good.advantages, claim] }, ctx);
      expect(v.ok, claim).toBe(false);
      expect(v.problems.join(" ")).toMatch(/unsourced claims/);
    }
    // Hypothetical numbers inside an interview scenario are part of the question, not a claim.
    const scenario = { ...good, levels: [...good.levels.slice(0, 4), { level: 5, question: "If Load Balancers mark 80% of servers unhealthy, what happens?", hint: "Think about Load Balancers health checks." }] };
    expect(validateChapter(scenario, ctx).ok).toBe(true);
  });
});
