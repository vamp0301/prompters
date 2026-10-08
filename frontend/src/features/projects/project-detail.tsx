"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ExternalLink, GitBranch, Lightbulb, Lock, Send, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { ErrorState, PageSkeleton } from "@/components/ui/misc";
import { Progress, ScoreRing } from "@/components/ui/progress";
import { WorkStatusBadge } from "@/features/shared/status-badge";
import { api } from "@/lib/api/client";
import type { ProjectDetail, ProjectHintResult, ProjectSubmitResult } from "@/lib/api/types";
import { cn, relativeTime } from "@/lib/utils";

const REPO_RE = /^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\//;
const HINT_LEVEL = ["Concept", "Step", "Partial code"];

function CheckList({ items, label, initialDone = 0, onChange }: { items: { title: string; description?: string }[]; label: string; initialDone?: number; onChange?: (done: number) => void }) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map((_, i) => i < initialDone));
  const toggle = (i: number) => {
    const next = checked.map((c, j) => (j === i ? !c : c));
    setChecked(next);
    onChange?.(next.filter(Boolean).length);
  };
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-surface-2">
              <input type="checkbox" checked={checked[i]} onChange={() => toggle(i)} className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]" />
              <span className="min-w-0">
                <span className={cn("block text-sm", checked[i] && "text-muted line-through")}>{it.title}</span>
                {it.description && <span className="block text-xs text-muted">{it.description}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

function Hints({ project }: { project: ProjectDetail }) {
  const qc = useQueryClient();
  const [independence, setIndependence] = useState<number | null>(null);
  const reveal = useMutation({
    mutationFn: () => api.post<ProjectHintResult>(`/projects/${project.slug}/hint`),
    onSuccess: (r) => {
      setIndependence(r.independenceScore);
      qc.setQueryData<ProjectDetail>(["project", project.slug], (old) => (old ? { ...old, hints: { ...old.hints, revealed: r.revealed } } : old));
    },
  });
  const { total, revealed } = project.hints;
  if (total === 0) return <p className="text-sm text-muted">This project has no hints. You&apos;ve got this.</p>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">Stuck? Hints go from concept → step → partial code. Each one lowers your independence score for this project, so try for 15 minutes first.</p>
      {revealed.length > 0 && (
        <ol className="space-y-2">
          {revealed.map((h, i) => (
            <li key={i} className="rounded-lg border border-warn/30 bg-warn-soft p-3 text-sm">
              <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-warn">Hint {i + 1} · {HINT_LEVEL[i] ?? "Hint"}</div>
              <Markdown className="text-sm">{h}</Markdown>
            </li>
          ))}
        </ol>
      )}
      {independence !== null && (
        <p role="status" className="text-xs text-muted">Independence score for this project is now <span className="font-mono text-text">{Math.round(independence)}</span>/100.</p>
      )}
      {revealed.length < total ? (
        <Button variant="secondary" size="sm" onClick={() => reveal.mutate()} loading={reveal.isPending} disabled={!project.unlocked}>
          <Lightbulb className="size-4" aria-hidden /> Reveal hint {revealed.length + 1} of {total} (costs independence)
        </Button>
      ) : (
        <p className="text-xs text-subtle">All {total} hints revealed.</p>
      )}
    </div>
  );
}

function SubmissionResult({ result }: { result: ProjectSubmitResult }) {
  const s = result.submission;
  return (
    <Card className={result.complete ? "border-accent/40" : "border-warn/40"} role="status" aria-live="polite">
      <CardBody className="space-y-4">
        <div className="flex items-start gap-3">
          {result.complete ? <CheckCircle2 className="size-6 shrink-0 text-accent" aria-hidden /> : <XCircle className="size-6 shrink-0 text-warn" aria-hidden />}
          <div>
            <h3 className="font-semibold">{result.complete ? "Project complete — next rung unlocked" : "Not complete yet"}</h3>
            <p className="text-sm text-muted">{result.complete ? "You built it and explained it. That's proof." : result.reason}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <ScoreRing value={s.explainScore} size={96} stroke={8} label="Explain score" sub="Explain" />
          <ScoreRing value={s.independenceScore} size={96} stroke={8} label="Independence score" sub="Independence" />
        </div>
        <ul className="space-y-3">
          {result.feedback.map((f, i) => (
            <li key={i} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">{f.question}</p>
                <span className="shrink-0 font-mono text-sm tabular-nums">{Math.round(f.score)}</span>
              </div>
              <Progress value={f.score} tone={f.score >= 50 ? "accent" : "warn"} className="mt-2" label={`Score for question ${i + 1}`} />
              {f.missing.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  Ideas to mention: {f.missing.map((m) => <Badge key={m} tone="warn">{m.split("|")[0]}</Badge>)}
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

/** Keyed by submission version so the form re-seeds from the server after each submit. */
function ProjectWork({ project, result, onResult }: { project: ProjectDetail; result: ProjectSubmitResult | null; onResult: (r: ProjectSubmitResult) => void }) {
  const qc = useQueryClient();
  const sub = project.submission;
  const [milestonesDone, setMilestonesDone] = useState(() => Math.min(sub?.milestonesDone ?? 0, project.milestones.length));
  const [repoUrl, setRepoUrl] = useState(sub?.repoUrl ?? "");
  const [liveUrl, setLiveUrl] = useState(sub?.liveUrl ?? "");
  const [approach, setApproach] = useState(sub?.howIBuiltIt?.approach ?? "");
  const [bugFixed, setBugFixed] = useState(sub?.howIBuiltIt?.bugFixed ?? "");
  const [tradeoff, setTradeoff] = useState(sub?.howIBuiltIt?.tradeoff ?? "");
  const [answers, setAnswers] = useState<string[]>(() => project.explainQuestions.map((q) => sub?.explainAnswers?.find((a) => a.question === q)?.answer ?? ""));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = useMutation({
    mutationFn: () =>
      api.post<ProjectSubmitResult>(`/projects/${project.slug}/submit`, {
        repoUrl: repoUrl.trim(),
        liveUrl: liveUrl.trim(),
        howIBuiltIt: { approach: approach.trim(), bugFixed: bugFixed.trim(), tradeoff: tradeoff.trim() },
        milestonesDone,
        explainAnswers: answers.map((a) => a.trim()),
      }),
    onSuccess: (r) => {
      onResult(r);
      qc.invalidateQueries({ queryKey: ["project", project.slug] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["readiness"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["journey"] });
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!REPO_RE.test(repoUrl.trim())) errs.repoUrl = "Use a https:// GitHub, GitLab or Bitbucket URL.";
    if (liveUrl.trim() && !/^https?:\/\/\S+$/.test(liveUrl.trim())) errs.liveUrl = "Enter a full URL starting with https://";
    if (approach.trim().length < 30) errs.approach = "Describe your approach in a few sentences (30+ characters).";
    if (bugFixed.trim().length < 20) errs.bugFixed = "Describe one bug you fixed (20+ characters).";
    if (tradeoff.trim().length < 20) errs.tradeoff = "Describe one trade-off you made (20+ characters).";
    answers.forEach((a, i) => {
      if (!a.trim()) errs[`q${i}`] = "Answer this question in your own words.";
    });
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    submit.mutate();
  };

  const disabled = !project.unlocked;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Milestones" description={`${milestonesDone}/${project.milestones.length} done — tick them as you go. Every milestone must be done to complete the project.`} />
        <CardBody className="pt-3">
          <CheckList items={project.milestones} label="Milestones" initialDone={milestonesDone} onChange={setMilestonesDone} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Hints" />
        <CardBody className="pt-3"><Hints project={project} /></CardBody>
      </Card>

      {result && <SubmissionResult result={result} />}

      <Card>
        <CardHeader title={sub ? "Update your submission" : "Submit your project"} description="Your repo, how you built it, and your answers about your own code. Write it yourself — this is your interview story." />
        <CardBody>
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <fieldset disabled={disabled} className="space-y-5 disabled:opacity-60">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Repository URL" htmlFor="repoUrl" error={errors.repoUrl} hint="GitHub, GitLab or Bitbucket">
                  <Input id="repoUrl" type="url" inputMode="url" placeholder="https://github.com/you/project" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} aria-invalid={!!errors.repoUrl} />
                </Field>
                <Field label="Live URL (optional)" htmlFor="liveUrl" error={errors.liveUrl}>
                  <Input id="liveUrl" type="url" inputMode="url" placeholder="https://…" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} aria-invalid={!!errors.liveUrl} />
                </Field>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">How I built it</h3>
                <Field label="Your approach" htmlFor="approach" error={errors.approach}>
                  <Textarea id="approach" value={approach} onChange={(e) => setApproach(e.target.value)} placeholder="How did you structure it, and why?" aria-invalid={!!errors.approach} />
                </Field>
                <Field label="One bug you fixed" htmlFor="bugFixed" error={errors.bugFixed}>
                  <Textarea id="bugFixed" value={bugFixed} onChange={(e) => setBugFixed(e.target.value)} placeholder="What broke, how you found it, how you fixed it" aria-invalid={!!errors.bugFixed} />
                </Field>
                <Field label="One trade-off you made" htmlFor="tradeoff" error={errors.tradeoff}>
                  <Textarea id="tradeoff" value={tradeoff} onChange={(e) => setTradeoff(e.target.value)} placeholder="What you chose, what you gave up, and why" aria-invalid={!!errors.tradeoff} />
                </Field>
              </div>

              {project.explainQuestions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Explain your code</h3>
                  {project.explainQuestions.map((q, i) => (
                    <Field key={i} label={`${i + 1}. ${q}`} htmlFor={`q${i}`} error={errors[`q${i}`]}>
                      <Textarea id={`q${i}`} value={answers[i]} onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))} aria-invalid={!!errors[`q${i}`]} />
                    </Field>
                  ))}
                </div>
              )}
            </fieldset>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={submit.isPending} disabled={disabled}>
                <Send className="size-4" aria-hidden /> {sub ? "Resubmit" : "Submit project"}
              </Button>
              {milestonesDone < project.milestones.length && <span className="text-xs text-muted">Tip: finish every milestone before submitting.</span>}
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export function ProjectDetailView({ slug }: { slug: string }) {
  // Lives here (not in the keyed form) so it survives the refetch after submitting.
  const [result, setResult] = useState<ProjectSubmitResult | null>(null);
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["project", slug], queryFn: () => api.get<ProjectDetail>(`/projects/${slug}`) });
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const p = data!;
  const sub = p.submission;

  return (
    <div className="space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1 text-xs text-muted hover:text-text"><ArrowLeft className="size-3.5" aria-hidden /> Project ladder</Link>
      <div>
        <div className="eyebrow text-accent">Rung {p.rung}</div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl leading-tight">{p.title}</h1>
          {p.unlocked ? <WorkStatusBadge status={sub?.status ?? "NOT_STARTED"} /> : <Badge><Lock className="size-3" aria-hidden /> Locked</Badge>}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {p.skills.map((s) => <Badge key={s}>{s}</Badge>)}
          {p.technologies.map((t) => <Badge key={t} tone="info">{t}</Badge>)}
        </div>
      </div>

      {!p.unlocked && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 p-4 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <p className="text-muted">Complete the previous rung first. You can read the brief now and plan ahead — hints and submissions open once it unlocks.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="The brief" />
            <CardBody className="pt-2"><Markdown>{p.description}</Markdown></CardBody>
          </Card>
          <Card>
            <CardHeader title="Requirements" description="Use this as your own checklist — it isn't saved." />
            <CardBody className="pt-3">
              <CheckList items={p.requirements.map((r) => ({ title: r }))} label="Requirements" />
            </CardBody>
          </Card>
          <ProjectWork key={sub?.updatedAt ?? "new"} project={p} result={result} onResult={setResult} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start" aria-label="Your submission">
          <Card>
            <CardHeader title="Your submission" />
            <CardBody>
              {sub ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <ScoreRing value={sub.explainScore} size={88} stroke={7} label="Explain score" sub="Explain" />
                    <ScoreRing value={sub.independenceScore} size={88} stroke={7} label="Independence score" sub="Independence" />
                  </div>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2"><dt className="text-muted">Milestones</dt><dd className="font-mono">{sub.milestonesDone}/{p.milestones.length}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-muted">Last submitted</dt><dd>{relativeTime(sub.updatedAt)}</dd></div>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    <a href={sub.repoUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}><GitBranch className="size-4" aria-hidden /> Repo</a>
                    {sub.liveUrl && <a href={sub.liveUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}><ExternalLink className="size-4" aria-hidden /> Live</a>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">Nothing submitted yet. Build it, push it to GitHub, then tell us how you built it.</p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-2 text-sm text-muted">
              <p className="font-medium text-text">How completion works</p>
              <p>All milestones ticked + an explain-your-code score that passes the bar. Your independence score drops with each hint, and it all feeds your Readiness score.</p>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
