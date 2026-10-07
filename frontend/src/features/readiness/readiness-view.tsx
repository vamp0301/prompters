"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, ShieldCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { InkAnnotation, NotebookSection } from "@/components/ui/paper";
import { api } from "@/lib/api/client";
import type { Readiness } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ScoreHistoryChart } from "./score-history-chart";

const FACTORS: Record<string, { label: string; explain: string }> = {
  mastery: { label: "Topic mastery", explain: "Share of the topics your target role needs that you've mastered (80%+ on a fresh quiz)." },
  projects: { label: "Projects", explain: "Completed builds and ladder projects, weighted by how independently you built them." },
  dsa: { label: "DSA", explain: "Share of data-structures & algorithms topics you've mastered." },
  recall: { label: "Recall", explain: "How well you remember mastered topics, from your latest spaced-review scores." },
  interview: { label: "Interview", explain: "Interview-practice answer scores and coverage, blended with recent mock-test scores." },
  resume: { label: "Resume & profile", explain: "How complete your profile is: education, goal, skills, headline, summary, links, target companies." },
};

function Delta({ label, past, now }: { label: string; past: number | null; now: number }) {
  if (past === null)
    return (
      <div className="rounded-lg border border-border bg-surface p-3">
        <div className="text-xs text-muted">{label}</div>
        <div className="mt-0.5 text-sm text-subtle">Not enough history yet</div>
      </div>
    );
  const d = now - past;
  const Icon = d > 0 ? ArrowUpRight : d < 0 ? ArrowDownRight : Minus;
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 flex items-center gap-1.5">
        <Icon className={cn("size-4", d > 0 ? "text-accent" : d < 0 ? "text-danger" : "text-muted")} aria-hidden />
        <span className="font-mono text-lg font-semibold tabular-nums">{d > 0 ? "+" : ""}{d}</span>
        <span className="text-xs text-subtle">from {past}</span>
      </div>
    </div>
  );
}

export function ReadinessView() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["readiness"], queryFn: () => api.get<Readiness>("/readiness") });
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const r = data!;
  const wSum = Object.values(r.weights).reduce((a, b) => a + b, 0) || 1;
  const roleLabel = r.role === "FULLSTACK" ? "Full-stack" : r.role === "AI" ? "AI Engineer" : r.role.charAt(0) + r.role.slice(1).toLowerCase();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Readiness" title="How interview-ready are you?" description={`One honest number for your target role: ${r.role === "SDE" ? "SDE" : r.role === "DEVOPS" ? "DevOps" : roleLabel}.`} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <NotebookSection className="flex flex-col gap-4">
            <div className="font-mono text-[11px] font-semibold tracking-[0.2em] text-accent-2">INTERVIEW READINESS</div>
            <div className="flex items-end gap-3">
              <span className="font-display text-6xl font-semibold leading-none tabular-nums">{r.score}</span>
              <span className="pb-1 font-mono text-lg text-subtle">/ 100</span>
              <InkAnnotation className="mb-1 ml-auto -rotate-3 text-2xl">{r.score >= 80 ? "Keep it warm." : r.score >= 60 ? "Almost there." : "Focus here next ↓"}</InkAnnotation>
            </div>
            <div className="h-2.5 overflow-hidden rounded-sm border border-border bg-surface-2" role="img" aria-label={`Readiness ${r.score} out of 100`}>
              <div className="h-full bg-text/85" style={{ width: `${r.score}%` }} />
            </div>
            <div>
              <div className="text-lg font-semibold">{r.status}</div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><ShieldCheck className="size-3.5" aria-hidden /> Computed only from your real activity — nothing self-reported.</p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 text-left">
              <Delta label="Last 7 days" past={r.sevenDaysAgo} now={r.score} />
              <Delta label="Last 30 days" past={r.thirtyDaysAgo} now={r.score} />
            </div>
        </NotebookSection>

        <Card>
          <CardHeader title="Score over time" description="Last 90 days. Hover or use ← → to inspect points." />
          <CardBody>
            {r.history.length > 1 ? (
              <ScoreHistoryChart points={r.history} />
            ) : (
              <p className="py-10 text-center text-sm text-muted">Your trend line appears after your score changes. Master a topic or finish a build and check back.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="What makes up your score" description="Each factor is 0–100; the weight is how much it counts." />
          <CardBody>
            <ul className="space-y-4">
              {Object.entries(r.factors).map(([k, v]) => {
                const f = FACTORS[k] ?? { label: k, explain: "" };
                const w = Math.round(((r.weights[k] ?? 0) / wSum) * 100);
                return (
                  <li key={k}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium">{f.label} <span className="font-mono text-xs font-normal text-subtle">· weight {w}%</span></span>
                      <span className="font-mono tabular-nums">{v}</span>
                    </div>
                    <Progress value={v} label={f.label} tone={v < 35 ? "warn" : "accent"} />
                    <p className="mt-1 text-xs text-muted">{f.explain}</p>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Next 3 actions" description="The fastest ways to move your score." />
            <CardBody>
              {r.nextActions.length ? (
                <ol className="space-y-2">
                  {r.nextActions.map((a, i) => (
                    <li key={a.href + i}>
                      <Link href={a.href} className="group flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-border-strong">
                        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-surface-2 font-mono text-xs">{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium group-hover:text-accent">{a.label}</span>
                          <span className="block text-xs text-muted">{a.reason}</span>
                        </span>
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted">Nothing urgent — keep your daily Practice 10 going.</p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Weakest areas" />
            <CardBody>
              {r.weakestAreas.length ? (
                <ul className="space-y-3">
                  {r.weakestAreas.map((w) => (
                    <li key={w.key}>
                      <div className="mb-1 flex justify-between text-sm"><span>{w.label}</span><span className="font-mono text-xs text-muted">{w.value}%</span></div>
                      <Progress value={w.value} tone="warn" label={w.label} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Every area is at 100%. Impressive — now go apply.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="By area" description="Stage progress plus projects, interview and recall." />
        <CardBody>
          <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {r.areas.map((a) => (
              <li key={a.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                <span className="truncate text-sm">{a.label}</span>
                <span className="font-mono text-xs tabular-nums text-muted">{a.value}%</span>
                <Progress value={a.value} label={a.label} className="col-span-2" />
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
