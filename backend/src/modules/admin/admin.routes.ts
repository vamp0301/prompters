import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { invalidateCurriculum } from "../learning/path.service.js";
import { contentRoutes } from "./content.routes.js";
import { curriculumRoutes } from "./curriculum.routes.js";
import { insightsRoutes } from "./insights.routes.js";
import { platformRoutes } from "./platform.routes.js";
import { adminSiteRoutes } from "../site/site.routes.js";
import { adminPersonalizationRoutes } from "../personalization/admin.routes.js";

/**
 * Admin API. Role tiers:
 *  AUTHOR      — write drafts: topics, sections, questions, build tasks, prompts, interviews
 *  ADMIN       — publish content, manage stages/modules/projects/assessments, users, integrity
 *  SUPER_ADMIN — roles, feature flags, scoring rules, audit logs, publish overrides, website copy
 */
export function adminRoutes() {
  const r = Router();
  r.use(requireRole("AUTHOR"));
  // Any admin write may change the curriculum shape learners see.
  r.use((req, res, next) => {
    if (req.method !== "GET") res.on("finish", invalidateCurriculum);
    next();
  });
  r.use(insightsRoutes());
  r.use(curriculumRoutes());
  r.use(contentRoutes());
  r.use(platformRoutes());
  r.use(adminSiteRoutes());
  r.use(adminPersonalizationRoutes());
  return r;
}
