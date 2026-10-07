import { Router } from "express";
import { z } from "zod";
import { executeCode } from "../../jobs/queues.js";
import { codeRunLimiter } from "../../middleware/rate-limit.js";
import { currentUser } from "../../middleware/auth.js";
import { MAX_CODE_BYTES } from "../../sandbox/types.js";
import { handler, parse } from "../../utils/http.js";
import { logEvent } from "../platform/events.js";

const runSchema = z.object({
  language: z.enum(["javascript", "python"]),
  code: z.string().max(MAX_CODE_BYTES),
  topicSlug: z.string().max(120).optional(),
});

export function codeRoutes() {
  const r = Router();
  r.post("/run", codeRunLimiter(), handler(async (req) => {
    const body = parse(runSchema, req.body);
    const result = await executeCode({ language: body.language, code: body.code });
    await logEvent(currentUser(req).id, "code_run", { meta: { language: body.language, topic: body.topicSlug ?? null, exitCode: result.exitCode } });
    return result;
  }));
  return r;
}
