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
  }

  if (status >= 500) logger.error({ err, requestId: req.id, path: req.path }, "Unhandled error");
  else logger.debug({ code, requestId: req.id, path: req.path }, message);

  res.status(status).json({ success: false, error: { code, message, details, requestId: req.id } });
}
