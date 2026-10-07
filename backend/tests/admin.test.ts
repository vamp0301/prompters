import { beforeAll, describe, expect, it } from "vitest";
import { login, resetDb, seedFixture, startWorker } from "./helpers.js";
import { prisma } from "../src/lib/prisma.js";

let moduleId: string;

beforeAll(async () => {
  await resetDb();
  await seedFixture();
  startWorker();
  moduleId = (await prisma.module.findUniqueOrThrow({ where: { slug: "basics" } })).id;
});

const SECTIONS = ["DEFINITION", "ANALOGY", "WHY", "USAGE", "INTERNALS", "CODE", "MISTAKES", "DEBUGGING", "TRADEOFFS", "REAL_PROJECT"];

describe("admin permissions", () => {
  it("students cannot reach the admin API", async () => {
    const { agent } = await login();
    expect((await agent.get("/api/admin/topics")).status).toBe(403);
  });
  it("authors can write drafts but cannot publish or change scoring", async () => {
    const { agent } = await login("AUTHOR");
    expect((await agent.get("/api/admin/topics")).status).toBe(200);
    expect((await agent.post("/api/admin/scoring").send({})).status).toBe(403);
    const t = await prisma.topic.findUniqueOrThrow({ where: { slug: "alpha" } });
    expect((await agent.post(`/api/admin/topics/${t.id}/publish`).send({})).status).toBe(403);
  });
});

describe("content lifecycle", () => {
  it("create → blocked publish → complete → publish → student sees it → versioned and audited", async () => {
    const { agent, id: adminId } = await login("SUPER_ADMIN");
    const created = await agent.post("/api/admin/topics").send({ moduleId, slug: "delta", title: "Delta", order: 5, technicalDefinition: "Delta is a thing.", prerequisites: [] });
    expect(created.status).toBe(201);
    const topicId = created.body.data.id;

    const blocked = await agent.post(`/api/admin/topics/${topicId}/publish`).send({});
    expect(blocked.status).toBe(422);
    expect(blocked.body.error.details.missing).toContain("Hinglish");

    await agent.put(`/api/admin/topics/${topicId}/sections`).send({
      sections: SECTIONS.map((type) => ({
        type,
        content: { hinglish: `${type} hinglish`, en: `${type} english` },
        ...(type === "CODE" ? { codeJs: "console.log(1)", codePython: "print(1)" } : {}),
      })),
    });
    for (let i = 0; i < 5; i++) {
      const q = await agent.post("/api/admin/questions").send({ topicId, type: "MCQ", prompt: `Delta question ${i}?`, options: ["yes", "no"], correct: [0], explanation: "Because yes." });
      expect(q.status).toBe(201);
    }
    const badQ = await agent.post("/api/admin/questions").send({ topicId, type: "MCQ", prompt: "Broken question", options: ["a", "b"], correct: [5], explanation: "nope nope" });
    expect(badQ.status).toBe(400);
    await agent.post("/api/admin/interviews").send({ topicId, category: "BACKEND", question: "What is delta?", short: "A thing.", deep: "A deeper thing." });

    const health = await agent.get(`/api/admin/topics/${topicId}/completeness`);
    expect(health.body.data.publishable).toBe(true);

    const pub = await agent.post(`/api/admin/topics/${topicId}/publish`).send({ note: "first" });
    expect(pub.status).toBe(200);
    expect(pub.body.data.version).toBe(1);

    await agent.put(`/api/admin/topics/${topicId}/sections`).send({ sections: [{ type: "DEFINITION", content: { hinglish: "v2 hinglish", en: "v2 english" } }] });
    const pub2 = await agent.post(`/api/admin/topics/${topicId}/publish`).send({});
    expect(pub2.body.data.version).toBe(2);

    const { agent: student } = await login();
    const seen = await student.get("/api/roadmap");
    const delta = seen.body.data.stages[0].modules[0].topics.find((t: { slug: string }) => t.slug === "delta");
    expect(delta.state).toBe("AVAILABLE");
    const page = await student.get("/api/topics/delta");
    expect(page.body.data.sections[0].content.en).toBe("v2 english");

    const restored = await agent.post(`/api/admin/topics/${topicId}/versions/1/restore`);
    expect(restored.status).toBe(200);
    const preview = await agent.get(`/api/admin/topics/${topicId}/preview`);
    expect(preview.body.data.sections[0].content.en).toBe("DEFINITION english");

    const logs = await agent.get(`/api/admin/audit-logs?entityId=${topicId}`);
    const actions = logs.body.data.items.map((l: { action: string }) => l.action);
    expect(actions).toEqual(expect.arrayContaining(["CREATED_TOPIC", "PUBLISHED_TOPIC", "RESTORED_TOPIC_VERSION"]));
    expect(logs.body.data.items[0].actorId).toBe(adminId);
  });

  it("broken code samples block publishing", async () => {
    const { agent } = await login("ADMIN");
    const t = await prisma.topic.findUniqueOrThrow({ where: { slug: "gamma" } });
    await prisma.topicSection.update({ where: { topicId_type: { topicId: t.id, type: "CODE" } }, data: { codeJs: "throw new Error('boom')" } });
    const res = await agent.post(`/api/admin/topics/${t.id}/publish`).send({});
    expect(res.status).toBe(422);
    expect(res.body.error.details.codeFailures[0]).toMatchObject({ section: "CODE", language: "javascript" });
  });

  it("scoring changes are versioned and take effect", async () => {
    const { agent } = await login("SUPER_ADMIN");
    const current = await agent.get("/api/admin/scoring");
    const res = await agent.post("/api/admin/scoring").send({ config: { ...current.body.data.active, masteryThreshold: 90 }, note: "stricter" });
    expect(res.status).toBe(201);
    expect((await agent.get("/api/admin/scoring")).body.data.active.masteryThreshold).toBe(90);
    await agent.post(`/api/admin/scoring`).send({ config: { ...current.body.data.active }, note: "back" });
  });

  it("validates CSV imports before committing anything", async () => {
    const { agent } = await login("AUTHOR");
    const header = "topicSlug,type,difficulty,prompt,code,codeLanguage,options,correct,keywords,explanation,tags";
    const csv = `${header}\nalpha,MCQ,1,"Is this, valid?",,,yes|no,0,,Because it is.,\nnope,MCQ,1,Bad topic?,,,a|b,0,,x x,\n`;
    const dry = await agent.post("/api/admin/questions-import").send({ csv });
    expect(dry.body.data.valid).toBe(1);
    expect(dry.body.data.invalid[0].row).toBe(3);
    const before = await prisma.question.count();
    expect((await agent.post("/api/admin/questions-import").send({ csv, commit: true })).status).toBe(400);
    expect(await prisma.question.count()).toBe(before);
  });

  it("content health and global search work", async () => {
    const { agent } = await login("ADMIN");
    const health = await agent.get("/api/admin/content-health");
    expect(health.body.data.totals.topics).toBeGreaterThan(0);
    expect(health.body.data.languages.hinglish).toBeGreaterThan(0);
    const search = await agent.get("/api/admin/search?q=alpha");
    expect(search.body.data.results.map((r: { type: string }) => r.type)).toEqual(expect.arrayContaining(["Topic", "Build task", "Prompt"]));
    const dash = await agent.get("/api/admin/dashboard");
    expect(dash.status).toBe(200);
    expect(dash.body.data.daily.length).toBeGreaterThan(25);
  });

  it("super admin can change roles, never their own", async () => {
    const { agent, id } = await login("SUPER_ADMIN");
    const { id: target } = await login();
    expect((await agent.patch(`/api/admin/users/${id}/role`).send({ role: "STUDENT" })).status).toBe(400);
    expect((await agent.patch(`/api/admin/users/${target}/role`).send({ role: "AUTHOR" })).body.data.role).toBe("AUTHOR");
  });
});
