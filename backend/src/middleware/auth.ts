import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env, isProd } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { forbidden, unauthorized } from "../utils/errors.js";

export const SESSION_COOKIE = "prompters_session";
const SESSION_DAYS = 7;

interface TokenPayload {
  sub: string;
  tv: number;
}

export function issueSession(res: Response, user: { id: string; tokenVersion: number }) {
  const token = jwt.sign({ sub: user.id, tv: user.tokenVersion } satisfies TokenPayload, env.JWT_SECRET, {
    expiresIn: `${SESSION_DAYS}d`,
    algorithm: "HS256",
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE ?? isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearSession(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

/** Attaches req.user when a valid session cookie is present. Never throws. */
export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as TokenPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, status: true, tokenVersion: true, lastActiveAt: true },
    });
    if (user && user.status === "ACTIVE" && user.tokenVersion === payload.tv) {
      req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
      const stale = !user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > 5 * 60 * 1000;
      if (stale) {
        prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } }).catch(() => undefined);
      }
    }
  } catch {
    // Invalid or expired token: treat as anonymous.
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(unauthorized());
  next();
}

const RANK: Record<Role, number> = { STUDENT: 0, AUTHOR: 1, ADMIN: 2, SUPER_ADMIN: 3 };

/** Allows the given role and anything ranked above it. */
export function requireRole(min: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (RANK[req.user.role] < RANK[min]) return next(forbidden());
    next();
  };
}

export function hasRole(role: Role, min: Role) {
  return RANK[role] >= RANK[min];
}

export function currentUser(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}
