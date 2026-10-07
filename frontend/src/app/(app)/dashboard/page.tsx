"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Circle, Flame, Hammer, RefreshCw, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/ui/misc";
import { Progress, ScoreRing } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { Dashboard } from "@/lib/api/types";
import { CareerOverview } from "@/features/dashboard/career-overview";

const FACTOR_LABEL: Record<string, string> = { mastery: "Topic mastery", dsa: "DSA", projects: "Projects", recall: "Recall", interview: "Interview", resume: "Resume & profile" };

export default function DashboardPage() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<Dashboard>("/dashboard") });
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const d = data!;
  const r = d.readiness;
  const delta = r.sevenDaysAgo === null ? null : r.score - r.sevenDaysAgo;
  const minutes = d.plan.filter((p) => !p.done).reduce((a, p) => a + p.minutes, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-accent">Dashboard</div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Namaste, {d.user.name.split(" ")[0]} 👋</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Flame className={d.streak.activeToday ? "size-4 text-warn" : "size-4"} /> {d.streak.current}-day streak
        </div>
      </div>

      {!d.user.placementDone && d.totals.mastered === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-info/30 bg-info-soft p-4 text-sm">
          <span>Already know some basics? A 15-minute placement test lets you skip topics you&apos;ve mastered.</span>
          <Link href="/practice?placement=1" className={buttonClass("secondary", "sm")}>Take placement test</Link>
        </div>
      )}

      <CareerOverview />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Readiness score" description={`Target role: ${({ BACKEND: "Backend", FRONTEND: "Frontend", FULLSTACK: "Full-stack", DEVOPS: "DevOps", SDE: "SDE", AI: "AI Engineer" } as Record<string, string>)[r.role] ?? r.role}`} action={<Link href="/readiness" className="text-xs text-muted hover:text-text">Details →</Link>} />
          <CardBody className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <ScoreRing value={r.score} label="Readiness" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="font-medium">{r.status}</div>
              {delta !== null && <div className="flex items-center gap-1 text-xs text-muted"><TrendingUp className="size-3.5" /> {delta >= 0 ? "+" : ""}{delta} in the last 7 days</div>}
              <ul className="space-y-2 pt-1">
                {Object.entries(r.factors).map(([k, v]) => (
                  <li key={k} className="grid grid-cols-[110px_1fr_30px] items-center gap-2 text-xs">
                    <span className="text-muted">{FACTOR_LABEL[k]}</span>
                    <Progress value={v} label={FACTOR_LABEL[k]} />
                    <span className="text-right font-mono tabular-nums">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Today's plan" description={minutes ? `About ${minutes} minutes left` : "All done for today 🎉"} />
          <CardBody>
            {d.plan.length ? (
              <ul className="space-y-1">
                {d.plan.map((p) => (
                  <li key={p.key}>
                    <Link href={p.href} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-surface-2">
                      {p.done ? <CheckCircle2 className="size-4 text-accent" /> : <Circle className="size-4 text-subtle" />}
                      <span className={p.done ? "flex-1 text-muted line-through" : "flex-1"}>{p.label}</span>
                      <span className="font-mono text-xs text-subtle">{p.minutes}m</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Your plan appears once you start your first topic.</p>}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader title="Continue learning" />
          <CardBody>
            {d.continue ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-muted">{d.continue.stage.title} → {d.continue.module}</div>
                  <div className="mt-0.5 text-lg font-semibold">{d.continue.topic.title}</div>
                  <div className="mt-2 flex items-center gap-3"><Progress value={d.continue.stage.percent} className="w-48" label="Stage progress" /><span className="font-mono text-xs text-muted">{d.continue.stage.percent}%</span></div>
                </div>
                <Link href={`/learn/topic/${d.continue.topic.slug}`} className={buttonClass("primary")}>Continue <ArrowRight className="size-4" /></Link>
              </div>
            ) : (
              <EmptyState title="Nothing unlocked right now" description="Take your stage exam to unlock the next stage." action={<Link href="/learn" className={buttonClass("secondary", "sm")}>Open roadmap</Link>} />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Next 3 actions" />
          <CardBody>
            <ol className="space-y-3">
              {r.nextActions.map((a, i) => (
                <li key={a.href + i}>
                  <Link href={a.href} className="group block">
                    <div className="text-sm font-medium group-hover:text-accent">→ {a.label}</div>
                    <div className="text-xs text-muted">{a.reason}</div>
                  </Link>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader title="Weak areas" />
          <CardBody>
            {d.weakAreas.length ? (
              <ul className="space-y-3">
                {d.weakAreas.map((w) => (
                  <li key={w.key}>
                    <div className="mb-1 flex justify-between text-sm"><span>{w.label}</span><span className="font-mono text-xs text-muted">{w.value}%</span></div>
                    <Progress value={w.value} tone="warn" label={w.label} />
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">No weak areas yet — keep going.</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Reviews" />
          <CardBody>
            <div className="flex items-center gap-3">
              <RefreshCw className="size-8 text-accent" />
              <div>
                <div className="font-mono text-2xl font-semibold">{d.dueReviews}</div>
                <div className="text-xs text-muted">{d.dueReviews ? "due today" : "You're all caught up. Your next review appears when it's due."}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {d.dueReviews > 0 && <Link href="/reviews" className={buttonClass("primary", "sm")}>Review now</Link>}
              <Link href="/practice" className={buttonClass("secondary", "sm")}>Practice 10</Link>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent builds" action={<Link href="/build" className="text-xs text-muted hover:text-text">All →</Link>} />
          <CardBody>
            {d.recentBuilds.length ? (
              <ul className="space-y-2">
                {d.recentBuilds.map((b) => (
                  <li key={b.slug}>
                    <Link href={`/workspace/${b.slug}`} className="flex items-center justify-between gap-2 text-sm hover:text-accent">
                      <span className="truncate">{b.title}</span>
                      {b.independenceScore !== null ? <Badge tone="accent">Independence {Math.round(b.independenceScore)}</Badge> : <Badge tone="info">Explain pending</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted"><Hammer className="mb-2 size-5" />Your first build is waiting. Master a topic, then build it without AI.</div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
