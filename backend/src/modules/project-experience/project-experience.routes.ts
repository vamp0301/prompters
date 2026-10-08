import { Router } from "express";
import { z } from "zod";
import { currentUser } from "../../middleware/auth.js";
import { aiLimiter, careerAnswerLimiter, skillGuideLimiter } from "../../middleware/rate-limit.js";
import { handler, param, parse } from "../../utils/http.js";
import { ensureAiInterviewEnabled } from "../career/career.routes.js";
import { getProject, listProjects, regenerate, updateFacts } from "./project.service.js";
import { API_FOCUS } from "./integrations.js";
import { answerTest, MODES, projectReport, startTest, view } from "./test.service.js";

/** Project Experience Intelligence: one interview-prep module per resume project. Own data only. */
export function projectExperienceRoutes() {
  const r = Router();

  r.get("/", handler(async (req) => {
    const { resumeId } = parse(z.object({ resumeId: z.string().max(40).optional() }), req.query);
    return listProjects(currentUser(req).id, resumeId);
  }));

  // Opening a module generates it on first view (or after the facts changed): an AI feature.
  r.get("/:id", skillGuideLimiter(), handler(async (req) => {
    const me = currentUser(req);
    const { generate } = parse(z.object({ generate: z.enum(["0", "1"]).default("1") }), req.query);
    if (generate === "1") await ensureAiInterviewEnabled(me.id);
    return getProject(me.id, param(req, "id"), { generate: generate === "1" });
  }));

  r.patch("/:id/facts", handler(async (req) => {
    const { facts } = parse(z.object({ facts: z.record(z.string().max(500).nullable()).refine((f) => Object.keys(f).length <= 40, "Too many fields.") }), req.body);
    return updateFacts(currentUser(req).id, param(req, "id"), facts);
  }));

  r.post("/:id/regenerate", aiLimiter(), handler(async (req) => {
    const me = currentUser(req);
    await ensureAiInterviewEnabled(me.id);
    return regenerate(me.id, param(req, "id"));
  }));

  r.post("/:id/tests", aiLimiter(), handler(async (req, res) => {
    const me = currentUser(req);
    await ensureAiInterviewEnabled(me.id);
    const { mode, focus } = parse(z.object({ mode: z.enum(MODES), focus: z.enum(API_FOCUS).default("ALL") }), req.body);
    res.status(201);
    return startTest(me.id, param(req, "id"), mode, focus);
  }));

  r.get("/:id/tests/:testId", handler(async (req) => view(param(req, "testId"), currentUser(req).id)));

  r.post("/:id/tests/:testId/answer", careerAnswerLimiter(), handler(async (req) => {
    const me = currentUser(req);
    await ensureAiInterviewEnabled(me.id);
    const { answer } = parse(z.object({ answer: z.string().max(6000) }), req.body);
    return answerTest(me.id, param(req, "id"), param(req, "testId"), answer);
  }));

  r.get("/:id/report", handler(async (req) => projectReport(currentUser(req).id, param(req, "id"))));

  return r;
}
