import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { extractText, getDocumentProxy } from "unpdf";
import { aiJson } from "../../ai/json.js";
import { fileStorageEnabled } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { storage } from "../../lib/storage.js";
import { badRequest, notFound } from "../../utils/errors.js";
import { logEvent } from "../platform/events.js";
import { prompts, sanitizeQuestions } from "./prompts.js";
import { jobParsedSchema, matchSchema, resumeParsedSchema, type MatchAI } from "./schemas.js";

export const MATCH_WEIGHTS: Record<keyof MatchAI["breakdown"], number> = {
  requiredSkills: 25,
  technicalStack: 20,
  experience: 15,
  projects: 15,
  keywords: 10,
  responsibilities: 10,
  education: 5,
};

/** Overall job-match score is computed by code from the category scores, so it is consistent and explainable. */
export function weightedMatchScore(b: MatchAI["breakdown"]) {
  const total = Object.values(MATCH_WEIGHTS).reduce((a, w) => a + w, 0);
  const sum = (Object.keys(MATCH_WEIGHTS) as (keyof typeof MATCH_WEIGHTS)[]).reduce((a, k) => a + b[k] * MATCH_WEIGHTS[k], 0);
  return Math.round(sum / total);
}

const MAX_UPLOAD = 5 * 1024 * 1024;

/**
 * Postgres text can't hold NUL (0x00) — some PDFs (Word/Canva exports) yield it from text extraction and the
 * insert failed with a 500. Other invisible control characters go too; tabs and newlines stay.
 */
// eslint-disable-next-line no-control-regex
export const stripControlChars = (text: string) => text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

export async function documentText(input: { text?: string; fileBase64?: string; mimeType?: string }) {
  if (input.text?.trim()) return { text: stripControlChars(input.text).trim(), file: null };
  if (!input.fileBase64) throw badRequest("Upload a PDF or paste the text.");
  const file = Buffer.from(input.fileBase64, "base64");
  if (file.length > MAX_UPLOAD) throw badRequest("File is larger than 5 MB.");
  if (input.mimeType === "application/pdf" || file.subarray(0, 5).toString() === "%PDF-") {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(file));
      const { text } = await extractText(pdf, { mergePages: true });
      const clean = stripControlChars(text).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
      if (clean.length < 80) throw new Error("too short");
      return { text: clean, file };
    } catch {
      throw badRequest("Couldn't read text from this PDF (it may be a scanned image). Paste the text instead.");
    }
  }
  if (input.mimeType?.startsWith("text/")) return { text: stripControlChars(file.toString("utf8")).trim(), file };
  throw badRequest("Upload a PDF or a .txt file, or paste the text.");
}

export async function createResume(userId: string, input: { label?: string; fileName?: string; text?: string; fileBase64?: string; mimeType?: string }) {
  const { text, file } = await documentText(input);
  if (text.length < 150) throw badRequest("This resume looks too short to analyse.");
  const p = prompts.parseResume(text);
  const parsed = await aiJson("parse_resume", p.system, p.user, resumeParsedSchema, 4000, { fast: true });
  let storageKey: string | null = null;
  // Without file storage only the original file is dropped: the extracted text and the analysis are saved as usual.
  if (file && fileStorageEnabled()) {
    storageKey = `resumes/${userId}/${randomUUID()}.${input.mimeType === "application/pdf" ? "pdf" : "txt"}`;
    await storage().put(storageKey, file, input.mimeType ?? "application/octet-stream");
  }
  return prisma.careerResume.create({
    data: {
      userId,
      label: input.label?.trim() || input.fileName || parsed.headline || "My resume",
      fileName: input.fileName,
      storageKey,
      text,
      parsed: parsed as Prisma.InputJsonValue,
    },
  });
}

export async function createJob(userId: string, input: { title?: string; company?: string; text?: string; fileBase64?: string; mimeType?: string }) {
  const { text } = await documentText(input);
  if (text.length < 80) throw badRequest("This job description looks too short to analyse.");
  const p = prompts.parseJob(text);
  const parsed = await aiJson("parse_job", p.system, p.user, jobParsedSchema, 3000, { fast: true });
  return prisma.jobTarget.create({
    data: {
      userId,
      title: input.title?.trim() || parsed.title || "Target role",
      company: input.company?.trim() || parsed.company || null,
      text,
      parsed: parsed as Prisma.InputJsonValue,
    },
  });
}

export async function analyse(userId: string, resumeId: string, jobId: string) {
  const [resume, job] = await Promise.all([
    prisma.careerResume.findFirst({ where: { id: resumeId, userId } }),
    prisma.jobTarget.findFirst({ where: { id: jobId, userId } }),
  ]);
  if (!resume) throw notFound("Resume");
  if (!job) throw notFound("Job description");
  const p = prompts.match(resumeParsedSchema.parse(resume.parsed), jobParsedSchema.parse(job.parsed), job.title);
  const ai = await aiJson("match", p.system, p.user, matchSchema, 8000);
  const questions = sanitizeQuestions(ai.questions);
  const match = await prisma.jobMatch.create({
    data: {
      userId,
      resumeId,
      jobId,
      score: weightedMatchScore(ai.breakdown),
      breakdown: ai.breakdown,
      strong: ai.strong,
      missing: ai.missing,
      risks: ai.risks,
      claims: ai.claims,
      questions,
      model: process.env.AI_MODEL ?? process.env.AI_PROVIDER ?? null,
    },
  });
  await logEvent(userId, "career_analysis", { meta: { matchId: match.id, score: match.score, job: job.title } });
  return match;
}

export async function deleteResume(userId: string, id: string) {
  const resume = await prisma.careerResume.findFirst({ where: { id, userId } });
  if (!resume) throw notFound("Resume");
  if (resume.storageKey) await storage().delete(resume.storageKey).catch(() => undefined);
  await prisma.careerResume.delete({ where: { id } });
}
