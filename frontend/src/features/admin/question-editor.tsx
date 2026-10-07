"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Plus, Square, SquareCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ErrorState, Skeleton } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { AdminQuestion, ContentStatus, QuestionType } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useAllTopics } from "./hooks";
import { DifficultySelect, fieldErrorsOf, FormError, ListEditor, Modal, move, RowControls, StatusSelect, TagInput } from "./ui";

export const QUESTION_TYPES: { value: QuestionType; label: string; help: string }[] = [
  { value: "MCQ", label: "Multiple choice", help: "One correct option." },
  { value: "MULTI", label: "Multi-select", help: "Several correct options; learner must pick all of them." },
  { value: "PREDICT_OUTPUT", label: "Predict the output", help: "Show code; options are possible outputs." },
  { value: "SPOT_BUG", label: "Spot the bug", help: "Show buggy code; options describe the bug." },
  { value: "FILL_CODE", label: "Fill the code", help: "Code with a blank; options fill it." },
  { value: "SCENARIO", label: "Scenario", help: "A real situation; pick the best decision." },
  { value: "ORDER_STEPS", label: "Order the steps", help: "List options in the CORRECT order — learners see them shuffled." },
  { value: "EXPLAIN", label: "Explain (free text)", help: "Graded by keywords. Use “a|b” for accepted alternatives." },
];

type Draft = {
  topicId: string;
  type: QuestionType;
  difficulty: number;
  prompt: string;
  code: string;
  codeLanguage: "" | "javascript" | "python";
  options: string[];
  correct: number[];
  keywords: string[];
  explanation: string;
  tags: string[];
  points: number;
  status: ContentStatus;
};

const fromQuestion = (q: AdminQuestion): Draft => ({
  topicId: q.topicId,
  type: q.type,
  difficulty: q.difficulty,
  prompt: q.prompt,
  code: q.code ?? "",
  codeLanguage: q.codeLanguage ?? "",
  options: q.options ?? [],
  correct: q.correct ?? [],
  keywords: q.keywords,
  explanation: q.explanation,
  tags: q.tags,
  points: q.points,
  status: q.status,
});

const blank = (topicId: string): Draft => ({
  topicId, type: "MCQ", difficulty: 1, prompt: "", code: "", codeLanguage: "", options: ["", ""], correct: [], keywords: [], explanation: "", tags: [], points: 1, status: "PUBLISHED",
});

function toBody(d: Draft) {
  const explain = d.type === "EXPLAIN";
  return {
    topicId: d.topicId,
    type: d.type,
    difficulty: d.difficulty,
    prompt: d.prompt,
    code: d.code.trim() ? d.code : null,
    codeLanguage: d.codeLanguage || null,
    options: explain ? null : d.options,
    correct: explain || d.type === "ORDER_STEPS" ? null : d.correct,
    keywords: d.keywords.map((k) => k.trim()).filter(Boolean),
    explanation: d.explanation,
    tags: d.tags,
    points: d.points,
    status: d.status,
  };
}

function OptionsEditor({ d, setD, error }: { d: Draft; setD: (fn: (d: Draft) => Draft) => void; error?: string }) {
  const multi = d.type === "MULTI";
  const ordered = d.type === "ORDER_STEPS";
  const toggle = (i: number) =>
    setD((p) => ({ ...p, correct: multi ? (p.correct.includes(i) ? p.correct.filter((x) => x !== i) : [...p.correct, i].sort((a, b) => a - b)) : [i] }));
  const remove = (i: number) =>
    setD((p) => ({ ...p, options: p.options.filter((_, j) => j !== i), correct: p.correct.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c)) }));
  const reorder = (i: number, dir: -1 | 1) =>
    setD((p) => {
      const j = i + dir;
      const map = (c: number) => (c === i ? j : c === j ? i : c);
      return { ...p, options: move(p.options, i, dir), correct: p.correct.map(map) };
    });
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-medium text-muted">
        {ordered ? "Steps — in the correct order" : multi ? "Options — tick every correct one" : "Options — pick the correct one"}
        <span className="ml-1 font-mono text-subtle">({d.options.length}/10)</span>
      </legend>
      <div className="space-y-1.5">
        {d.options.map((o, i) => {
          const isCorrect = d.correct.includes(i);
          return (
            <div key={i} className={cn("flex items-center gap-1.5 rounded-lg border p-1", isCorrect && !ordered ? "border-accent/50 bg-accent-soft" : "border-transparent")}>
              {ordered ? (
                <span className="w-7 text-center font-mono text-[11px] text-subtle">{i + 1}</span>
              ) : (
                <button
                  type="button"
                  role={multi ? "checkbox" : "radio"}
                  aria-checked={isCorrect}
                  aria-label={`Mark option ${i + 1} correct`}
                  onClick={() => toggle(i)}
                  className={cn("grid size-7 shrink-0 place-items-center rounded-md", isCorrect ? "text-accent" : "text-subtle hover:text-text")}
                >
                  {multi ? (isCorrect ? <SquareCheck className="size-4" /> : <Square className="size-4" />) : isCorrect ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                </button>
              )}
              <Input value={o} onChange={(e) => setD((p) => ({ ...p, options: p.options.map((x, j) => (j === i ? e.target.value : x)) }))} aria-label={`Option ${i + 1}`} className="h-9 font-mono text-[13px]" />
              <RowControls index={i} count={d.options.length} onMove={(dir) => reorder(i, dir)} onRemove={() => remove(i)} labelText={`option ${i + 1}`} />
            </div>
          );
        })}
      </div>
      {d.options.length < 10 && <Button type="button" size="sm" variant="ghost" className="mt-1" onClick={() => setD((p) => ({ ...p, options: [...p.options, ""] }))}><Plus className="size-3.5" /> Add option</Button>}
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </fieldset>
  );
}

function QuestionForm({ initial, id, lockTopic, onDone }: { initial: Draft; id?: string; lockTopic?: boolean; onDone: () => void }) {
  const qc = useQueryClient();
  const topics = useAllTopics();
  const [d, setDraft] = useState(initial);
  const setD = (fn: (d: Draft) => Draft) => setDraft(fn);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((p) => ({ ...p, [k]: v }));
  const save = useMutation({
    meta: { silent: true },
    mutationFn: () => (id ? api.patch(`/admin/questions/${id}`, toBody(d)) : api.post("/admin/questions", toBody(d))),
    onSuccess: () => { toast.success(id ? "Question saved" : "Question created"); qc.invalidateQueries({ queryKey: ["admin"] }); onDone(); },
  });
  const archive = useMutation({
    mutationFn: () => api.post(`/admin/questions/${id}/archive`),
    onSuccess: () => { toast.success("Question archived"); qc.invalidateQueries({ queryKey: ["admin"] }); onDone(); },
  });
  const e = fieldErrorsOf(save.error);
  const meta = QUESTION_TYPES.find((t) => t.value === d.type);

  return (
    <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); save.mutate(); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Topic" htmlFor="q-topic" error={e.topicId}>
          <Select id="q-topic" value={d.topicId} disabled={lockTopic} onChange={(x) => set("topicId", x.target.value)}>
            {!d.topicId && <option value="">Choose a topic…</option>}
            {topics.data?.map((t) => <option key={t.id} value={t.id}>{t.module.stage.code} · {t.title}</option>)}
            {!topics.data && d.topicId && <option value={d.topicId}>Loading…</option>}
          </Select>
        </Field>
        <Field label="Type" htmlFor="q-type" error={e.type} hint={meta?.help}>
          <Select id="q-type" value={d.type} onChange={(x) => set("type", x.target.value as QuestionType)}>
            {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Prompt" htmlFor="q-prompt" error={e.prompt}><Textarea id="q-prompt" value={d.prompt} onChange={(x) => set("prompt", x.target.value)} maxLength={4000} className="min-h-20" /></Field>
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <Field label="Code (optional)" htmlFor="q-code" error={e.code}>
          <Textarea id="q-code" value={d.code} onChange={(x) => set("code", x.target.value)} spellCheck={false} className="min-h-24 bg-code font-mono text-[13px]" placeholder="// shown above the options" />
        </Field>
        <Field label="Code language" htmlFor="q-lang" error={e.codeLanguage}>
          <Select id="q-lang" value={d.codeLanguage} onChange={(x) => set("codeLanguage", x.target.value as Draft["codeLanguage"])}>
            <option value="">None</option><option value="javascript">JavaScript</option><option value="python">Python</option>
          </Select>
        </Field>
      </div>

      {d.type === "EXPLAIN" ? (
        <ListEditor label="Keywords (use a|b for alternatives; ≥ 2)" values={d.keywords} onChange={(v) => set("keywords", v)} max={15} placeholder="closure|lexical scope" error={e.keywords} />
      ) : (
        <>
          <OptionsEditor d={d} setD={setD} error={e.options ?? e.correct} />
          {d.type === "ORDER_STEPS" && <p className="text-xs text-subtle">No correct marker needed — the order above is the answer.</p>}
        </>
      )}

      <Field label="Explanation (shown after answering)" htmlFor="q-expl" error={e.explanation}><Textarea id="q-expl" value={d.explanation} onChange={(x) => set("explanation", x.target.value)} maxLength={4000} /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Difficulty" htmlFor="q-diff" error={e.difficulty}><DifficultySelect id="q-diff" value={d.difficulty} onChange={(v) => set("difficulty", v)} /></Field>
        <Field label="Points" htmlFor="q-pts" error={e.points}><Input id="q-pts" type="number" min={1} max={10} value={d.points} onChange={(x) => set("points", Number(x.target.value))} /></Field>
        <Field label="Status" htmlFor="q-status" error={e.status}><StatusSelect id="q-status" value={d.status} onChange={(v) => set("status", v as ContentStatus)} /></Field>
      </div>
      <Field label="Tags" htmlFor="q-tags" error={e.tags}><TagInput id="q-tags" value={d.tags} onChange={(v) => set("tags", v)} max={10} placeholder="type and press Enter" /></Field>
      <p className="text-xs text-subtle">Only <strong>Published</strong> questions count toward the quiz pool.</p>
      <FormError error={save.error} />
      <div className="flex flex-wrap justify-between gap-2">
        {id ? <Button type="button" variant="danger" onClick={() => archive.mutate()} loading={archive.isPending} disabled={d.status === "ARCHIVED"}>Archive</Button> : <span />}
        <div className="flex gap-2"><Button type="button" variant="ghost" onClick={onDone}>Cancel</Button><Button type="submit" loading={save.isPending}>{id ? "Save question" : "Create question"}</Button></div>
      </div>
    </form>
  );
}

/** Create (no id) or edit (id) a question. `topicId` pre-fills and locks the topic. */
export function QuestionDialog({ open, onClose, questionId, topicId, question }: { open: boolean; onClose: () => void; questionId?: string; topicId?: string; question?: AdminQuestion }) {
  const needsFetch = open && !!questionId && !question;
  const q = useQuery({ queryKey: ["admin", "question", questionId], queryFn: () => api.get<AdminQuestion>(`/admin/questions/${questionId}`), enabled: needsFetch });
  const record = question ?? q.data;
  return (
    <Modal open={open} onClose={onClose} title={questionId ? "Edit question" : "New question"} size="lg">
      {!open ? null : questionId && !record ? (
        q.error ? <ErrorState error={q.error} /> : <Skeleton className="h-96" />
      ) : (
        <QuestionForm
          key={record?.id ?? `new-${topicId ?? ""}`}
          id={record?.id}
          initial={record ? fromQuestion(record) : blank(topicId ?? "")}
          lockTopic={!!topicId && !record}
          onDone={onClose}
        />
      )}
    </Modal>
  );
}
