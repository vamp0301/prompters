import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/errors.js";
import { logger } from "../lib/logger.js";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "This endpoint does not exist.", requestId: req.id },
  });
}

/** Connection-level failures of Postgres (Prisma) or Redis (ioredis). */
export function isDependencyOutage(err: unknown) {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  if (err instanceof Prisma.PrismaClientKnownRequestError && ["P1001", "P1002", "P1008", "P1017", "P2024"].includes(err.code)) return true;
  if (!(err instanceof Error)) return false;
  return err.name === "MaxRetriesPerRequestError" || /ECONNREFUSED|ECONNRESET|ETIMEDOUT|Connection is closed|Stream isn't writeable/i.test(err.message);
}

/** Errors raised by body-parser (express.json) carry a `type` and a 4xx `status`. */
function isBodyParserError(err: unknown): err is { type: string; status: number } {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { type?: unknown; status?: unknown };
  return typeof e.type === "string" && typeof e.status === "number" && e.status >= 400 && e.status < 500;
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong. Your progress is safe — please try again.";
  let details: unknown;

  if (err instanceof AppError) {
    ({ status, code, message, details } = err);
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      status = 409;
      code = "CONFLICT";
      message = "That already exists.";
    } else if (err.code === "P2025") {
      status = 404;
      code = "NOT_FOUND";
      message = "Resource not found.";
    }
  } else if (err instanceof SyntaxError && "body" in err) {
    status = 400;
    code = "INVALID_JSON";
    message = "Request body is not valid JSON.";
  } else if (isDependencyOutage(err)) {
    // Database or Redis unreachable: a temporary outage, not a bug — say so (and let clients retry).
    status = 503;
    code = "SERVICE_UNAVAILABLE";
    message = "Prompters is having trouble reaching its database or cache. Please try again in a minute.";
  } else if (isBodyParserError(err)) {
    // express.json() reports these with their own HTTP status; never let them fall through as a 500.
    if (err.type === "entity.too.large") {
      status = 413;
      code = "PAYLOAD_TOO_LARGE";
      message = "That upload is too large. Files must be 5 MB or smaller.";
    } else if (err.type === "encoding.unsupported" || err.type === "charset.unsupported") {
      status = 415;
      code = "UNSUPPORTED_MEDIA_TYPE";
      message = "Unsupported request encoding.";
    } else {
      status = 400;
      code = "BAD_REQUEST";
      message = "The request body couldn't be read.";
    }
  }

  if (status === 503) res.setHeader("retry-after", "30");
  if (status >= 500) logger.error({ err, requestId: req.id, path: req.path, code }, status === 503 ? "Dependency unavailable" : "Unhandled error");
  else logger.debug({ code, requestId: req.id, path: req.path }, message);

  res.status(status).json({ success: false, error: { code, message, details, requestId: req.id } });
}
