import { beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import { login, resetDb } from "./helpers.js";
import { prisma } from "../src/lib/prisma.js";
import { createApp } from "../src/server/app.js";
import { loadTaxonomy, roleDef, syncTaxonomy } from "../src/modules/roles/taxonomy.js";

/** Practitioner review is recorded by people, covers one framework version, and is never automatic. */
const app = createApp();
beforeAll(async () => {
  await resetDb();
  await syncTaxonomy();
  await loadTaxonomy();
});

describe("content governance", () => {
  it("everything starts unreviewed and is labelled so publicly", async () => {
    const roles = (await supertest(app).get("/api/roles")).body.data.roles as { reviewed: boolean; review: { status: string } }[];
    expect(roles.length).toBeGreaterThan(20);
    expect(roles.every((r) => !r.reviewed && r.review.status === "UNREVIEWED")).toBe(true);
  });

  it("only an admin records a review, it names the practitioner, and it is audited", async () => {
    const student = await login();
    const admin = await login("ADMIN");
    expect((await student.agent.post("/api/admin/roles/product_manager/review").send({ status: "REVIEWED", reviewedBy: "X" })).status).toBe(403);
    expect((await admin.agent.post("/api/admin/roles/product_manager/review").send({ status: "REVIEWED" })).status).toBe(400);
    const ok = await admin.agent.post("/api/admin/roles/product_manager/review").send({ status: "REVIEWED", reviewedBy: "Meera Iyer", reviewerCredentials: "Senior PM, 9 yrs", notes: "Framework fine for APM." });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    expect(ok.body.data).toMatchObject({ reviewStatus: "REVIEWED", reviewed: true, reviewedBy: "Meera Iyer", reviewedFrameworkVersion: 1 });
    expect(roleDef("product_manager")!.reviewed).toBe(true);
    const pub = (await supertest(app).get("/api/roles/product_manager")).body.data;
    expect(pub.review).toMatchObject({ status: "REVIEWED", reviewedBy: "Meera Iyer" });
    expect(await prisma.adminAuditLog.count({ where: { actorId: admin.id, action: "REVIEWED_ROLE_FRAMEWORK", entityId: "product_manager" } })).toBe(1);
  });

  it("a catalogue re-sync keeps the review; a changed framework ends it (new version, unreviewed)", async () => {
    expect((await syncTaxonomy()).synced).toBe(false); // nothing changed → nothing written, review kept
    await loadTaxonomy();
    expect(roleDef("product_manager")!.reviewed).toBe(true);
    // Simulate the stored framework drifting from the catalogue (e.g. a catalogue edit): a competency weight differs.
    await prisma.roleCompetency.updateMany({ where: { roleKey: "product_manager", importance: "REQUIRED" }, data: { weight: 0.5 } });
    const res = await syncTaxonomy();
    expect(res.synced).toBe(true);
    const row = await prisma.careerRole.findUniqueOrThrow({ where: { key: "product_manager" } });
    expect(row).toMatchObject({ frameworkVersion: 2, reviewed: false, reviewStatus: "UNREVIEWED", reviewedFrameworkVersion: 1, reviewedBy: "Meera Iyer" });
    await loadTaxonomy();
    expect(roleDef("product_manager")!.reviewed).toBe(false);
    expect((await supertest(app).get("/api/roles/product_manager")).body.data.review.status).toBe("UNREVIEWED");
  });

  it("concurrent syncs (several instances starting) are safe", async () => {
    const results = await Promise.all([syncTaxonomy(), syncTaxonomy(), syncTaxonomy()]);
    expect(results.every((r) => r.synced === false)).toBe(true);
    expect(await prisma.careerRole.count()).toBe(29);
  });
});
