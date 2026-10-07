"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Flame, History, RefreshCw, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, PageHeader, PageSkeleton, Skeleton, Stat } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { ScoreHistoryChart } from "@/features/readiness/score-history-chart";
import { api, qs } from "@/lib/api/client";
import type { Journey, JourneyEvent, Paged } from "@/lib/api/types";
import { cn, formatDate, relativeTime } from "@/lib/utils";

const num = (v: unknown) => (typeof v === "number" ? Math.round(v) : null);
const str = (v: unknown) => (typeof v === "string" ? v : null);
const KIND_LABEL: Record<string, string> = { MASTERY: "mastery quiz", REVIEW: "review", PRACTICE: "Practice 10", PLACEMENT: "placement test", STAGE_EXAM: "stage exam", MOCK_TEST: "mock test" };

/** Turns a learning event into a short, human sentence. Unknown types fall back to a readable label. */
function describe(e: JourneyEvent): string {
  const m = e.meta ?? {};
  const t = e.topic?.title;
  const score = num(m.score);
  const on = t ? ` on ${t}` : "";
  switch (e.type) {
    case "signup": return "Joined Prompters";
    case "login": return "Logged in";
    case "onboarding_completed": return "Set up your learning path";
    case "placement_completed": return `Finished the placement test${score !== null ? ` (${score}%)` : ""}${num(m.skippedTopics) ? ` and skipped ${num(m.skippedTopics)} topics` : ""}`;
    case "topic_started": return `Started ${t ?? "a new topic"}`;
    case "topic_read": return `Read the lesson${on}`;
    case "quiz_started": return `Started a ${KIND_LABEL[str(m.kind) ?? ""] ?? "quiz"}${on}`;
    case "quiz_submitted": return str(m.kind) === "PRACTICE" ? `Finished Practice 10${score !== null ? ` — ${score}%` : ""}` : `${m.passed ? "Passed" : "Took"} the mastery quiz${on}${score !== null ? ` — ${score}%` : ""}`;
    case "mastery_achieved": return `Mastered ${t ?? "a topic"}${score !== null ? ` with ${score}%` : ""}`;
    case "review_completed": return `Passed a spaced review${on}${score !== null ? ` — ${score}%` : ""}`;
    case "review_failed": return `Review${on} needs another go${score !== null ? ` (${score}%)` : ""}`;
    case "stage_passed": return `Passed a stage exam${score !== null ? ` with ${score}%` : ""} — next stage unlocked`;
    case "build_started": return `Started building ${str(m.task) ?? "a task"}${on}`;
    case "hint_used": return `Used hint ${num(m.level) ?? ""} on ${str(m.project) ?? str(m.task) ?? "a build"}`.replace("  ", " ");
    case "code_run": return "Ran code in the playground";
    case "build_submitted": return `Submitted ${str(m.task) ?? "a build"} — ${num(m.passedCount) ?? 0}/${num(m.total) ?? 0} tests passed`;
    case "build_completed": return `Completed ${str(m.task) ?? "a build"} without AI${num(m.independenceScore) !== null ? ` (independence ${num(m.independenceScore)})` : ""}`;
    case "project_submitted": return `${m.complete ? "Completed" : "Submitted"} project ${str(m.project) ?? ""}${num(m.explainScore) !== null ? ` — explain score ${num(m.explainScore)}` : ""}`.trim();
    case "prompt_unlocked": return `Unlocked ${num(m.count) ?? "new"} prompt${num(m.count) === 1 ? "" : "s"}${t ? ` for ${t}` : ""}`;
    case "prompt_used": return "Copied a prompt from the library";
    case "interview_practiced": return `Practised an interview answer${t ? ` about ${t}` : ""}${score !== null ? ` — ${score}%` : ""}`;
    case "mock_test_started": return "Started a mock test";
    case "mock_test_completed": return `Finished a mock test${score !== null ? ` — ${score}%` : ""}`;
    case "readiness_milestone": return `Readiness score crossed ${num(m.milestone) ?? "a milestone"}`;
    case "application_added": return `Applied to ${str(m.company) ?? "a company"}`;
    case "offer_received": return `Received an offer from ${str(m.company) ?? "a company"} 🎉`;
    case "ai_explain": return `Asked for an AI explanation${on}`;
    default: return e.type.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
  }
}

function Milestones({ items }: { items: Journey["milestones"] }) {
  const next = items.findIndex((m) => !m.at);
  return (
    <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[9px] before:top-2 before:w-px before:bg-border">
      {items.map((m, i) => (
        <li key={m.label} className="relative flex items-start gap-3">
          <span className={cn("relative z-10 grid size-5 shrink-0 place-items-center rounded-full bg-surface", m.at ? "text-accent" : i === next ? "text-text" : "text-subtle")}>
            {m.at ? <CheckCircle2 className="size-5" aria-hidden /> : <Circle className="size-4" aria-hidden />}
          </span>
          <div className={cn("min-w-0 text-sm", !m.at && "text-subtle")}>
            <div className={cn(m.at && "font-medium text-text", i === next && "text-text")}>
              {m.label}
              <span className="sr-only">{m.at ? " — achieved" : " — not yet"}</span>
            </div>
            {m.at ? <time dateTime={m.at} className="font-mono text-xs text-muted">{formatDate(m.at)}</time> : i === next ? <div className="text-xs text-muted">Up next</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ActivityFeed() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["journey-events", page],
    queryFn: () => api.get<Paged<JourneyEvent>>(`/journey/events${qs({ page })}`),
    placeholderData: (prev) => prev,
  });
  if (isLoading) return <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const d = data!;
  const pages = Math.max(1, Math.ceil(d.total / d.pageSize));
  if (!d.items.length) return <p className="text-sm text-muted">Your activity will show up here as you learn, build and practise.</p>;
  return (
    <div aria-busy={isFetching}>
      <ul className="divide-y divide-border">
        {d.items.map((e) => (
          <li key={e.id} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:gap-3">
            <span className="min-w-0 flex-1 text-sm">
              {describe(e)}
              {e.topic && (
                <>
                  {" · "}
                  <Link href={`/learn/topic/${e.topic.slug}`} className="text-muted underline-offset-4 hover:text-accent hover:underline">{e.topic.title}</Link>
                </>
              )}
            </span>
            <time dateTime={e.createdAt} title={formatDate(e.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })} className="shrink-0 font-mono text-xs text-subtle">
              {relativeTime(e.createdAt)}
            </time>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <nav aria-label="Activity pages" className="mt-3 flex items-center justify-between gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Newer</Button>
          <span className="font-mono text-xs text-muted">Page {d.page} of {pages}</span>
          <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Older</Button>
        </nav>
      )}
    </div>
  );
}

export function JourneyView() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["journey"], queryFn: () => api.get<Journey>("/journey") });
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const j = data!;
  const s = j.stats;
  const hours = Math.floor(s.estLearningMinutes / 60);
  const mins = s.estLearningMinutes % 60;
  const stages = j.stages.filter((st) => st.total > 0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="My journey" title="My learning journey" description="Everything you've done on Prompters, from your first lesson to your first offer. All of it comes from your real activity." />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader title="Milestones" />
          <CardBody><Milestones items={j.milestones} /></CardBody>
        </Card>

        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Topics mastered" value={s.topicsMastered} hint={`${s.topicsLearning} in progress`} />
            <Stat label="Quizzes taken" value={s.quizzesTaken} hint={`${s.quizzesFailed} mastery quiz${s.quizzesFailed === 1 ? "" : "zes"} not passed`} />
            <Stat label="Reviews done" value={s.reviewsDone} hint={`${s.reviewsFailed} need another go`} />
            <Stat label="Builds without AI" value={s.buildsCompleted} hint={`${s.hintsUsed} hint${s.hintsUsed === 1 ? "" : "s"} used`} />
            <Stat label="Avg independence" value={s.avgIndependence ?? "—"} hint={s.avgIndependence === null ? "After your first build" : "Completed builds"} />
            <Stat label="Interview answers" value={s.interviewPractice} hint="Practised" />
            <Stat label="Mock tests & exams" value={s.mockTests} />
            <Stat
              label="Streak"
              value={<span className="inline-flex items-center gap-1.5"><Flame className={cn("size-5", s.streak.activeToday ? "text-warn" : "text-subtle")} aria-hidden />{s.streak.current}</span>}
              hint={`${s.streak.activeDays} active day${s.streak.activeDays === 1 ? "" : "s"}`}
            />
            <Stat label="Est. learning time" value={hours ? `${hours}h ${mins}m` : `${mins}m`} hint="From lessons you've read" />
          </div>

          <Card>
            <CardHeader title="Readiness over time" action={<Link href="/readiness" className="text-xs text-muted hover:text-text">Details →</Link>} />
            <CardBody className="pt-3">
              {j.readiness.length > 1 ? (
                <ScoreHistoryChart points={j.readiness} compact label="Readiness score history" />
              ) : (
                <p className="text-sm text-muted">Your readiness trend appears once your score changes.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Stage progress" />
          <CardBody>
            {stages.length ? (
              <ul className="space-y-3">
                {stages.map((st) => (
                  <li key={st.slug}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2"><span className="font-mono text-xs text-subtle">{st.code}</span><span className="truncate">{st.title}</span>{st.passed && <Trophy className="size-3.5 shrink-0 text-accent" aria-label="Stage exam passed" />}</span>
                      <span className="shrink-0 font-mono text-xs text-muted">{st.mastered}/{st.total}</span>
                    </div>
                    <Progress value={st.percent} label={`${st.title} progress`} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Stage progress appears once your path has topics.</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Strong topics" description="Your best recall" />
          <CardBody>
            {j.strong.length ? (
              <ul className="space-y-1.5">
                {j.strong.map((t) => (
                  <li key={t.slug} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/learn/topic/${t.slug}`} className="truncate hover:text-accent">{t.title}</Link>
                    <span className="shrink-0 font-mono text-xs text-muted">{Math.round(t.score)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Master your first topic and it will show up here.</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Fading topics" description="Reviews you missed or didn't pass" />
          <CardBody>
            {j.forgotten.length ? (
              <>
                <ul className="space-y-1.5">
                  {j.forgotten.map((t) => (
                    <li key={t.slug} className="flex items-center justify-between gap-2 text-sm">
                      <Link href={`/learn/topic/${t.slug}`} className="truncate hover:text-accent">{t.title}</Link>
                      <Badge tone="warn"><RefreshCw className="size-3" aria-hidden />{t.recallScore !== null ? ` ${Math.round(t.recallScore)}%` : " Review"}</Badge>
                    </li>
                  ))}
                </ul>
                <Link href="/reviews" className={buttonClass("secondary", "sm", "mt-4")}>Review now</Link>
              </>
            ) : (
              <p className="text-sm text-muted">Nothing is fading. Keep doing your reviews when they&apos;re due.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Activity" description="Newest first" />
        <CardBody className="pt-2"><ActivityFeed /></CardBody>
      </Card>

      {s.topicsMastered === 0 && s.quizzesTaken === 0 && (
        <EmptyState icon={<History className="size-5" />} title="Your journey starts with one topic" description="Open your roadmap, read your first lesson and take its quiz. Every step you take is recorded here." action={<Link href="/learn" className={buttonClass("primary", "sm")}>Open roadmap</Link>} />
      )}
    </div>
  );
}
