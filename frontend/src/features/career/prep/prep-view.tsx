"use client";
import Link from "next/link";
import { useDeferredValue, useId, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CircleDot, Download, Loader2, RefreshCw, RotateCcw, Search, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { PrepCategory, PrepPlanDetail, PrepPracticeStatus, PrepPriority, PrepQuestion } from "@/lib/api/types";
import { cn, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { careerKeys, ConfirmButton, InlineError } from "../shared";
import { usePrepUsage } from "./prep-start-card";
import { PackDialog } from "./pack-dialog";
import { PREP_CATEGORY, PREP_CATEGORY_ORDER, PRIORITY, PRIORITY_ORDER, QuestionBadges } from "./prep-shared";
import { QuestionDialog } from "./question-dialog";

export function PrepView({ id }: { id: string }) {
  const plan = useQuery({
    queryKey: careerKeys.prepPlan(id),
    queryFn: () => api.get<PrepPlanDetail>(`/career/prep/${id}`),
    refetchInterval: (q) => (q.state.data && (q.state.data.status === "QUEUED" || q.state.data.status === "RUNNING") ? 1500 : false),
  });
  if (plan.isLoading) return <PageSkeleton />;
  if (plan.error) return <ErrorState error={plan.error} retry={() => plan.refetch()} />;
  const p = plan.data!;
  return (
    <div className="space-y-6">
      <Link href="/career" className="inline-flex items-center gap-1 text-xs text-muted hover:text-text">
        <ArrowLeft className="size-3.5" aria-hidden /> Career AI
      </Link>
      {p.status === "READY" ? <ReadyView plan={p} /> : <GeneratingView plan={p} />}
    </div>
  );
}

// ───────────────────────── generating ─────────────────────────

type StepState = "pending" | "running" | "done" | "failed";

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") return <Check className="size-3.5 text-accent" aria-hidden />;
  if (state === "running") return <Loader2 className="size-3.5 animate-spin text-accent" aria-hidden />;
  if (state === "failed") return <X className="size-3.5 text-danger" aria-hidden />;
  return <span className="inline-block size-3.5 text-center font-mono text-[10px] text-subtle" aria-hidden>·</span>;
}

function GeneratingView({ plan }: { plan: PrepPlanDetail }) {
  const qc = useQueryClient();
  const retry = useMutation({
    meta: { silent: true },
    mutationFn: () => api.post(`/career/prep/${plan.id}/retry`),
    onSuccess: () => qc.invalidateQueries({ queryKey: careerKeys.prepPlan(plan.id) }),
  });
  const pr = plan.progress;
  const failed = plan.status === "FAILED";
  const steps: { label: string; state: StepState; detail?: string }[] = [
    { label: "Resume analyzed", state: pr.resume.state, detail: pr.resume.chunks ? `${pr.resume.chunks} chunks` : undefined },
    { label: "Skills extracted", state: pr.skills.state, detail: pr.skills.count !== undefined ? `${pr.skills.count} skills` : undefined },
    { label: "Projects analyzed", state: pr.projects.state, detail: pr.projects.count !== undefined ? `${pr.projects.count} projects & roles` : undefined },
    ...PREP_CATEGORY_ORDER.filter((c) => pr.categories[c]).map((c) => {
      const e = pr.categories[c]!;
      return { label: PREP_CATEGORY[c].label, state: e.state, detail: `${e.done}/${e.target}` };
    }),
    { label: "Removing near-duplicates", state: pr.dedupe?.state ?? "pending", detail: pr.dedupe?.removed !== undefined ? `${pr.dedupe.removed} removed` : undefined },
    { label: "Ranking your Top 100", state: pr.ranking.state },
  ];
  const target = Object.values(pr.categories).reduce((a, e) => a + (e?.target ?? 0), 0);
  const done = Object.values(pr.categories).reduce((a, e) => a + (e?.done ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Preparing your interview" title={plan.title} description={`Resume: ${plan.resume.label} · started ${formatDate(plan.createdAt)}`} />
      <Card className="max-w-xl">
        <CardBody className="space-y-4">
          {failed ? (
            <div role="alert" className="space-y-3">
              <p className="text-sm font-medium text-danger">Generation stopped.</p>
              <p className="text-sm text-muted">{plan.error ?? "Something went wrong."}</p>
              <InlineError error={retry.error} />
              <Button onClick={() => retry.mutate()} loading={retry.isPending}>
                <RotateCcw className="size-4" aria-hidden /> Retry — keep what&apos;s done
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted" role="status" aria-live="polite">
              Analysing your resume and writing questions category by category. Every question is checked for duplicates, resume evidence and technical quality before it&apos;s saved.
            </p>
          )}
          {target > 0 && <Progress value={Math.min(100, (done / target) * 100)} label={`${done} of ${target} questions`} />}
          <ol className="space-y-1.5 font-mono text-xs">
            {steps.map((s) => (
              <li key={s.label} className={cn("flex items-center gap-2", s.state === "pending" ? "text-subtle" : "text-text")}>
                <StepIcon state={s.state} />
                <span className="flex-1">{s.label}</span>
                {s.detail && <span className="tabular-nums text-muted">{s.detail}</span>}
              </li>
            ))}
          </ol>
          {!failed && <p className="text-xs text-subtle">Usually 2–4 minutes. You can leave this page; your plan keeps generating.</p>}
        </CardBody>
      </Card>
    </>
  );
}

// ───────────────────────── ready ─────────────────────────

/** Regenerating is always an explicit, confirmed action: it costs one of the day's generations. */
function RegenerateButton({ plan }: { plan: PrepPlanDetail }) {
  const router = useRouter();
  const qc = useQueryClient();
  const usage = usePrepUsage();
  const regen = useMutation({
    meta: { silent: true },
    mutationFn: () =>
      api.post<{ id: string }>("/career/prep", { resumeId: plan.resume.id, ...(plan.job ? { jobId: plan.job.id } : { targetRole: plan.targetRole }), regenerate: true }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: careerKeys.prepPlans });
      qc.invalidateQueries({ queryKey: careerKeys.prepUsage });
      router.push(`/career/prep/${p.id}`);
    },
  });
  const left = usage.data?.remaining;
  return (
    <span className="flex flex-col items-end gap-1">
      <ConfirmButton
        variant="secondary"
        size="md"
        icon={<RefreshCw className="size-4" aria-hidden />}
        label="Regenerate"
        title="Generate a fresh Top 100?"
        confirmLabel="Regenerate"
        disabled={left === 0}
        loading={regen.isPending}
        body={
          <p>
            Creates a new plan for the same resume and target. This plan, its practice history and its PDFs stay available.
            {left !== undefined && ` Uses 1 of your ${left} remaining generation${left === 1 ? "" : "s"} today.`}
          </p>
        }
        onConfirm={() => regen.mutate()}
      />
      {regen.error ? <InlineError error={regen.error} /> : left === 0 ? <span className="text-[11px] text-subtle">Daily generation limit reached</span> : null}
    </span>
  );
}

const STATUS_LABEL: Record<PrepPracticeStatus, string> = { NEW: "Not practised", PRACTICED: "Practised", CONFIDENT: "Confident" };

function ReadyView({ plan }: { plan: PrepPlanDetail }) {
  const uid = useId();
  const questions = useQuery({ queryKey: careerKeys.prepQuestions(plan.id), queryFn: () => api.get<PrepQuestion[]>(`/career/prep/${plan.id}/questions`) });
  const [priorities, setPriorities] = useState<PrepPriority[]>([]);
  const [categories, setCategories] = useState<PrepCategory[]>([]);
  const [skill, setSkill] = useState("");
  const [status, setStatus] = useState<PrepPracticeStatus | "">("");
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search.trim().toLowerCase());
  const [openId, setOpenId] = useState<string | null>(null);
  const [packOpen, setPackOpen] = useState(false);

  const all = useMemo(() => questions.data ?? [], [questions.data]);
  const skills = useMemo(() => [...new Set(all.map((q) => q.skill))].sort((a, b) => a.localeCompare(b)), [all]);
  const presentCategories = PREP_CATEGORY_ORDER.filter((c) => all.some((q) => q.category === c));
  const filtered = all.filter(
    (q) =>
      (!priorities.length || priorities.includes(q.priority)) &&
      (!categories.length || categories.includes(q.category)) &&
      (!skill || q.skill === skill) &&
      (!status || q.status === status) &&
      (!query || `${q.question} ${q.skill} ${q.sourceLabel}`.toLowerCase().includes(query)),
  );
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const confident = all.filter((q) => q.status === "CONFIDENT").length;
  const practised = all.filter((q) => q.status !== "NEW").length;
  const anyFilter = priorities.length || categories.length || skill || status || query;
  const v = plan.validation;
  const rejected = v ? Object.values(v.rejected).reduce((a, b) => a + b, 0) : 0;

  return (
    <>
      <PageHeader
        eyebrow={plan.job ? "Prepared for this job" : "Prepared for your target role"}
        title={`Your Top ${all.length || 100} Interview Questions`}
        description={
          <>
            {plan.title} · Resume: {plan.resume.label} · {formatDate(plan.completedAt ?? plan.createdAt)}
          </>
        }
        actions={
          <>
            <RegenerateButton plan={plan} />
            <Button onClick={() => setPackOpen(true)}>
              <Download className="size-4" aria-hidden /> Download my interview pack
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {PRIORITY_ORDER.map((p) => {
          const n = all.filter((q) => q.priority === p).length;
          const on = priorities.includes(p);
          return (
            <button
              key={p}
              type="button"
              aria-pressed={on}
              onClick={() => setPriorities((l) => toggle(l, p))}
              className={cn("rounded-xl border p-3 text-left transition-colors", on ? "border-accent bg-accent-soft" : "border-border bg-surface hover:bg-surface-2")}
            >
              <div className="text-xs text-muted">
                {PRIORITY[p].emoji} {PRIORITY[p].label}
              </div>
              <div className="font-mono text-2xl font-semibold tabular-nums">{n}</div>
              <div className="text-[11px] text-subtle">{PRIORITY[p].copy}</div>
            </button>
          );
        })}
        <div className="rounded-xl border border-border bg-surface p-3 sm:col-span-2 lg:col-span-1">
          <div className="text-xs text-muted">Practice</div>
          <div className="font-mono text-2xl font-semibold tabular-nums">
            {confident}
            <span className="text-sm text-subtle">/{all.length}</span>
          </div>
          <Progress value={all.length ? (confident / all.length) * 100 : 0} label={`${confident} confident of ${all.length}`} />
          <div className="mt-1 text-[11px] text-subtle">{practised} practised · {confident} confident</div>
        </div>
      </div>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
            {presentCategories.map((c) => {
              const on = categories.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCategories((l) => toggle(l, c))}
                  className={cn("rounded-md border px-2 py-1 text-xs transition-colors", on ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:text-text")}
                >
                  {PREP_CATEGORY[c].emoji} {PREP_CATEGORY[c].short} <span className="font-mono tabular-nums text-subtle">{all.filter((q) => q.category === c).length}</span>
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <Field label="Search" htmlFor={`${uid}-s`}>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" aria-hidden />
                <Input id={`${uid}-s`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="JWT, indexing, your project…" className="pl-8" />
              </div>
            </Field>
            <Field label="Skill" htmlFor={`${uid}-k`}>
              <Select id={`${uid}-k`} value={skill} onChange={(e) => setSkill(e.target.value)}>
                <option value="">All skills</option>
                {skills.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Practice" htmlFor={`${uid}-st`}>
              <Select id={`${uid}-st`} value={status} onChange={(e) => setStatus(e.target.value as PrepPracticeStatus | "")}>
                <option value="">Any</option>
                {(Object.keys(STATUS_LABEL) as PrepPracticeStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span aria-live="polite">
              Showing {filtered.length} of {all.length}
            </span>
            {anyFilter ? (
              <button
                type="button"
                className="underline underline-offset-4 hover:text-text"
                onClick={() => {
                  setPriorities([]);
                  setCategories([]);
                  setSkill("");
                  setStatus("");
                  setSearch("");
                }}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </CardBody>
      </Card>

      {questions.isLoading ? (
        <PageSkeleton />
      ) : questions.error ? (
        <ErrorState error={questions.error} retry={() => questions.refetch()} />
      ) : !filtered.length ? (
        <EmptyState icon={<Search className="size-4" />} title="No questions match these filters" description="Try removing a filter." />
      ) : (
        <ol className="space-y-2">
          {filtered.map((q) => (
            <li key={q.id}>
              <button type="button" onClick={() => setOpenId(q.id)} className="group flex w-full items-start gap-3 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-accent/50 hover:bg-surface-2/50">
                <span className="w-8 shrink-0 pt-0.5 text-right font-mono text-sm font-semibold text-subtle tabular-nums">{q.rank}</span>
                <span className="min-w-0 flex-1 space-y-1.5">
                  <QuestionBadges q={q} compact />
                  <span className="block text-sm font-medium group-hover:text-accent">{q.question}</span>
                  <span className="line-clamp-1 block text-xs text-muted">{q.why}</span>
                </span>
                <span className="shrink-0 pt-0.5" title={STATUS_LABEL[q.status]}>
                  {q.status === "CONFIDENT" ? <Check className="size-4 text-accent" aria-label="Confident" /> : q.status === "PRACTICED" ? <CircleDot className="size-4 text-warn" aria-label="Practised" /> : null}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {v && (
        <p className="flex items-start gap-2 text-xs text-subtle">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Quality checked: {v.generated} questions generated, {rejected} rejected (duplicates and paraphrases, not grounded in your resume, unknown skills or non-technical) before your Top {all.length} was ranked.
        </p>
      )}

      {openId && <QuestionDialog planId={plan.id} questionId={openId} list={filtered.map((q) => q.id)} onNavigate={setOpenId} onClose={() => setOpenId(null)} />}
      <PackDialog open={packOpen} onClose={() => setPackOpen(false)} plan={plan} />
    </>
  );
}
