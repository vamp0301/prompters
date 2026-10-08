"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, Check, ChevronRight, Circle, Command, Flame, Hammer, Plus, RefreshCw, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { StatCard, TapedNote, paperCard } from "@/components/ui/paper";
import { cn } from "@/lib/utils";
import { Progress, ScoreRing } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { Dashboard } from "@/lib/api/types";
import { CareerOverview } from "@/features/dashboard/career-overview";

const PATH_TONES = ["bg-accent-soft text-accent", "bg-info-soft text-info", "bg-accent-2-soft text-accent-2", "bg-pink-soft text-pink"];
const QUICK_LINKS = [
  { href: "/learn", label: "Open roadmap" },
  { href: "/practice", label: "Practice 10" },
  { href: "/career", label: "Career AI" },
];

const FACTOR_LABEL: Record<string, string> = { mastery: "Topic mastery", dsa: "DSA", projects: "Projects", recall: "Recall", interview: "Interview", resume: "Resume & profile" };

export default function DashboardPage() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<Dashboard>("/dashboard") });
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const d = data!;
  const r = d.readiness;
  const delta = r.sevenDaysAgo === null ? null : r.score - r.sevenDaysAgo;
  const minutes = d.plan.filter((p) => !p.done).reduce((a, p) => a + p.minutes, 0);
  const built = d.recentBuilds.filter((b) => b.independenceScore !== null);
  const independence = built.length ? Math.round(built.reduce((a, b) => a + (b.independenceScore ?? 0), 0) / built.length) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-3">Namaste, {d.user.name.split(" ")[0]} <span className={cn("inline-flex items-center gap-1 normal-case tracking-normal", d.streak.activeToday ? "text-accent-2" : "text-muted")}><Flame className="size-3.5" aria-hidden /> {d.streak.current}-day streak</span></span>}
        title="A focused place to make progress"
        description="Everything you need is close at hand."
        actions={
          <Link href={d.continue ? `/learn/topic/${d.continue.topic.slug}` : "/learn"} className={buttonClass("primary", "lg")}>
            <Plus className="size-4" aria-hidden /> Start next step
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Topics mastered" value={d.totals.mastered} hint={`of ${d.totals.available} live topics`} tone="green" />
        <StatCard label="Readiness" value={`${r.score}/100`} hint={delta === null ? r.status : `${delta >= 0 ? "+" : ""}${delta} this week`} tone="orange" />
        <StatCard
          label="Independence"
          value={independence === null ? "—" : `${independence}/100`}
          hint={independence === null ? "After your first build" : `Across ${built.length} build${built.length === 1 ? "" : "s"}`}
          tone="blue"
        />
        <StatCard label="Streak" value={`${d.streak.current} day${d.streak.current === 1 ? "" : "s"}`} hint={`${d.streak.activeDays} active days`} tone="pink" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <section aria-labelledby="path-title" className={cn(paperCard, "p-6")}>
          <p className="eyebrow text-accent">Your path</p>
          <h2 id="path-title" className="font-display mt-1 text-2xl">
            Small steps, visible proof
          </h2>
          <p className="mt-1 text-xs text-muted">{minutes ? `Today's plan · about ${minutes} minutes left` : "Today's plan · all done 🎉"}</p>
          {d.plan.length ? (
            <ul className="mt-5 divide-y divide-border border-y border-border">
              {d.plan.map((p, i) => (
                <li key={p.key}>
                  <Link href={p.href} className="group flex items-center gap-4 py-4">
                    <span className={cn("grid size-[34px] shrink-0 place-items-center rounded-lg", PATH_TONES[i % PATH_TONES.length])}>
                      {p.done ? <Check className="size-4" aria-hidden /> : <Circle className="size-3.5" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-[13px] font-bold", p.done && "text-muted line-through")}>{p.label}</span>
                      <span className="block text-xs text-muted">{p.done ? "Done today" : `About ${p.minutes} minutes`}</span>
                    </span>
                    <span className="font-mono text-[10px] text-muted">{p.minutes}m</span>
                    <ChevronRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-muted">Your plan appears once you start your first topic.</p>
          )}
        </section>
        <div className="space-y-4">
          <TapedNote tape="A note to self">
            <p className="font-display text-[1.9rem] leading-[1.15]">Build something you can defend.</p>
            <p className="mt-4 text-[13px] leading-relaxed">Confidence doesn&apos;t come from knowing everything. It comes from knowing your own decisions.</p>
            <p className="font-display mt-3 text-sm italic">— the Prompters way</p>
          </TapedNote>
          <nav aria-labelledby="quick-title" className={cn(paperCard, "p-6")}>
            <div className="flex items-center justify-between">
              <h2 id="quick-title" className="font-display text-2xl">
                Quick links
              </h2>
              <Command className="size-4" aria-hidden />
            </div>
            <ul className="mt-4 divide-y divide-border border-b border-border">
              {QUICK_LINKS.map((q) => (
                <li key={q.href}>
                  <Link href={q.href} className="flex items-center justify-between py-3 text-[13px] hover:text-accent">
                    {q.label} <ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {!d.user.placementDone && d.totals.mastered === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-info/30 bg-info-soft p-4 text-sm">
          <span>Already know some basics? A 15-minute placement test lets you skip topics you&apos;ve mastered.</span>
          <Link href="/practice?placement=1" className={buttonClass("secondary", "sm")}>Take placement test</Link>
        </div>
      )}

      <CareerOverview />

      <div className="grid gap-4">
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
