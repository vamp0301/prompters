import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { redis } from "../../lib/redis.js";
import { handler } from "../../utils/http.js";

/** Unauthenticated curriculum outline for the marketing roadmap page (titles only, cached 5 min). */
export function publicRoutes() {
  const r = Router();
  r.get("/curriculum", handler(async () => {
    const cached = await redis().get("public:curriculum").catch(() => null);
    if (cached) return JSON.parse(cached);
    const stages = await prisma.stage.findMany({
      where: { status: { in: ["PUBLISHED", "COMING_SOON"] } },
      orderBy: [{ order: "asc" }, { track: "asc" }],
      select: {
        slug: true, code: true, title: true, description: true, track: true, estHours: true, targetRoles: true,
        modules: {
          where: { status: { in: ["PUBLISHED", "COMING_SOON"] } },
          orderBy: { order: "asc" },
          select: {
            slug: true, title: true, description: true,
            topics: { where: { status: { in: ["PUBLISHED", "COMING_SOON"] } }, orderBy: { order: "asc" }, select: { slug: true, title: true, status: true, publishedVersion: true } },
          },
        },
      },
    });
    const data = stages.map((s) => ({
      ...s,
      modules: s.modules.map((m) => ({ ...m, topics: m.topics.map((t) => ({ slug: t.slug, title: t.title, available: t.status === "PUBLISHED" && t.publishedVersion > 0 })) })),
    }));
    await redis().set("public:curriculum", JSON.stringify(data), "EX", 300).catch(() => undefined);
    return data;
  }));
  return r;
}
