"use client";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, MessagesSquare, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { api, qs } from "@/lib/api/client";
import type { GoalRole, InterviewList, InterviewPracticeResult, InterviewQ } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const ACRONYMS = new Set(["DSA", "OS", "DBMS", "OOP", "HR", "AI", "SDE"]);
export const prettyCategory = (c: string) => (ACRONYMS.has(c) ? c : c.charAt(0) + c.slice(1).toLowerCase().replace(/_/g, " "));

const ROLES: { value: GoalRole; label: string }[] = [
  { value: "BACKEND", label: "Backend" },
  { value: "FRONTEND", label: "Frontend" },
  { value: "FULLSTACK", label: "Full-stack" },
  { value: "DEVOPS", label: "DevOps" },
  { value: "SDE", label: "SDE" },
  { value: "AI", label: "AI" },
];

const DIFFICULTY: Record<number, string> = { 1: "Easy", 2: "Medium", 3: "Hard" };
const scoreTone = (s: number) => (s >= 70 ? "accent" : s >= 40 ? "warn" : "danger") as "accent" | "warn" | "danger";

export function InterviewBank() {
  const uid = useId();
  const [category, setCategory] = useState("");
  const [role, setRole] = useState("");
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applySearch = (value: string) => {
    if (timer.current) clearTimeout(timer.current);
    setQ(value.trim());
    setPage(1);
  };
  const onSearchChange = (value: string) => {
    setInput(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setQ(value.trim());
      setPage(1);
    }, 300);
  };

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["interview-questions", { category, role, q, page }],
    queryFn: () => api.get<InterviewList>(`/interview/questions${qs({ category, role, q, page })}`),
    placeholderData: (prev) => prev,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const filtered = Boolean(category || role || q);
  const clear = () => {
    setCategory("");
    setRole("");
    setInput("");
    applySearch("");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Interview prep"
        title="Practise out loud, then compare"
        description="Answer each question the way you would in the room. We check your answer for the key ideas interviewers listen for, then show you the model answer."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_180px]">
        <form
          role="search"
          className="relative sm:col-span-2 lg:col-span-1"
          onSubmit={(e) => {
            e.preventDefault();
            applySearch(input);
          }}
        >
          <label htmlFor={`${uid}-q`} className="sr-only">Search questions</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <Input id={`${uid}-q`} type="search" value={input} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search questions" className="pl-9" />
        </form>
        <div>
          <label htmlFor={`${uid}-cat`} className="sr-only">Category</label>
          <Select id={`${uid}-cat`} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {data?.categories
              .slice()
              .sort((a, b) => prettyCategory(a.category).localeCompare(prettyCategory(b.category)))
              .map((c) => <option key={c.category} value={c.category}>{prettyCategory(c.category)} ({c.count})</option>)}
          </Select>
        </div>
        <div>
          <label htmlFor={`${uid}-role`} className="sr-only">Role</label>
          <Select id={`${uid}-role`} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2" role="status" aria-busy="true" aria-label="Loading questions">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : error ? (
        <ErrorState error={error} retry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        filtered ? (
          <EmptyState icon={<Search className="size-5" />} title="No questions match these filters" description="Try a broader search, or a different category or role." action={<Button variant="secondary" size="sm" onClick={clear}>Clear filters</Button>} />
        ) : (
          <EmptyState icon={<MessagesSquare className="size-5" />} title="No interview questions published yet" description="Questions are added with each topic. In the meantime, every topic page has its own interview section." action={<Link href="/learn" className="text-sm text-accent underline-offset-4 hover:underline">Open roadmap</Link>} />
        )
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span className="font-mono">{data.total} question{data.total === 1 ? "" : "s"}</span>
            {isFetching && <span aria-live="polite">Updating…</span>}
          </div>
          <ul className={cn("space-y-2 transition-opacity", isFetching && "opacity-70")}>
            {data.items.map((item) => <QuestionRow key={item.id} q={item} />)}
          </ul>
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3">
              <Button variant="secondary" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="size-4" aria-hidden /> Prev
              </Button>
              <span className="font-mono text-xs text-muted">Page {data.page} of {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page >= totalPages || isFetching} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next <ChevronRight className="size-4" aria-hidden />
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function QuestionRow({ q }: { q: InterviewQ }) {
  const uid = useId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [skipped, setSkipped] = useState(false);
  const practice = useMutation({
    mutationFn: () => api.post<InterviewPracticeResult>(`/interview/questions/${q.id}/practice`, { answer }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["interview-questions"] }),
  });
  const result = practice.data;
  const model = result
    ? { short: result.modelShort, deep: result.modelDeep, followUps: result.followUps, commonMistake: result.commonMistake }
    : skipped
      ? { short: q.short, deep: q.deep, followUps: q.followUps, commonMistake: q.commonMistake }
      : null;

  return (
    <li className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`${uid}-panel`}
        className="flex w-full items-start gap-3 rounded-xl p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div className="min-w-0 flex-1">
          <div className="font-medium leading-snug">{q.question}</div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {q.category && <Badge>{prettyCategory(q.category)}</Badge>}
            <Badge tone={q.difficulty >= 3 ? "warn" : "neutral"}>{DIFFICULTY[q.difficulty] ?? `Level ${q.difficulty}`}</Badge>
            {q.bestScore !== null && q.bestScore !== undefined && (
              <Badge tone={scoreTone(q.bestScore)}><span className="font-mono">Best {q.bestScore}</span></Badge>
            )}
          </div>
        </div>
        <ChevronDown className={cn("mt-1 size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div id={`${uid}-panel`} className="space-y-4 border-t border-border p-4 text-sm">
          {q.topic && (
            <p className="text-xs text-muted">
              Topic: <Link href={`/learn/topic/${q.topic.slug}`} className="text-text underline-offset-4 hover:underline">{q.topic.title}</Link>
            </p>
          )}

          {!skipped || result ? (
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (answer.trim()) practice.mutate();
              }}
            >
              <label htmlFor={`${uid}-answer`} className="block text-xs font-medium text-muted">Answer like you&apos;re in the interview</label>
              <Textarea id={`${uid}-answer`} value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={5000} className="min-h-32" placeholder="Explain it in your own words — what it is, why it matters, a quick example." />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" size="sm" loading={practice.isPending} disabled={!answer.trim()}>{result ? "Try again" : "Check my answer"}</Button>
                {!model && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSkipped(true)}>Skip — show the model answer</Button>
                )}
                <span className="ml-auto font-mono text-[11px] text-subtle">{answer.length}/5000</span>
              </div>
            </form>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setSkipped(false)}>Practise this one instead</Button>
          )}

          {result && (
            <div className="space-y-3 rounded-lg border border-border bg-surface-2/50 p-4" aria-live="polite">
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-semibold tabular-nums">{result.score}<span className="text-sm text-subtle">/100</span></span>
                <Progress value={result.score} tone={scoreTone(result.score)} label="Answer score" className="flex-1" />
              </div>
              {result.matched.length > 0 && (
                <div>
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-accent">Key ideas you covered</div>
                  <div className="flex flex-wrap gap-1.5">{result.matched.map((k) => <Badge key={k} tone="accent">{k.split("|")[0]}</Badge>)}</div>
                </div>
              )}
              {result.missing.length > 0 && (
                <div>
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-warn">Key ideas to add</div>
                  <div className="flex flex-wrap gap-1.5">{result.missing.map((k) => <Badge key={k} tone="warn">{k.split("|")[0]}</Badge>)}</div>
                </div>
              )}
            </div>
          )}

          {model && (
            <div className="space-y-4">
              <div className="rounded-lg bg-accent-soft p-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-accent">Say it in 30 seconds</div>
                <p className="leading-relaxed">{model.short}</p>
              </div>
              <div>
                <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-subtle">Deep answer</div>
                <Markdown className="text-sm">{model.deep}</Markdown>
              </div>
              {model.followUps.length > 0 && (
                <div>
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-subtle">Likely follow-ups</div>
                  <ul className="list-disc space-y-1 pl-5 text-muted">{model.followUps.map((f) => <li key={f}>{f}</li>)}</ul>
                </div>
              )}
              {model.commonMistake && <p className="rounded-lg bg-warn-soft p-3 text-warn"><strong>Common mistake:</strong> {model.commonMistake}</p>}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
