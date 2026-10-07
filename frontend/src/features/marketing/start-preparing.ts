import { api } from "@/lib/api/client";

export const TARGET_ROLES = [
  { key: "backend", label: "Backend" },
  { key: "frontend", label: "Frontend" },
  { key: "fullstack", label: "Full Stack" },
  { key: "sde", label: "Software Engineer" },
  { key: "data_analyst", label: "Data Analyst" },
  { key: "devops", label: "DevOps" },
  { key: "ml_engineer", label: "ML Engineer" },
] as const;

/**
 * Uploads a resume and starts (or reuses) its Top-100 plan through the existing career API.
 * Shared by the landing-page card (logged in) and the post-sign-up handoff.
 */
export async function startPreparing(doc: { base64: string; mimeType: string; name: string }, targetRole: string) {
  const resume = await api.post<{ id: string }>("/career/resumes", { fileBase64: doc.base64, mimeType: doc.mimeType, fileName: doc.name });
  const plan = await api.post<{ id: string }>("/career/prep", { resumeId: resume.id, targetRole });
  return plan.id;
}
