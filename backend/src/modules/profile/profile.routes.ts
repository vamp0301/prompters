import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { currentUser } from "../../middleware/auth.js";
import { handler, parse } from "../../utils/http.js";
import { logEvent } from "../platform/events.js";

const ROLES = ["BACKEND", "FRONTEND", "FULLSTACK", "DEVOPS", "SDE", "AI"] as const;

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
  education: z.string().max(120).nullable().optional(),
  year: z.number().int().min(1).max(6).nullable().optional(),
  codingLevel: z.enum(["ZERO", "BEGINNER", "INTERMEDIATE", "ADVANCED"]).nullable().optional(),
  startLanguage: z.enum(["PYTHON", "JAVASCRIPT"]).optional(),
  explanationLocale: z.enum(["hinglish", "en", "hi"]).optional(),
  goalRole: z.enum(ROLES).nullable().optional(),
  targetCompanies: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  targetSalary: z.string().max(40).nullable().optional(),
  targetDate: z.coerce.date().nullable().optional(),
  weeklyHours: z.number().int().min(1).max(80).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(40).optional(),
  goals: z.string().max(1000).nullable().optional(),
  headline: z.string().max(160).nullable().optional(),
  summary: z.string().max(1500).nullable().optional(),
  links: z.record(z.string().url().max(300)).nullable().optional(),
});

const onboardingSchema = profileSchema.extend({
  startLanguage: z.enum(["PYTHON", "JAVASCRIPT"]),
  explanationLocale: z.enum(["hinglish", "en", "hi"]),
  goalRole: z.enum(ROLES),
  codingLevel: z.enum(["ZERO", "BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  weeklyHours: z.number().int().min(1).max(80),
});

export function profileRoutes() {
  const r = Router();

  r.get("/", handler(async (req) => {
    const me = currentUser(req);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: me.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true, profile: true },
    });
    return user;
  }));

  r.patch("/", handler(async (req) => {
    const me = currentUser(req);
    const { name, links, ...data } = parse(profileSchema, req.body);
    if (name) await prisma.user.update({ where: { id: me.id }, data: { name } });
    return prisma.userProfile.upsert({
      where: { userId: me.id },
      create: { userId: me.id, ...data, links: links ?? undefined },
      update: { ...data, links: links === null ? undefined : links },
    });
  }));

  r.post("/onboarding", handler(async (req) => {
    const me = currentUser(req);
    const { name, links, ...data } = parse(onboardingSchema, req.body);
    if (name) await prisma.user.update({ where: { id: me.id }, data: { name } });
    const profile = await prisma.userProfile.upsert({
      where: { userId: me.id },
      create: { userId: me.id, ...data, links: links ?? undefined, onboardedAt: new Date() },
      update: { ...data, links: links ?? undefined, onboardedAt: new Date() },
    });
    await logEvent(me.id, "onboarding_completed", { meta: { startLanguage: data.startLanguage, goalRole: data.goalRole } });
    return profile;
  }));

  return r;
}
