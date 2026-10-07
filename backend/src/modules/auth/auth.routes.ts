import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { codeExecutionEnabled } from "../../config/env.js";
import { deleteUserObjects } from "../../lib/storage.js";
import { authLimiter } from "../../middleware/rate-limit.js";
import { clearSession, currentUser, issueSession, requireAuth } from "../../middleware/auth.js";
import { handler, parse } from "../../utils/http.js";
import * as auth from "./auth.service.js";
import { flagsFor } from "../platform/flags.js";
import { badRequest } from "../../utils/errors.js";

const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128)
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password,
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) });

export function authRoutes() {
  const r = Router();
  const limiter = authLimiter();

  r.post("/register", limiter, handler(async (req, res) => {
    const user = await auth.register(parse(registerSchema, req.body));
    issueSession(res, user);
    res.status(201);
    return prisma.user.findUnique({ where: { id: user.id }, select: auth.publicUser });
  }));

  r.post("/login", limiter, handler(async (req, res) => {
    const user = await auth.login(parse(loginSchema, req.body));
    issueSession(res, user);
    return prisma.user.findUnique({ where: { id: user.id }, select: auth.publicUser });
  }));

  r.post("/google", limiter, handler(async (req, res) => {
    const { credential } = parse(z.object({ credential: z.string().min(10) }), req.body);
    const user = await auth.googleLogin(credential);
    issueSession(res, user);
    return prisma.user.findUnique({ where: { id: user.id }, select: auth.publicUser });
  }));

  r.post("/logout", handler(async (_req, res) => {
    clearSession(res);
    return { loggedOut: true };
  }));

  r.post("/logout-all", requireAuth, handler(async (req, res) => {
    await prisma.user.update({ where: { id: currentUser(req).id }, data: { tokenVersion: { increment: 1 } } });
    clearSession(res);
    return { loggedOut: true };
  }));

  r.get("/me", requireAuth, handler(async (req) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: currentUser(req).id }, select: { ...auth.publicUser, passwordHash: true } });
    const { passwordHash, ...rest } = user;
    // CODE_EXECUTION is server config, not a DB flag: lets the UI explain why "Run" is unavailable.
    return { ...rest, hasPassword: !!passwordHash, flags: { ...(await flagsFor(user.id)), CODE_EXECUTION: codeExecutionEnabled() } };
  }));

  r.post("/change-password", requireAuth, limiter, handler(async (req, res) => {
    const body = parse(z.object({ currentPassword: z.string().max(128).default(""), newPassword: password }), req.body);
    const user = await auth.changePassword(currentUser(req).id, body.currentPassword, body.newPassword);
    issueSession(res, user);
    return { changed: true };
  }));

  r.get("/export", requireAuth, handler(async (req) => auth.exportData(currentUser(req).id)));

  r.delete("/account", requireAuth, handler(async (req, res) => {
    const { confirm } = parse(z.object({ confirm: z.string() }), req.body ?? {});
    const me = currentUser(req);
    if (confirm !== me.email) throw badRequest("Type your email to confirm account deletion.");
    if (me.role !== "STUDENT") throw badRequest("Staff accounts must be demoted before deletion.");
    // Files first: if storage fails the account still exists and the user can retry, rather than
    // leaving private files with no owner. Idempotent, so a retry is safe.
    await deleteUserObjects(me.id);
    await prisma.user.delete({ where: { id: me.id } });
    clearSession(res);
    return { deleted: true };
  }));

  return r;
}
