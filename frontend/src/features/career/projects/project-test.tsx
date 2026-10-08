"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { ErrorState, Skeleton } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { ApiFocus, ProjectModule, ProjectReport, ProjectTestMode, ProjectTestResult, ProjectTestView } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { InlineError } from "../shared";
import { LevelBadge, SectionTitle, track } from "./project-ui";

const MODES: { mode: ProjectTestMode; title: string; copy: string }[] = [
  { mode: "QUICK", title: "Quick test", copy: "10 questions, two per level" },
  { mode: "DEEP", title: "Project deep dive", copy: "All 20 questions, L1 → L5" },
  { mode: "DRILL", title: "Interviewer drill-down", copy: "Adaptive: climbs on good answers, digs into weak ones" },
  { mode: "SENIOR", title: "Senior engineer challenge", copy: "L4–L5: debugging, scale, failures" },
  { mode: "DEFENSE", title: "Resume defense", copy: "Only questions on your resume claims" },
  { mode: "API", title: "API interview", copy: "APIs, services and the whole architecture" },
];

const reportKey = (id: string) => ["career", "projects", id, "report"] as const;

export function ProjectTest({ project }: { project: ProjectModule }) {
  const [test, setTest] = useState<ProjectTestView | null>(null);
  const qc = useQueryClient();
  const start = useMutation({
    meta: { silent: true },
    mutationFn: ({ mode, focus }: { mode: ProjectTestMode; focus?: ApiFocus }) => api.post<ProjectTestView>(`/career/projects/${project.id}/tests`, { mode, focus }),
    onSuccess: setTest,
  });
  if (test) return <Runner project={project} test={test} onChange={setTest} onDone={() => qc.invalidateQueries({ queryKey: reportKey(project.id) })} onRestart={() => setTest(null)} />;
  const hasClaims = (project.content?.claimDefense.length ?? 0) > 0;
  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Knowledge test" title="How well do you actually know this project?">
        Answer in your own words, as you would in an interview. Each answer is scored on correctness, depth, reasoning and clarity — not on grammar or accent.
      </SectionTitle>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {MODES.filter((m) => m.mode !== "API").map((m) => {
          const off = m.mode === "DEFENSE" && !hasClaims;
          return (
            <li key={m.mode}>
              <button
                type="button"
                disabled={off || start.isPending}
                onClick={() => start.mutate({ mode: m.mode })}
                className="h-full w-full rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent disabled:opacity-50"
              >
                <span className="block font-medium">{m.title}</span>
                <span className="mt-1 block text-xs text-muted">{off ? "No resume claims for this project" : m.copy}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div>
        <p className="eyebrow text-accent">API interview</p>
        <p className="mt-1 text-sm text-muted">Questions about the APIs and services this project uses, L1 → L5. “Full system” adds an endpoint drill-down and the final architecture test.</p>
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="API interview focus">
          {project.integrations.focuses.map((f) => (
            <li key={f}>
              <button
                type="button"
                disabled={start.isPending}
                onClick={() => start.mutate({ mode: "API", focus: f })}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm transition-colors hover:border-accent disabled:opacity-50"
              >
                {f === "ALL" ? "Full system" : (project.integrations.kinds.find((k) => k.kind === f)?.label ?? f)}
              </button>
            </li>
          ))}
        </ul>
        {project.integrations.focuses.length <= 1 && <p className="mt-1 text-xs text-muted">No APIs or services are listed for this project yet — add them in Facts.</p>}
      </div>
      <InlineError error={start.error} />
    </div>
  );
}

function Runner({ project, test, onChange, onDone, onRestart }: { project: ProjectModule; test: ProjectTestView; onChange: (t: ProjectTestView) => void; onDone: () => void; onRestart: () => void }) {
  const uid = useId();
  const [answer, setAnswer] = useState("");
  const submit = useMutation({
    meta: { silent: true },
    mutationFn: () => api.post<ProjectTestView>(`/career/projects/${project.id}/tests/${test.id}/answer`, { answer }),
    onSuccess: (t) => {
      onChange(t);
      setAnswer("");
      if (t.status === "COMPLETED") onDone();
    },
  });
  const pct = test.progress.total ? (test.progress.answered / test.progress.total) * 100 : 0;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow text-accent">{MODES.find((m) => m.mode === test.mode)?.title}{test.isRetest ? " · re-interview" : ""}</p>
        <Button variant="ghost" size="sm" onClick={onRestart}>
          Choose another test
        </Button>
      </div>
      <Progress value={pct} label={`${test.progress.answered} answered`} />
      {test.last && (
        <div role="status" className="rounded-lg border border-border bg-surface-2/60 p-3 text-[13px]">
          <p>
            Last answer: <span className="font-mono font-semibold">{test.last.score}%</span>
            {test.last.covered.length > 0 && <> · covered {test.last.covered.join(", ")}</>}
            {test.last.missing.length > 0 && <> · missed {test.last.missing.join(", ")}</>}
          </p>
        </div>
      )}
      {test.current ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (answer.trim()) submit.mutate();
          }}
        >
          <p className="flex items-start gap-2 text-lg leading-snug">
            <LevelBadge level={test.current.level} />
            <span>
              {test.current.isFollowUp && <span className="mr-1 text-accent-2">Follow-up:</span>}
              {test.current.question}
            </span>
          </p>
          <p className="font-mono text-[10px] uppercase tracking-wide text-subtle">
            {test.current.dimension.toLowerCase()} · {test.current.skill}
          </p>
          <Field label="Your answer" htmlFor={`${uid}-a`}>
            <Textarea id={`${uid}-a`} value={answer} onChange={(e) => setAnswer(e.target.value)} className="min-h-32" maxLength={6000} placeholder="Explain it as you would to the interviewer…" />
          </Field>
          <InlineError error={submit.error} />
          <Button type="submit" disabled={!answer.trim()} loading={submit.isPending}>
            Submit answer <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      ) : (
        test.result && <Results result={test.result} project={project} />
      )}
    </div>
  );
}

const STATUS_TONE = { STRONG: "accent", MODERATE: "warn", WEAK: "danger" } as const;

function Results({ result, project }: { result: ProjectTestResult; project: ProjectModule }) {
  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Result" title={`Overall ${result.overall ?? "—"}% · highest level passed L${result.highestLevelPassed}`}>
        Every score below shows what it rests on.
      </SectionTitle>
      <Dimensions dims={result.dimensions} />
      <Skills result={result} project={project} />
    </div>
  );
}

function Dimensions({ dims }: { dims: ProjectTestResult["dimensions"] }) {
  const scored = dims.filter((d) => d.score !== null);
  return (
    <ul className="space-y-3" aria-label="Scores by dimension">
      {scored.map((d) => (
        <li key={d.dimension}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium capitalize">{d.dimension.toLowerCase()} understanding</span>
            <span className="font-mono tabular-nums">{d.score}%</span>
          </div>
          <Progress value={d.score ?? 0} label={`${d.dimension} ${d.score}%`} />
          <ul className="mt-1 space-y-0.5 text-[11px] text-muted">
            {d.evidence.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </li>
      ))}
      {dims.filter((d) => d.score === null).length > 0 && (
        <li className="text-xs text-subtle">Not tested yet: {dims.filter((d) => d.score === null).map((d) => d.dimension.toLowerCase()).join(", ")}.</li>
      )}
    </ul>
  );
}

function Skills({ result, project }: { result: ProjectTestResult; project: ProjectModule }) {
  return (
    <div className="space-y-2">
      <h3 className="eyebrow text-text">Skills in this project</h3>
      <ul className="flex flex-wrap gap-1.5">
        {result.skills.map((s) => (
          <li key={s.key}>
            <Badge tone={STATUS_TONE[s.status]}>
              {s.skill} · {s.status.toLowerCase()} {s.score}%
            </Badge>
          </li>
        ))}
        {result.unknownSkills.map((s) => (
          <li key={s}>
            <Badge>{s} · unknown</Badge>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        Weak skills become recommendations on your dashboard.{" "}
        <Link href={`/career/projects/${project.id}?tab=gaps`} className="text-accent underline underline-offset-4">
          See the learning plan
        </Link>
      </p>
    </div>
  );
}

/** Skill gaps across every test on this project, the learning loop for each, and first-vs-latest progress. */
export function ProjectGaps({ project }: { project: ProjectModule }) {
  const q = useQuery({ queryKey: reportKey(project.id), queryFn: () => api.get<ProjectReport>(`/career/projects/${project.id}/report`) });
  if (q.isLoading) return <Skeleton className="h-40" />;
  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const r = q.data!;
  if (!r.tests.length)
    return <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">Take a knowledge test first — gaps come from your answers, not guesses.</p>;
  const weak = r.skills.filter((s) => s.status !== "STRONG");
  return (
    <div className="space-y-8">
      <section>
        <SectionTitle eyebrow="Skill gaps" title="What to fix before an interviewer finds it" />
        <div className="grid gap-3 md:grid-cols-2">
          {(["STRONG", "MODERATE", "WEAK"] as const).map((st) => (
            <div key={st} className="rounded-lg border border-border bg-surface p-3">
              <p className="eyebrow text-text">{st.toLowerCase()}</p>
              <p className="mt-1 text-sm">{r.skills.filter((s) => s.status === st).map((s) => `${s.skill} (${s.score}%)`).join(", ") || "—"}</p>
            </div>
          ))}
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="eyebrow text-text">unknown</p>
            <p className="mt-1 text-sm">{r.unknownSkills.join(", ") || "—"}</p>
          </div>
        </div>
      </section>
      {weak.length > 0 && (
        <section>
          <SectionTitle eyebrow="Learning loop" title="Learn → practise → project question → re-interview" />
          <ol className="space-y-3">
            {weak.map((s) => (
              <li key={s.key} className="rounded-lg border border-border bg-surface p-3">
                <p className="font-medium">
                  {s.skill} <span className="font-mono text-xs text-muted">{s.score}%</span>
                </p>
                <ol className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
                  <li>
                    <Link href={`/career/skills/map?name=${encodeURIComponent(s.skill)}`} onClick={() => track("PROJECT_REVISION_STARTED", project.id, { skill: s.skill })} className="text-accent underline underline-offset-4">
                      1. Learn {s.skill}
                    </Link>
                  </li>
                  <li aria-hidden>→</li>
                  <li>
                    <Link href={`/career/skills/guide?name=${encodeURIComponent(s.skill)}`} className="text-accent underline underline-offset-4">
                      2. Practise
                    </Link>
                  </li>
                  <li aria-hidden>→</li>
                  <li>3. Answer the {project.name} questions on it (Questions tab)</li>
                  <li aria-hidden>→</li>
                  <li>4. Re-interview (Test tab → drill-down)</li>
                </ol>
              </li>
            ))}
          </ol>
        </section>
      )}
      <section>
        <SectionTitle eyebrow="Scores" title="By dimension, with evidence" />
        <Dimensions dims={r.dimensions} />
      </section>
      {r.progress && r.progress.some((p) => p.first !== null) && (
        <section>
          <SectionTitle eyebrow="Re-interview" title="First test vs latest" />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                <th scope="col" className="pb-2 font-medium">Dimension</th>
                <th scope="col" className="pb-2 text-right font-medium">First</th>
                <th scope="col" className="pb-2 text-right font-medium">Latest</th>
              </tr>
            </thead>
            <tbody>
              {r.progress
                .filter((p) => p.first !== null)
                .map((p) => (
                  <tr key={p.dimension} className="border-t border-border">
                    <td className="py-1.5 capitalize">{p.dimension.toLowerCase()}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-muted">{p.first}%</td>
                    <td className={cn("py-1.5 text-right font-mono tabular-nums", (p.latest ?? 0) > (p.first ?? 0) ? "text-accent" : "")}>
                      {(p.latest ?? 0) > (p.first ?? 0) ? <Check className="mr-1 inline size-3" aria-hidden /> : (p.latest ?? 0) < (p.first ?? 0) ? <Repeat className="mr-1 inline size-3" aria-hidden /> : null}
                      {p.latest}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
