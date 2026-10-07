import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { currentUser } from "../../middleware/auth.js";
import { notFound } from "../../utils/errors.js";
import { handler, param, parse } from "../../utils/http.js";
import { logEvent } from "../platform/events.js";

export const APPLICATION_STATUSES = ["APPLIED", "ASSESSMENT", "TECHNICAL", "HR", "OFFER", "REJECTED", "WITHDRAWN"] as const;

const schema = z.object({
  company: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  status: z.enum(APPLICATION_STATUSES).default("APPLIED"),
  round: z.string().max(100).nullable().optional(),
  appliedAt: z.coerce.date().nullable().optional(),
  nextStepAt: z.coerce.date().nullable().optional(),
  interviewAt: z.coerce.date().nullable().optional(),
  result: z.string().max(200).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export function applicationRoutes() {
  const r = Router();

  r.get("/", handler(async (req) => prisma.application.findMany({ where: { userId: currentUser(req).id }, orderBy: { updatedAt: "desc" } })));

  r.post("/", handler(async (req, res) => {
    const me = currentUser(req);
    const app = await prisma.application.create({ data: { ...parse(schema, req.body), userId: me.id } });
    await logEvent(me.id, "application_added", { meta: { company: app.company } });
    res.status(201);
    return app;
  }));

  r.patch("/:id", handler(async (req) => {
    const me = currentUser(req);
    const data = parse(schema.partial(), req.body);
    // Scoped by userId: updating someone else's application is impossible (IDOR-safe).
    const existing = await prisma.application.findFirst({ where: { id: param(req, "id"), userId: me.id } });
    if (!existing) throw notFound("Application");
    const app = await prisma.application.update({ where: { id: existing.id }, data });
    if (data.status === "OFFER" && existing.status !== "OFFER") await logEvent(me.id, "offer_received", { meta: { company: app.company } });
    return app;
  }));

  r.delete("/:id", handler(async (req) => {
    const { count } = await prisma.application.deleteMany({ where: { id: param(req, "id"), userId: currentUser(req).id } });
    if (!count) throw notFound("Application");
    return { deleted: true };
  }));

  return r;
}
