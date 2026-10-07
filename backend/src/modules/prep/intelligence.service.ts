import type { CareerResume, ResumeChunk, ResumeClaim } from "@prisma/client";
import { aiJson } from "../../ai/json.js";
import { prisma } from "../../lib/prisma.js";
import { resumeParsedSchema, type ResumeParsed } from "../career/schemas.js";
import { prepPrompts } from "./prompts.js";
import { intelligenceSchema } from "./schemas.js";
import { canonicalSkill, evidenceInResume, normalize, sectionize, verbatimEvidence } from "./text.js";

const AI_TIMEOUT = 120_000;

export type ResumeIntelligence = { resume: CareerResume; parsed: ResumeParsed; chunks: ResumeChunk[]; claims: ResumeClaim[] };

export function resumeSkills(parsed: ResumeParsed) {
  const s = parsed.skills;
  return [...s.languages, ...s.frameworks, ...s.databases, ...s.cloud, ...s.devops, ...s.other];
}

/**
 * PDF text → sections → semantic chunks → evidence-checked claims, persisted once per
 * resume. Resumes uploaded before this existed are processed the first time they're used.
 */
export async function ensureResumeIntelligence(resumeId: string): Promise<ResumeIntelligence> {
  const resume = await prisma.careerResume.findUniqueOrThrow({ where: { id: resumeId } });
  const parsed = resumeParsedSchema.parse(resume.parsed);
  if (resume.analyzedAt) {
    const [chunks, claims] = await Promise.all([
      prisma.resumeChunk.findMany({ where: { resumeId }, orderBy: { order: "asc" } }),
      prisma.resumeClaim.findMany({ where: { resumeId }, orderBy: { id: "asc" } }),
    ]);
    return { resume, parsed, chunks, claims };
  }

  const sections = sectionize(resume.text);
  const p = prepPrompts.intelligence(sections, parsed);
  const ai = await aiJson("resume_intelligence", p.system, p.user, intelligenceSchema, 12000, { timeoutMs: AI_TIMEOUT });

  // Achievements/certifications the first parse found but the chunker missed still become chunks.
  const titles = new Set(ai.chunks.map((c) => normalize(c.title)));
  const extra = [
    ...parsed.achievements.map((t) => ({ type: "ACHIEVEMENT" as const, t })),
    ...parsed.certifications.map((t) => ({ type: "CERTIFICATION" as const, t })),
  ].filter(({ t }) => !titles.has(normalize(t)));

  // Skill chunks are computed: each skill with the projects/jobs that evidence it.
  const work = ai.chunks.filter((c) => c.type === "PROJECT" || c.type === "EXPERIENCE");
  const skillNames = new Map<string, string>();
  for (const s of [...resumeSkills(parsed), ...work.flatMap((c) => c.technologies)]) {
    const key = canonicalSkill(s);
    if (key && !skillNames.has(key)) skillNames.set(key, s.trim());
  }
  const skillChunks = [...skillNames.entries()].slice(0, 40).map(([key, label]) => {
    const evidence = work
      .filter((c) => c.technologies.some((t) => canonicalSkill(t) === key) || ` ${normalize(`${c.summary} ${c.contribution ?? ""}`)} `.includes(` ${normalize(label)} `))
      .map((c) => c.title);
    return { label, evidence };
  });

  return prisma.$transaction(async (tx) => {
    await tx.resumeClaim.deleteMany({ where: { resumeId } });
    await tx.resumeChunk.deleteMany({ where: { resumeId } });
    const byRef = new Map<string, string>();
    let order = 0;
    for (const c of ai.chunks) {
      const section = sections[c.section] ?? sections[0];
      const created = await tx.resumeChunk.create({
        data: {
          resumeId,
          order: order++,
          type: c.type,
          section: section.heading,
          title: c.title,
          text: c.summary || c.title,
          technologies: c.technologies,
          risk: c.risk,
          meta:
            c.type === "PROJECT" || c.type === "EXPERIENCE"
              ? { problem: c.problem ?? null, architecture: c.architecture ?? null, features: c.features, contribution: c.contribution ?? null, complexity: c.complexity }
              : undefined,
        },
      });
      byRef.set(c.ref.toLowerCase(), created.id);
    }
    for (const e of extra) {
      await tx.resumeChunk.create({ data: { resumeId, order: order++, type: e.type, section: e.type === "ACHIEVEMENT" ? "Achievements" : "Certifications", title: e.t, text: e.t, risk: "MEDIUM" } });
    }
    for (const s of skillChunks) {
      await tx.resumeChunk.create({
        data: { resumeId, order: order++, type: "SKILL", section: "Skills", title: s.label, text: s.evidence.length ? `Used in: ${s.evidence.join(", ")}` : "Listed on resume", technologies: [s.label], risk: s.evidence.length ? "MEDIUM" : "HIGH", meta: { evidence: s.evidence } },
      });
    }
    // Claims are only kept when their evidence is really in the resume text.
    const claims = ai.claims.filter((c) => evidenceInResume(c.evidence, resume.text));
    for (const c of claims) {
      await tx.resumeClaim.create({
        data: {
          resumeId,
          chunkId: c.chunkRef ? byRef.get(c.chunkRef.toLowerCase()) ?? null : null,
          claim: c.claim,
          evidence: verbatimEvidence(c.evidence, resume.text) || c.evidence,
          skills: c.skills,
          confidence: c.confidence,
          risk: c.risk,
          depth: c.depth,
        },
      });
    }
    const updated = await tx.careerResume.update({ where: { id: resumeId }, data: { analyzedAt: new Date() } });
    const [chunks, savedClaims] = await Promise.all([
      tx.resumeChunk.findMany({ where: { resumeId }, orderBy: { order: "asc" } }),
      tx.resumeClaim.findMany({ where: { resumeId }, orderBy: { id: "asc" } }),
    ]);
    return { resume: updated, parsed, chunks, claims: savedClaims };
  }, { timeout: 30_000 });
}
