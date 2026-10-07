"use client";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, CheckCircle2, Lightbulb, Lock, Play, Send, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { EmptyState, ErrorState, PageSkeleton, Tabs } from "@/components/ui/misc";
import { ScoreRing } from "@/components/ui/progress";
import { CODE_EXECUTION_OFF, useCodeExecution, useMe } from "@/features/auth/use-me";
import { InkAnnotation } from "@/components/ui/paper";
import { api, ApiError } from "@/lib/api/client";
import type { BuildTask, TestView } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type Lang = "javascript" | "python";
interface RunResponse { output: string; stderr: string; timedOut: boolean; tests: TestView[] }
interface SubmitResponse extends RunResponse { status: string; passedCount: number; totalCount: number; explainQuestions: string[] | null }
interface ExplainResponse { passed: boolean; minExplainScore: number; explainScore: number; feedback: { question: string; score: number; missing: string[] }[]; independenceScore?: number; projectScore?: number; breakdown?: { tests: number; explanation: number; hintsUsed: number; independence: number } }

const show = (v: unknown) => JSON.stringify(v);

function TestList({ tests }: { tests: TestView[] }) {
  return (
    <ul className="space-y-1.5">
      {tests.map((t, i) => (
        <li key={i} className={cn("rounded-md border p-2 text-xs", t.passed ? "border-accent/30 bg-accent-soft" : "border-danger/30 bg-danger-soft")}>
          <div className="flex items-center gap-2 font-medium">
            {t.passed ? <CheckCircle2 className="size-3.5 text-accent" /> : <XCircle className="size-3.5 text-danger" />}
            {t.hidden ? <><Lock className="size-3" /> Hidden test</> : t.name}
          </div>
          {!t.hidden && (
            <div className="mt-1 grid gap-0.5 pl-5 font-mono text-[11px] text-muted">
              <span>input: {t.args?.map(show).join(", ")}</span>
              <span>expected: {show(t.expected)}</span>
              {!t.passed && <span className="text-text">got: {t.error ? <span className="text-danger">{t.error}</span> : show(t.actual)}</span>}
            </div>
          )}
          {t.hidden && !t.passed && t.error && <div className="mt-1 pl-5 text-muted">{t.error}</div>}
        </li>
      ))}
    </ul>
  );
}

export default function WorkspacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: me, isLoading: meLoading } = useMe();
  const { data: task, error, isLoading, refetch } = useQuery({ queryKey: ["build", slug], queryFn: () => api.get<BuildTask>(`/build-tasks/${slug}`) });

  if (isLoading || meLoading) return <div className="p-6"><PageSkeleton /></div>;
  if (error instanceof ApiError && error.status === 423) return <div className="mx-auto max-w-xl p-6"><EmptyState icon={<Lock className="size-5" />} title="Not unlocked yet" description={error.message} action={<Link href="/build" className={buttonClass("secondary", "sm")}>All build tasks</Link>} /></div>;
  if (error || !task) return <div className="mx-auto max-w-xl p-6"><ErrorState error={error} retry={() => refetch()} /></div>;
  const preferred: Lang = task.submission?.language ?? (me?.profile?.startLanguage === "PYTHON" ? "python" : "javascript");
  return <Workspace key={slug} slug={slug} task={task} preferred={preferred} />;
}

function Workspace({ slug, task, preferred }: { slug: string; task: BuildTask; preferred: Lang }) {
  const qc = useQueryClient();
  const [lang, setLang] = useState<Lang>(preferred);
  const [code, setCode] = useState<Record<Lang, string>>(() => ({
    javascript: task.starter.javascript,
    python: task.starter.python,
    ...(task.submission ? { [task.submission.language]: task.submission.code } : {}),
  }));
  const [panel, setPanel] = useState<"tests" | "output">("tests");
  const [run, setRun] = useState<RunResponse | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [answers, setAnswers] = useState<string[]>(() => task.explainQuestions?.map(() => "") ?? []);
  const [explainResult, setExplainResult] = useState<ExplainResponse | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    if (!task.submission) api.post(`/build-tasks/${slug}/start`, { language: preferred }).catch(() => undefined);
  }, [task.submission, slug, preferred]);

  // Autosave the code every 5 seconds while editing.
  useEffect(() => {
    const t = setInterval(() => {
      if (!dirty.current) return;
      dirty.current = false;
      api.put(`/build-tasks/${slug}/code`, { language: lang, code: code[lang] }).catch(() => { dirty.current = true; });
    }, 5000);
    return () => clearInterval(t);
  }, [slug, lang, code]);

  const canRun = useCodeExecution();
  const runM = useMutation({
    mutationFn: () => api.post<RunResponse>(`/build-tasks/${slug}/run`, { language: lang, code: code[lang] }),
    onSuccess: (r) => { setRun(r); setPanel(r.stderr && !r.tests.length ? "output" : "tests"); },
  });
  const submitM = useMutation({
    mutationFn: () => api.post<SubmitResponse>(`/build-tasks/${slug}/submit`, { language: lang, code: code[lang] }),
    onSuccess: (r) => {
      setSubmitResult(r);
      setRun(r);
      setPanel("tests");
      if (r.explainQuestions) {
        setAnswers((a) => (a.length === r.explainQuestions!.length ? a : r.explainQuestions!.map(() => "")));
        toast.success(`All ${r.totalCount} tests passed. Now explain your code.`);
      } else toast.error(`${r.passedCount}/${r.totalCount} tests passed. Keep going.`);
      qc.invalidateQueries({ queryKey: ["build", slug] });
    },
  });
  const hintM = useMutation({
    mutationFn: () => api.post<{ level: number; hint: string; independenceScore: number }>(`/build-tasks/${slug}/hint`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["build", slug] }),
  });
  const explainM = useMutation({
    mutationFn: () => api.post<ExplainResponse>(`/build-tasks/${slug}/explain`, { answers }),
    onSuccess: (r) => {
      setExplainResult(r);
      qc.invalidateQueries({ queryKey: ["build", slug] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const sub = task.submission;
  const status = sub?.status ?? "IN_PROGRESS";
  const explainQuestions = submitResult?.explainQuestions ?? task.explainQuestions;
  const hintsUsed = sub?.hintsUsed ?? 0;
  const independence = sub?.independenceScore ?? 100;
  const completed = status === "COMPLETED" || explainResult?.passed;
  const nextPenalty = task.hintPenalties[hintsUsed];

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={task.topic ? `/learn/topic/${task.topic.slug}` : "/build"} aria-label="Back" className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-text"><ArrowLeft className="size-4" /></Link>
          <div className="min-w-0">
            <div className="font-mono text-[10px] font-semibold tracking-[0.2em] text-accent-2">BUILD WITHOUT AI · WORKSHEET</div>
            <h1 className="font-display truncate text-base font-semibold">{task.title}</h1>
          </div>
          <InkAnnotation className="hidden -rotate-2 text-xl md:inline">Close the AI tab.</InkAnnotation>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge tone="danger"><Bot className="size-3" /> AI chat: OFF</Badge>
          <Badge tone="danger">Autocomplete: OFF</Badge>
          <Badge tone={independence >= 90 ? "accent" : "warn"}>Independence {Math.round(independence)}</Badge>
          {completed && <Badge tone="accent"><Trophy className="size-3" /> Completed</Badge>}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <aside className="paper-ruled min-h-0 space-y-6 overflow-y-auto border-b border-border bg-surface/60 p-5 lg:border-b-0 lg:border-r">
          <section>
            <h2 className="mb-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-accent-2">01 · YOUR TASK</h2>
            <Markdown className="text-sm">{task.description}</Markdown>
            <p className="mt-3 text-xs text-muted">Implement <code className="rounded bg-surface-2 px-1 font-mono">{task.functionName}</code>. {task.publicTests.length} visible tests, {task.hiddenTestCount} hidden.</p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-accent-2">02 · EXPECTED BEHAVIOUR</h2>
            <ul className="space-y-1.5 font-mono text-[11px]">
              {task.publicTests.map((t) => (
                <li key={t.name} className="rounded-md border border-border bg-surface-2 p-2">
                  <div className="text-subtle">{t.name}</div>
                  <div>{task.functionName}({t.args.map(show).join(", ")}) → {show(t.expected)}</div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-accent-2"><Lightbulb className="size-3.5" /> 03 · HINTS ({hintsUsed}/{task.hints.total})</h2>
            <ol className="space-y-2">
              {task.hints.revealed.map((h, i) => (
                <li key={i} className="rounded-md border border-warn/30 bg-warn-soft p-3 text-sm">
                  <div className="mb-1 font-mono text-[10px] uppercase text-warn">{["Concept", "Step", "Partial code"][i]} hint</div>
                  <Markdown className="text-sm">{h}</Markdown>
                </li>
              ))}
            </ol>
            {hintsUsed < task.hints.total && !completed && (
              <Button size="sm" variant="secondary" className="mt-2" onClick={() => hintM.mutate()} loading={hintM.isPending}>
                Reveal {["concept", "step", "partial-code"][hintsUsed]} hint <span className="text-subtle">(−{nextPenalty} independence)</span>
              </Button>
            )}
            <p className="mt-2 text-xs text-subtle">Hints are fine — they just lower your independence score a little. Try for 5 minutes first.</p>
          </section>

          {explainQuestions && !completed && (
            <section className="rounded-xl border border-accent/30 bg-accent-soft p-4">
              <h2 className="text-sm font-semibold">Explain your code</h2>
              <p className="mt-1 text-xs text-muted">Interviewers will ask exactly this. Answer in your own words (Hinglish is fine).</p>
              <form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); explainM.mutate(); }}>
                {explainQuestions.map((q, i) => (
                  <div key={q}>
                    <label htmlFor={`ex-${i}`} className="text-sm font-medium">{i + 1}. {q}</label>
                    <Textarea id={`ex-${i}`} className="mt-1 bg-surface" value={answers[i] ?? ""} onChange={(e) => setAnswers((a) => { const n = [...a]; n[i] = e.target.value; return n; })} />
                    {explainResult && !explainResult.passed && explainResult.feedback[i]?.missing.length > 0 && <p className="mt-1 text-xs text-warn">Think about: {explainResult.feedback[i].missing.join(", ")}</p>}
                  </div>
                ))}
                <Button type="submit" size="sm" loading={explainM.isPending} disabled={answers.some((a) => !a.trim())}>Submit explanation</Button>
                {explainResult && !explainResult.passed && <p className="text-xs text-warn">Score {explainResult.explainScore}/100 — need {explainResult.minExplainScore}. Add more of the why.</p>}
              </form>
            </section>
          )}

          {completed && (
            <section className="rounded-xl border border-accent/30 bg-surface p-5 text-center">
              <ScoreRing value={explainResult?.projectScore ?? sub?.projectScore ?? 0} size={120} label="Project score" sub="project score" />
              <div className="mt-3 text-sm font-semibold">{independence >= 95 ? "You built this independently." : "Built and explained — nice."}</div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-left text-xs">
                <div className="rounded-md bg-surface-2 p-2"><dt className="text-subtle">Tests</dt><dd className="font-mono">{sub?.passedCount ?? submitResult?.passedCount}/{sub?.totalCount ?? submitResult?.totalCount}</dd></div>
                <div className="rounded-md bg-surface-2 p-2"><dt className="text-subtle">Explanation</dt><dd className="font-mono">{Math.round(explainResult?.explainScore ?? sub?.explainScore ?? 0)}</dd></div>
                <div className="rounded-md bg-surface-2 p-2"><dt className="text-subtle">Hints used</dt><dd className="font-mono">{hintsUsed}</dd></div>
                <div className="rounded-md bg-surface-2 p-2"><dt className="text-subtle">Independence</dt><dd className="font-mono">{Math.round(explainResult?.independenceScore ?? independence)}</dd></div>
              </dl>
              <Link href="/build" className={buttonClass("secondary", "sm", "mt-4")}>More build tasks</Link>
            </section>
          )}
        </aside>

        <section className="flex min-h-[60vh] min-w-0 flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <Tabs value={lang} onChange={(v) => setLang(v)} items={[{ value: "javascript", label: "JavaScript" }, { value: "python", label: "Python" }]} />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => runM.mutate()} loading={runM.isPending} disabled={!canRun}><Play className="size-3.5" /> Run tests</Button>
              <Button size="sm" onClick={() => submitM.mutate()} loading={submitM.isPending} disabled={!canRun}><Send className="size-3.5" /> Submit</Button>
            </div>
          </div>
          {!canRun && <p role="status" className="border-b border-warn/30 bg-warn-soft px-3 py-2 text-xs text-warn">{CODE_EXECUTION_OFF}</p>}
          <div className="min-h-0 flex-1 bg-code">
            <CodeEditor value={code[lang]} onChange={(v) => { dirty.current = true; setCode((c) => ({ ...c, [lang]: v })); }} language={lang} ariaLabel={`${lang} solution`} />
          </div>
          <div className="h-64 shrink-0 overflow-hidden border-t border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
              <Tabs value={panel} onChange={setPanel} items={[{ value: "tests", label: "Tests" }, { value: "output", label: "Output" }]} />
              {run && <span className="font-mono text-xs text-muted">{run.tests.filter((t) => t.passed).length}/{run.tests.length} passing{run.timedOut && " · timed out"}</span>}
            </div>
            <div className="h-[calc(100%-37px)] overflow-y-auto p-3" aria-live="polite">
              {!run ? <p className="text-sm text-subtle">Run tests to see results. Submit runs hidden tests too.</p>
                : panel === "tests" ? <TestList tests={run.tests} />
                : <pre className="whitespace-pre-wrap font-mono text-xs leading-5">{run.output || <span className="text-subtle">(no output)</span>}{run.stderr && <span className="mt-2 block text-danger">{run.stderr}</span>}</pre>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
