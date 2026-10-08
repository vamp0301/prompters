"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BookOpen, Check, Circle, CircleDot, Flame, Network, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { ErrorState, PageHeader, Tabs } from "@/components/ui/misc";
import { paperCard, StatCard } from "@/components/ui/paper";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { ConceptImportance, ConceptRef, ConceptStatus, SkillMapView } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const mapHref = (name: string) => `/career/skills/map?name=${encodeURIComponent(name)}`;
export const conceptHref = (name: string, key: string) => `/career/skills/concept?name=${encodeURIComponent(name)}&c=${encodeURIComponent(key)}`;

export const IMPORTANCE: Record<ConceptImportance, { label: string; tone: "danger" | "warn" | "info" }> = {
  MUST: { label: "Must know", tone: "danger" },
  GOOD: { label: "Good to know", tone: "warn" },
  ADVANCED: { label: "Advanced", tone: "info" },
};

export const STATUS: Record<ConceptStatus | "NEW", { label: string; icon: typeof Check; className: string }> = {
  MASTERED: { label: "Mastered", icon: Check, className: "border-accent bg-accent text-accent-fg" },
  UNDERSTOOD: { label: "Understood", icon: CircleDot, className: "border-info bg-info-soft text-info" },
  LEARNING: { label: "Learning", icon: CircleDot, className: "border-warn bg-warn-soft text-warn" },
  NEW: { label: "Not studied", icon: Circle, className: "border-border-strong bg-surface text-subtle" },
};

export function Dots({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${label} ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("size-1.5 rounded-full", i <= value ? "bg-text" : "bg-border-strong")} />
      ))}
    </span>
  );
}

export function Frequency({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-accent-2" role="img" aria-label={`Asked in interviews: ${value} of 5`}>
      {Array.from({ length: value }, (_, i) => (
        <Flame key={i} className="size-3" aria-hidden />
      ))}
    </span>
  );
}

function ConceptCard({ skill, c, status }: { skill: string; c: ConceptRef; status: ConceptStatus | "NEW" }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <Link href={conceptHref(skill, c.key)} className={cn(paperCard, "paper-lift group flex h-full flex-col gap-2 p-3.5")}>
      <div className="flex items-start gap-2.5">
        <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", s.className)} title={s.label}>
          <Icon className="size-3" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-[14px] font-semibold leading-snug group-hover:text-accent">{c.title}</span>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-[30px] text-[10px] text-muted">
        <Badge tone={IMPORTANCE[c.importance].tone}>{IMPORTANCE[c.importance].label}</Badge>
        <span className="inline-flex items-center gap-1">
          <Dots value={c.difficulty} label="Difficulty" />
        </span>
        <Frequency value={c.frequency} />
        <span className="sr-only">Status: {s.label}</span>
      </div>
    </Link>
  );
}

type Filter = "ALL" | ConceptImportance;

export function MapView({ name }: { name: string }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["knowledge", "map", name], queryFn: () => api.get<SkillMapView>(`/career/knowledge/map?name=${encodeURIComponent(name)}`), enabled: !!name, staleTime: 30_000 });

  const back = (
    <Link href="/career/skills" className="inline-flex items-center gap-1 text-xs text-muted hover:text-text">
      <ArrowLeft className="size-3.5" aria-hidden /> All my skills
    </Link>
  );
  if (isLoading)
    return (
      <div className="space-y-6">
        {back}
        <div role="status" className={cn(paperCard, "flex items-center gap-3 p-6 text-sm text-muted")}>
          <Network className="size-5 animate-pulse text-accent" aria-hidden /> Mapping {name} into the concepts you need… the first time takes a few seconds, then it&apos;s instant.
        </div>
      </div>
    );
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const d = data!;
  const pct = d.stats.concepts ? Math.round((d.stats.mastered / d.stats.concepts) * 100) : 0;
  const statusOf = (k: string): ConceptStatus | "NEW" => d.progress[k]?.status ?? "NEW";

  return (
    <div className="space-y-6">
      {back}
      <PageHeader
        eyebrow={d.skill.curated ? "Learning track" : "Knowledge map · from your resume"}
        title={d.skill.name}
        description={d.map.summary}
        actions={
          !d.skill.curated ? (
            <Link href={`/career/skills/guide?name=${encodeURIComponent(d.skill.name)}`} className={buttonClass("secondary", "md")}>
              <BookOpen className="size-4" aria-hidden /> Overview guide
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Concepts" value={d.stats.concepts} hint={`${d.map.domains.length} domains`} tone="green" />
        <StatCard label="Mastered" value={`${d.stats.mastered}`} hint={`${pct}% · ${d.stats.understood} understood`} tone="orange" />
        <StatCard label="Must know" value={`${d.stats.mustKnowMastered}/${d.stats.mustKnow}`} hint="mastered" tone="pink" />
        <StatCard label="Explain score" value={d.stats.averageExplain ?? "—"} hint={d.stats.averageExplain === null ? "Explain a concept to see it" : "average of your explanations"} tone="blue" />
      </div>

      <section aria-labelledby="progress-h" className={cn(paperCard, "p-5")}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="progress-h" className="font-display text-xl">
            Your progress
          </h2>
          <span className="text-xs text-muted">Mastered = you explained it well, not just read it.</span>
        </div>
        <Progress value={pct} className="mt-3" label={`${d.skill.name} mastered ${pct}%`} />
        <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {d.map.domains.map((dm) => {
            const p = d.domains.find((x) => x.key === dm.key)!;
            return (
              <li key={dm.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 text-sm">
                <a href={`#d-${dm.key}`} className="hover:text-accent">
                  {dm.title}
                </a>
                <span className="font-mono text-xs text-muted tabular-nums">
                  {p.mastered}/{p.total}
                </span>
                <Progress value={(p.mastered / p.total) * 100} className="col-span-2 h-1" label={`${dm.title} ${p.mastered} of ${p.total}`} />
              </li>
            );
          })}
        </ul>
      </section>

      {d.claims.length > 0 && (
        <section aria-labelledby="claims-h" className={cn(paperCard, "p-5")}>
          <h2 id="claims-h" className="font-display text-xl">
            Your resume claims about {d.skill.name}
          </h2>
          <p className="mt-1 text-xs text-muted">An interviewer will drill into each one. Be ready for every step, easiest first.</p>
          <ul className="mt-4 space-y-4">
            {d.claims.map((c) => (
              <li key={c.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium">&ldquo;{c.claim}&rdquo;</p>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                    <Target className="size-3.5" aria-hidden /> Expected depth <Dots value={Math.min(5, Math.round(c.depth * (5 / 7)) || 1)} label="Expected depth" />
                  </span>
                </div>
                {c.drill.length ? (
                  <ol className="mt-3 space-y-1.5 border-l-2 border-accent/30 pl-3 text-[13px]">
                    {c.drill.map((q) => (
                      <li key={q.id}>
                        <Link href={`/career/prep/${q.planId}`} className="hover:text-accent">
                          {q.question}
                        </Link>
                        {q.status === "CONFIDENT" && <Check className="ml-1 inline size-3.5 text-accent" aria-label="Confident" />}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-xs text-muted">Generate your Top 100 to see the questions an interviewer would ask about this claim.</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { value: "ALL", label: "All" },
            { value: "MUST", label: "🔥 Must know" },
            { value: "GOOD", label: "Good to know" },
            { value: "ADVANCED", label: "Advanced" },
          ]}
        />
        <ul className="flex flex-wrap gap-3 text-[11px] text-muted" aria-label="Legend">
          {(["MASTERED", "UNDERSTOOD", "LEARNING", "NEW"] as const).map((k) => {
            const S = STATUS[k];
            return (
              <li key={k} className="inline-flex items-center gap-1.5">
                <span className={cn("grid size-4 place-items-center rounded-full border", S.className)}>
                  <S.icon className="size-2.5" aria-hidden />
                </span>
                {S.label}
              </li>
            );
          })}
          <li className="inline-flex items-center gap-1.5">
            <Dots value={3} label="Difficulty" /> difficulty
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Frequency value={2} /> asked in interviews
          </li>
        </ul>
      </div>

      {d.map.domains.map((dm, i) => {
        const concepts = dm.concepts.filter((c) => filter === "ALL" || c.importance === filter);
        if (!concepts.length) return null;
        return (
          <section key={dm.key} id={`d-${dm.key}`} aria-labelledby={`h-${dm.key}`} className="scroll-mt-24 space-y-3">
            <h2 id={`h-${dm.key}`} className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-accent-2">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-display text-2xl">{dm.title}</span>
              <span className="text-xs text-muted">{dm.concepts.length} concepts</span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {concepts.map((c) => (
                <li key={c.key}>
                  <ConceptCard skill={d.skill.name} c={c} status={statusOf(c.key)} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {d.map.related.length > 0 && (
        <p className="text-xs text-muted">
          Related skills: <span className="text-text">{d.map.related.join(" · ")}</span>
        </p>
      )}
      <p className="flex items-center gap-1.5 text-[11px] text-subtle">
        <ArrowRight className="size-3" aria-hidden />
        {d.skill.curated ? "Structure curated by Prompters; each chapter is written by AI and checked against a fixed format." : "This map and its chapters are written by AI and checked against a fixed format — verify anything you'll rely on."}
      </p>
    </div>
  );
}
