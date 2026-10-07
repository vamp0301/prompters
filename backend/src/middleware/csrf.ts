import type { NextFunction, Request, Response } from "express";
import { corsOrigins, env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defence for cookie-authenticated requests:
 *  1. Session cookie is SameSite=Lax (blocks most cross-site POSTs).
 *  2. Mutating requests must send JSON (a cross-site form cannot set this without a CORS preflight).
 *  3. If an Origin header is present it must be an allowed origin.
 */
export function csrfGuard(req: Request, _res: Response, next: NextFunction) {
  if (SAFE.has(req.method)) return next();
  const origin = req.header("origin");
  const allowed = [...corsOrigins, env.APP_URL];
  if (origin && !allowed.includes(origin)) {
    return next(new AppError(403, "CSRF_REJECTED", "Request origin not allowed."));
  }
  const hasBody = Number(req.header("content-length") ?? 0) > 0 || req.header("transfer-encoding");
  if (hasBody && !req.is("application/json")) {
    return next(new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Requests must be JSON."));
  }
  next();
}
