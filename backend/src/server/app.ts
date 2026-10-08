import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { corsOrigins, isProd } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { workerAlive } from "../lib/heartbeat.js";
import { redis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { loadUser, requireAuth } from "../middleware/auth.js";
import { personalizationRoutes } from "../modules/personalization/personalization.routes.js";
import { projectExperienceRoutes } from "../modules/project-experience/project-experience.routes.js";
import { csrfGuard } from "../middleware/csrf.js";
import { errorHandler, notFoundHandler } from "../middleware/error-handler.js";
import { globalLimiter } from "../middleware/rate-limit.js";
import { requestId } from "../middleware/request-id.js";
import { adminRoutes } from "../modules/admin/admin.routes.js";
import { aiRoutes } from "../modules/ai/ai.routes.js";
import { applicationRoutes } from "../modules/applications/applications.routes.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { buildRoutes } from "../modules/build/build.routes.js";
import { codeRoutes } from "../modules/code/code.routes.js";
import { dashboardRoutes } from "../modules/dashboard/dashboard.routes.js";
import { interviewRoutes } from "../modules/interview/interview.routes.js";
import { journeyRoutes } from "../modules/journey/journey.routes.js";
import { learningRoutes } from "../modules/learning/learning.routes.js";
import { publicRoutes } from "../modules/learning/public.routes.js";
import { publicSiteRoutes } from "../modules/site/site.routes.js";
import { profileRoutes } from "../modules/profile/profile.routes.js";
import { projectRoutes } from "../modules/projects/projects.routes.js";
import { promptRoutes } from "../modules/prompts/prompts.routes.js";
import { quizRoutes } from "../modules/quiz/quiz.routes.js";
import { readinessRoutes } from "../modules/readiness/readiness.routes.js";
import { careerRoutes } from "../modules/career/career.routes.js";
import { prepRoutes } from "../modules/prep/prep.routes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (isProd) app.set("trust proxy", 1);

  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (req) => (req as express.Request).id, autoLogging: { ignore: (req) => req.url === "/health" || req.url === "/live" || req.url === "/ready" } }));
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  // Resume PDFs and answer audio arrive as base64 JSON; only these routes get the larger limit.
  app.use("/api/career", express.json({ limit: "8mb" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Liveness: the process is up (no dependency checks, so a DB blip doesn't restart the API).
  app.get("/live", (_req, res) => {
    res.json({ success: true, data: { alive: true } });
  });

  // Readiness: can this instance serve traffic? Database and Redis must answer.
  const dependencies = async () => {
    const [db, cache] = await Promise.allSettled([prisma.$queryRaw`SELECT 1`, redis().ping()]);
    return { database: db.status === "fulfilled", redis: cache.status === "fulfilled" };
  };
  app.get("/ready", async (_req, res) => {
    const deps = await dependencies();
    const ok = deps.database && deps.redis;
    res.status(ok ? 200 : 503).json({ success: ok, data: deps });
  });

  // Overall health for dashboards: readiness plus whether a background worker is alive. The worker
  // doesn't affect the status code (the API can serve while it restarts) but is reported.
  app.get("/health", async (_req, res) => {
    const deps = await dependencies();
    const worker = deps.redis ? await workerAlive().catch(() => false) : false;
    const ok = deps.database && deps.redis;
    res.status(ok ? 200 : 503).json({ success: ok, data: { ...deps, worker } });
  });

  const api = express.Router();
  api.use(loadUser);
  api.use(globalLimiter());
  api.use(csrfGuard);

  api.use("/auth", authRoutes());
  api.use("/public/site", publicSiteRoutes());
  api.use("/public", publicRoutes());
  api.use("/profile", requireAuth, profileRoutes());
  api.use("/dashboard", requireAuth, dashboardRoutes());
  api.use("/readiness", requireAuth, readinessRoutes());
  api.use("/personalization", requireAuth, personalizationRoutes());
  api.use("/journey", requireAuth, journeyRoutes());
  api.use("/build-tasks", requireAuth, buildRoutes());
  api.use("/projects", requireAuth, projectRoutes());
  api.use("/prompts", requireAuth, promptRoutes());
  api.use("/interview", requireAuth, interviewRoutes());
  api.use("/applications", requireAuth, applicationRoutes());
  api.use("/code", requireAuth, codeRoutes());
  api.use("/ai", requireAuth, aiRoutes());
  api.use("/career/prep", requireAuth, prepRoutes());
  api.use("/career/projects", requireAuth, projectExperienceRoutes());
  api.use("/career", requireAuth, careerRoutes());
  api.use("/admin", requireAuth, adminRoutes());
  api.use("/", requireAuth, learningRoutes());
  api.use("/", requireAuth, quizRoutes());

  app.use("/api", api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
