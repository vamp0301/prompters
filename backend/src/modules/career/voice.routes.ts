import { Readable } from "node:stream";
import { Router } from "express";
import { z } from "zod";
import { currentUser } from "../../middleware/auth.js";
import { careerAnswerLimiter } from "../../middleware/rate-limit.js";
import { handler, param, parse } from "../../utils/http.js";
import { MAX_SPEECH_CHARS, speech, sttToken, voiceConfig } from "./voice.service.js";

/** Manisha's cloud voice: /api/career/voice/… (see voice.service.ts). */
export function voiceRoutes() {
  const r = Router();
  const limit = careerAnswerLimiter();

  r.get("/config", handler(async () => voiceConfig()));

  r.post("/:sessionId/token", limit, handler(async (req) => sttToken(currentUser(req).id, param(req, "sessionId"))));

  r.post("/:sessionId/speech", limit, async (req, res, next) => {
    const ctrl = new AbortController();
    // The candidate moved on (next question, mute, left the room): stop paying for this audio.
    res.on("close", () => ctrl.abort());
    try {
      const { text } = parse(z.object({ text: z.string().trim().min(1).max(MAX_SPEECH_CHARS) }), req.body);
      const out = await speech(currentUser(req).id, param(req, "sessionId"), text, ctrl.signal);
      res.setHeader("content-type", out.contentType);
      res.setHeader("cache-control", "private, no-store");
      const stream = Readable.fromWeb(out.body as import("node:stream/web").ReadableStream);
      stream.on("error", () => res.destroy());
      stream.pipe(res);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
