"use client";
import Link from "next/link";
import { ChevronRight, Clock, ListChecks, Target, Timer, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import type { AssessmentSummary } from "@/lib/api/types";
import { attemptsLeft, useAssessments } from "./use-assessments";

function AssessmentCard({ a }: { a: AssessmentSummary }) {
  const left = attemptsLeft(a);
  const passed = a.bestScore !== null && a.bestScore >= a.passingScore;
  return (
    <li>
      <Link href={`/mock-tests/${a.slug}`} className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {a.stage && <div className="font-mono text-[11px] uppercase tracking-wider text-subtle">{a.stage.title}</div>}
            <h3 className="font-medium">{a.title}</h3>
          </div>
          <ChevronRight className="mt-1 size-4 shrink-0 text-muted" aria-hidden />
        </div>
        {a.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{a.description}</p>}
        <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div><dt className="flex items-center gap-1 text-subtle"><Clock className="size-3" aria-hidden /> Duration</dt><dd className="font-mono">{a.durationMinutes} min</dd></div>
          <div><dt className="flex items-center gap-1 text-subtle"><ListChecks className="size-3" aria-hidden /> Questions</dt><dd className="font-mono">{a.questionCount}</dd></div>
          <div><dt className="flex items-center gap-1 text-subtle"><Target className="size-3" aria-hidden /> Pass</dt><dd className="font-mono">{a.passingScore}%</dd></div>
        </dl>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {a.bestScore !== null ? (
            <Badge tone={passed ? "accent" : "warn"}><Trophy className="size-3" aria-hidden /> Best {Math.round(a.bestScore)}%{passed ? " · passed" : ""}</Badge>
          ) : (
            <Badge>Not attempted</Badge>
          )}
          <Badge tone={left === 0 ? "danger" : "neutral"}>
            {a.maxAttempts === null ? `${a.attemptsUsed} attempt${a.attemptsUsed === 1 ? "" : "s"} · unlimited` : `${a.attemptsUsed}/${a.maxAttempts} attempts used`}
          </Badge>
        </div>
      </Link>
    </li>
  );
}

export function MockTestList() {
  const { data, error, isLoading, refetch } = useAssessments();
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const exams = data!.filter((a) => a.kind === "STAGE_EXAM");
  const mocks = data!.filter((a) => a.kind === "MOCK_TEST");

  return (
    <>
      <PageHeader
        eyebrow="Timed assessments"
        title="Mock tests & stage exams"
        description="Stage exams unlock your next stage. Company-style mock tests rehearse the real thing: a timer, fullscreen, and integrity logging."
      />
      {data!.length === 0 ? (
        <EmptyState icon={<Timer className="size-5" />} title="No assessments published yet" description="Stage exams and mock tests will show up here. Until then, Practice 10 is the best warm-up." action={<Link href="/practice" className={buttonClass("secondary", "sm")}>Practice 10</Link>} />
      ) : (
        <div className="space-y-8">
          {mocks.length > 0 && (
            <section aria-labelledby="mocks">
              <h2 id="mocks" className="mb-3 text-sm font-semibold">Company-style mock tests</h2>
              <ul className="grid gap-3 md:grid-cols-2">{mocks.map((a) => <AssessmentCard key={a.id} a={a} />)}</ul>
            </section>
          )}
          {exams.length > 0 && (
            <section aria-labelledby="exams">
              <h2 id="exams" className="mb-1 text-sm font-semibold">Stage exams</h2>
              <p className="mb-3 text-xs text-muted">Pass a stage exam to unlock the next stage of your roadmap.</p>
              <ul className="grid gap-3 md:grid-cols-2">{exams.map((a) => <AssessmentCard key={a.id} a={a} />)}</ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}
