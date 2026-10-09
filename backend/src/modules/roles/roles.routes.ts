import { Router } from "express";
import { z } from "zod";
import { currentUser, requireAuth } from "../../middleware/auth.js";
import { notFound } from "../../utils/errors.js";
import { handler, param, parse } from "../../utils/http.js";
import { EXPERIENCE_BANDS } from "../prep/ladder.js";
import { FAMILIES, type FamilyKey } from "./catalogue.js";
import { addProfile, archiveProfile, listProfiles, setPrimary, updateProfile } from "./profiles.service.js";
import { classifyRole, listRoles, roleDef, taxonomy } from "./taxonomy.js";

const familyKeys = Object.keys(FAMILIES) as [FamilyKey, ...FamilyKey[]];

const summary = (r: ReturnType<typeof listRoles>[number]) => ({ key: r.key, name: r.name, family: r.family, familyName: r.familyName, description: r.description, code: r.code, reviewed: r.reviewed });

/** The career catalogue (public, read-only: not personal data). */
export function roleCatalogueRoutes() {
  const r = Router();
  r.get("/", handler(async (req) => {
    const q = parse(z.object({ q: z.string().max(80).optional(), family: z.enum(familyKeys).optional() }), req.query);
    return {
      version: taxonomy().version,
      families: Object.entries(FAMILIES).map(([key, f]) => ({ key, ...f })),
      roles: listRoles(q).map(summary),
    };
  }));
  r.post("/classify", handler(async (req) => {
    const { text } = parse(z.object({ text: z.string().max(200) }), req.body);
    return classifyRole(text);
  }));
  r.get("/:key", handler(async (req) => {
    const role = roleDef(param(req, "key"));
    if (!role || !role.active) throw notFound("Role");
    const by = (importance: string) => role.competencies.filter((c) => c.importance === importance).map((c) => ({ key: c.key, name: c.name, kind: c.kind, description: c.description, assessments: c.assessments }));
    return { ...summary(role), specializations: role.specializations, areas: role.areas, rubric: role.rubric, assessments: role.assessments, competencies: { required: by("REQUIRED"), preferred: by("PREFERRED"), optional: by("OPTIONAL") } };
  }));
  return r;
}

const profileBody = z.object({
  roleKey: z.string().max(60),
  level: z.enum(EXPERIENCE_BANDS).optional(),
  jobId: z.string().max(40).nullable().optional(),
  timeline: z.coerce.date().nullable().optional(),
  primary: z.boolean().optional(),
});

/** The signed-in user's target careers. */
export function targetRoleRoutes() {
  const r = Router();
  r.use(requireAuth);
  r.get("/", handler(async (req) => listProfiles(currentUser(req).id, { includeArchived: req.query.all === "1" })));
  r.post("/", handler(async (req, res) => {
    res.status(201);
    return addProfile(currentUser(req).id, parse(profileBody, req.body));
  }));
  r.patch("/:id", handler(async (req) => updateProfile(currentUser(req).id, param(req, "id"), parse(profileBody.omit({ roleKey: true, primary: true }), req.body))));
  r.post("/:id/primary", handler(async (req) => setPrimary(currentUser(req).id, param(req, "id"))));
  r.delete("/:id", handler(async (req) => archiveProfile(currentUser(req).id, param(req, "id"))));
  return r;
}
