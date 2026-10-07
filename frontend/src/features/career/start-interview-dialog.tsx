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

const FALLBACK: Interviewer = { name: "Manisha", role: "Senior Technical Interviewer", company: "Prompters", tone: "Professional, calm, neutral, technical", thinkingSeconds: 30, answerSeconds: 120, codingSeconds: 900 };

export function StartInterviewDialog({ open, onClose, matchId, interviewer }: { open: boolean; onClose: () => void; matchId: string; interviewer?: Interviewer }) {
  return (
    <Dialog open={open} onClose={onClose} title="Start AI Technical Interview" className="max-w-xl">
      {/* Mounted only while open, so the form state starts fresh each time. */}
      <StartForm matchId={matchId} interviewer={interviewer ?? FALLBACK} onCancel={onClose} />
    </Dialog>
  );
}

function StartForm({ matchId, interviewer, onCancel }: { matchId: string; interviewer: Interviewer; onCancel: () => void }) {
  const uid = useId();
  const router = useRouter();
  const qc = useQueryClient();
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState(15);
  const [recording, setRecording] = useState(false);
  const [integrity, setIntegrity] = useState(false);
  const [preparationOnly, setPreparationOnly] = useState(false);
  const [storeAudio, setStoreAudio] = useState(true);

  const start = useMutation({
    meta: { silent: true },
    mutationFn: () =>
      api.post<StartInterviewResponse>("/career/sessions", {
        matchId,
        durationMinutes: duration,
        questionTarget: questions,
        consent: { recording, integrity, preparationOnly, storeAudio },
      }),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: careerKeys.sessions });
      qc.invalidateQueries({ queryKey: careerKeys.analysis(matchId) });
      router.push(`/career/live/${s.id}`);
    },
  });

  const err = start.error;
  const inProgressId =
    err instanceof ApiError && err.code === "INTERVIEW_IN_PROGRESS" && err.details && typeof err.details === "object" && "sessionId" in err.details
      ? String((err.details as { sessionId: unknown }).sessionId)
      : null;
  const allConsent = recording && integrity && preparationOnly;
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
          <div className="text-xs text-muted">Company simulation: {interviewer.company} · calm, professional</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Duration" htmlFor={`${uid}-dur`}>
          <Select id={`${uid}-dur`} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {[20, 30, 45].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Questions" htmlFor={`${uid}-q`}>
          <Select id={`${uid}-q`} value={questions} onChange={(e) => setQuestions(Number(e.target.value))}>
            {[10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n} questions
              </option>
            ))}
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
          <li>Up to 2 coding questions, plus follow-ups based on what you say.</li>
          <li>Screen sharing is required. If it stops 3 times, the interview ends.</li>
          <li>Tab switches, fullscreen exits and clipboard actions are logged as integrity signals.</li>
          <li>Eye contact is not tracked or scored.</li>
        </ul>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">Consent (required)</legend>
        <Check checked={recording} onChange={setRecording} label="I consent to recording and AI analysis of this interview." />
        <Check checked={integrity} onChange={setIntegrity} label="I understand that integrity signals may be recorded." />
        <Check checked={preparationOnly} onChange={setPreparationOnly} label="I understand that the technical-readiness report is a preparation assessment and not an automated hiring decision." />
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
        <input type="checkbox" role="switch" checked={storeAudio} onChange={(e) => setStoreAudio(e.target.checked)} className="mt-0.5 size-4 accent-[var(--accent)]" />
        <span className="text-xs text-muted">
          <span className="block text-sm text-text">Save my answer audio so I can replay it</span>
          Deleted automatically after 30 days; you can delete it any time.
        </span>
      </label>

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
