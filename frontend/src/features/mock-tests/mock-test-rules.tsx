"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ClipboardX, Clock, Eye, Flag, ListChecks, Lock, Maximize, ShieldCheck, Target, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, PageSkeleton, Stat } from "@/components/ui/misc";
import { apiStatus } from "@/features/shared/api-status";
import { api } from "@/lib/api/client";
import type { AssessmentSummary, Attempt } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import { attemptsLeft, useAssessments, useAttempts } from "./use-assessments";

const POLICY: Record<AssessmentSummary["violationPolicy"], { label: string; text: (limit: number) => string }> = {
  LOG: { label: "Log only", text: () => "Tab switches and clipboard attempts are recorded and lower the attempt's integrity score, but the test carries on normally." },
  FLAG: { label: "Flag", text: (n) => `Going over ${n} tab switch${n === 1 ? "" : "es"} flags the attempt. Your answers still count, and the flag shows next to the score.` },
  AUTO_SUBMIT: { label: "Auto-submit", text: (n) => `Going over ${n} tab switch${n === 1 ? "" : "es"} submits the test immediately with the answers you have so far.` },
};

function PastAttempts({ title }: { title: string }) {
  const { data, error, isLoading, refetch } = useAttempts();
  if (isLoading) return <div className="h-24 animate-pulse rounded-lg bg-surface-2" aria-hidden />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const rows = data!.filter((a) => a.assessment?.title === title);
  if (!rows.length) return <p className="text-sm text-muted">No attempts yet. Your scores and integrity results will appear here after you submit.</p>;
  return (
    <ul className="divide-y divide-border">
      {rows.map((a) => (
        <li key={a.id}>
          <Link href={`/quiz/${a.id}?title=${encodeURIComponent(title)}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm hover:text-accent">
            <span className="min-w-0 flex-1">{formatDate(a.finishedAt ?? a.startedAt, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            <span className="font-mono tabular-nums">{a.score === null ? "—" : `${Math.round(a.score)}%`}</span>
            {a.passed === true && <Badge tone="accent">Passed</Badge>}
            {a.passed === false && <Badge tone="danger">Not passed</Badge>}
            {a.flagged && <Badge tone="warn"><Flag className="size-3" aria-hidden /> Flagged</Badge>}
            {a.integrityScore !== null && <span className="text-xs text-muted">Integrity <span className="font-mono">{Math.round(a.integrityScore)}</span></span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Rules({ a }: { a: AssessmentSummary }) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const left = attemptsLeft(a);
  const start = useMutation({
    mutationFn: () => api.post<Attempt>(`/assessments/${a.slug}/start`),
    onSuccess: (attempt) => router.push(`/quiz/${attempt.id}?title=${encodeURIComponent(a.title)}`),
    meta: { silent: true },
  });
  const status = apiStatus(start.error);
  const stageLocked = status === 423;
  const noAttempts = status === 409 || left === 0;
  const policy = POLICY[a.violationPolicy];

  const rules = [
    a.requireFullscreen && { icon: Maximize, text: "You'll be asked to switch to fullscreen. Leaving fullscreen is logged." },
    { icon: Eye, text: `Switching tabs or windows is logged (limit: ${a.tabSwitchLimit}). Every logged event lowers the attempt's integrity score.` },
    a.blockClipboard && { icon: ClipboardX, text: "Copy, cut and paste are blocked and attempts are logged." },
    { icon: Timer, text: `Answers save as you go. The ${a.durationMinutes}-minute timer keeps running even if you close the tab — when time is up, your saved answers are graded.` },
  ].filter(Boolean) as { icon: typeof Eye; text: string }[];

  return (
    <div className="space-y-6">
      <Link href="/mock-tests" className="inline-flex items-center gap-1 text-xs text-muted hover:text-text"><ArrowLeft className="size-3.5" aria-hidden /> All tests</Link>
      <div>
        <div className="font-mono text-[11px] uppercase tracking-wider text-accent">{a.kind === "STAGE_EXAM" ? "Stage exam" : "Mock test"}{a.stage ? ` · ${a.stage.title}` : ""}</div>
        <h1 className="text-2xl font-semibold tracking-tight">{a.title}</h1>
        {a.description && <p className="mt-1 max-w-2xl text-sm text-muted">{a.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Duration" value={`${a.durationMinutes}m`} />
        <Stat label="Questions" value={a.questionCount} />
        <Stat label="Passing score" value={`${a.passingScore}%`} />
        <Stat label="Attempts" value={a.maxAttempts === null ? a.attemptsUsed : `${a.attemptsUsed}/${a.maxAttempts}`} hint={left === null ? "Unlimited" : `${left} left`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Before you start" description="Read these once — they're the same rules real company tests use." />
          <CardBody className="space-y-5">
            <ul className="space-y-3">
              {rules.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 text-sm">
                  <Icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2 font-medium"><AlertTriangle className="size-4 text-warn" aria-hidden /> Violation policy: {policy.label}</div>
              <p className="text-muted">{policy.text(a.tabSwitchLimit)}</p>
            </div>
            <div className="flex gap-3 rounded-lg border border-info/30 bg-info-soft p-3 text-sm">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
              <p>
                <span className="font-medium">An honest note:</span> we log tab switches and clipboard use. A browser can&apos;t see other devices — explain-your-code and
                personalised questions are what verify your understanding. The only person a shortcut fools is you on interview day.
              </p>
            </div>

            {stageLocked ? (
              <EmptyState icon={<Lock className="size-5" />} title="This stage is still locked" description={start.error instanceof Error ? start.error.message : "Pass the previous stage exam first."} action={<Link href="/learn" className={buttonClass("secondary", "sm")}>Open roadmap</Link>} />
            ) : noAttempts ? (
              <EmptyState icon={<Lock className="size-5" />} title="No attempts left" description="You've used every attempt for this test. Your best score is kept, and Practice 10 is the best way to keep sharpening." action={<Link href="/practice" className={buttonClass("secondary", "sm")}>Practice 10</Link>} />
            ) : (
              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-4 accent-[var(--accent)]" />
                  <span>I&apos;ve read the rules. I&apos;ll attempt this on my own, without other tabs, people or AI.</span>
                </label>
                {start.error && <p role="alert" className="text-sm text-danger">{start.error instanceof Error ? start.error.message : "Couldn't start the test. Please try again."}</p>}
                <Button size="lg" disabled={!agreed} loading={start.isPending} onClick={() => start.mutate()}>
                  <Clock className="size-4" aria-hidden /> Start {a.durationMinutes}-minute test
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Your attempts" description={a.bestScore !== null ? `Best score ${Math.round(a.bestScore)}%` : undefined} />
            <CardBody className="pt-2"><PastAttempts title={a.title} /></CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-2 text-sm text-muted">
              <p className="flex items-center gap-2 font-medium text-text"><ListChecks className="size-4" aria-hidden /> Scoring</p>
              <p className="flex gap-2"><Target className="mt-0.5 size-4 shrink-0" aria-hidden /> {a.passingScore}% or more passes{a.kind === "STAGE_EXAM" ? " and unlocks the next stage" : ""}. Mock test scores count toward the interview part of your Readiness score.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function MockTestRules({ slug }: { slug: string }) {
  const { data, error, isLoading, refetch } = useAssessments();
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const a = data!.find((x) => x.slug === slug);
  if (!a)
    return (
      <EmptyState
        icon={<Timer className="size-5" />}
        title="We couldn't find this test"
        description="It may have been unpublished or the link is wrong."
        action={<Link href="/mock-tests" className={buttonClass("secondary", "sm")}>All mock tests</Link>}
      />
    );
  return <Rules a={a} />;
}
