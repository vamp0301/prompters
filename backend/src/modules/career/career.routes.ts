import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { aiLimiter, careerAnswerLimiter, skillGuideLimiter } from "../../middleware/rate-limit.js";
import { currentUser } from "../../middleware/auth.js";
import { AppError, notFound } from "../../utils/errors.js";
import { handler, param, parse } from "../../utils/http.js";
import { aiProvider } from "../../ai/provider.js";
import { isEnabled } from "../platform/flags.js";
import { MATCH_WEIGHTS, analyse, createJob, createResume, deleteResume } from "./analysis.service.js";
import * as interview from "./interview.service.js";
import { careerOverview } from "./overview.service.js";
import { GUIDE_LOCALES, resumeSkills, skillGuide } from "./skills.service.js";
import { deletePackFiles } from "../prep/pack.service.js";

const docSchema = z.object({
  text: z.string().max(60000).optional(),
  fileBase64: z.string().max(7_500_000).optional(),
  mimeType: z.string().max(100).optional(),
  fileName: z.string().max(200).optional(),
});

export async function ensureAiInterviewEnabled(userId: string) {
  if (!(await isEnabled("AI_INTERVIEW", userId))) throw new AppError(403, "FEATURE_DISABLED", "AI interviews are not enabled for your account yet.");
}

export function careerRoutes() {
  const r = Router();
  const ai = aiLimiter();

  r.get("/status", handler(async (req) => {
    const enabled = await isEnabled("AI_INTERVIEW", currentUser(req).id);
    const reason = !aiProvider() ? "NO_PROVIDER" : !enabled ? "FEATURE_DISABLED" : null;
    return {
    available: reason === null,
    reason,
    interviewer: interview.INTERVIEWER,
    matchWeights: MATCH_WEIGHTS,
    };
  }));

  // One-call summary for the dashboard: resume decoded + Top-100 split by priority and category.
  r.get("/overview", handler(async (req) => careerOverview(currentUser(req).id)));

  // ───── Skill guides: learn each resume skill (real-world use, implementation, perks, drawbacks) ─────
  r.get("/skills", handler(async (req) => resumeSkills(currentUser(req).id)));
  r.get("/skills/guide", skillGuideLimiter(), handler(async (req) => {
    const me = currentUser(req);
    const q = parse(z.object({ name: z.string().trim().min(1).max(80), lang: z.enum(GUIDE_LOCALES).default("en") }), req.query);
    return skillGuide(me.id, q.name, q.lang);
  }));

  // ───── Resumes & job descriptions ─────
  r.get("/resumes", handler(async (req) =>
    prisma.careerResume.findMany({ where: { userId: currentUser(req).id }, orderBy: { createdAt: "desc" }, select: { id: true, label: true, fileName: true, parsed: true, createdAt: true } })));
  r.post("/resumes", ai, handler(async (req, res) => {
    const me = currentUser(req);
    await ensureAiInterviewEnabled(me.id);
    const body = parse(docSchema.extend({ label: z.string().max(120).optional() }), req.body);
    const resume = await createResume(me.id, body);
    res.status(201);
    return { id: resume.id, label: resume.label, parsed: resume.parsed, createdAt: resume.createdAt };
  }));
  r.delete("/resumes/:id", handler(async (req) => {
    const me = currentUser(req);
    const matches = await prisma.jobMatch.findMany({ where: { resumeId: param(req, "id"), userId: me.id }, select: { id: true } });
    await interview.deleteAudioForMatches(matches.map((m) => m.id));
    if (await prisma.careerResume.count({ where: { id: param(req, "id"), userId: me.id } })) await interview.deleteAudioForResume(param(req, "id"));
    const plans = await prisma.prepPlan.findMany({ where: { resumeId: param(req, "id"), userId: me.id }, select: { id: true } });
    await deletePackFiles(plans.map((p) => p.id));
    await deleteResume(me.id, param(req, "id"));
    return { deleted: true };
  }));

  r.get("/jobs", handler(async (req) =>
    prisma.jobTarget.findMany({ where: { userId: currentUser(req).id }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, company: true, parsed: true, createdAt: true } })));
  r.post("/jobs", ai, handler(async (req, res) => {
    const me = currentUser(req);
    await ensureAiInterviewEnabled(me.id);
    const body = parse(docSchema.extend({ title: z.string().max(160).optional(), company: z.string().max(160).optional() }), req.body);
    const job = await createJob(me.id, body);
    res.status(201);
    return { id: job.id, title: job.title, company: job.company, parsed: job.parsed, createdAt: job.createdAt };
  }));
  r.delete("/jobs/:id", handler(async (req) => {
    const me = currentUser(req);
    const job = await prisma.jobTarget.findFirst({ where: { id: param(req, "id"), userId: me.id }, include: { matches: { select: { id: true } }, prepPlans: { select: { id: true } } } });
    if (!job) throw notFound("Job description");
    await interview.deleteAudioForMatches(job.matches.map((m) => m.id));
    await deletePackFiles(job.prepPlans.map((p) => p.id));
    await prisma.jobTarget.delete({ where: { id: job.id } });
    return { deleted: true };
  }));

  // ───── Job-specific analysis ─────
  r.post("/analyses", ai, handler(async (req, res) => {
    const me = currentUser(req);
    await ensureAiInterviewEnabled(me.id);
    const { resumeId, jobId } = parse(z.object({ resumeId: z.string(), jobId: z.string() }), req.body);
    const match = await analyse(me.id, resumeId, jobId);
    res.status(201);
    return match;
  }));
  r.get("/analyses", handler(async (req) =>
    prisma.jobMatch.findMany({
      where: { userId: currentUser(req).id },
      orderBy: { createdAt: "desc" },
      select: { id: true, score: true, createdAt: true, job: { select: { title: true, company: true } }, resume: { select: { label: true } }, _count: { select: { sessions: true } } },
    })));
  r.get("/analyses/:id", handler(async (req) => {
    const me = currentUser(req);
    const match = await prisma.jobMatch.findFirst({
      where: { id: param(req, "id"), userId: me.id },
      include: {
        job: { select: { id: true, title: true, company: true, parsed: true } },
        resume: { select: { id: true, label: true, parsed: true } },
        sessions: { orderBy: { startedAt: "desc" }, select: { id: true, status: true, readinessScore: true, result: true, startedAt: true } },
      },
    });
    if (!match) throw notFound("Analysis");
    return { ...match, weights: MATCH_WEIGHTS };
  }));
  r.delete("/analyses/:id", handler(async (req) => {
    const me = currentUser(req);
    const match = await prisma.jobMatch.findFirst({ where: { id: param(req, "id"), userId: me.id } });
    if (!match) throw notFound("Analysis");
    await interview.deleteAudioForMatches([match.id]);
    await prisma.jobMatch.delete({ where: { id: match.id } });
    return { deleted: true };
  }));

  // ───── Interviews ─────
  r.get("/sessions", handler(async (req) => interview.interviewHistory(currentUser(req).id)));

  r.post("/sessions", ai, handler(async (req, res) => {
    const me = currentUser(req);
    await ensureAiInterviewEnabled(me.id);
    const body = parse(
      z
        .object({
          matchId: z.string().max(40).optional(),
          resumeId: z.string().max(40).optional(),
          targetRole: z.string().max(40).optional(),
          difficulty: z.enum(["STANDARD", "HARD"]).default("STANDARD"),
          // Ignored: interviews are English-only. Still accepted so older clients don't get a 400.
          language: z.enum(["hinglish", "en", "hi"]).optional(),
          durationMinutes: z.union([z.literal(15), z.literal(20), z.literal(30), z.literal(45)]).default(30),
          questionTarget: z.number().int().min(5).max(25).optional(),
          consent: z.object({ analysis: z.boolean().optional(), recording: z.boolean().optional(), integrity: z.boolean(), preparationOnly: z.boolean(), storeAudio: z.boolean().default(true) }),
        })
        .refine((b) => !!b.matchId || (!!b.resumeId && !!b.targetRole), { message: "Choose a resume and a target role, or a job-match analysis.", path: ["targetRole"] }),
      req.body,
    );
    res.status(201);
    return interview.startSession(me.id, body);
  }));

  r.get("/sessions/:id", handler(async (req) => interview.getSession(currentUser(req).id, param(req, "id"))));

  r.post("/sessions/:id/answer", careerAnswerLimiter(), handler(async (req) => {
    const body = parse(
      z.object({
        turnId: z.string(),
        answerText: z.string().max(10000).optional(),
        skipped: z.boolean().optional(),
        durationSec: z.number().int().min(0).max(3600).optional(),
        audioBase64: z.string().max(5_600_000).optional(),
        audioMime: z.string().max(60).optional(),
        code: z.string().max(65536).optional(),
        codeLanguage: z.enum(["javascript", "python"]).optional(),
      }),
      req.body,
    );
    return interview.submitAnswer(currentUser(req).id, param(req, "id"), body);
  }));

  r.post("/sessions/:id/run-code", careerAnswerLimiter(), handler(async (req) => {
    const body = parse(z.object({ turnId: z.string(), language: z.enum(["javascript", "python"]), code: z.string().max(65536) }), req.body);
    return interview.runCode(currentUser(req).id, param(req, "id"), body.turnId, body.language, body.code);
  }));

  r.post("/sessions/:id/integrity", handler(async (req) => {
    const { events } = parse(z.object({ events: z.array(z.object({ type: z.enum(interview.INTERVIEW_INTEGRITY_EVENTS), meta: z.record(z.unknown()).optional() })).min(1).max(50) }), req.body);
    return interview.logIntegrity(currentUser(req).id, param(req, "id"), events);
  }));

  r.post("/sessions/:id/end", handler(async (req) => interview.endSession(currentUser(req).id, param(req, "id"))));
  r.post("/sessions/:id/recording", handler(async (req) => {
    const { allow } = parse(z.object({ allow: z.boolean() }), req.body);
    return interview.setRecordingConsent(currentUser(req).id, param(req, "id"), allow);
  }));
  r.post("/sessions/:id/pause", handler(async (req) => interview.pauseSession(currentUser(req).id, param(req, "id"))));
  r.post("/sessions/:id/resume", handler(async (req) => interview.resumeSession(currentUser(req).id, param(req, "id"))));

  r.get("/sessions/:id/turns/:turnId/audio", async (req, res, next) => {
    try {
      const obj = await interview.audioFor(currentUser(req).id, param(req, "id"), param(req, "turnId"));
      res.setHeader("content-type", obj.contentType);
      res.setHeader("cache-control", "private, no-store");
      res.send(obj.body);
    } catch (e) {
      next(e);
    }
  });

  r.delete("/sessions/:id/recordings", handler(async (req) => interview.deleteRecordings(currentUser(req).id, param(req, "id"))));
  r.delete("/sessions/:id", handler(async (req) => interview.deleteSession(currentUser(req).id, param(req, "id"))));

  return r;
}
