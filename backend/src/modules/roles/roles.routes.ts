import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { currentUser, requireAuth, requireRole } from "../../middleware/auth.js";
import { audit } from "../platform/audit.js";
import { badRequest, notFound } from "../../utils/errors.js";
import { handler, param, parse } from "../../utils/http.js";
import { EXPERIENCE_BANDS } from "../prep/ladder.js";
import { FAMILIES, type FamilyKey } from "./catalogue.js";
import { addProfile, archiveProfile, listProfiles, setPrimary, updateProfile } from "./profiles.service.js";
import { classifyRole, listRoles, loadTaxonomy, REVIEW_STATUSES, roleDef, taxonomy } from "./taxonomy.js";

const familyKeys = Object.keys(FAMILIES) as [FamilyKey, ...FamilyKey[]];

/** Every role says whether a practitioner has reviewed its CURRENT framework (unreviewed content stays labelled). */
const summary = (r: ReturnType<typeof listRoles>[number]) => ({
  key: r.key, name: r.name, family: r.family, familyName: r.familyName, description: r.description, code: r.code, reviewed: r.reviewed,
  frameworkVersion: r.frameworkVersion,
  review: { status: r.reviewed ? "REVIEWED" : r.review.status === "REVIEWED" ? "UNREVIEWED" : r.review.status, reviewedBy: r.reviewed ? r.review.reviewedBy : null, reviewedAt: r.reviewed ? r.review.reviewedAt : null },
});

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

const reviewBody = z.object({
  status: z.enum(REVIEW_STATUSES),
  /** The practitioner's name — required to mark a role reviewed. */
  reviewedBy: z.string().trim().min(2).max(120).optional(),
  reviewerCredentials: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

/**
 * Content governance (ADMIN): record a practitioner's review of a role's competency framework.
 * A review covers the framework version in force at the time; nothing marks a role reviewed
 * automatically (AI generation and catalogue syncs never do).
 */
export function roleAdminRoutes() {
  const r = Router();
  r.use(requireAuth, requireRole("ADMIN"));
  r.get("/", handler(async () => listAdmin()));
  r.post("/:key/review", handler(async (req) => {
    const body = parse(reviewBody, req.body);
    if (body.status === "REVIEWED" && !body.reviewedBy) throw badRequest("Name the practitioner who reviewed this framework.");
    const before = await prisma.careerRole.findUnique({ where: { key: param(req, "key") } });
    if (!before) throw notFound("Role");
    const reviewed = body.status === "REVIEWED";
    const after = await prisma.careerRole.update({
      where: { key: before.key },
      data: {
        reviewStatus: body.status,
        reviewed,
        reviewedBy: body.reviewedBy ?? before.reviewedBy,
        reviewerCredentials: body.reviewerCredentials ?? before.reviewerCredentials,
        reviewNotes: body.notes ?? before.reviewNotes,
        ...(reviewed ? { reviewedAt: new Date(), reviewedFrameworkVersion: before.frameworkVersion } : {}),
      },
    });
    await audit(currentUser(req).id, "REVIEWED_ROLE_FRAMEWORK", "CareerRole", before.key, { status: before.reviewStatus, frameworkVersion: before.frameworkVersion }, { status: after.reviewStatus, reviewedBy: after.reviewedBy, frameworkVersion: after.frameworkVersion });
    await loadTaxonomy();
    return after;
  }));
  return r;
}

async function listAdmin(): Promise<unknown[]> {
  return prisma.careerRole.findMany({ orderBy: [{ family: "asc" }, { name: "asc" }], select: { key: true, name: true, family: true, frameworkVersion: true, reviewStatus: true, reviewed: true, reviewedBy: true, reviewerCredentials: true, reviewedAt: true, reviewedFrameworkVersion: true, reviewNotes: true } });
}
