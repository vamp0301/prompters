"use client";
import { useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/misc";
import { ApiError } from "@/lib/api/client";
import type { InterviewStatus, QuestionCategory, RiskLevel } from "@/lib/api/types";

export const careerKeys = {
  status: ["career", "status"] as const,
  resumes: ["career", "resumes"] as const,
  jobs: ["career", "jobs"] as const,
  analyses: ["career", "analyses"] as const,
  analysis: (id: string) => ["career", "analysis", id] as const,
  sessions: ["career", "sessions"] as const,
  session: (id: string) => ["career", "session", id] as const,
  prepMeta: ["career", "prep", "meta"] as const,
  prepPlans: ["career", "prep", "plans"] as const,
  prepUsage: ["career", "prep", "usage"] as const,
  prepPlan: (id: string) => ["career", "prep", "plan", id] as const,
  prepQuestions: (id: string) => ["career", "prep", "questions", id] as const,
  prepQuestion: (planId: string, id: string) => ["career", "prep", "question", planId, id] as const,
};

export const AI_UNAVAILABLE_COPY = "AI analysis isn't configured yet — an admin needs to add a Gemini API key.";

/** Friendly, inline copy for errors from the career endpoints (AI calls fail in their own specific ways). */
export function friendlyError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === "AI_UNAVAILABLE") return AI_UNAVAILABLE_COPY;
    if (e.code === "PREP_DAILY_LIMIT") return e.message;
    if (e.code === "AI_BAD_OUTPUT") return "The AI returned something we couldn't use. Please try again — it usually works on the second attempt.";
    if (e.status === 429) return "You're going a little fast. Wait a minute, then try again.";
    return e.message;
  }
  return e instanceof Error ? e.message : "Something went wrong. Please try again.";
}

export function InlineError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{friendlyError(error)}</span>
    </p>
  );
}

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export interface PickedFile {
  name: string;
  mimeType: string;
  base64: string;
  size: number;
}

/** Validates a PDF/TXT ≤ 5 MB and reads it as base64 (without the data: prefix). */
export function readDocument(file: File): Promise<PickedFile> {
  const lower = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");
  const isTxt = file.type === "text/plain" || lower.endsWith(".txt");
  if (!isPdf && !isTxt) return Promise.reject(new Error("Only PDF or .txt files are supported."));
  if (file.size > MAX_FILE_BYTES) return Promise.reject(new Error("That file is larger than 5 MB."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const url = String(reader.result ?? "");
      resolve({ name: file.name, mimeType: isPdf ? "application/pdf" : "text/plain", base64: url.slice(url.indexOf(",") + 1), size: file.size });
    };
    reader.readAsDataURL(file);
  });
}

export const LEVEL_LABEL: Record<number, string> = {
  1: "L1 Fundamental",
  2: "L2 Practical",
  3: "L3 Deep technical",
  4: "L4 Scenario",
  5: "L5 Architecture",
};

export const CATEGORY_ORDER: QuestionCategory[] = ["IMPORTANT", "GOOD", "BETTER", "MAY_BE_ASKED", "CONCEPTUAL"];
export const CATEGORY: Record<QuestionCategory, { label: string; tone: "danger" | "accent" | "info" | "warn" | "neutral" }> = {
  IMPORTANT: { label: "🔥 High probability", tone: "danger" },
  GOOD: { label: "🟢 Good to know", tone: "accent" },
  BETTER: { label: "Deeper", tone: "neutral" },
  MAY_BE_ASKED: { label: "🟡 Possible follow-up", tone: "warn" },
  CONCEPTUAL: { label: "🔵 Conceptual", tone: "info" },
};

export const RISK: Record<RiskLevel, { label: string; tone: "danger" | "warn" | "accent" }> = {
  HIGH: { label: "🔴 HIGH", tone: "danger" },
  MEDIUM: { label: "🟡 MEDIUM", tone: "warn" },
  LOW: { label: "🟢 LOW", tone: "accent" },
};

export const SEVERITY_TONE: Record<RiskLevel, "danger" | "warn" | "info"> = { HIGH: "danger", MEDIUM: "warn", LOW: "info" };

export const RESULT: Record<string, { label: string; tone: "accent" | "warn" | "danger"; emoji: string; copy: string }> = {
  INTERVIEW_READY: { label: "Interview Ready", tone: "accent", emoji: "🟢", copy: "Your current technical performance indicates strong readiness for this role's technical interview." },
  NEEDS_IMPROVEMENT: { label: "Needs Improvement", tone: "warn", emoji: "🟡", copy: "You understand the fundamentals, but deeper questions need practice." },
  NOT_YET_READY: { label: "Not Yet Ready", tone: "danger", emoji: "🔴", copy: "Your fundamentals need more practice before attempting this level of technical interview." },
};

export function ResultBadge({ result, status }: { result: string | null; status: InterviewStatus }) {
  const r = result ? RESULT[result] : undefined;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {r && <Badge tone={r.tone}>{r.label}</Badge>}
      {status === "ENDED_INTEGRITY" && <Badge tone="danger">Ended early</Badge>}
      {status === "ABANDONED" && <Badge>Abandoned</Badge>}
    </span>
  );
}

export const LANGUAGE_LABEL: Record<string, string> = { hinglish: "Hinglish", en: "English", hi: "Hindi" };

export const scoreTone = (s: number) => (s >= 75 ? "accent" : s >= 55 ? "warn" : "danger") as "accent" | "warn" | "danger";

/** A button that asks for confirmation in an accessible dialog before running `onConfirm`. */
export function ConfirmButton({
  label,
  title,
  body,
  confirmLabel = "Delete",
  onConfirm,
  loading,
  variant = "ghost",
  size = "sm",
  icon,
  ariaLabel,
  disabled,
}: {
  label: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void | Promise<unknown>;
  loading?: boolean;
  variant?: "ghost" | "danger" | "secondary" | "outline";
  size?: "sm" | "md";
  icon?: ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)} aria-label={ariaLabel} disabled={disabled} loading={loading}>
        {icon}
        {label}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title}>
        <div className="space-y-4 text-sm text-muted">
          {body}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                setOpen(false);
                await onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
