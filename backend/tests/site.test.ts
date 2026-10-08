import { beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import { app, login, resetDb } from "./helpers.js";
import { prisma } from "../src/lib/prisma.js";

beforeAll(async () => {
  await resetDb();
});

const landing = () => ({
  hero: { eyebrow: "✦ Built around you", titleLead: "Prepare for", titleAccent: "your", titleTail: "interview.", lede: "Learn it.", primaryCta: "Start", secondaryCta: "How", steps: ["One", "Two", "Three"] },
  upload: { tape: "Start here", noteLine1: "no busywork", noteLine2: "just progress", title: "Build", subtitle: "Drop a resume.", dropTitle: "Choose", dropHint: "PDF", button: "Continue", finePrint: "Yours." },
  loop: { eyebrow: "Loop", title: "Not a course.", titleAccent: "A system.", cards: [1, 2, 3, 4].map((i) => ({ title: `Card ${i}`, text: "Text" })) },
  top100: { eyebrow: "Plan", title: "Top 100.", titleAccent: "Matters.", body: "Body", cta: "Explore", sample: { meta: "Intense", question: "Q?", why: "Why", resume: "Resume" } },
  finalCta: { eyebrow: "Next", line1: "Line", accent: "Accent", button: "Go" },
  footer: { tagline: "Tagline" },
  announcement: { enabled: false, text: "", linkLabel: "", linkHref: "" },
  seo: { title: "", description: "" },
});

describe("website content (Super Admin)", () => {
  it("only a Super Admin can read or change it; everyone can read the public copy", async () => {
    const anon = supertest(app);
    expect((await anon.get("/api/public/site/landing")).body.data).toEqual({ content: null, updatedAt: null });
    expect((await anon.get("/api/public/site/nope")).status).toBe(404);
    expect((await anon.put("/api/admin/site/landing").send({ content: landing(), expectedVersion: 0 })).status).toBe(401);
    for (const role of ["STUDENT", "AUTHOR", "ADMIN"] as const) {
      const { agent } = await login(role);
      expect((await agent.get("/api/admin/site/landing")).status).toBe(403);
      expect((await agent.put("/api/admin/site/landing").send({ content: landing(), expectedVersion: 0 })).status).toBe(403);
    }
  });

  it("saves, publishes, guards against overwriting, audits and resets", async () => {
    const { agent, id } = await login("SUPER_ADMIN");
    const c = landing();
    c.hero.titleLead = "Get ready for";
    c.announcement = { enabled: true, text: "Beta is free", linkLabel: "See pricing", linkHref: "/pricing" };
    const saved = await agent.put("/api/admin/site/landing").send({ content: c, expectedVersion: 0 });
    expect(saved.status).toBe(200);
    expect(saved.body.data.version).toBe(1);
    expect(saved.body.data.updatedBy.email).toMatch(/@test\.dev$/);
    expect((await supertest(app).get("/api/public/site/landing")).body.data.content.hero.titleLead).toBe("Get ready for");

    // A stale editor can't overwrite a newer save.
    expect((await agent.put("/api/admin/site/landing").send({ content: c, expectedVersion: 0 })).status).toBe(409);
    expect((await agent.put("/api/admin/site/landing").send({ content: c, expectedVersion: 1 })).body.data.version).toBe(2);

    const logs = await prisma.adminAuditLog.findMany({ where: { entityType: "SiteContent", actorId: id } });
    expect(logs.map((l) => l.action)).toEqual(["UPDATED_SITE_CONTENT", "UPDATED_SITE_CONTENT"]);

    const reset = await agent.delete("/api/admin/site/landing");
    expect(reset.body.data).toMatchObject({ content: null, version: 0 });
    expect((await supertest(app).get("/api/public/site/landing")).body.data.content).toBeNull();
    expect((await agent.delete("/api/admin/site/landing")).status).toBe(404);
  });

  it("rejects unsafe links, unknown fields, empty text and oversized copy", async () => {
    const { agent } = await login("SUPER_ADMIN");
    const bad = [
      (c: ReturnType<typeof landing>) => (c.announcement = { enabled: true, text: "Hi", linkLabel: "x", linkHref: "javascript:alert(1)" }),
      (c: ReturnType<typeof landing>) => (c.announcement = { enabled: true, text: "Hi", linkLabel: "x", linkHref: "//evil.example" }),
      (c: ReturnType<typeof landing>) => (c.announcement = { enabled: true, text: "Hi", linkLabel: "x", linkHref: "http://plain.example" }),
      (c: ReturnType<typeof landing>) => (c.announcement = { enabled: true, text: "", linkLabel: "", linkHref: "" }),
      (c: ReturnType<typeof landing>) => (c.hero.titleLead = ""),
      (c: ReturnType<typeof landing>) => (c.hero.lede = "x".repeat(500)),
      (c: ReturnType<typeof landing>) => Object.assign(c.hero, { script: "<script>" }),
      (c: ReturnType<typeof landing>) => (c.loop.cards = c.loop.cards.slice(0, 2)),
    ];
    for (const mutate of bad) {
      const c = landing();
      mutate(c);
      const res = await agent.put("/api/admin/site/landing").send({ content: c, expectedVersion: 0 });
      expect(res.status, JSON.stringify(c.announcement)).toBe(400);
    }
    const ok = landing();
    ok.announcement = { enabled: true, text: "New", linkLabel: "Read", linkHref: "https://example.com/post" };
    expect((await agent.put("/api/admin/site/landing").send({ content: ok, expectedVersion: 0 })).status).toBe(200);
  });
});
