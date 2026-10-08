import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { conflict, notFound } from "../../utils/errors.js";
import { parse } from "../../utils/http.js";

const text = (max: number) => z.string().trim().max(max);
const line = (max = 120) => text(max).min(1, "Can't be empty.");

/** A link the banner may point to: a site path ("/pricing") or an https URL. Never javascript:, never //host. */
const href = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || (/^\/(?!\/)/.test(v) && !/[\s<>"']/.test(v)) || /^https:\/\/[^\s<>"']+$/.test(v), "Use a path like /pricing or an https:// link.");

export const landingSchema = z
  .object({
    hero: z.object({
      eyebrow: line(80),
      titleLead: line(40),
      titleAccent: line(30),
      titleTail: line(40),
      lede: line(200),
      primaryCta: line(40),
      secondaryCta: line(40),
      steps: z.tuple([line(40), line(40), line(40)]),
    }).strict(),
    upload: z.object({
      tape: line(30),
      noteLine1: line(40),
      noteLine2: line(40),
      title: line(80),
      subtitle: line(200),
      dropTitle: line(40),
      dropHint: line(60),
      button: line(50),
      finePrint: line(160),
    }).strict(),
    loop: z.object({
      eyebrow: line(60),
      title: line(80),
      titleAccent: line(80),
      cards: z.array(z.object({ title: line(40), text: line(160) }).strict()).length(4),
    }).strict(),
    top100: z.object({
      eyebrow: line(60),
      title: line(60),
      titleAccent: line(80),
      body: line(300),
      cta: line(40),
      sample: z.object({ meta: line(60), question: line(200), why: line(200), resume: line(120) }).strict(),
    }).strict(),
    finalCta: z.object({ eyebrow: line(60), line1: line(120), accent: line(120), button: line(50) }).strict(),
    footer: z.object({ tagline: line(160) }).strict(),
    announcement: z.object({ enabled: z.boolean(), text: text(200), linkLabel: text(40), linkHref: href }).strict()
      .refine((a) => !a.enabled || a.text.length > 0, { message: "Write the announcement text, or turn it off.", path: ["text"] })
      .refine((a) => !a.linkLabel === !a.linkHref, { message: "Give the link both a label and an address, or neither.", path: ["linkHref"] }),
    seo: z.object({ title: text(70), description: text(170) }).strict(),
  })
  .strict();

export type LandingContent = z.infer<typeof landingSchema>;

const SCHEMAS = { landing: landingSchema } as const;
export type SiteKey = keyof typeof SCHEMAS;
export const SITE_KEYS = Object.keys(SCHEMAS) as SiteKey[];
export const isSiteKey = (k: string): k is SiteKey => k in SCHEMAS;
export const siteSchema = (k: SiteKey) => SCHEMAS[k];

/** Public read: the saved overrides only (the frontend merges them over its defaults). */
export async function publicSiteContent(key: SiteKey) {
  const row = await prisma.siteContent.findUnique({ where: { key }, select: { content: true, updatedAt: true } });
  return { content: row?.content ?? null, updatedAt: row?.updatedAt ?? null };
}

export async function adminSiteContent(key: SiteKey) {
  const row = await prisma.siteContent.findUnique({ where: { key } });
  const editor = row?.updatedById ? await prisma.user.findUnique({ where: { id: row.updatedById }, select: { name: true, email: true } }) : null;
  return { key, content: row?.content ?? null, version: row?.version ?? 0, updatedAt: row?.updatedAt ?? null, updatedBy: editor };
}

/**
 * Saves overrides with optimistic concurrency: `expectedVersion` must match what the editor loaded
 * (0 = nothing saved yet), so one admin can't silently overwrite another's edits.
 */
export async function saveSiteContent(key: SiteKey, content: unknown, expectedVersion: number, actorId: string) {
  const data = parse(siteSchema(key), content) as Prisma.InputJsonValue;
  return prisma.$transaction(async (tx) => {
    const current = await tx.siteContent.findUnique({ where: { key } });
    if ((current?.version ?? 0) !== expectedVersion) throw conflict("Someone else saved this page since you opened it. Reload to see their changes.");
    const saved = current
      ? await tx.siteContent.update({ where: { key }, data: { content: data, version: { increment: 1 }, updatedById: actorId } })
      : await tx.siteContent.create({ data: { key, content: data, version: 1, updatedById: actorId } });
    return { before: current?.content ?? null, saved };
  });
}

export async function resetSiteContent(key: SiteKey) {
  const current = await prisma.siteContent.findUnique({ where: { key } });
  if (!current) throw notFound("Saved website content");
  await prisma.siteContent.delete({ where: { key } });
  return current.content;
}
