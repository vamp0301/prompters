"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, EyeOff, FlaskConical, Plus, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { Tabs } from "@/components/ui/misc";
import { EntityPage, FormFooter, useEntitySave, type FormProps } from "@/features/admin/entity-page";
import { ExplainEditor, TopicSelect } from "@/features/admin/shared-fields";
import { DifficultySelect, move, RowControls, slugify, StatusBadge, StatusSelect, Td } from "@/features/admin/ui";
import { api } from "@/lib/api/client";
import type { AdminBuildTask, AdminExplainQ, ContentStatus } from "@/lib/api/types";
import { cn, relativeTime } from "@/lib/utils";

type TestDraft = { name: string; args: string; expected: string; hidden: boolean };
const parseJson = (s: string): { ok: true; value: unknown } | { ok: false; error: string } => {
  try { return { ok: true, value: JSON.parse(s) }; } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" }; }
};
const testError = (t: TestDraft) => {
  const a = parseJson(t.args);
  if (!a.ok) return { args: a.error };
  if (!Array.isArray(a.value)) return { args: "Args must be a JSON array, e.g. [1, 2]" };
  const e = parseJson(t.expected);
  if (!e.ok) return { expected: e.error };
  return null;
};

const HINT_LABELS = ["Hint 1 · concept", "Hint 2 · step", "Hint 3 · partial code"];

function ReferenceCheck({ task }: { task: AdminBuildTask }) {
  const [lang, setLang] = useState<"javascript" | "python">("javascript");
  const [code, setCode] = useState({ javascript: `function ${task.functionName}() {\n  \n}\n`, python: `def ${task.functionName}():\n    pass\n` });
  const run = useMutation({
    mutationFn: () => api.post<{ allPassed: boolean; outcomes: { name: string; passed: boolean; hidden: boolean; actual?: unknown; error?: string }[]; stderr: string }>(`/admin/build-tasks/${task.id}/validate`, { language: lang, code: code[lang] }),
  });
  return (
    <section className="space-y-3 rounded-xl border border-info/30 bg-info-soft/30 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <FlaskConical className="size-4 text-info" aria-hidden />
        <h3 className="text-sm font-semibold">Validate with a reference solution</h3>
        <span className="text-xs text-muted">Runs the <em>saved</em> tests in the sandbox. The solution is not stored.</span>
        <Tabs className="ml-auto" value={lang} onChange={setLang} items={[{ value: "javascript", label: "JavaScript" }, { value: "python", label: "Python" }]} />
      </div>
      <div className="h-56 overflow-hidden rounded-lg border border-border"><CodeEditor language={lang} value={code[lang]} onChange={(v) => setCode((c) => ({ ...c, [lang]: v }))} ariaLabel="Reference solution" /></div>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" loading={run.isPending} onClick={() => run.mutate()}>Run tests</Button>
        {run.data && (run.data.allPassed ? <Badge tone="accent"><CheckCircle2 className="size-3" /> All {run.data.outcomes.length} passed</Badge> : <Badge tone="danger"><XCircle className="size-3" /> {run.data.outcomes.filter((o) => !o.passed).length} failing</Badge>)}
      </div>
      {run.data && (
        <ul className="space-y-1">
          {run.data.outcomes.map((o, i) => (
            <li key={i} className={cn("flex flex-wrap items-center gap-2 rounded-md px-2 py-1 font-mono text-[12px]", o.passed ? "bg-accent-soft" : "bg-danger-soft")}>
              {o.passed ? <CheckCircle2 className="size-3.5 text-accent" /> : <XCircle className="size-3.5 text-danger" />}
              <span>{o.name}</span>{o.hidden && <Badge><EyeOff className="size-3" /> hidden</Badge>}
              {!o.passed && <span className="text-muted">{o.error ?? `got ${JSON.stringify(o.actual)}`}</span>}
            </li>
          ))}
          {run.data.stderr && <pre className="mt-2 max-h-32 overflow-auto rounded bg-code p-2 font-mono text-[11px] text-danger">{run.data.stderr}</pre>}
        </ul>
      )}
    </section>
  );
}

function BuildTaskForm({ record, prefill, readOnly, onDone }: FormProps<AdminBuildTask>) {
  const [f, setF] = useState(() => ({
    slug: record?.slug ?? "",
    topicId: record?.topicId ?? prefill.topicId ?? "",
    title: record?.title ?? "",
    description: record?.description ?? "",
    functionName: record?.functionName ?? "solve",
    starterJs: record?.starterJs ?? "function solve(input) {\n  // your code\n}\n",
    starterPython: record?.starterPython ?? "def solve(input):\n    # your code\n    pass\n",
    tests: (record?.tests ?? [{ name: "basic", args: [], expected: null }]).map((t): TestDraft => ({ name: t.name, args: JSON.stringify(t.args), expected: JSON.stringify(t.expected ?? null), hidden: !!t.hidden })),
    hints: [0, 1, 2].map((i) => record?.hints?.[i] ?? ""),
    explainQuestions: (record?.explainQuestions ?? [{ question: "", keywords: [] }]) as AdminExplainQ[],
    difficulty: record?.difficulty ?? 1,
    estMinutes: record?.estMinutes ?? 20,
    status: (record?.status ?? "DRAFT") as ContentStatus,
  }));
  const [descTab, setDescTab] = useState<"write" | "preview">("write");
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const { save, archive, errors: e } = useEntitySave("build-tasks", record, "Build task", onDone);
  const testErrors = f.tests.map(testError);
  const hasJsonErrors = testErrors.some(Boolean);
  const setTest = (i: number, patch: Partial<TestDraft>) => set("tests", f.tests.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  const submit = () => {
    if (hasJsonErrors) return;
    save.mutate({
      ...f,
      topicId: f.topicId || null,
      tests: f.tests.map((t) => ({ name: t.name, args: JSON.parse(t.args), expected: JSON.parse(t.expected), hidden: t.hidden })),
      explainQuestions: f.explainQuestions.map((q) => ({ question: q.question, keywords: q.keywords })),
    });
  };

  return (
    <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); submit(); }}>
      <fieldset disabled={readOnly} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title" htmlFor="bt-title" error={e.title}><Input id="bt-title" value={f.title} onChange={(x) => setF((p) => ({ ...p, title: x.target.value, slug: !record && (p.slug === "" || p.slug === slugify(p.title)) ? slugify(x.target.value) : p.slug }))} /></Field>
          <Field label="Slug" htmlFor="bt-slug" error={e.slug}><Input id="bt-slug" value={f.slug} onChange={(x) => set("slug", x.target.value)} className="font-mono" /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Topic" htmlFor="bt-topic" error={e.topicId} className="sm:col-span-2"><TopicSelect id="bt-topic" value={f.topicId} onChange={(v) => set("topicId", v)} optional /></Field>
          <Field label="Difficulty" htmlFor="bt-diff" error={e.difficulty}><DifficultySelect id="bt-diff" value={f.difficulty} onChange={(v) => set("difficulty", v)} /></Field>
          <Field label="Est. minutes" htmlFor="bt-min" error={e.estMinutes}><Input id="bt-min" type="number" min={1} max={600} value={f.estMinutes} onChange={(x) => set("estMinutes", Number(x.target.value))} /></Field>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between"><label htmlFor="bt-desc" className="text-xs font-medium text-muted">Description (Markdown)</label><Tabs value={descTab} onChange={setDescTab} items={[{ value: "write", label: "Write" }, { value: "preview", label: "Preview" }]} /></div>
          {descTab === "write" ? <Textarea id="bt-desc" value={f.description} onChange={(x) => set("description", x.target.value)} className="min-h-40 font-mono text-[13px]" maxLength={10000} /> : <div className="min-h-40 rounded-lg border border-border p-3"><Markdown className="text-sm">{f.description || "_Nothing yet_"}</Markdown></div>}
          {e.description && <p role="alert" className="mt-1 text-xs text-danger">{e.description}</p>}
        </div>
        <Field label="Function name" htmlFor="bt-fn" error={e.functionName} hint="The tests call this function in both languages."><Input id="bt-fn" value={f.functionName} onChange={(x) => set("functionName", x.target.value)} className="font-mono" /></Field>
        <div className="grid gap-3 lg:grid-cols-2">
          <div><div className="mb-1 text-xs font-medium text-muted">Starter · JavaScript</div><div className="h-48 overflow-hidden rounded-lg border border-border"><CodeEditor language="javascript" value={f.starterJs} onChange={(v) => set("starterJs", v)} readOnly={readOnly} ariaLabel="JavaScript starter" /></div></div>
          <div><div className="mb-1 text-xs font-medium text-muted">Starter · Python</div><div className="h-48 overflow-hidden rounded-lg border border-border"><CodeEditor language="python" value={f.starterPython} onChange={(v) => set("starterPython", v)} readOnly={readOnly} ariaLabel="Python starter" /></div></div>
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-xs font-medium text-muted">Tests <span className="font-mono text-subtle">({f.tests.length}/50 · {f.tests.filter((t) => t.hidden).length} hidden)</span></legend>
          {f.tests.map((t, i) => {
            const err = testErrors[i];
            return (
              <div key={i} className={cn("grid gap-2 rounded-lg border p-2.5 sm:grid-cols-[1fr_1.4fr_1fr_auto]", err ? "border-danger/40" : "border-border")}>
                <Input value={t.name} onChange={(x) => setTest(i, { name: x.target.value })} placeholder="name" aria-label={`Test ${i + 1} name`} className="h-9" />
                <div>
                  <Input value={t.args} onChange={(x) => setTest(i, { args: x.target.value })} placeholder="[1, 2]" aria-label={`Test ${i + 1} args (JSON array)`} aria-invalid={!!err?.args} className={cn("h-9 font-mono text-xs", err?.args && "border-danger")} spellCheck={false} />
                  {err?.args && <p className="mt-0.5 text-[11px] text-danger">{err.args}</p>}
                </div>
                <div>
                  <Input value={t.expected} onChange={(x) => setTest(i, { expected: x.target.value })} placeholder="3" aria-label={`Test ${i + 1} expected (JSON)`} aria-invalid={!!err?.expected} className={cn("h-9 font-mono text-xs", err?.expected && "border-danger")} spellCheck={false} />
                  {err?.expected && <p className="mt-0.5 text-[11px] text-danger">{err.expected}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <label className="flex items-center gap-1 text-xs text-muted"><input type="checkbox" checked={t.hidden} onChange={(x) => setTest(i, { hidden: x.target.checked })} className="accent-[var(--accent)]" /> hidden</label>
                  <RowControls index={i} count={f.tests.length} onMove={(d) => set("tests", move(f.tests, i, d))} onRemove={f.tests.length > 1 ? () => set("tests", f.tests.filter((_, j) => j !== i)) : undefined} labelText={`test ${i + 1}`} />
                </div>
              </div>
            );
          })}
          {f.tests.length < 50 && <Button type="button" size="sm" variant="ghost" onClick={() => set("tests", [...f.tests, { name: `case ${f.tests.length + 1}`, args: "[]", expected: "null", hidden: false }])}><Plus className="size-3.5" /> Add test</Button>}
          {e.tests && <p role="alert" className="text-xs text-danger">{e.tests}</p>}
        </fieldset>

        <fieldset className="grid gap-3 lg:grid-cols-3">
          <legend className="mb-1.5 text-xs font-medium text-muted">Hints (exactly 3, each costs independence points)</legend>
          {f.hints.map((h, i) => (
            <Field key={i} label={HINT_LABELS[i]} htmlFor={`bt-h${i}`}>
              <Textarea id={`bt-h${i}`} value={h} onChange={(x) => set("hints", f.hints.map((y, j) => (j === i ? x.target.value : y)))} className={cn("min-h-24", i === 2 && "font-mono text-[12px]")} maxLength={3000} />
            </Field>
          ))}
          {e.hints && <p role="alert" className="text-xs text-danger lg:col-span-3">{e.hints}</p>}
        </fieldset>
        <ExplainEditor value={f.explainQuestions} onChange={(v) => set("explainQuestions", v)} max={6} error={e.explainQuestions} />
        <Field label="Status" htmlFor="bt-status" error={e.status} className="max-w-xs"><StatusSelect id="bt-status" value={f.status} onChange={(v) => set("status", v as ContentStatus)} /></Field>
      </fieldset>
      {hasJsonErrors && <p role="alert" className="text-xs text-danger">Fix the JSON in the highlighted tests before saving.</p>}
      {record && <ReferenceCheck task={record} />}
      <FormFooter save={save} archive={archive} isEdit={!!record} readOnly={readOnly} onDone={onDone} label="Build task" archived={record?.status === "ARCHIVED"} />
    </form>
  );
}

export default function BuildTasksPage() {
  return (
    <EntityPage<AdminBuildTask>
      path="build-tasks" label="Build task" eyebrow="Build without AI" title="Build tasks" write="AUTHOR"
      description="Hands-on tasks graded by tests, with 3 paid hints and an explain-your-solution check."
      searchPlaceholder="Search title or slug"
      headers={[{ label: "Task" }, { label: "Topic" }, { label: "Tests", right: true }, { label: "Diff", right: true }, { label: "Subs", right: true }, { label: "Status" }, { label: "Updated" }]}
      row={(t, open) => (
        <tr key={t.id} className="cursor-pointer hover:bg-surface-2/40" onClick={open}>
          <Td><button className="text-left font-medium hover:text-accent" onClick={(e) => { e.stopPropagation(); open(); }}>{t.title}</button><div className="font-mono text-[11px] text-subtle">{t.slug} · {t.functionName}()</div></Td>
          <Td className="text-xs text-muted">{t.topic?.title ?? "—"}</Td>
          <Td right mono>{t.tests.length}<span className="text-subtle"> ({t.tests.filter((x) => x.hidden).length}h)</span></Td>
          <Td right mono>{t.difficulty}</Td>
          <Td right mono>{t._count.submissions}</Td>
          <Td><StatusBadge status={t.status} /></Td>
          <Td className="whitespace-nowrap text-xs text-muted">{relativeTime(t.updatedAt)}</Td>
        </tr>
      )}
      Form={BuildTaskForm}
    />
  );
}

