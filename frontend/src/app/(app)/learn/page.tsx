"use client";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { useRoadmap } from "@/features/roadmap/use-roadmap";
import { StudyLanguage } from "@/features/roadmap/study-language";
import { cn } from "@/lib/utils";
import { paperCard, StudyStamp } from "@/components/ui/paper";

export default function RoadmapPage() {
  const { data, error, isLoading, refetch } = useRoadmap();
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const stages = data!.stages;
  // The first unlocked stage not yet passed is where the learner is now.
  const currentId = stages.find((x) => x.unlocked && !x.passed)?.id;
  return (
    <>
      <PageHeader
        eyebrow="Your roadmap"
        title="From first line of code to job-ready"
        description={`Studying in ${data!.language === "PYTHON" ? "Python" : data!.language === "JAVASCRIPT" ? "JavaScript" : "your chosen language"} — switch any time below. Each stage unlocks when you pass the previous stage exam.`}
      />
      <div className="glass -mt-2 mb-6 rounded-xl px-4 py-3">
        <StudyLanguage />
      </div>
      <ol className="relative space-y-4 before:absolute before:bottom-8 before:left-[19px] before:top-8 before:border-l before:border-dashed before:border-border-strong">
        {stages.map((s) => (
          <li key={s.id} className="relative">
            <Link
              href={`/learn/${s.slug}`}
              className={cn(paperCard, "paper-lift flex items-center gap-4 p-4", !s.unlocked && "border-dashed bg-surface/60 shadow-none")}
            >
              <span className={cn("relative z-10 grid size-10 shrink-0 place-items-center rounded-lg border font-mono text-sm", s.passed ? "border-accent bg-accent text-accent-fg" : s.unlocked ? "border-border-strong bg-surface-2" : "border-border bg-surface text-subtle")}>
                {s.passed ? <CheckCircle2 className="size-5" /> : s.unlocked ? s.code : <Lock className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] tracking-[0.18em] text-subtle">STAGE {s.code}</div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg font-semibold">{s.title}</span>
                  {s.passed ? (
                    <StudyStamp>✓ PASSED</StudyStamp>
                  ) : s.id === currentId ? (
                    <StudyStamp tone="red">→ CURRENT</StudyStamp>
                  ) : !s.unlocked ? (
                    <StudyStamp tone="muted">○ LOCKED</StudyStamp>
                  ) : null}
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
