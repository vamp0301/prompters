import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resetDb } from "./helpers.js";
import { prisma } from "../src/lib/prisma.js";
import { CODE_ASSESSMENTS, COMPETENCIES, FAMILIES, ROLES } from "../src/modules/roles/catalogue.js";
import { builtInTaxonomy, classifyRole, listRoles, loadTaxonomy, roleDef, syncTaxonomy, taxonomy } from "../src/modules/roles/taxonomy.js";
import { canonicalSkill } from "../src/modules/prep/text.js";

beforeAll(async () => {
  await resetDb();
});
afterAll(async () => {
  await loadTaxonomy().catch(() => undefined);
});

describe("career catalogue", () => {
  const t = builtInTaxonomy();

  it("covers every career family with real roles, each with a weighted competency framework", () => {
    for (const family of Object.keys(FAMILIES)) expect([...t.roles.values()].some((r) => r.family === family)).toBe(true);
    for (const r of t.roles.values()) {
      expect(r.competencies.filter((c) => c.importance === "REQUIRED").length).toBeGreaterThanOrEqual(4);
      expect(r.areas.reduce((s, a) => s + a.weight, 0)).toBeCloseTo(1, 5);
      // Every rubric scores the same cross-role basics plus the family's own dimensions.
      expect(r.rubric.map((d) => d.key)).toEqual(expect.arrayContaining(["reasoning", "clarity", "evidence", "judgment"]));
      expect(r.rubric.length).toBeGreaterThan(4);
    }
  });

  it("competency keys are the canonical skill keys, unique across the catalogue", () => {
    const keys = Object.keys(COMPETENCIES).map((n) => canonicalSkill(n));
    expect(new Set(keys).size).toBe(keys.length);
    expect(t.competencies.get("sql")?.name).toBe("SQL");
    expect(t.competencies.get(canonicalSkill("Node.js"))?.name).toBe("Node.js");
  });

  it("non-technical careers never get coding assessments", () => {
    for (const key of ["product_manager", "marketing_manager", "finance_analyst", "hr_generalist", "management_consultant", "account_executive", "ux_designer", "project_manager", "data_analyst"]) {
      const r = roleDef(key)!;
      expect(r.code).toBe(false);
      expect(r.assessments.some((a) => CODE_ASSESSMENTS.has(a))).toBe(false);
    }
    expect(roleDef("backend")!.code).toBe(true);
    expect(roleDef("data_scientist")!.code).toBe(true);
  });

  it("a Data Analyst framework is analytics, not a software-engineering roadmap", () => {
    const da = roleDef("data_analyst")!;
    const required = da.competencies.filter((c) => c.importance === "REQUIRED").map((c) => c.name);
    expect(required).toEqual(expect.arrayContaining(["SQL", "Excel", "Statistics", "KPIs"]));
    for (const dev of ["Data structures & algorithms", "System design", "OOP", "Node.js"]) expect(da.competencies.some((c) => c.name === dev)).toBe(false);
  });

  it("a Product Manager framework is product sense, prioritisation and metrics — no coding", () => {
    const pm = roleDef("product_manager")!;
    expect(pm.competencies.filter((c) => c.importance === "REQUIRED").map((c) => c.name)).toEqual(expect.arrayContaining(["Product sense", "Prioritization", "Product metrics", "Stakeholder management"]));
    expect(pm.competencies.some((c) => c.importance !== "OPTIONAL" && c.code)).toBe(false);
    expect(pm.areas.map((a) => a.key)).toEqual(["PRODUCT_SENSE", "METRICS", "PRIORITIZATION", "STAKEHOLDERS"]);
  });

  it("the original engineering roles keep their keys", () => {
    for (const key of ["backend", "frontend", "fullstack", "sde", "data_analyst", "devops", "ml_engineer"]) expect(roleDef(key)).not.toBeNull();
    expect(ROLES.length).toBeGreaterThanOrEqual(25);
  });

  it("role search finds by name, alias or family", () => {
    expect(listRoles({ q: "mba" }).map((r) => r.key)).toEqual(expect.arrayContaining(["marketing_manager", "finance_analyst", "hr_generalist", "operations_manager"]));
    expect(listRoles({ family: "design" }).map((r) => r.key)).toEqual(["product_designer", "ux_designer"]);
  });
});

describe("role classification", () => {
  it.each([
    ["Associate Product Manager at a fintech", "product_manager"],
    ["MBA Marketing", "marketing_manager"],
    ["Data Analyst", "data_analyst"],
    ["Business Analyst (BA) — banking", "business_analyst"],
    ["UI/UX designer", "ux_designer"],
    ["Inside sales / BDE", "account_executive"],
  ])("%s → %s", (text, key) => {
    const r = classifyRole(text);
    expect(r.suggestions[0].key).toBe(key);
    expect(r.ambiguous).toBe(false);
  });

  it("vague or unknown targets ask instead of defaulting to software engineering", () => {
    for (const text of ["", "manager", "something in a big company"]) {
      const r = classifyRole(text);
      expect(r.ambiguous).toBe(true);
      expect(r.suggestions[0]?.key).not.toBe("sde");
    }
  });
});

describe("database taxonomy", () => {
  it("syncs the catalogue once, loads it back identically, and stays extensible", async () => {
    expect((await syncTaxonomy()).synced).toBe(true);
    expect((await syncTaxonomy()).synced).toBe(false); // idempotent
    const loaded = await loadTaxonomy();
    expect(loaded.source).toBe("database");
    expect(loaded.roles.size).toBe(builtInTaxonomy().roles.size);
    const pm = loaded.roles.get("product_manager")!;
    expect(pm.competencies.map((c) => `${c.key}:${c.importance}`)).toEqual(builtInTaxonomy().roles.get("product_manager")!.competencies.map((c) => `${c.key}:${c.importance}`));
    expect(await prisma.competencyPrerequisite.count()).toBeGreaterThan(5);

    // A career added in the database (no code change) is a first-class role after reload.
    await prisma.careerRole.create({ data: { key: "chartered_accountant", family: "mba", name: "Chartered Accountant", description: "Audit, tax and accounts.", aliases: ["ca", "chartered accountant"], areas: [], rubric: [], version: 1 } });
    await prisma.roleCompetency.createMany({ data: ["accounting", "financial statements"].map((competencyKey) => ({ roleKey: "chartered_accountant", competencyKey, importance: "REQUIRED", weight: 1 })) });
    await loadTaxonomy();
    expect(roleDef("chartered_accountant")?.competencies.map((c) => c.name)).toEqual(["Accounting", "Financial statements"]);
    expect(classifyRole("Chartered Accountant").suggestions[0].key).toBe("chartered_accountant");
    expect(taxonomy().source).toBe("database");
  });
});
