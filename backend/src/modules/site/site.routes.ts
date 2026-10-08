import { Router } from "express";
import { z } from "zod";
import { currentUser, requireRole } from "../../middleware/auth.js";
import { notFound } from "../../utils/errors.js";
import { handler, param, parse } from "../../utils/http.js";
import { audit } from "../platform/audit.js";
import { adminSiteContent, isSiteKey, publicSiteContent, resetSiteContent, saveSiteContent, SITE_KEYS, type SiteKey } from "./site.service.js";

const keyOf = (raw: string): SiteKey => {
  if (!isSiteKey(raw)) throw notFound("Website page");
  return raw;
};

/** Public: GET /api/public/site/:key — the saved copy for a public page (or null). */
export function publicSiteRoutes() {
  const r = Router();
  r.get("/:key", handler(async (req, res) => {
    res.setHeader("cache-control", "public, max-age=30, stale-while-revalidate=120");
    return publicSiteContent(keyOf(param(req, "key")));
  }));
  return r;
}

const saveSchema = z.object({ content: z.unknown(), expectedVersion: z.number().int().min(0) });

/** Admin: Super Admins edit the public website's copy. Every change is audit-logged. */
export function adminSiteRoutes() {
  const r = Router();
  const superAdmin = requireRole("SUPER_ADMIN");

  r.get("/site", superAdmin, handler(async () => Promise.all(SITE_KEYS.map((k) => adminSiteContent(k)))));
  r.get("/site/:key", superAdmin, handler(async (req) => adminSiteContent(keyOf(param(req, "key")))));

  r.put("/site/:key", superAdmin, handler(async (req) => {
    const key = keyOf(param(req, "key"));
    const { content, expectedVersion } = parse(saveSchema, req.body);
    const me = currentUser(req);
    const { before, saved } = await saveSiteContent(key, content, expectedVersion, me.id);
    await audit(me.id, "UPDATED_SITE_CONTENT", "SiteContent", key, before, saved.content);
    return adminSiteContent(key);
  }));

  r.delete("/site/:key", superAdmin, handler(async (req) => {
    const key = keyOf(param(req, "key"));
    const me = currentUser(req);
    const before = await resetSiteContent(key);
    await audit(me.id, "RESET_SITE_CONTENT", "SiteContent", key, before, null);
    return adminSiteContent(key);
  }));
  return r;
}
