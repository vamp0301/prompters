"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, CircleDot, Eye, Loader2, Lock, RefreshCw, Route } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-editor";
import { Input, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { DiagramView } from "@/features/knowledge/diagram";
import { api, ApiError } from "@/lib/api/client";
import type { PipelineStage, ProjectDetail, ProjectPipeline } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const key = (slug: string) => ["project-pipeline", slug];
const errorText = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : "Something went wrong. Please try again.");

function StatusIcon({ s }: { s: PipelineStage }) {
  if (s.status === "DONE") return <CheckCircle2 className="size-4 text-accent" aria-label="Done" />;
  if (s.blockedBy.length) return <Lock className="size-4 text-subtle" aria-label="Blocked" />;
  if (s.status === "IN_PROGRESS") return <CircleDot className="size-4 text-info" aria-label="In progress" />;
  return <Circle className="size-4 text-subtle" aria-label="To do" />;
}

function Solution({ slug, stage }: { slug: string; stage: PipelineStage }) {
  const qc = useQueryClient();
  const reveal = useMutation({
    mutationFn: () => api.post<{ independenceScore: number }>(`/projects/${slug}/pipeline/stages/${stage.key}/solution`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(slug) });
      qc.invalidateQueries({ queryKey: ["project", slug] });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const sol = stage.solution;
  if (!sol)
    return (
      <div className="rounded-lg border border-warn/30 bg-warn-soft p-3 text-xs">
        <p className="text-warn">The full solution for this stage (steps, complete code and a diagram) is one click away. Opening it counts like a hint and lowers this project&apos;s independence score.</p>
        <Button size="sm" variant="secondary" className="mt-2" loading={reveal.isPending} onClick={() => reveal.mutate()}>
          <Eye className="size-4" aria-hidden /> Show the solution
        </Button>
      </div>
    );
  return (
    <div className="space-y-3 rounded-lg border border-accent/30 bg-accent-soft/40 p-3 text-sm">
      <div className="font-mono text-[10px] uppercase tracking-wider text-accent">Solution</div>
      {sol.summary && <p className="font-medium">{sol.summary}</p>}
      {sol.steps.length > 0 && <ol className="list-decimal space-y-1 pl-5">{sol.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>}
      {sol.code.map((c, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium">{c.title || "Code"} <span className="font-mono text-[10px] uppercase text-subtle">{c.language}</span></span>
            <button type="button" className="text-muted hover:text-text" onClick={() => navigator.clipboard.writeText(c.code).then(() => toast.success("Copied"), () => toast.error("Couldn't copy"))}>Copy</button>
          </div>
          <CodeBlock code={c.code} language={c.language} />
          {c.explanation.length > 0 && <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted">{c.explanation.map((x, j) => <li key={j}>{x}</li>)}</ul>}
        </div>
      ))}
      {sol.diagram && <DiagramView diagram={sol.diagram} compact />}
      {sol.pitfalls.length > 0 && (
        <div><p className="text-xs font-semibold">Common mistakes</p><ul className="list-disc space-y-0.5 pl-5 text-xs text-muted">{sol.pitfalls.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
      )}
    </div>
  );
}

function StageCard({ slug, stage, index, titles, requirements, isCurrent }: { slug: string; stage: PipelineStage; index: number; titles: Record<string, string>; requirements: string[]; isCurrent: boolean }) {
  const qc = useQueryClient();
  const [evidence, setEvidence] = useState<Record<string, { note: string; url: string }>>(() =>
    Object.fromEntries(stage.acceptance.map((a) => [a.id, { note: stage.evidence[a.id]?.note ?? "", url: stage.evidence[a.id]?.url ?? "" }])),
  );
  const save = useMutation({
    mutationFn: (status: PipelineStage["status"]) =>
      api.patch<{ pipeline: ProjectPipeline }>(`/projects/${slug}/pipeline/stages/${stage.key}`, {
        status,
        evidence: Object.fromEntries(Object.entries(evidence).map(([id, e]) => [id, { note: e.note, url: e.url.trim() || undefined }])),
      }),
    onSuccess: (r, status) => {
      qc.setQueryData(key(slug), r);
      if (status === "DONE") toast.success(`"${stage.title}" done`);
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const blocked = stage.blockedBy.length > 0;
  return (
    <li>
      <details open={isCurrent} className={cn("group rounded-lg border bg-surface", isCurrent ? "border-accent/50" : "border-border")}>
        <summary className="flex cursor-pointer list-none items-start gap-3 p-3">
          <StatusIcon s={stage} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">
              <span className="font-mono text-[11px] text-subtle">{String(index + 1).padStart(2, "0")}</span> {stage.title}
              {isCurrent && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-fg">Resume here</span>}
            </div>
            <p className="text-xs text-muted">{stage.goal}</p>
          </div>
        </summary>
        <div className="space-y-3 border-t border-border p-3 text-sm">
          {blocked && <p className="text-xs text-subtle">Needs first: {stage.blockedBy.map((b) => titles[b] ?? b).join(", ")}</p>}
          {stage.covers.length > 0 && (
            <p className="text-xs text-muted">Covers: {stage.covers.map((n) => `#${n} ${requirements[n - 1] ?? ""}`).join(" · ")}</p>
          )}
          <div>
            <p className="text-xs font-semibold">Tasks</p>
            <ol className="list-decimal space-y-1 pl-5">{stage.tasks.map((t, i) => <li key={i}>{t}</li>)}</ol>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold">Done when — add your evidence for each</legend>
            {stage.acceptance.map((a) => (
              <div key={a.id} className="rounded-md border border-border p-2">
                <p className="text-xs">{a.text}</p>
                <Textarea
                  aria-label={`Evidence: ${a.text}`}
                  className="mt-1 min-h-14 text-xs"
                  placeholder="What did you check, and what happened? e.g. curl output, a screenshot description, a test name"
                  value={evidence[a.id]?.note ?? ""}
                  onChange={(e) => setEvidence((x) => ({ ...x, [a.id]: { ...x[a.id], note: e.target.value } }))}
                />
                <Input
                  aria-label={`Link for: ${a.text}`}
                  className="mt-1 h-8 text-xs"
                  placeholder="https://github.com/you/repo/commit/… (optional)"
                  value={evidence[a.id]?.url ?? ""}
                  onChange={(e) => setEvidence((x) => ({ ...x, [a.id]: { ...x[a.id], url: e.target.value } }))}
                />
              </div>
            ))}
            <p className="text-[11px] text-subtle">Evidence is your own record — Prompters doesn&apos;t run your code to check it.</p>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            {stage.status !== "DONE" ? (
              <>
                <Button size="sm" disabled={blocked} loading={save.isPending && save.variables === "DONE"} onClick={() => save.mutate("DONE")}>Mark stage done</Button>
                <Button size="sm" variant="secondary" loading={save.isPending && save.variables === "IN_PROGRESS"} onClick={() => save.mutate("IN_PROGRESS")}>{stage.status === "IN_PROGRESS" ? "Save evidence" : "Start this stage"}</Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" loading={save.isPending} onClick={() => save.mutate("IN_PROGRESS")}>Reopen</Button>
            )}
          </div>
          <Solution slug={slug} stage={stage} />
        </div>
      </details>
    </li>
  );
}

/** Project-specific build plan: stages with dependencies, evidence-backed progress and solutions on request. */
export function BuildPipeline({ project }: { project: ProjectDetail }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: key(project.slug),
    queryFn: () => api.get<{ pipeline: ProjectPipeline | null }>(`/projects/${project.slug}/pipeline`),
    enabled: project.unlocked,
    refetchInterval: (x) => (x.state.data?.pipeline && ["QUEUED", "RUNNING"].includes(x.state.data.pipeline.status) ? 2500 : false),
  });
  const generate = useMutation({
    mutationFn: (regenerate: boolean) => api.post<{ pipeline: ProjectPipeline }>(`/projects/${project.slug}/pipeline`, { regenerate }),
    onSuccess: (r) => qc.setQueryData(key(project.slug), r),
    onError: (e) => toast.error(errorText(e)),
  });
  if (!project.unlocked) return null;
  const p = q.data?.pipeline ?? null;
  const building = p && (p.status === "QUEUED" || p.status === "RUNNING");
  const titles = Object.fromEntries((p?.stages ?? []).map((s) => [s.key, s.title]));
  return (
    <Card>
      <CardHeader title="Build plan" description="A step-by-step plan made for this project's requirements and stack. Resume where you stopped; each stage is done when you've shown evidence for it." />
      <CardBody className="space-y-3 pt-3">
        {q.isLoading && <p className="text-sm text-muted">Loading…</p>}
        {q.isError && <p role="alert" className="text-sm text-danger">{errorText(q.error)}</p>}
        {!q.isLoading && !p && (
          <Button size="sm" loading={generate.isPending} onClick={() => generate.mutate(false)}>
            <Route className="size-4" aria-hidden /> Make my build plan
          </Button>
        )}
        {building && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted"><Loader2 className="size-4 animate-spin" aria-hidden /> Building your plan for this project — usually under a minute. You can leave this page.</p>
        )}
        {p?.status === "FAILED" && (
          <div role="alert" className="text-sm text-danger">
            {p.error ?? "Couldn't build the plan."} <button type="button" className="underline" onClick={() => generate.mutate(true)}>Try again</button>
          </div>
        )}
        {p && p.stages.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <Progress value={(p.done / Math.max(1, p.total)) * 100} className="flex-1" label={`${p.done} of ${p.total} stages done`} />
              <span className="text-xs text-muted">{p.done}/{p.total}</span>
            </div>
            {p.stale && (
              <p className="flex flex-wrap items-center gap-2 rounded-md bg-warn-soft p-2 text-xs text-warn">
                The project brief changed since this plan was made.
                <button type="button" className="inline-flex items-center gap-1 underline" disabled={!!building} onClick={() => generate.mutate(true)}><RefreshCw className="size-3" aria-hidden /> Update the plan (keeps your progress)</button>
              </p>
            )}
            <ol className="space-y-2">
              {p.stages.map((s, i) => <StageCard key={`${s.key}-${p.updatedAt}`} slug={project.slug} stage={s} index={i} titles={titles} requirements={p.requirements} isCurrent={s.key === p.current} />)}
            </ol>
          </>
        )}
      </CardBody>
    </Card>
  );
}
