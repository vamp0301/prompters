"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { EntityPage, FormFooter, useEntitySave, type FormProps } from "@/features/admin/entity-page";
import { useAllTopics, useStages } from "@/features/admin/hooks";
import { label as human, slugify, StatusBadge, StatusSelect, TagInput, Td, Toggle } from "@/features/admin/ui";
import type { AdminAssessment, ContentStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const KINDS = ["STAGE_EXAM", "MOCK_TEST", "PLACEMENT", "PRACTICE"] as const;
const POLICIES = [
  { value: "LOG", title: "Log only", desc: "Record tab switches, paste and fullscreen exits for review. The attempt is never affected." },
  { value: "FLAG", title: "Flag for review", desc: "Past the tab-switch limit the attempt is flagged for an admin to review. The score stands until reviewed." },
  { value: "AUTO_SUBMIT", title: "Auto-submit", desc: "Past the tab-switch limit the attempt is submitted immediately with the answers so far." },
] as const;

function AssessmentForm({ record, readOnly, onDone }: FormProps<AdminAssessment>) {
  const stages = useStages();
  const topics = useAllTopics();
  const [f, setF] = useState(() => ({
    slug: record?.slug ?? "",
    title: record?.title ?? "",
    description: record?.description ?? "",
    kind: record?.kind ?? ("STAGE_EXAM" as AdminAssessment["kind"]),
    stageId: record?.stageId ?? "",
    topicSlugs: record?.topicSlugs ?? [],
    durationMinutes: record?.durationMinutes ?? 30,
    questionCount: record?.questionCount ?? 20,
    passingScore: record?.passingScore ?? 70,
    maxAttempts: record?.maxAttempts === null || record?.maxAttempts === undefined ? "" : String(record.maxAttempts),
    tabSwitchLimit: record?.tabSwitchLimit ?? 3,
    violationPolicy: record?.violationPolicy ?? ("FLAG" as AdminAssessment["violationPolicy"]),
    blockClipboard: record?.blockClipboard ?? true,
    requireFullscreen: record?.requireFullscreen ?? true,
    status: (record?.status ?? "DRAFT") as ContentStatus,
  }));
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const { save, archive, errors: e } = useEntitySave("assessments", record, "Assessment", onDone);
  const known = topics.data?.map((t) => t.slug) ?? [];
  const unknown = topics.data ? f.topicSlugs.filter((s) => !known.includes(s)) : [];
  const submit = () => save.mutate({ ...f, description: f.description || null, stageId: f.stageId || null, maxAttempts: f.maxAttempts === "" ? null : Number(f.maxAttempts) });

  return (
    <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); submit(); }}>
      <fieldset disabled={readOnly} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title" htmlFor="as-title" error={e.title}><Input id="as-title" value={f.title} onChange={(x) => setF((p) => ({ ...p, title: x.target.value, slug: !record && (p.slug === "" || p.slug === slugify(p.title)) ? slugify(x.target.value) : p.slug }))} /></Field>
          <Field label="Slug" htmlFor="as-slug" error={e.slug}><Input id="as-slug" value={f.slug} onChange={(x) => set("slug", x.target.value)} className="font-mono" /></Field>
        </div>
        <Field label="Description" htmlFor="as-desc" error={e.description}><Textarea id="as-desc" value={f.description} onChange={(x) => set("description", x.target.value)} maxLength={2000} className="min-h-16" /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Kind" htmlFor="as-kind" error={e.kind}><Select id="as-kind" value={f.kind} onChange={(x) => set("kind", x.target.value as AdminAssessment["kind"])}>{KINDS.map((k) => <option key={k} value={k}>{human(k)}</option>)}</Select></Field>
          <Field label="Stage" htmlFor="as-stage" error={e.stageId}>
            <Select id="as-stage" value={f.stageId} onChange={(x) => set("stageId", x.target.value)}>
              <option value="">No stage</option>
              {stages.data?.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.title}</option>)}
            </Select>
          </Field>
          <Field label="Status" htmlFor="as-status" error={e.status}><StatusSelect id="as-status" value={f.status} onChange={(v) => set("status", v as ContentStatus)} /></Field>
        </div>
        <Field label="Topic pool (slugs) — empty = every topic in the stage" htmlFor="as-topics" error={e.topicSlugs ?? (unknown.length ? `Unknown slugs: ${unknown.join(", ")}` : undefined)}>
          <TagInput id="as-topics" value={f.topicSlugs} onChange={(v) => set("topicSlugs", v)} suggestions={known} max={200} placeholder="start typing a topic slug" />
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Field label="Duration (min)" htmlFor="as-dur" error={e.durationMinutes}><Input id="as-dur" type="number" min={1} max={300} value={f.durationMinutes} onChange={(x) => set("durationMinutes", Number(x.target.value))} /></Field>
          <Field label="Questions" htmlFor="as-qc" error={e.questionCount}><Input id="as-qc" type="number" min={1} max={200} value={f.questionCount} onChange={(x) => set("questionCount", Number(x.target.value))} /></Field>
          <Field label="Pass score %" htmlFor="as-pass" error={e.passingScore}><Input id="as-pass" type="number" min={0} max={100} value={f.passingScore} onChange={(x) => set("passingScore", Number(x.target.value))} /></Field>
          <Field label="Max attempts" htmlFor="as-max" error={e.maxAttempts} hint="blank = unlimited"><Input id="as-max" type="number" min={1} max={100} value={f.maxAttempts} onChange={(x) => set("maxAttempts", x.target.value)} /></Field>
          <Field label="Tab-switch limit" htmlFor="as-tab" error={e.tabSwitchLimit}><Input id="as-tab" type="number" min={0} max={50} value={f.tabSwitchLimit} onChange={(x) => set("tabSwitchLimit", Number(x.target.value))} /></Field>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-muted">Violation policy</legend>
          <div role="radiogroup" aria-label="Violation policy" className="grid gap-2 sm:grid-cols-3">
            {POLICIES.map((p) => (
              <button key={p.value} type="button" role="radio" aria-checked={f.violationPolicy === p.value} onClick={() => set("violationPolicy", p.value)}
                className={cn("rounded-lg border p-3 text-left transition-colors", f.violationPolicy === p.value ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong")}>
                <div className="flex items-center gap-2 text-sm font-medium">{p.title}<span className="font-mono text-[10px] text-subtle">{p.value}</span></div>
                <p className="mt-1 text-xs text-muted">{p.desc}</p>
              </button>
            ))}
          </div>
          {e.violationPolicy && <p role="alert" className="text-xs text-danger">{e.violationPolicy}</p>}
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle checked={f.blockClipboard} onChange={(v) => set("blockClipboard", v)} label="Block clipboard" description="Copy/paste is blocked and attempts are logged." disabled={readOnly} />
          <Toggle checked={f.requireFullscreen} onChange={(v) => set("requireFullscreen", v)} label="Require fullscreen" description="Leaving fullscreen is logged as an integrity event." disabled={readOnly} />
        </div>
        <p className="text-xs text-subtle">Integrity signals are evidence for a human to review — never automatic proof of cheating.</p>
      </fieldset>
      <FormFooter save={save} archive={archive} isEdit={!!record} readOnly={readOnly} onDone={onDone} label="Assessment" archived={record?.status === "ARCHIVED"} />
    </form>
  );
}

export default function AssessmentsPage() {
  return (
    <EntityPage<AdminAssessment>
      path="assessments" label="Assessment" eyebrow="Assessment" title="Assessments" write="ADMIN"
      description="Stage exams, mock tests and placement tests with timing and integrity rules."
      searchPlaceholder="Search title or slug"
      headers={[{ label: "Assessment" }, { label: "Kind" }, { label: "Stage" }, { label: "Q · min · pass", right: true }, { label: "Policy" }, { label: "Attempts", right: true }, { label: "Status" }]}
      row={(a, open) => (
        <tr key={a.id} className="cursor-pointer hover:bg-surface-2/40" onClick={open}>
          <Td><button className="text-left font-medium hover:text-accent" onClick={(e) => { e.stopPropagation(); open(); }}>{a.title}</button><div className="font-mono text-[11px] text-subtle">{a.slug}</div></Td>
          <Td><Badge className="font-mono">{a.kind}</Badge></Td>
          <Td className="text-xs text-muted">{a.stage?.title ?? "—"}</Td>
          <Td right mono className="whitespace-nowrap">{a.questionCount} · {a.durationMinutes} · {a.passingScore}%</Td>
          <Td className="font-mono text-[11px] text-muted">{a.violationPolicy} · {a.tabSwitchLimit} tabs</Td>
          <Td right mono>{a._count.attempts}</Td>
          <Td><StatusBadge status={a.status} /></Td>
        </tr>
      )}
      Form={AssessmentForm}
    />
  );
}
