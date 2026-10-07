"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Info, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-editor";
import { Markdown } from "@/components/ui/markdown";
import { ErrorState, PageHeader, PageSkeleton, Stat } from "@/components/ui/misc";
import { Progress, ScoreRing } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { InterviewReport, InterviewSessionView, InterviewTurnResult } from "@/lib/api/types";
import { cn, formatDate } from "@/lib/utils";
import { CATEGORY, ConfirmButton, InlineError, LANGUAGE_LABEL, LEVEL_LABEL, RESULT, careerKeys, scoreTone } from "./shared";

const SIGNAL_LABEL: Record<string, string> = {
  TAB_HIDDEN: "Tab switches",
  WINDOW_BLUR: "Window lost focus",
  FULLSCREEN_EXIT: "Fullscreen exits",
  SCREEN_SHARE_STOPPED: "Screen-share interruptions",
  SCREEN_SHARE_RESUMED: "Screen-share resumed",
  MIC_DISCONNECTED: "Microphone disconnected",
  CAMERA_DISCONNECTED: "Camera disconnected",
  COPY: "Clipboard actions (copy)",
  PASTE: "Clipboard actions (paste)",
  CUT: "Clipboard actions (cut)",
  LARGE_PASTE: "Large paste",
};

const VERDICT: Record<string, { label: string; tone: "accent" | "warn" | "danger" | "neutral" }> = {
  CORRECT: { label: "Correct", tone: "accent" },
  PARTIAL: { label: "Partially correct", tone: "warn" },
  INCORRECT: { label: "Incorrect", tone: "danger" },
  NO_ANSWER: { label: "No answer", tone: "neutral" },
  SKIPPED: { label: "Skipped", tone: "neutral" },
};

function verdictOf(t: InterviewTurnResult) {
  if (t.skipped) return "SKIPPED";
  if (t.kind === "CODING") {
    const r = t.codeResult;
    return !r?.total ? "INCORRECT" : r.passed === r.total ? "CORRECT" : r.passed > 0 ? "PARTIAL" : "INCORRECT";
  }
  return t.evaluation?.verdict ?? "INCORRECT";
}

export function ReportView({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, error, isLoading, refetch } = useQuery({ queryKey: careerKeys.session(id), queryFn: () => api.get<InterviewSessionView>(`/career/sessions/${id}`) });

  const delRecordings = useMutation({
    meta: { silent: true },
    mutationFn: () => api.delete<{ deleted: number }>(`/career/sessions/${id}/recordings`),
    onSuccess: () => qc.invalidateQueries({ queryKey: careerKeys.session(id) }),
  });
  const delSession = useMutation({
    meta: { silent: true },
    mutationFn: () => api.delete(`/career/sessions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["career"] });
      router.push("/career");
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const s = data!;

  const back = (
    <Link href="/career" className="inline-flex items-center gap-1 text-xs text-muted hover:text-text">
      <ArrowLeft className="size-3.5" aria-hidden /> Career AI
    </Link>
  );

  if (s.status === "IN_PROGRESS") {
    return (
      <div className="space-y-6">
        {back}
        <PageHeader eyebrow="Technical interview" title="Interview in progress" description={`${s.job.title} · ${s.progress.answered}/${s.progress.target} answered. The report is ready once the interview ends.`} />
        <Link href={`/career/live/${s.id}`} className={buttonClass("primary", "md")}>
          Return to the interview <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const report = s.report;
  const hasAudio = s.turns.some((t) => t.hasAudio);

  return (
    <div className="space-y-6">
      {back}
      <PageHeader
        eyebrow="Technical Readiness Report"
        title={s.job.title}
        description={`${s.job.company ? `${s.job.company} · ` : ""}${formatDate(s.startedAt)} · ${LANGUAGE_LABEL[s.language] ?? s.language} · with ${s.interviewer.name}`}
        actions={
          <Link href={`/career/analysis/${s.matchId}`} className={buttonClass("secondary", "md")}>
            <RotateCcw className="size-4" aria-hidden /> Retake interview
          </Link>
        }
      />

      {s.status === "ENDED_INTEGRITY" && (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          The interview ended early because the required environment (screen sharing) wasn&apos;t maintained. The report covers the questions answered before it ended.
        </div>
      )}

      {report ? <ReportBody report={report} /> : <p className="text-sm text-muted">No report was generated for this interview.</p>}

      {s.turns.length > 0 && (
        <section aria-labelledby="review-h" className="space-y-3">
          <h2 id="review-h" className="text-sm font-semibold">Question-by-question review</h2>
          <div className="space-y-2">
            {s.turns.map((t, i) => (
              <TurnReview key={t.id} sessionId={s.id} turn={t} index={i} />
            ))}
          </div>
        </section>
      )}

      <Card>
        <CardHeader title="Your data" description="Answer recordings are deleted automatically after 30 days. Transcripts and scores stay until you delete the interview." />
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <ConfirmButton
              variant="secondary"
              label="Delete recordings"
              icon={<Trash2 className="size-3.5" aria-hidden />}
              title="Delete recordings?"
              body={<p>All saved answer audio for this interview will be deleted. Your transcript, scores and report stay.</p>}
              disabled={!hasAudio}
              loading={delRecordings.isPending}
              onConfirm={() => delRecordings.mutate()}
            />
            <ConfirmButton
              variant="danger"
              label="Delete this interview"
              icon={<Trash2 className="size-3.5" aria-hidden />}
              title="Delete this interview?"
              body={<p>The report, transcript, scores and any recordings will be permanently deleted. This can&apos;t be undone.</p>}
              loading={delSession.isPending}
              onConfirm={() => delSession.mutate()}
            />
          </div>
          {!hasAudio && <p className="text-xs text-subtle">No recordings are stored for this interview.</p>}
          {delRecordings.isSuccess && <p role="status" className="text-xs text-accent">Recordings deleted.</p>}
          <InlineError error={delRecordings.error ?? delSession.error} />
        </CardBody>
      </Card>

      {report && (
        <div className="flex items-start gap-2 rounded-xl border border-info/30 bg-info-soft px-4 py-3 text-sm text-info">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{report.disclaimer}</p>
        </div>
      )}

      <div className="flex justify-center">
        <Link href={`/career/analysis/${s.matchId}`} className={buttonClass("primary", "lg")}>
          <RotateCcw className="size-4" aria-hidden /> Retake interview
        </Link>
      </div>
    </div>
  );
}

function ReportBody({ report }: { report: InterviewReport }) {
  const r = RESULT[report.result.key];
  const signals = Object.entries(report.integrity.signals).filter(([k]) => k !== "SCREEN_SHARE_RESUMED");
  const clipboard = ["COPY", "PASTE", "CUT"].reduce((a, k) => a + (report.integrity.signals[k] ?? 0), 0);
  const rows = [
    ...signals.filter(([k]) => !["COPY", "PASTE", "CUT"].includes(k)).map(([k, n]) => ({ label: SIGNAL_LABEL[k] ?? k, n })),
    ...(clipboard ? [{ label: "Clipboard actions", n: clipboard }] : []),
  ].sort((a, b) => b.n - a.n);
  const integrityTone = report.integrity.status === "No signals" ? "accent" : report.integrity.status === "Minor signals" ? "warn" : "danger";

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <Card>
          <CardBody className="flex flex-col items-center gap-3 text-center">
            <ScoreRing value={report.readiness} size={180} stroke={12} label="Technical readiness" sub="readiness" />
            {r && (
              <div>
                <div className={cn("text-lg font-semibold", r.tone === "accent" ? "text-accent" : r.tone === "warn" ? "text-warn" : "text-danger")}>
                  {r.emoji} {r.label}
                </div>
                <p className="mt-1 text-sm text-muted">{r.copy}</p>
              </div>
            )}
            {report.insufficientEvidence && (
              <p className="flex items-center gap-1.5 rounded-md border border-warn/30 bg-warn-soft px-2 py-1 text-xs text-warn">
                <AlertTriangle className="size-3.5" aria-hidden /> Too few answers for a reliable score
              </p>
            )}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Correct" value={<span className="text-accent">{report.counts.correct}</span>} />
            <Stat label="Partially correct" value={<span className="text-warn">{report.counts.partial}</span>} />
            <Stat label="Incorrect" value={<span className="text-danger">{report.counts.incorrect}</span>} />
            <Stat label="Skipped" value={report.counts.skipped} />
          </div>
          <Card>
            <CardBody className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted">Communication</div>
                <div className="font-mono text-lg font-semibold tabular-nums">{report.communication !== null ? `${report.communication}/100` : "—"}</div>
              </div>
              {report.communication !== null && <Progress value={report.communication} tone={scoreTone(report.communication)} className="w-1/2" label="Communication score" />}
            </CardBody>
          </Card>
          <p className="text-xs text-subtle">
            {report.counts.total} question{report.counts.total === 1 ? "" : "s"} answered in total.
          </p>
        </div>
      </div>

      {report.areas.length > 0 && (
        <Card>
          <CardHeader title="Area breakdown" description="Average score per skill you were asked about." />
          <CardBody className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-sm">
              <caption className="sr-only">Score by skill area</caption>
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th scope="col" className="pb-2 font-medium">Skill</th>
                  <th scope="col" className="pb-2 font-medium">Score</th>
                  <th scope="col" className="pb-2 text-right font-medium">Questions</th>
                </tr>
              </thead>
              <tbody>
                {report.areas.map((a) => (
                  <tr key={a.skill} className="border-t border-border">
                    <th scope="row" className="py-2 pr-3 text-left font-normal">{a.skill}</th>
                    <td className="w-1/2 py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="w-9 font-mono text-xs tabular-nums">{a.score}%</span>
                        <Progress value={a.score} tone={scoreTone(a.score)} label={`${a.skill} ${a.score}%`} />
                      </div>
                    </td>
                    <td className="py-2 text-right font-mono text-xs text-muted tabular-nums">{a.questions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader title="You answered well" />
          <CardBody>
            {report.answeredWell.length ? (
              <ul className="space-y-1.5 text-sm">
                {report.answeredWell.map((s) => (
                  <li key={s} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No area scored 70+ yet — keep going.</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="You struggled with" />
          <CardBody>
            {report.struggled.length ? (
              <ul className="space-y-1.5 text-sm">
                {report.struggled.map((s) => (
                  <li key={s} className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No clear weak spots.</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recommended next steps" />
          <CardBody>
            <ul className="space-y-1.5 text-sm">
              {report.nextSteps.map((n) => (
                <li key={n.href + n.label}>
                  <Link href={n.href} className="group flex items-start gap-2 hover:text-accent">
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-subtle group-hover:text-accent" aria-hidden />
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Integrity signals"
          description="Integrity signals are context for review, not proof of anything."
          action={<Badge tone={integrityTone}><ShieldCheck className="size-3" aria-hidden /> {report.integrity.status}</Badge>}
        />
        <CardBody>
          {rows.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {rows.map((row) => (
                <li key={row.label} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span>{row.label}</span>
                  <span className="font-mono tabular-nums">{row.n}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No signals were recorded during this interview.</p>
          )}
          {report.integrity.screenShareWarnings > 0 && (
            <p className="mt-3 text-xs text-muted">
              Screen-share warnings: <span className="font-mono">{report.integrity.screenShareWarnings}</span> of 3 allowed.
            </p>
          )}
        </CardBody>
      </Card>
    </>
  );
}

function Score10({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border px-2 py-1.5">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="font-mono text-sm tabular-nums">{value}<span className="text-subtle">/10</span></div>
    </div>
  );
}

function TurnReview({ sessionId, turn: t, index }: { sessionId: string; turn: InterviewTurnResult; index: number }) {
  const v = VERDICT[verdictOf(t)];
  const e = t.evaluation;
  const review = t.codeResult?.review;
  return (
    <details className="group rounded-xl border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="mt-0.5 font-mono text-xs text-subtle">Q{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm">{t.kind === "CODING" ? t.question.split("\n")[0].replace(/\*\*/g, "") : t.question}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {t.kind === "FOLLOW_UP" && <Badge tone="info">Follow-up</Badge>}
            {t.kind === "CODING" && <Badge tone="info">Coding</Badge>}
            <Badge tone={v.tone}>{v.label}</Badge>
            <Badge>{t.skill}</Badge>
          </div>
        </div>
        <span className={cn("font-mono text-sm font-semibold tabular-nums", scoreTone(t.score) === "accent" ? "text-accent" : scoreTone(t.score) === "warn" ? "text-warn" : "text-danger")}>{t.score}</span>
        <ChevronDown className="mt-0.5 size-4 shrink-0 text-subtle transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-4 border-t border-border p-4 text-sm">
        <div className="space-y-2">
          {t.kind === "CODING" ? <Markdown className="text-sm">{t.question}</Markdown> : <p>{t.question}</p>}
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={CATEGORY[t.category]?.tone ?? "neutral"}>{CATEGORY[t.category]?.label ?? t.category}</Badge>
            <Badge tone="info">{LEVEL_LABEL[t.level] ?? `L${t.level}`}</Badge>
            {t.durationSec !== null && <Badge>{Math.round(t.durationSec)}s</Badge>}
          </div>
        </div>

        <div>
          <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">Your answer</h4>
          {t.skipped ? (
            <p className="text-muted">Skipped.</p>
          ) : t.answerText ? (
            <p className="whitespace-pre-wrap rounded-lg bg-surface-2/60 p-3">{t.answerText}</p>
          ) : !t.answerCode ? (
            <p className="text-muted">No spoken or written answer captured.</p>
          ) : null}
          {t.hasAudio && (
            <audio controls preload="none" src={`/api/career/sessions/${sessionId}/turns/${t.id}/audio`} className="mt-2 w-full max-w-md" aria-label={`Recording of your answer to question ${index + 1}`} />
          )}
        </div>

        {t.answerCode && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted">Your code {t.codeLanguage && <span className="normal-case">({t.codeLanguage})</span>}</h4>
            <CodeBlock code={t.answerCode} language={t.codeLanguage} />
            {t.codeResult && (
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge tone={t.codeResult.passed === t.codeResult.total ? "accent" : t.codeResult.passed ? "warn" : "danger"}>
                  Tests passed {t.codeResult.passed}/{t.codeResult.total}
                </Badge>
                {review && (
                  <>
                    <Badge>Time {review.timeComplexity}</Badge>
                    <Badge>Space {review.spaceComplexity}</Badge>
                  </>
                )}
              </div>
            )}
            {review && review.edgeCases.length > 0 && (
              <div>
                <div className="text-xs text-muted">Edge cases</div>
                <ul className="list-disc pl-5 text-xs">{review.edgeCases.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            )}
            {review && review.codeQuality.length > 0 && (
              <div>
                <div className="text-xs text-muted">Code-quality notes</div>
                <ul className="list-disc pl-5 text-xs">{review.codeQuality.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            )}
          </div>
        )}

        {e && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Score10 label="Correctness" value={e.correctness} />
              <Score10 label="Completeness" value={e.completeness} />
              <Score10 label="Understanding" value={e.understanding} />
              <Score10 label="Practical" value={e.practical} />
              <Score10 label="Communication" value={e.communication} />
            </div>
            {e.conceptsMentioned.length > 0 && (
              <div>
                <div className="mb-1 text-xs text-muted">Concepts you covered</div>
                <div className="flex flex-wrap gap-1">{e.conceptsMentioned.map((c) => <Badge key={c} tone="accent">✓ {c}</Badge>)}</div>
              </div>
            )}
            {e.missingConcepts.length > 0 && (
              <div>
                <div className="mb-1 text-xs text-muted">Missing concepts</div>
                <div className="flex flex-wrap gap-1">{e.missingConcepts.map((c) => <Badge key={c} tone="warn">⚠ {c}</Badge>)}</div>
              </div>
            )}
            {e.unsupportedClaims.length > 0 && (
              <div>
                <div className="mb-1 text-xs text-muted">Unsupported claims</div>
                <ul className="space-y-1">{e.unsupportedClaims.map((c) => <li key={c} className="rounded-md border border-danger/30 bg-danger-soft px-2 py-1 text-xs text-danger">{c}</li>)}</ul>
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-muted">
          Turn score: <span className="font-mono text-text">{t.score}/100</span>
        </p>
      </div>
    </details>
  );
}
