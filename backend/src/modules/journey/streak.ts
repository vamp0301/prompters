import { prisma } from "../../lib/prisma.js";

/** Day key in India time — the primary audience — so streaks roll over at local midnight. */
export const dayKey = (d: Date) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);

export async function streak(userId: string) {
  const since = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
  const events = await prisma.learningEvent.findMany({
    where: { userId, createdAt: { gte: since }, type: { notIn: ["login", "signup"] } },
    select: { createdAt: true },
  });
  const days = new Set(events.map((e) => dayKey(e.createdAt)));
  let current = 0;
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setTime(cursor.getTime() - 86_400_000); // today not started yet
  while (days.has(dayKey(cursor))) {
    current++;
    cursor.setTime(cursor.getTime() - 86_400_000);
  }
  return { current, activeDays: days.size, activeToday: days.has(dayKey(new Date())) };
}
