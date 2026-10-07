"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BotOff, ChevronRight, Code2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { EmptyState, ErrorState, PageHeader, PageSkeleton, Stat } from "@/components/ui/misc";
import { WorkStatusBadge } from "@/features/shared/status-badge";
import { api } from "@/lib/api/client";
import type { BuildTaskSummary } from "@/lib/api/types";
import { cn } from "@/lib/utils";

function group(tasks: BuildTaskSummary[]) {
  const map = new Map<string, { title: string; items: BuildTaskSummary[] }>();
  for (const t of tasks) {
    const key = t.stage?.slug ?? "general";
    const g = map.get(key) ?? { title: t.stage?.title ?? "General", items: [] };
    g.items.push(t);
    map.set(key, g);
  }
  return [...map.entries()];
}

function TaskRow({ t }: { t: BuildTaskSummary }) {
  const body = (
    <>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg border", t.locked ? "border-border text-subtle" : "border-border-strong bg-surface-2 text-accent")}>
        {t.locked ? <Lock className="size-4" aria-label="Locked" /> : <Code2 className="size-4" aria-hidden />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-medium", t.locked && "text-muted")}>{t.title}</span>
          {!t.locked && <WorkStatusBadge status={t.status} />}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          {t.topic && <span>{t.locked ? `Unlock "${t.topic.title}" first` : t.topic.title}</span>}
          <span className="font-mono">~{t.estMinutes}m</span>
          <span className="font-mono" aria-label={`Difficulty ${t.difficulty} of 5`}>{"●".repeat(t.difficulty)}<span className="text-subtle">{"●".repeat(Math.max(0, 5 - t.difficulty))}</span></span>
        </div>
      </div>
      <div className="hidden shrink-0 gap-2 sm:flex">
        {t.independenceScore !== null && <Badge tone="accent">Independence <span className="font-mono">{Math.round(t.independenceScore)}</span></Badge>}
        {t.projectScore !== null && <Badge tone="info">Score <span className="font-mono">{Math.round(t.projectScore)}</span></Badge>}
      </div>
      {!t.locked && <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />}
    </>
  );
  const cls = "flex items-center gap-3 rounded-xl border border-border bg-surface p-3 sm:p-4";
  return (
    <li>
      {t.locked ? (
        <div className={cn(cls, "border-dashed")}>{body}</div>
      ) : (
        <Link href={`/workspace/${t.slug}`} className={cn(cls, "transition-colors hover:border-border-strong")}>{body}</Link>
      )}
      {(t.independenceScore !== null || t.projectScore !== null) && (
        <div className="mt-1 flex gap-2 px-1 sm:hidden">
          {t.independenceScore !== null && <Badge tone="accent">Independence <span className="font-mono">{Math.round(t.independenceScore)}</span></Badge>}
          {t.projectScore !== null && <Badge tone="info">Score <span className="font-mono">{Math.round(t.projectScore)}</span></Badge>}
        </div>
      )}
    </li>
  );
}

export function BuildList() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["build-tasks"], queryFn: () => api.get<BuildTaskSummary[]>("/build-tasks") });
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const tasks = data!;
  const completed = tasks.filter((t) => t.status === "COMPLETED");
  const scored = completed.filter((t) => t.independenceScore !== null);
  const avgIndependence = scored.length ? Math.round(scored.reduce((a, t) => a + (t.independenceScore ?? 0), 0) / scored.length) : null;

  return (
    <>
      <PageHeader
        eyebrow="Build without AI"
        title="Build tasks"
        description="Small exercises where AI chat and autocomplete are off. Hidden tests grade your code, hints cost a little independence, and you explain your code before it counts."
      />
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm">
        <BotOff className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
        <p className="text-muted">
          <span className="text-text">Why no AI?</span> Interviewers ask &ldquo;why did you do it this way?&rdquo;. Typing it yourself is how you get an answer you can defend. Tasks unlock with their topic.
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={<Code2 className="size-5" />} title="No build tasks on your track yet" description="Build tasks appear here as topics on your roadmap get them. Keep learning — your first build is close." action={<Link href="/learn" className={buttonClass("secondary", "sm")}>Open roadmap</Link>} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            <Stat label="Completed" value={`${completed.length}/${tasks.length}`} />
            <Stat label="In progress" value={tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "TESTS_PASSED").length} />
            <Stat label="Avg independence" value={avgIndependence ?? "—"} hint={avgIndependence === null ? "Complete a build to see it" : "Across completed builds"} />
          </div>
          <div className="space-y-8">
            {group(tasks).map(([key, g]) => (
              <section key={key} aria-labelledby={`stage-${key}`}>
                <h2 id={`stage-${key}`} className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  {g.title}
                  <span className="font-mono text-xs font-normal text-subtle">{g.items.filter((t) => t.status === "COMPLETED").length}/{g.items.length}</span>
                </h2>
                <ul className="space-y-2">{g.items.map((t) => <TaskRow key={t.slug} t={t} />)}</ul>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
