"use client";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { useRoadmap } from "@/features/roadmap/use-roadmap";
import { cn } from "@/lib/utils";

export default function RoadmapPage() {
  const { data, error, isLoading, refetch } = useRoadmap();
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const stages = data!.stages;
  return (
    <>
      <PageHeader
        eyebrow="Your roadmap"
        title="From first line of code to job-ready"
        description={`Starting with ${data!.language === "PYTHON" ? "Python" : data!.language === "JAVASCRIPT" ? "JavaScript" : "your chosen language"}. Each stage unlocks when you pass the previous stage exam.`}
      />
      <ol className="relative space-y-3 before:absolute before:bottom-6 before:left-[19px] before:top-6 before:w-px before:bg-border">
        {stages.map((s) => (
          <li key={s.id} className="relative">
            <Link
              href={`/learn/${s.slug}`}
              className={cn("flex items-center gap-4 rounded-xl border bg-surface p-4 transition-colors hover:border-border-strong", s.unlocked ? "border-border" : "border-dashed border-border")}
            >
              <span className={cn("relative z-10 grid size-10 shrink-0 place-items-center rounded-lg border font-mono text-sm", s.passed ? "border-accent bg-accent text-accent-fg" : s.unlocked ? "border-border-strong bg-surface-2" : "border-border bg-surface text-subtle")}>
                {s.passed ? <CheckCircle2 className="size-5" /> : s.unlocked ? s.code : <Lock className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{s.title}</span>
                  {s.passed && <Badge tone="accent">Passed</Badge>}
                  {s.progress.total === 0 && <Badge>Coming soon</Badge>}
                </div>
                <p className="truncate text-sm text-muted">{s.unlocked ? s.description : s.lockReason}</p>
                {s.progress.total > 0 && (
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={s.progress.percent} className="max-w-xs" label={`${s.title} progress`} />
                    <span className="font-mono text-xs text-muted">{s.progress.mastered}/{s.progress.total}</span>
                  </div>
                )}
              </div>
              <span className="hidden text-xs text-subtle sm:block">~{s.estHours}h</span>
              <ChevronRight className="size-4 text-muted" />
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
