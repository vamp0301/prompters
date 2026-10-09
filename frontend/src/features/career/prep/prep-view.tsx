"use client";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Download, Loader2, RefreshCw, RotateCcw, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { EmptyState, ErrorState, PageHeader, PageSkeleton, Tabs } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { PrepCategory, PrepPlanDetail, PrepPracticeStatus, PrepPriority, PrepQuestion, PrepQuestionItem, PrepQuestionPage } from "@/lib/api/types";
import { cn, formatDate } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { careerKeys, ConfirmButton, InlineError } from "../shared";
import { usePrepUsage } from "./prep-start-card";
import { PackDialog } from "./pack-dialog";
import { groupByTopic, PREP_CATEGORY, PREP_CATEGORY_ORDER, PRIORITY, PRIORITY_ORDER, QuestionBadges } from "./prep-shared";
import { IndexCard, InkAnnotation, StudyStamp } from "@/components/ui/paper";
import { QuestionDialog } from "./question-dialog";
import { ResumeReader } from "./resume-reader";

const PAGE_SIZE = 20;
type SortOrder = "ladder" | "likely" | "personal";

/** Why a question is high in "For you" order (from the personalization engine's reason codes). */
const PERSONAL_REASON: Record<string, string> = {
  weak_skill: "Weak skill",
  interview_weakness: "Weak in interview",
  in_job_description: "In the JD",
  high_role_relevance: "Core for your role",
  on_your_resume: "On your resume",
  often_asked: "Often asked",
  needs_retry: "Retry — scored low",
  not_yet_practised: "Not practised",
  matches_your_level: "Your level",
};

/** The difficulty ladder: each stage is written, checked and published before the next. */
export const STAGE_INFO: Record<1 | 2 | 3, { label: string; range: string; copy: string }> = {
  1: { label: "Basics", range: "Difficulty 1–2", copy: "Fundamentals and how-to" },
  2: { label: "Core", range: "Difficulty 3", copy: "How it works under the hood" },
  3: { label: "Advanced", range: "Difficulty 4–5", copy: "Scenarios, scaling, design" },
};

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

function levelText(plan: PrepPlanDetail) {
  const l = plan.progress.level;
  if (!l) return undefined;
  const exp = l.months <= 0 ? "no work experience yet" : l.months < 12 ? `${l.months} months of experience` : `~${Math.round(l.months / 12)} years of experience`;
  return `${l.label} · ${exp}`;
}

/** Basics → Core → Advanced, with how far each stage is and whether it can be practised yet. */
function Ladder({ plan }: { plan: PrepPlanDetail }) {
  const stages = plan.progress.stages ?? [];
  return (
    <ol className="grid gap-3 sm:grid-cols-3" aria-label="Question ladder">
      {stages.map((s) => {
        const info = STAGE_INFO[s.stage as 1 | 2 | 3];
        return (
          <li key={s.stage} className={cn("rounded-lg border p-3", s.state === "done" ? "border-accent/40 bg-accent-soft/50" : s.state === "running" ? "border-accent" : "border-border")}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] tracking-widest text-subtle uppercase">Step {s.stage}</span>
              <StepIcon state={s.state} />
            </div>
            <p className="mt-1 font-display text-lg font-semibold">{info.label}</p>
            <p className="text-[11px] text-muted">
              {info.range} · {info.copy}
            </p>
            <Progress className="mt-2" value={s.target ? (Math.min(s.done, s.target) / s.target) * 100 : 0} label={`${info.label}: ${Math.min(s.done, s.target)} of ${s.target}`} />
            <p className="mt-1 font-mono text-[11px] text-muted tabular-nums">
              {s.state === "done" ? `${s.published} ready to practise` : s.state === "running" ? `writing & checking · ${Math.min(s.done, s.target)}/${s.target}` : s.state === "failed" ? "stopped" : `${s.target} questions`}
            </p>
          </li>
        );
      })}
    </ol>
  );
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
  const reading = !failed && pr.resume.state !== "done";
  const staged = !!pr.stages?.length;
  // Only plans made before the ladder show the original per-category step list.
  const legacy = !staged && Object.keys(pr.categories).length > 0;
  const steps: { label: string; state: StepState; detail?: string }[] = !legacy
    ? []
    : [
        ...PREP_CATEGORY_ORDER.filter((c) => pr.categories[c]).map((c) => {
          const e = pr.categories[c]!;
          return { label: PREP_CATEGORY[c].label, state: e.state, detail: `${e.done}/${e.target}` };
        }),
        { label: "Ranking your Top 100", state: pr.ranking.state },
      ];

  return (
    <>
      <PageHeader eyebrow="Preparing your interview" title={plan.title} description={`Resume: ${plan.resume.label} · started ${formatDate(plan.createdAt)}`} />
      <Card>
        <CardBody className="space-y-5">
          <ResumeReader reading={reading} label={plan.resume.label} skills={pr.skills.names} projects={pr.projects.names} level={levelText(plan)} />
          {failed ? (
            <div role="alert" className="space-y-3">
              <p className="text-sm font-medium text-danger">Generation stopped.</p>
              <p className="text-sm text-muted">{plan.error ?? "Something went wrong."}</p>
              {plan.published > 0 && <p className="text-sm text-muted">The {plan.published} questions already published stay available below.</p>}
              <InlineError error={retry.error} />
              <Button onClick={() => retry.mutate()} loading={retry.isPending}>
                <RotateCcw className="size-4" aria-hidden /> Retry — keep what&apos;s done
              </Button>
            </div>
          ) : (
            !reading && (
              <p className="text-sm text-muted" role="status" aria-live="polite">
                Writing your questions step by step — Basics first, then Core, then Advanced. Every question is checked for duplicates, resume evidence and level before it&apos;s published.
              </p>
            )
          )}
          {staged ? (
            <Ladder plan={plan} />
          ) : (
            steps.length > 0 && (
              <ol className="space-y-1.5 font-mono text-xs">
                {steps.map((s) => (
                  <li key={s.label} className={cn("flex items-center gap-2", s.state === "pending" ? "text-subtle" : "text-text")}>
                    <StepIcon state={s.state} />
                    <span className="flex-1">{s.label}</span>
                    {s.detail && <span className="tabular-nums text-muted">{s.detail}</span>}
                  </li>
                ))}
              </ol>
            )
          )}
          {pr.fresh && pr.fresh.previousPlans > 0 && (
            <p className="flex items-start gap-2 text-xs text-muted">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
              Fresh set: questions from your previous plan for this target are being avoided.
            </p>
          )}
          {!failed && <p className="text-xs text-subtle">Usually 2–4 minutes in total. You can leave this page; your plan keeps generating.</p>}
        </CardBody>
      </Card>

      {plan.published > 0 && (
        <section aria-labelledby="ready-now-h" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="ready-now-h" className="font-display text-2xl font-semibold">
              Start practising
            </h2>
            {!failed && <p className="text-xs text-muted">{plan.published} published — harder steps appear here as they finish.</p>}
          </div>
          <QuestionBrowser plan={plan} />
        </section>
      )}
    </>
  );
}

// ───────────────────────── ready ─────────────────────────

/** A question as a collectible index card: TOP 01, the question, topic, priority, practice state. */
function QuestionCard({ q, onOpen }: { q: PrepQuestionItem; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="paper-lift group block h-full w-full rounded-lg text-left focus-visible:outline-offset-4">
      <IndexCard
        hole
        className="h-full"
        label={`TOP ${String(q.rank).padStart(2, "0")}${q.stage ? ` · ${STAGE_INFO[q.stage as 1 | 2 | 3].label.toUpperCase()}` : ""}`}
        aside={
          q.status === "CONFIDENT" ? (
            <StudyStamp>✓ CONFIDENT</StudyStamp>
          ) : q.status === "PRACTICED" ? (
            <StudyStamp tone="muted">PRACTISED</StudyStamp>
          ) : null
        }
      >
        <p className="font-display text-[1.05rem] font-semibold leading-snug group-hover:text-accent">{q.question}</p>
        <p className="mt-2 line-clamp-2 text-xs text-muted">{q.why}</p>
        {q.personal && q.personal.reasons.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1" aria-label="Why it's suggested for you">
            {q.personal.reasons.slice(0, 3).map((r) => (
              <li key={r} className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] text-accent">
                {PERSONAL_REASON[r] ?? r}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <QuestionBadges q={q} compact />
        </div>
      </IndexCard>
    </button>
  );
}

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
        title="Generate a fresh set?"
        confirmLabel="Regenerate"
        disabled={left === 0}
        loading={regen.isPending}
        body={
          <p>
            Creates a new plan for the same resume and target with different questions — the ones in this plan are avoided. This plan, its practice history and its PDFs stay available.
            {left !== undefined && ` Uses 1 of your ${left} remaining generation${left === 1 ? "" : "s"} today.`}
          </p>
        }
        onConfirm={() => regen.mutate()}
      />
      {regen.error ? <InlineError error={regen.error} /> : left === 0 ? <span className="text-[11px] text-subtle">Daily generation limit reached</span> : null}
    </span>
  );
}

function ReadyView({ plan }: { plan: PrepPlanDetail }) {
  const [packOpen, setPackOpen] = useState(false);
  const v = plan.validation;
  const rejected = v ? Object.values(v.rejected).reduce((a, b) => a + b, 0) : 0;
  const fresh = plan.progress.fresh;
  const level = levelText(plan);

  return (
    <>
      <PageHeader
        eyebrow={plan.job ? "Prepared for this job" : "Prepared for your target role"}
        title={`Your Top ${plan.published || 100} Interview Questions`}
        description={
          <>
            {plan.title} · Resume: {plan.resume.label} · {formatDate(plan.completedAt ?? plan.createdAt)}
            {level && (
              <>
                <br />
                Pitched at: {level}
              </>
            )}
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

      {plan.published > 0 && plan.published < 100 && (
        <p role="status" className="rounded-md border border-warn/30 bg-warn-soft px-3 py-2 text-sm text-warn">
          Partial plan: {plan.published} questions passed our quality checks for this resume and target. We don&apos;t pad the list with weaker questions — you can Regenerate later for a fresh set.
        </p>
      )}
      {fresh && fresh.previousPlans > 0 && (
        <p className="flex items-start gap-2 text-sm text-muted">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          {fresh.repeated === 0
            ? "Fresh set: none of these questions were in your previous plan for this target."
            : `Mostly fresh: ${fresh.repeated} question${fresh.repeated === 1 ? "" : "s"} repeat from your previous plan — your resume didn't support enough new ones.`}
        </p>
      )}

      <QuestionBrowser plan={plan} />

      {v && (
        <p className="flex items-start gap-2 text-xs text-subtle">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Quality checked: {v.generated} questions generated, {rejected} rejected (duplicates and paraphrases, asked before, wrong level, not grounded in your resume, unknown skills or non-technical) before your Top {plan.published} was published.
        </p>
      )}

      <PackDialog open={packOpen} onClose={() => setPackOpen(false)} plan={plan} />
    </>
  );
}

// ───────────────────────── browsing (paged on the server) ─────────────────────────

const STATUS_LABEL: Record<PrepPracticeStatus, string> = { NEW: "Not practised", PRACTICED: "Practised", CONFIDENT: "Confident" };

/** Waits until typing pauses before searching (one request per pause, not per keystroke). */
function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

type PageParams = { page: number; size: number; stage?: number; difficulty?: number; priority: string; category: string; skill: string; status: string; q: string; sort: SortOrder };

/** The five difficulty steps, easiest first. */
const LEVELS = [
  { level: 1, label: "Easy", hint: "Definitions and basics" },
  { level: 2, label: "Basic", hint: "How-to and everyday use" },
  { level: 3, label: "Medium", hint: "How it works and why" },
  { level: 4, label: "Hard", hint: "Scenarios and problems" },
  { level: 5, label: "Expert", hint: "Design, strategy, trade-offs" },
] as const;
type Level = "all" | 1 | 2 | 3 | 4 | 5;
/** Questions per page inside one step. */
const STEP_PAGE_SIZE = 10;

const pagePath = (planId: string, p: PageParams) => {
  const qs = new URLSearchParams();
  for (const [k, val] of Object.entries(p)) if (val !== undefined && val !== "") qs.set(k, String(val));
  return `/career/prep/${planId}/questions/page?${qs}`;
};

function QuestionBrowser({ plan }: { plan: PrepPlanDetail }) {
  const uid = useId();
  const qc = useQueryClient();
  // Dashboard bars link here pre-filtered (?priority=INTENSE or ?category=PROJECT).
  const params = useSearchParams();
  const [page, setPage] = useState(1);
  /** Any filter change starts again from page 1. */
  const resetting =
    <A,>(set: (a: A) => void) =>
    (a: A) => {
      set(a);
      setPage(1);
    };
  const [priorities, setPrioritiesRaw] = useState<PrepPriority[]>(() => (PRIORITY_ORDER.includes(params.get("priority") as PrepPriority) ? [params.get("priority") as PrepPriority] : []));
  const [categories, setCategoriesRaw] = useState<PrepCategory[]>(() => (PREP_CATEGORY_ORDER.includes(params.get("category") as PrepCategory) ? [params.get("category") as PrepCategory] : []));
  const [stage, setStageRaw] = useState<"all" | "1" | "2" | "3">("all");
  // Recommendations link here pre-filtered by skill (?skill=Caching).
  const [skill, setSkillRaw] = useState(() => params.get("skill") ?? "");
  const [status, setStatusRaw] = useState<PrepPracticeStatus | "">("");
  const [sort, setSortRaw] = useState<SortOrder>(() => (params.get("sort") === "personal" ? "personal" : "ladder"));
  const [search, setSearchRaw] = useState("");
  const setPriorities = resetting(setPrioritiesRaw);
  const setCategories = resetting(setCategoriesRaw);
  const setStage = resetting(setStageRaw);
  const setSkill = resetting(setSkillRaw);
  const setStatus = resetting(setStatusRaw);
  const setSort = resetting(setSortRaw);
  const setSearch = resetting(setSearchRaw);
  const q = useDebounced(search.trim(), 300);
  const [view, setView] = useState<"list" | "topics">("list");
  // Step by step from easy to hard: start at Step 1, unless a link arrived with a filter.
  const deepLinked = ["priority", "category", "skill", "sort"].some((k) => params.get(k));
  const [level, setLevelRaw] = useState<Level>(deepLinked ? "all" : 1);
  const setLevel = resetting(setLevelRaw);
  const size = level === "all" ? PAGE_SIZE : STEP_PAGE_SIZE;
  const [openId, setOpenId] = useState<string | null>(null);

  const filters = { stage: stage === "all" ? undefined : Number(stage), difficulty: level === "all" ? undefined : level, priority: priorities.join(","), category: categories.join(","), skill, status, q, sort };

  const pageParams: PageParams = { ...filters, page, size };
  // `published` is in the key: when the next stage is published, the list refreshes by itself.
  const keyFor = (p: PageParams) => [...careerKeys.prepQuestions(plan.id), "page", p, plan.published] as const;
  const list = useQuery({
    queryKey: keyFor(pageParams),
    queryFn: () => api.get<PrepQuestionPage>(pagePath(plan.id, pageParams)),
    placeholderData: keepPreviousData,
    enabled: view === "list",
  });
  const data = list.data;
  // Prefetch the next page so "Next" is instant.
  const nextParams: PageParams | null = data && page < data.pages ? { ...pageParams, page: page + 1 } : null;
  const nextKey = nextParams ? JSON.stringify(nextParams) : "";
  useEffect(() => {
    if (!nextParams) return;
    void qc.prefetchQuery({ queryKey: keyFor(nextParams), queryFn: () => api.get<PrepQuestionPage>(pagePath(plan.id, nextParams)), staleTime: 30_000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the serialised params
  }, [nextKey, plan.id, plan.published, qc]);

  // "By topic" groups the whole list, so it loads the full (small) list only when opened.
  const all = useQuery({
    queryKey: [...careerKeys.prepQuestions(plan.id), "all", plan.published],
    queryFn: () => api.get<PrepQuestion[]>(`/career/prep/${plan.id}/questions`),
    enabled: view === "topics",
  });
  const topicRows = useMemo(() => {
    const needle = q.toLowerCase();
    return (all.data ?? []).filter(
      (x) =>
        (stage === "all" || x.stage === Number(stage)) &&
        (!priorities.length || priorities.includes(x.priority)) &&
        (!categories.length || categories.includes(x.category)) &&
        (!skill || x.skill === skill) &&
        (!status || x.status === status) &&
        (!needle || `${x.question} ${x.skill} ${x.sourceLabel}`.toLowerCase().includes(needle)),
    );
  }, [all.data, stage, priorities, categories, skill, status, q]);

  const facets = data?.facets;
  const toggle = <T,>(l: T[], val: T) => (l.includes(val) ? l.filter((x) => x !== val) : [...l, val]);
  const anyFilter = priorities.length || categories.length || stage !== "all" || skill || status || search;
  const total = plan.published;
  const confident = plan.practice.CONFIDENT ?? 0;
  const practised = (plan.practice.PRACTICED ?? 0) + confident;
  const items = data?.items ?? [];
  const stagesPresent = ([1, 2, 3] as const).filter((s) => (facets?.stages[String(s)] ?? 0) > 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {PRIORITY_ORDER.map((p) => {
          const n = facets?.priorities[p] ?? 0;
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
        <div className="col-span-2 rounded-xl border border-border bg-surface p-3 lg:col-span-1">
          <div className="text-xs text-muted">Practice</div>
          <div className="font-mono text-2xl font-semibold tabular-nums">
            {confident}
            <span className="text-sm text-subtle">/{total}</span>
          </div>
          <Progress value={total ? (confident / total) * 100 : 0} label={`${confident} confident of ${total}`} />
          <div className="mt-1 text-[11px] text-subtle">
            {practised} practised · {confident} confident
          </div>
        </div>
      </div>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              value={stage}
              onChange={setStage}
              items={[
                { value: "all", label: <>All steps <span className="font-mono text-subtle tabular-nums">{total}</span></> },
                ...stagesPresent.map((s) => ({
                  value: String(s) as "1" | "2" | "3",
                  label: (
                    <>
                      {s}. {STAGE_INFO[s].label} <span className="font-mono text-subtle tabular-nums">{facets?.stages[String(s)] ?? 0}</span>
                    </>
                  ),
                })),
              ]}
            />
            <Field label="Order" htmlFor={`${uid}-sort`} className="w-full sm:w-60">
              <Select id={`${uid}-sort`} value={sort} onChange={(e) => setSort(e.target.value as SortOrder)}>
                <option value="ladder">Step by step (easy → hard)</option>
                <option value="likely">Most likely to be asked</option>
                <option value="personal">For you (weak spots first)</option>
              </Select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
            {PREP_CATEGORY_ORDER.filter((c) => (facets?.categories[c] ?? 0) > 0 || categories.includes(c)).map((c) => {
              const on = categories.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCategories((l) => toggle(l, c))}
                  className={cn("rounded-md border px-2 py-1 text-xs transition-colors", on ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:text-text")}
                >
                  {PREP_CATEGORY[c].emoji} {PREP_CATEGORY[c].short} <span className="font-mono tabular-nums text-subtle">{facets?.categories[c] ?? 0}</span>
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
                {(facets?.skills ?? []).map((s) => (
                  <option key={s.skill} value={s.skill}>
                    {s.skill} ({s.count})
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
              {view === "topics"
                ? all.data
                  ? `Showing ${topicRows.length} of ${total}`
                  : "Loading questions…"
                : data
                  ? data.total
                    ? `Showing ${(page - 1) * size + 1}–${Math.min(page * size, data.total)} of ${data.total}${data.total !== total ? ` (filtered from ${total})` : ""}`
                    : `Showing 0 of ${total}`
                  : "Loading questions…"}
            </span>
            {anyFilter ? (
              <button
                type="button"
                className="underline underline-offset-4 hover:text-text"
                onClick={() => {
                  setPriorities([]);
                  setCategories([]);
                  setStage("all");
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={view}
          onChange={setView}
          items={[
            { value: "list", label: "Step by step" },
            { value: "topics", label: "By topic" },
          ]}
        />
        {view === "topics" && <InkAnnotation className="text-xl">one topic at a time →</InkAnnotation>}
      </div>

      {view === "list" && <LevelSteps level={level} onChange={setLevel} steps={facets?.difficulties} total={total} />}

      {view === "list" ? (
        list.isLoading ? (
          <PageSkeleton />
        ) : list.error ? (
          <ErrorState error={list.error} retry={() => list.refetch()} />
        ) : !items.length ? (
          <EmptyState icon={<Search className="size-4" />} title="No questions match these filters" description="Try removing a filter." />
        ) : (
          <div className={cn("space-y-4 transition-opacity", list.isPlaceholderData && "opacity-60")} aria-busy={list.isFetching}>
            <ol className="grid gap-3 md:grid-cols-2">
              {items.map((x, i) => {
                // Step headings mark where the ladder moves up a level.
                const startsStage = level === "all" && sort === "ladder" && x.stage > 0 && (i === 0 || items[i - 1].stage !== x.stage);
                return (
                  <li key={x.id} className={cn(startsStage && "md:col-span-2")}>
                    {startsStage && (
                      <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-border pb-2">
                        <h3 className="font-display text-xl font-semibold">
                          Step {x.stage} · {STAGE_INFO[x.stage as 1 | 2 | 3].label}
                        </h3>
                        <span className="font-mono text-xs text-muted">{STAGE_INFO[x.stage as 1 | 2 | 3].range}</span>
                      </div>
                    )}
                    <div className={cn(startsStage && "md:w-[calc(50%-0.375rem)]")}>
                      <QuestionCard q={x} onOpen={() => setOpenId(x.id)} />
                    </div>
                  </li>
                );
              })}
            </ol>
            <Pagination page={page} pages={data?.pages ?? 1} onChange={setPage} label="Question pages" />
            {level !== "all" && page >= (data?.pages ?? 1) && <NextStep level={level} steps={facets?.difficulties} onGo={(l) => { setLevel(l); window.scrollTo({ top: 0, behavior: "smooth" }); }} />}
          </div>
        )
      ) : all.isLoading ? (
        <PageSkeleton />
      ) : all.error ? (
        <ErrorState error={all.error} retry={() => all.refetch()} />
      ) : !topicRows.length ? (
        <EmptyState icon={<Search className="size-4" />} title="No questions match these filters" description="Try removing a filter." />
      ) : (
        <div className="space-y-8">
          {groupByTopic(topicRows).map((g) => {
            const confidentHere = g.questions.filter((x) => x.status === "CONFIDENT").length;
            const intenseHere = g.questions.filter((x) => x.priority === "INTENSE").length;
            return (
              <section key={g.topic} aria-label={`${g.topic}: ${g.questions.length} questions`}>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-2">
                  <h3 className="font-display text-xl font-semibold">{g.topic}</h3>
                  <p className="font-mono text-xs text-muted">
                    {g.questions.length} question{g.questions.length === 1 ? "" : "s"}
                    {intenseHere ? ` · ${intenseHere} intense` : ""} · {confidentHere}/{g.questions.length} confident
                  </p>
                </div>
                <ol className="grid gap-3 md:grid-cols-2">
                  {g.questions.map((x) => (
                    <li key={x.id}>
                      <QuestionCard q={x} onOpen={() => setOpenId(x.id)} />
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}

      {openId && (
        <QuestionDialog
          planId={plan.id}
          questionId={openId}
          list={view === "topics" ? groupByTopic(topicRows).flatMap((g) => g.questions.map((x) => x.id)) : items.map((x) => x.id)}
          onNavigate={setOpenId}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}

/** Easy → Expert: one step at a time, each with its own pages. */
function LevelSteps({ level, onChange, steps, total }: { level: Level; onChange: (l: Level) => void; steps?: { difficulty: number; total: number; confident: number }[]; total: number }) {
  if (!steps) return null;
  return (
    <nav aria-label="Difficulty steps" className="-mx-1 overflow-x-auto px-1 pb-1">
      <ol className="flex min-w-max gap-2">
        {LEVELS.map((l, i) => {
          const s = steps.find((x) => x.difficulty === l.level);
          const n = s?.total ?? 0;
          const on = level === l.level;
          return (
            <li key={l.level} className="flex items-center gap-2">
              <button
                type="button"
                aria-current={on ? "step" : undefined}
                disabled={!n}
                onClick={() => onChange(l.level)}
                className={cn("w-32 rounded-xl border p-2.5 text-left transition-colors disabled:opacity-50", on ? "border-accent bg-accent-soft" : "border-border bg-surface hover:bg-surface-2")}
              >
                <span className="block font-mono text-[10px] uppercase tracking-wider text-muted">Step {l.level}</span>
                <span className="block font-semibold">{l.label}</span>
                <span className="block text-[11px] text-muted">
                  {n} question{n === 1 ? "" : "s"}
                  {s?.confident ? ` · ${s.confident} confident` : ""}
                </span>
              </button>
              {i < LEVELS.length - 1 && <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />}
            </li>
          );
        })}
        <li className="flex items-center pl-2">
          <button type="button" aria-current={level === "all" ? "step" : undefined} onClick={() => onChange("all")} className={cn("rounded-xl border px-3 py-2.5 text-sm transition-colors", level === "all" ? "border-accent bg-accent-soft" : "border-border bg-surface hover:bg-surface-2")}>
            All levels <span className="font-mono text-xs text-muted tabular-nums">{total}</span>
          </button>
        </li>
      </ol>
    </nav>
  );
}

function NextStep({ level, steps, onGo }: { level: 1 | 2 | 3 | 4 | 5; steps?: { difficulty: number; total: number }[]; onGo: (l: 1 | 2 | 3 | 4 | 5) => void }) {
  const next = LEVELS.find((l) => l.level > level && (steps?.find((s) => s.difficulty === l.level)?.total ?? 0) > 0);
  if (!next) return <p className="text-center text-sm text-muted">That&apos;s the hardest step. Switch to “All levels” to review everything.</p>;
  return (
    <div className="flex justify-center">
      <Button onClick={() => onGo(next.level)}>
        Next: Step {next.level} · {next.label} <ArrowRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
