"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, GraduationCap, Hourglass, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { WorkStatusBadge } from "@/features/shared/status-badge";
import { api } from "@/lib/api/client";
import type { ProjectSummary } from "@/lib/api/types";
import { cn } from "@/lib/utils";

function Rung({ p }: { p: ProjectSummary }) {
  const done = p.status === "COMPLETED";
  const open = p.unlocked && !p.comingSoon;
  const body = (
    <>
      <span
        className={cn(
          "relative z-10 grid size-10 shrink-0 place-items-center rounded-lg border font-mono text-sm",
          done ? "border-accent bg-accent text-accent-fg" : open ? "border-border-strong bg-surface-2" : "border-border bg-surface text-subtle",
        )}
        aria-hidden
      >
        {done ? <CheckCircle2 className="size-5" /> : p.comingSoon ? <Hourglass className="size-4" /> : open ? p.rung : <Lock className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[11px] uppercase tracking-wider text-subtle">Rung {p.rung}</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-medium", !open && "text-muted")}>{p.title}</span>
          {p.comingSoon ? <Badge>Coming soon</Badge> : !p.unlocked ? <Badge><Lock className="size-3" aria-hidden /> Locked</Badge> : <WorkStatusBadge status={p.status} />}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{p.unlocked || p.comingSoon ? p.description : "Complete the previous project to unlock this rung."}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {p.skills.map((s) => <Badge key={s}>{s}</Badge>)}
          {p.technologies.map((t) => <Badge key={t} tone="info">{t}</Badge>)}
        </div>
        {(p.independenceScore !== null || p.explainScore !== null) && (
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
            {p.explainScore !== null && <span>Explain <span className="font-mono text-text">{Math.round(p.explainScore)}</span></span>}
            {p.independenceScore !== null && <span>Independence <span className="font-mono text-text">{Math.round(p.independenceScore)}</span></span>}
          </div>
        )}
      </div>
      {!p.comingSoon && <ChevronRight className="mt-3 size-4 shrink-0 text-muted" aria-hidden />}
    </>
  );
  const cls = cn("flex items-start gap-4 rounded-xl border bg-surface p-4", open ? "border-border" : "border-dashed border-border");
  return (
    <li className="relative">
      {p.comingSoon ? <div className={cls}>{body}</div> : <Link href={`/projects/${p.slug}`} className={cn(cls, "transition-colors hover:border-border-strong")}>{body}</Link>}
    </li>
  );
}

export function ProjectLadder() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["projects"], queryFn: () => api.get<ProjectSummary[]>("/projects") });
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const projects = data!;
  const done = projects.filter((p) => p.status === "COMPLETED").length;
  return (
    <>
      <PageHeader
        eyebrow="Project ladder"
        title="Ten projects, each one harder"
        description="From a CLI to-do app to a system-design capstone. Each rung unlocks when you complete the one below it — milestones done, explain-your-code passed."
      />
      {projects.length === 0 ? (
        <EmptyState icon={<GraduationCap className="size-5" />} title="The ladder is being built" description="Projects will appear here soon. Keep mastering topics — they're what every project is made of." />
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3">
            <Progress value={(done / projects.length) * 100} className="max-w-xs" label="Projects completed" />
            <span className="font-mono text-xs text-muted">{done}/{projects.length} completed</span>
          </div>
          <ol className="relative space-y-3 before:absolute before:bottom-6 before:left-[36px] before:top-6 before:w-px before:bg-border" aria-label="Project ladder, rung 1 first">
            {projects.map((p) => <Rung key={p.slug} p={p} />)}
          </ol>
        </>
      )}
    </>
  );
}
