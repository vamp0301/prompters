"use client";
import Link from "next/link";
import { use } from "react";
import { Lock, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { TopicRow } from "@/features/roadmap/topic-row";
import { useRoadmap } from "@/features/roadmap/use-roadmap";

export default function StagePage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage: slug } = use(params);
  const { data, error, isLoading, refetch } = useRoadmap();
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const s = data!.stages.find((x) => x.slug === slug);
  if (!s) return <EmptyState title="Stage not found" description="This stage isn't part of your roadmap." action={<Link href="/learn" className={buttonClass("secondary", "sm")}>Back to roadmap</Link>} />;

  return (
    <>
      <PageHeader
        eyebrow={`Stage ${s.code}`}
        title={s.title}
        description={s.description}
        actions={s.examSlug && s.unlocked ? <Link href={`/mock-tests/${s.examSlug}`} className={buttonClass(s.passed ? "secondary" : "primary")}><Timer className="size-4" /> {s.passed ? "Retake stage exam" : "Take stage exam"}</Link> : null}
      />
      {!s.unlocked && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm">
          <Lock className="size-4 text-warn" /> {s.lockReason}
        </div>
      )}
      {s.progress.total > 0 && (
        <Card className="mb-6 flex flex-wrap items-center gap-6 p-5">
          <div className="min-w-48 flex-1">
            <div className="mb-2 flex justify-between text-sm"><span className="text-muted">Topics mastered</span><span className="font-mono">{s.progress.mastered}/{s.progress.total}</span></div>
            <Progress value={s.progress.percent} label="Stage progress" />
          </div>
          <div className="text-sm"><div className="text-muted">Stage exam</div><div className="font-medium">{s.passed ? `Passed${s.bestExamScore ? ` · ${Math.round(s.bestExamScore)}%` : ""}` : s.bestExamScore ? `Best ${Math.round(s.bestExamScore)}%` : "Not attempted"}</div></div>
          <div className="text-sm"><div className="text-muted">Estimated</div><div className="font-medium">~{s.estHours} hours</div></div>
        </Card>
      )}
      <div className="space-y-4">
        {s.modules.map((m) => (
          <Card key={m.id} className="p-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-3 pb-1 pt-3">
              <div>
                <h2 className="font-semibold">{m.title}</h2>
                <p className="text-xs text-muted">{m.description}</p>
              </div>
              <Badge>{m.topics.filter((t) => t.state === "MASTERED").length}/{m.topics.filter((t) => t.hasContent).length} mastered</Badge>
            </div>
            <ul className="mt-1">{m.topics.map((t) => <TopicRow key={t.id} topic={t} />)}</ul>
          </Card>
        ))}
      </div>
    </>
  );
}
