import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { AppError, badRequest, conflict, unauthorized } from "../../utils/errors.js";
import { logEvent } from "../platform/events.js";

const BCRYPT_ROUNDS = 12;
// Used to keep login timing similar whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync("prompters-timing-guard", BCRYPT_ROUNDS);

export const publicUser = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  profile: { select: { onboardedAt: true, startLanguage: true, explanationLocale: true, goalRole: true, avatarUrl: true } },
} as const;

export async function register(input: { name: string; email: string; password: string }) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict("An account with this email already exists.");
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, name: input.name.trim(), passwordHash, profile: { create: {} } },
  });
  await logEvent(user.id, "signup");
  return user;
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase().trim() } });
  const ok = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.passwordHash || !ok) throw unauthorized("Email or password is incorrect.");
  if (user.status !== "ACTIVE") throw new AppError(403, "ACCOUNT_SUSPENDED", "This account is suspended. Contact support.");
  await logEvent(user.id, "login");
  return user;
}

export async function googleLogin(credential: string) {
  if (!env.GOOGLE_CLIENT_ID) throw new AppError(503, "GOOGLE_DISABLED", "Google sign-in is not configured.");
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID }).catch(() => {
    throw unauthorized("Google sign-in failed.");
  });
  const p = ticket.getPayload();
  if (!p?.email || !p.email_verified || !p.sub) throw unauthorized("Google account email is not verified.");
  const email = p.email.toLowerCase();
  let user = await prisma.user.findFirst({ where: { OR: [{ googleId: p.sub }, { email }] } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: p.name ?? email.split("@")[0], googleId: p.sub, profile: { create: { avatarUrl: p.picture } } },
    });
    await logEvent(user.id, "signup", { meta: { method: "google" } });
  } else if (!user.googleId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { googleId: p.sub } });
  }
  if (user.status !== "ACTIVE") throw new AppError(403, "ACCOUNT_SUSPENDED", "This account is suspended. Contact support.");
  return user;
}

export async function changePassword(userId: string, current: string, next: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.passwordHash && !(await bcrypt.compare(current, user.passwordHash))) {
    throw badRequest("Current password is incorrect.");
  }
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(next, BCRYPT_ROUNDS), tokenVersion: { increment: 1 } },
  });
}

/** DPDP Act: let a learner download everything we store about them. */
export async function exportData(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      ...publicUser,
      profile: true,
      masteries: true,
      quizAttempts: { select: { id: true, kind: true, score: true, passed: true, startedAt: true, finishedAt: true, topicId: true } },
      submissions: { select: { buildTaskId: true, language: true, code: true, status: true, independenceScore: true, completedAt: true } },
      projectSubmissions: true,
      readiness: true,
      events: true,
      applications: true,
      interviewPractice: true,
    },
  });
}
