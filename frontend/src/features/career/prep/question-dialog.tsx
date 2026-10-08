"use client";
import { useCallback, useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Lightbulb, Mic, MicOff, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { Dialog, Skeleton, ErrorState } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { PrepPracticeResult, PrepPracticeStatus, PrepQuestionDetail } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import { useDictation } from "../live/use-voice";
import { careerKeys, InlineError, scoreTone } from "../shared";
import { QuestionBadges } from "./prep-shared";

const VERDICT: Record<string, { label: string; tone: "accent" | "warn" | "danger" | "neutral" }> = {
  CORRECT: { label: "Solid answer", tone: "accent" },
  PARTIAL: { label: "Partly there", tone: "warn" },
  INCORRECT: { label: "Needs work", tone: "danger" },
  NO_ANSWER: { label: "No real answer", tone: "neutral" },
};

export function QuestionDialog({ planId, questionId, list, onNavigate, onClose }: { planId: string; questionId: string; list: string[]; onNavigate: (id: string) => void; onClose: () => void }) {
  const i = list.indexOf(questionId);
  const prev = i > 0 ? list[i - 1] : null;
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
  return (
    <Dialog open onClose={onClose} title="Interview question" className="max-w-2xl">
      {/* Keyed so practice state resets per question. */}
      <QuestionBody key={questionId} planId={planId} questionId={questionId} />
      <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
        <Button variant="ghost" size="sm" disabled={!prev} onClick={() => prev && onNavigate(prev)}>
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </Button>
        <span className="font-mono text-xs text-subtle tabular-nums">{i >= 0 ? `${i + 1} / ${list.length}` : ""}</span>
        <Button variant="ghost" size="sm" disabled={!next} onClick={() => next && onNavigate(next)}>
          Next <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </Dialog>
  );
}

function QuestionBody({ planId, questionId }: { planId: string; questionId: string }) {
  const uid = useId();
  const qc = useQueryClient();
  const detail = useQuery({ queryKey: careerKeys.prepQuestion(planId, questionId), queryFn: () => api.get<PrepQuestionDetail>(`/career/prep/${planId}/questions/${questionId}`) });
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showKeyPoints, setShowKeyPoints] = useState(false);
  const [result, setResult] = useState<PrepPracticeResult | null>(null);
  const append = useCallback((t: string) => setAnswer((a) => (a ? `${a} ${t}` : t)), []);
  // Practice mirrors the interview: English only.
  const dictation = useDictation(append);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: careerKeys.prepQuestions(planId) });
    qc.invalidateQueries({ queryKey: careerKeys.prepQuestion(planId, questionId) });
    qc.invalidateQueries({ queryKey: careerKeys.prepPlan(planId) });
  };
  const submit = useMutation({
    meta: { silent: true },
    mutationFn: () => api.post<PrepPracticeResult>(`/career/prep/${planId}/questions/${questionId}/attempts`, { answer: [answer, dictation.interim].filter(Boolean).join(" ").trim() }),
    onSuccess: (r) => {
      void dictation.stop();
      setResult(r);
      setShowKeyPoints(true);
      refresh();
    },
  });
  const mark = useMutation({
    mutationFn: (status: PrepPracticeStatus) => api.patch(`/career/prep/${planId}/questions/${questionId}`, { status }),
    onSuccess: refresh,
  });

  if (detail.isLoading) return <Skeleton className="h-64" />;
  if (detail.error) return <ErrorState error={detail.error} retry={() => detail.refetch()} />;
  const q = detail.data!;
  const e = result?.attempt.evaluation;

  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-subtle">#{q.rank}</span>
          <QuestionBadges q={q} />
        </div>
        <p className="text-base font-semibold leading-snug">{q.question}</p>
      </div>

      <section aria-label="Why this question" className="space-y-2 rounded-lg border border-border bg-surface-2/40 p-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">Why you&apos;ll be asked this</h3>
        <p>{q.why}</p>
        {q.evidence && (
          <p className="flex gap-2 text-muted">
            <Quote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              <span className="text-xs text-subtle">From your resume: </span>“{q.evidence}”
            </span>
          </p>
        )}
        <p className="text-xs text-subtle">
          Source: {q.source.claim ? `Resume claim — ${q.source.claim.claim}` : q.source.chunk ? `${q.source.chunk.title}` : q.sourceLabel} · An interviewer could drill {q.followUpDepth} level{q.followUpDepth === 1 ? "" : "s"} deep.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => setShowHint((s) => !s)} aria-expanded={showHint}>
          <Lightbulb className="size-3.5" aria-hidden /> {showHint ? "Hide hint" : "Show hint"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowKeyPoints((s) => !s)} aria-expanded={showKeyPoints}>
          {showKeyPoints ? "Hide key points" : "Reveal key points"}
        </Button>
      </div>
      {showHint && <p className="rounded-lg border border-info/30 bg-info-soft px-3 py-2 text-info">{q.hint}</p>}
      {showKeyPoints && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted">A strong answer covers</h3>
          <ul className="list-disc space-y-1 pl-5">
            {q.keyPoints.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
          {q.followUps.length > 0 && (
            <>
              <h3 className="pt-1 text-xs font-medium uppercase tracking-wider text-muted">Likely follow-ups</h3>
              <ul className="list-disc space-y-1 pl-5 text-muted">
                {q.followUps.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <section aria-label="Practise" className="space-y-2 border-t border-border pt-4">
        <Field label="Practise your answer (in English)" htmlFor={`${uid}-a`} hint="Answer as you would in the interview. You'll get feedback like Manisha would give.">
          <Textarea
            id={`${uid}-a`}
            value={dictation.interim ? `${answer} ${dictation.interim}`.trim() : answer}
            onChange={(ev) => setAnswer(ev.target.value)}
            className="min-h-32"
            maxLength={6000}
            placeholder={dictation.supported ? "Type, or press Speak and answer out loud…" : "Type your answer…"}
            disabled={submit.isPending}
          />
        </Field>
        {dictation.error && (
          <p className="text-xs text-warn">
            {dictation.error === "mic-denied"
              ? "Microphone permission is blocked — allow it from the site settings next to the address bar, or type your answer."
              : dictation.error === "no-microphone"
                ? "No microphone found — you can type your answer."
                : "Voice input stopped working — you can type your answer."}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => submit.mutate()} loading={submit.isPending} disabled={answer.trim().length < 10}>
            Get feedback
          </Button>
          {dictation.supported && (
            <Button variant="secondary" onClick={() => (dictation.listening ? void dictation.stop() : dictation.start())} aria-pressed={dictation.listening} disabled={submit.isPending}>
              {dictation.listening ? <MicOff className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />}
              {dictation.listening ? "Stop" : "Speak"}
            </Button>
          )}
          <span className="ml-auto flex gap-1">
            {q.status !== "CONFIDENT" ? (
              <Button variant="ghost" size="sm" onClick={() => mark.mutate("CONFIDENT")} loading={mark.isPending}>
                Mark as confident
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => mark.mutate("PRACTICED")} loading={mark.isPending}>
                Not confident yet
              </Button>
            )}
          </span>
        </div>
        <InlineError error={submit.error} />
      </section>

      {result && e && (
        <section aria-label="Feedback" aria-live="polite" className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-semibold tabular-nums">{result.attempt.score}</span>
            <div className="flex-1">
              <Progress value={result.attempt.score} tone={scoreTone(result.attempt.score)} label={`Score ${result.attempt.score}`} />
            </div>
            <Badge tone={VERDICT[e.verdict]?.tone ?? "neutral"}>{VERDICT[e.verdict]?.label ?? e.verdict}</Badge>
          </div>
          <dl className="grid grid-cols-5 gap-2 text-center text-xs">
            {(["correctness", "completeness", "understanding", "practical", "communication"] as const).map((k) => (
              <div key={k} className="rounded-md bg-surface-2/60 p-1.5">
                <dt className="truncate text-subtle capitalize">{k}</dt>
                <dd className="font-mono font-semibold tabular-nums">{e[k]}/10</dd>
              </div>
            ))}
          </dl>
          {e.missingConcepts.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted">Missing</h4>
              <div className="flex flex-wrap gap-1">
                {e.missingConcepts.map((m) => (
                  <Badge key={m} tone="warn">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {e.unsupportedClaims.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted">Check these statements</h4>
              <ul className="list-disc pl-5 text-xs text-danger">
                {e.unsupportedClaims.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {e.followUp?.needed && e.followUp.question && (
            <p className="text-xs text-muted">
              <span className="font-medium text-text">Manisha might follow up with:</span> {e.followUp.question}
            </p>
          )}
        </section>
      )}

      {q.attempts.length > 0 && (
        <details className="text-xs text-muted">
          <summary className="cursor-pointer select-none">Previous attempts ({q.attempts.length})</summary>
          <ul className="mt-2 space-y-1">
            {q.attempts.map((a) => (
              <li key={a.id} className="flex justify-between gap-3">
                <span className="truncate">{a.answer}</span>
                <span className="shrink-0 font-mono tabular-nums">
                  {a.score} · {formatDate(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
