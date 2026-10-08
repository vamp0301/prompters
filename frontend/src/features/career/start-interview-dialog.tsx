"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mic } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { Dialog } from "@/components/ui/misc";
import { ApiError, api } from "@/lib/api/client";
import type { Interviewer, StartInterviewResponse } from "@/lib/api/types";
import { careerKeys, InlineError } from "./shared";
import { useCodeExecution } from "@/features/auth/use-me";

const FALLBACK: Interviewer = { name: "Manisha", role: "Senior Technical Interviewer", company: "Prompters", tone: "Professional, calm, neutral, technical", thinkingSeconds: 30, answerSeconds: 120, codingSeconds: 900 };

/** Where the questions come from: a job-match analysis, or the resume + a target role. */
export type InterviewSource = { matchId: string } | { resumeId: string; targetRole: string; roleLabel: string };

export function StartInterviewDialog({ open, onClose, source, interviewer }: { open: boolean; onClose: () => void; source: InterviewSource; interviewer?: Interviewer }) {
  return (
    <Dialog open={open} onClose={onClose} title="Start AI Technical Interview" className="max-w-xl">
      {/* Mounted only while open, so the form state starts fresh each time. */}
      <StartForm source={source} interviewer={interviewer ?? FALLBACK} onCancel={onClose} />
    </Dialog>
  );
}

function StartForm({ source, interviewer, onCancel }: { source: InterviewSource; interviewer: Interviewer; onCancel: () => void }) {
  const uid = useId();
  const router = useRouter();
  const qc = useQueryClient();
  const codingOn = useCodeExecution();
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState<"STANDARD" | "HARD">("STANDARD");
  const [analysis, setAnalysis] = useState(false);
  const [integrity, setIntegrity] = useState(false);
  const [preparationOnly, setPreparationOnly] = useState(false);

  const start = useMutation({
    meta: { silent: true },
    mutationFn: () =>
      api.post<StartInterviewResponse>("/career/sessions", {
        ...("matchId" in source ? { matchId: source.matchId } : { resumeId: source.resumeId, targetRole: source.targetRole }),
        difficulty,
        durationMinutes: duration,
        // Audio recording is asked separately inside the interview, before the first voice answer.
        consent: { analysis, integrity, preparationOnly },
      }),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: careerKeys.sessions });
      if ("matchId" in source) qc.invalidateQueries({ queryKey: careerKeys.analysis(source.matchId) });
      router.push(`/career/live/${s.id}`);
    },
  });

  const err = start.error;
  const inProgressId =
    err instanceof ApiError && err.code === "INTERVIEW_IN_PROGRESS" && err.details && typeof err.details === "object" && "sessionId" in err.details
      ? String((err.details as { sessionId: unknown }).sessionId)
      : null;
  const allConsent = analysis && integrity && preparationOnly;
  const answerMin = Math.round(interviewer.answerSeconds / 60);

  return (
    <form
      className="space-y-5 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (allConsent) start.mutate();
      }}
    >
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2/50 p-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent" aria-hidden>
          {interviewer.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="font-medium">
            {interviewer.name} <span className="text-muted">· {interviewer.role}</span>
          </div>
          <div className="text-xs text-muted">
            {"matchId" in source ? "Questions from your resume and this job description" : `${source.roleLabel} interview, built from your resume`} · calm, professional
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Duration" htmlFor={`${uid}-dur`} hint={`About ${({ 15: 8, 30: 14, 45: 20 } as Record<number, number>)[duration]} questions, including follow-ups.`}>
          <Select id={`${uid}-dur`} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {[15, 30, 45].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Difficulty" htmlFor={`${uid}-diff`} hint={difficulty === "HARD" ? "Starts deeper; expect more scenario and design questions." : "Starts practical, then adapts to your answers."}>
          <Select id={`${uid}-diff`} value={difficulty} onChange={(e) => setDifficulty(e.target.value as "STANDARD" | "HARD")}>
            <option value="STANDARD">Standard</option>
            <option value="HARD">Hard</option>
          </Select>
        </Field>
      </div>

      <div>
        <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">What to expect</h3>
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
          <li>
            <span className="font-medium text-text">The interview is conducted strictly in English.</span> Manisha asks in English and you answer in English.
          </li>
          <li>
            <span className="font-mono">{interviewer.thinkingSeconds}s</span> thinking time, then about <span className="font-mono">{answerMin} min</span> to answer each question.
          </li>
          <li>One question at a time, with follow-ups based on what you actually say. Manisha won&apos;t give hints or answers during the interview — feedback comes in the report.</li>
          <li>{codingOn ? "Problem-solving questions use a code editor with tests." : "Problem-solving questions ask you to explain your approach, pseudocode and complexity — no code is run."}</li>
          <li>You can pause and continue later (within a day). If Manisha can&apos;t process an answer, it&apos;s saved and you can retry.</li>
          <li>Screen sharing is required. If it stops 3 times, the interview ends.</li>
          <li>Tab switches, fullscreen exits and clipboard actions are logged as integrity signals.</li>
          <li>Eye contact is not tracked or scored.</li>
        </ul>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">Consent (required)</legend>
        <Check checked={analysis} onChange={setAnalysis} label="I consent to AI analysis of my answers in this interview." />
        <Check checked={integrity} onChange={setIntegrity} label="I understand that integrity signals may be recorded." />
        <Check checked={preparationOnly} onChange={setPreparationOnly} label="I understand that the technical-readiness report is a preparation assessment and not an automated hiring decision." />
      </fieldset>

      <p className="rounded-lg border border-border bg-surface-2/50 p-3 text-xs text-muted">
        <span className="block text-sm text-text">Voice is optional</span>
        You can answer by voice or type every answer. Before your first voice answer, Manisha asks whether your answer audio may be recorded — you can continue without recording. Recordings are deleted after 30 days.
      </p>

      {inProgressId ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-xs text-warn">
          You already have an interview in progress.
          <Link href={`/career/live/${inProgressId}`} className={buttonClass("secondary", "sm")}>
            Resume interview
          </Link>
        </div>
      ) : (
        <InlineError error={err} />
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!allConsent} loading={start.isPending}>
          <Mic className="size-4" aria-hidden /> Start interview
        </Button>
      </div>
      {!allConsent && <p className="text-right text-xs text-subtle">Tick all three consent statements to start.</p>}
    </form>
  );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input type="checkbox" required checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--accent)]" />
      <span>{label}</span>
    </label>
  );
}
