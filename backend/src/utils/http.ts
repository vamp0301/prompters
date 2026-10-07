import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType, ZodTypeDef } from "zod";
import { AppError } from "./errors.js";

/** Wraps an async handler; the returned value is sent as `{ success: true, data }`. */
export function handler<T>(fn: (req: Request, res: Response) => Promise<T>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res)
      .then((data) => {
        if (!res.headersSent) res.json({ success: true, data: data ?? null });
      })
      .catch(next);
  };
}

export function parse<T>(schema: ZodType<T, ZodTypeDef, unknown>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Some fields are invalid.", result.error.flatten());
  }
  return result.data;
}

export function param(req: Request, name: string): string {
  const v = req.params[name];
  if (typeof v !== "string" || !v) throw new AppError(400, "BAD_REQUEST", `Missing ${name}`);
  return v;
}

export function pageParams(query: Request["query"], defaultSize = 20) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || defaultSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
