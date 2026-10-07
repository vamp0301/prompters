import { Router } from "express";
import { z } from "zod";
import { currentUser } from "../../middleware/auth.js";
import { codeRunLimiter } from "../../middleware/rate-limit.js";
import { MAX_CODE_BYTES } from "../../sandbox/types.js";
import { handler, param, parse } from "../../utils/http.js";
import * as build from "./build.service.js";

const lang = z.enum(["javascript", "python"]);
const codeSchema = z.object({ language: lang, code: z.string().max(MAX_CODE_BYTES) });

export function buildRoutes() {
  const r = Router();
  const limiter = codeRunLimiter();

  r.get("/", handler(async (req) => build.listTasks(currentUser(req).id)));
  r.get("/:slug", handler(async (req) => build.getTask(currentUser(req).id, param(req, "slug"))));
  r.post("/:slug/start", handler(async (req) => build.start(currentUser(req).id, param(req, "slug"), parse(z.object({ language: lang }), req.body).language)));
  r.put("/:slug/code", handler(async (req) => {
    const b = parse(codeSchema, req.body);
    return build.saveCode(currentUser(req).id, param(req, "slug"), b.language, b.code);
  }));
  r.post("/:slug/run", limiter, handler(async (req) => {
    const b = parse(codeSchema, req.body);
    return build.run(currentUser(req).id, param(req, "slug"), b.language, b.code);
  }));
  r.post("/:slug/hint", handler(async (req) => build.revealHint(currentUser(req).id, param(req, "slug"))));
  r.post("/:slug/submit", limiter, handler(async (req) => {
    const b = parse(codeSchema, req.body);
    return build.submit(currentUser(req).id, param(req, "slug"), b.language, b.code);
  }));
  r.post("/:slug/explain", handler(async (req) => {
    const { answers } = parse(z.object({ answers: z.array(z.string().trim().min(1, "Answer every question.").max(3000)).min(1).max(10) }), req.body);
    return build.explain(currentUser(req).id, param(req, "slug"), answers);
  }));

  return r;
}
