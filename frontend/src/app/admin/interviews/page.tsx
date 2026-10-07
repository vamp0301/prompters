"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Field, Select, Textarea } from "@/components/ui/input";
import { EntityPage, FormFooter, useEntitySave, type FormProps } from "@/features/admin/entity-page";
import { TopicSelect } from "@/features/admin/shared-fields";
import { DifficultySelect, label as human, ListEditor, StatusBadge, StatusSelect, TagInput, Td } from "@/features/admin/ui";
import type { AdminInterviewQ, ContentStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** Mirrors INTERVIEW_CATEGORIES in backend/src/modules/interview/interview.routes.ts. */
const CATEGORIES = ["DSA", "OS", "DBMS", "NETWORKS", "OOP", "BACKEND", "FRONTEND", "SYSTEM_DESIGN", "SECURITY", "PROJECTS", "HR", "FOUNDATIONS", "LANGUAGE"];
const ROLES = ["BACKEND", "FRONTEND", "FULLSTACK", "DEVOPS", "SDE", "AI"];

function InterviewForm({ record, prefill, readOnly, onDone }: FormProps<AdminInterviewQ>) {
  const [f, setF] = useState(() => ({
    topicId: record?.topicId ?? prefill.topicId ?? "",
    category: record?.category ?? "BACKEND",
    question: record?.question ?? "",
    short: record?.short ?? "",
    deep: record?.deep ?? "",
    followUps: record?.followUps ?? [],
    commonMistake: record?.commonMistake ?? "",
    keywords: record?.keywords ?? [],
    difficulty: record?.difficulty ?? 1,
    roles: record?.roles ?? [],
    status: (record?.status ?? "PUBLISHED") as ContentStatus,
  }));
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const { save, archive, errors: e } = useEntitySave("interviews", record, "Interview question", onDone);
  return (
    <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); save.mutate({ ...f, topicId: f.topicId || null, followUps: f.followUps.filter((x) => x.trim()) }); }}>
      <fieldset disabled={readOnly} className="space-y-4">
        <Field label="Question" htmlFor="iv-q" error={e.question}><Textarea id="iv-q" value={f.question} onChange={(x) => set("question", x.target.value)} maxLength={1000} className="min-h-16" /></Field>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Category" htmlFor="iv-cat" error={e.category}><Select id="iv-cat" value={f.category} onChange={(x) => set("category", x.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{human(c)}</option>)}</Select></Field>
          <Field label="Topic (optional)" htmlFor="iv-topic" error={e.topicId} className="sm:col-span-2"><TopicSelect id="iv-topic" value={f.topicId} onChange={(v) => set("topicId", v)} optional /></Field>
          <Field label="Difficulty" htmlFor="iv-diff" error={e.difficulty}><DifficultySelect id="iv-diff" value={f.difficulty} onChange={(v) => set("difficulty", v)} /></Field>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-muted">Roles</legend>
          <div className="flex flex-wrap gap-1.5">
            {ROLES.map((r) => {
              const on = f.roles.includes(r);
              return (
                <button key={r} type="button" aria-pressed={on} onClick={() => set("roles", on ? f.roles.filter((x) => x !== r) : [...f.roles, r])} className={cn("rounded-md border px-2 py-1 font-mono text-[11px] transition-colors", on ? "border-accent/50 bg-accent-soft text-accent" : "border-border text-muted hover:text-text")}>{r}</button>
              );
            })}
          </div>
        </fieldset>
        <Field label="Say it in 30 seconds (short answer)" htmlFor="iv-short" error={e.short}><Textarea id="iv-short" value={f.short} onChange={(x) => set("short", x.target.value)} maxLength={2000} className="min-h-20" /></Field>
        <Field label="Deep answer (Markdown)" htmlFor="iv-deep" error={e.deep}><Textarea id="iv-deep" value={f.deep} onChange={(x) => set("deep", x.target.value)} maxLength={10000} className="min-h-40 font-mono text-[13px]" /></Field>
        <ListEditor label="Likely follow-ups" values={f.followUps} onChange={(v) => set("followUps", v)} max={10} error={e.followUps} />
        <Field label="Common mistake" htmlFor="iv-mistake" error={e.commonMistake}><Textarea id="iv-mistake" value={f.commonMistake} onChange={(x) => set("commonMistake", x.target.value)} maxLength={2000} className="min-h-16" /></Field>
        <Field label="Keywords (practice answers are scored on these)" htmlFor="iv-kw" error={e.keywords}><TagInput id="iv-kw" value={f.keywords} onChange={(v) => set("keywords", v)} max={15} /></Field>
        <Field label="Status" htmlFor="iv-status" error={e.status} className="max-w-xs"><StatusSelect id="iv-status" value={f.status} onChange={(v) => set("status", v as ContentStatus)} /></Field>
      </fieldset>
      <FormFooter save={save} archive={archive} isEdit={!!record} readOnly={readOnly} onDone={onDone} label="Interview question" archived={record?.status === "ARCHIVED"} />
    </form>
  );
}

export default function InterviewsPage() {
  const [category, setCategory] = useState("");
  return (
    <EntityPage<AdminInterviewQ>
      path="interviews" label="Interview question" eyebrow="Get hired" title="Interview bank" write="AUTHOR"
      description="Questions with a 30-second answer, a deep answer, follow-ups and the mistake candidates usually make."
      searchPlaceholder="Search question text"
      extraParams={{ category }}
      extraFilters={<Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className="h-9 w-44"><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{human(c)}</option>)}</Select>}
      headers={[{ label: "Question" }, { label: "Category" }, { label: "Topic" }, { label: "Roles" }, { label: "Diff", right: true }, { label: "Status" }]}
      row={(q, open) => (
        <tr key={q.id} className="cursor-pointer hover:bg-surface-2/40" onClick={open}>
          <Td><button className="line-clamp-2 max-w-lg text-left hover:text-accent" onClick={(e) => { e.stopPropagation(); open(); }}>{q.question}</button></Td>
          <Td><Badge className="font-mono">{q.category}</Badge></Td>
          <Td className="text-xs text-muted">{q.topic?.title ?? "—"}</Td>
          <Td className="font-mono text-[11px] text-muted">{q.roles.join(" ") || "—"}</Td>
          <Td right mono>{q.difficulty}</Td>
          <Td><StatusBadge status={q.status} /></Td>
        </tr>
      )}
      Form={InterviewForm}
    />
  );
}
