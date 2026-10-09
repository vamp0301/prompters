"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, ChevronRight, Clock, GitFork } from "lucide-react";
import { api } from "@/lib/api/client";
import type { PublicStage } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

type Block = { kind: "common"; stage: PublicStage } | { kind: "fork"; python: PublicStage[]; javascript: PublicStage[] };

/**
 * The API returns stages ordered by (order, track). Consecutive language-track
 * stages share an order position, so we group each run into one fork block.
 */
function toBlocks(stages: PublicStage[]): Block[] {
  const blocks: Block[] = [];
  for (const stage of stages) {
    if (stage.track === "COMMON") {
      blocks.push({ kind: "common", stage });
      continue;
    }
    const last = blocks[blocks.length - 1];
    const fork = last?.kind === "fork" ? last : null;
    const target = fork ?? { kind: "fork" as const, python: [], javascript: [] };
    if (!fork) blocks.push(target);
    (stage.track === "PYTHON" ? target.python : target.javascript).push(stage);
  }
  return blocks;
}

function countTopics(stage: PublicStage) {
  let total = 0;
  let available = 0;
  for (const m of stage.modules) {
    for (const t of m.topics) {
      total += 1;
      if (t.available) available += 1;
    }
  }
  return { total, available };
}

const trackLabel = { COMMON: null, PYTHON: "Python track", JAVASCRIPT: "JavaScript track" } as const;

function StageCard({ stage, className, nested }: { stage: PublicStage; className?: string; nested?: boolean }) {
  const Heading = nested ? "h4" : "h3";
  const { total, available } = countTopics(stage);
  const headingId = `stage-${stage.slug}`;
  return (
    <section aria-labelledby={headingId} className={cn("rounded-xl border border-border bg-surface", className)}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-2 font-mono text-xs" aria-hidden>
            {stage.code}
          </span>
          <div className="min-w-0">
            {trackLabel[stage.track] && <div className="eyebrow text-accent">{trackLabel[stage.track]}</div>}
            <Heading id={headingId} className="font-semibold tracking-tight">
              <span className="sr-only">Stage {stage.code}: </span>
              {stage.title}
            </Heading>
            {stage.description && <p className="mt-1 text-sm leading-relaxed text-muted">{stage.description}</p>}
          </div>
        </div>
        <dl className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-xs text-muted sm:flex-col sm:items-end">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Topics available</dt>
            <dd className="font-mono tabular-nums">
              <span className="text-text">{available}</span>/{total} topics live
            </dd>
          </div>
          {stage.estHours > 0 && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Estimated hours</dt>
              <Clock className="size-3.5" aria-hidden />
              <dd className="font-mono tabular-nums">~{stage.estHours}h</dd>
            </div>
          )}
        </dl>
      </div>

      {stage.targetRoles.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-5 pb-4">
          <span className="mr-1 text-xs text-subtle">Builds toward</span>
          {stage.targetRoles.map((r) => (
            <Badge key={r}>{r}</Badge>
          ))}
        </div>
      )}

      {stage.modules.length > 0 ? (
        <ul className="divide-y divide-border border-t border-border">
          {stage.modules.map((m) => {
            const live = m.topics.filter((t) => t.available).length;
            return (
              <li key={m.slug}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3 hover:bg-surface-2/60 [&::-webkit-details-marker]:hidden">
                    <ChevronRight className="size-4 shrink-0 text-subtle transition-transform group-open:rotate-90" aria-hidden />
                    <span className="min-w-0 flex-1 text-sm font-medium">{m.title}</span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-subtle">
                      {live}/{m.topics.length}
                      <span className="sr-only"> topics available</span>
                    </span>
                  </summary>
                  <div className="px-5 pb-4 pl-12">
                    {m.description && <p className="mb-3 text-sm text-muted">{m.description}</p>}
                    {m.topics.length > 0 ? (
                      <ul className="space-y-1.5">
                        {m.topics.map((t) => (
                          <li key={t.slug} className="flex items-start justify-between gap-3 text-sm">
                            <span className={cn("flex min-w-0 items-start gap-2", !t.available && "text-muted")}>
                              {t.available ? (
                                <Check className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
                              ) : (
                                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border-strong" aria-hidden />
                              )}
                              <span className="min-w-0">{t.title}</span>
                            </span>
                            {t.available ? <span className="sr-only">Available</span> : <Badge tone="warn" className="shrink-0">Soon</Badge>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-subtle">Topics are being written.</p>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border-t border-border px-5 py-4 text-sm text-subtle">Modules for this stage are being written.</p>
      )}
    </section>
  );
}

function TrackColumn({ label, stages }: { label: string; stages: PublicStage[] }) {
  return (
    <div className="min-w-0 space-y-3">
      <div className="font-mono text-xs uppercase tracking-wider text-muted">{label}</div>
      {stages.length > 0 ? stages.map((s) => <StageCard key={s.slug} stage={s} nested />) : <p className="text-sm text-subtle">Coming soon.</p>}
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="Loading roadmap">
      <Skeleton className="h-40" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}

export function PublicRoadmap() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["public", "curriculum"],
    queryFn: () => api.get<PublicStage[]>("/public/curriculum"),
    staleTime: 5 * 60 * 1000,
  });

  if (isPending) return <RoadmapSkeleton />;
  if (isError) return <ErrorState error={error} retry={() => void refetch()} />;
  if (data.length === 0) {
    return (
      <EmptyState
        title="The roadmap is being published"
        description="Stages will appear here as soon as they're ready."
        action={<Link href="/register" className={buttonClass("primary")}>Create your free account</Link>}
      />
    );
  }

  const blocks = toBlocks(data);
  let liveTotal = 0;
  let topicTotal = 0;
  for (const s of data) {
    const c = countTopics(s);
    liveTotal += c.available;
    topicTotal += c.total;
  }

  return (
    <div>
      <p className="mb-6 text-sm text-muted">
        <span className="font-mono tabular-nums text-text">{liveTotal}</span> of <span className="font-mono tabular-nums text-text">{topicTotal}</span> topics
        are live today. Topics marked <Badge tone="warn">Soon</Badge> are planned and still being written.
      </p>
      <ol className="space-y-4" aria-label="Roadmap stages">
        {blocks.map((b) =>
          b.kind === "common" ? (
            <li key={b.stage.slug}>
              <StageCard stage={b.stage} />
            </li>
          ) : (
            <li key={`fork-${b.python[0]?.slug ?? ""}-${b.javascript[0]?.slug ?? ""}`} className="rounded-xl border border-dashed border-border-strong p-3 sm:p-4">
              <div className="mb-4 flex items-start gap-2 px-1">
                <GitFork className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                <div>
                  <h3 className="text-sm font-semibold">Choose your start: Python or JavaScript — same destination</h3>
                  <p className="mt-0.5 text-xs text-muted">Pick one. Both tracks lead into the same next stage.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TrackColumn label="Python" stages={b.python} />
                <TrackColumn label="JavaScript" stages={b.javascript} />
              </div>
            </li>
          ),
        )}
      </ol>
      <div className="mt-12 flex flex-col items-start gap-4 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold tracking-tight">Get your personal roadmap</h2>
          <p className="mt-1 text-sm text-muted">Take a short placement test and skip what you already know.</p>
        </div>
        <Link href="/register" className={buttonClass("primary")}>
          Start learning <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
