"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, GitBranch, Heart, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { EntityPage, FormFooter, useEntitySave, type FormProps } from "@/features/admin/entity-page";
import { TopicSelect } from "@/features/admin/shared-fields";
import { label as human, ListEditor, move, RowControls, slugify, StatusBadge, StatusSelect, Td } from "@/features/admin/ui";
import { api } from "@/lib/api/client";
import type { AdminPromptCard, ContentStatus } from "@/lib/api/types";

const CATEGORIES = ["LEARNING", "DEBUGGING", "CODE_REVIEW", "TESTING", "SECURITY", "SQL", "OPTIMIZATION", "DOCKER", "CICD", "SYSTEM_DESIGN", "RESUME", "INTERVIEW", "PROJECT_PLANNING"];
const placeholdersIn = (t: string) => [...new Set([...t.matchAll(/\[([A-Z0-9_]+)\]/g)].map((m) => m[1]))];

function PromptForm({ record, prefill, readOnly, onDone }: FormProps<AdminPromptCard>) {
  const qc = useQueryClient();
  const [f, setF] = useState(() => ({
    slug: record?.slug ?? "",
    topicId: record?.topicId ?? prefill.topicId ?? "",
    title: record?.title ?? "",
    category: record?.category ?? "LEARNING",
    task: record?.task ?? "",
    whenToUse: record?.whenToUse ?? "",
    template: record?.template ?? "",
    variables: record?.variables ?? [],
    whyItWorks: record?.whyItWorks ?? [],
    verifyChecklist: record?.verifyChecklist ?? [""],
    sampleOutput: record?.sampleOutput ?? "",
    status: (record?.status ?? "DRAFT") as ContentStatus,
  }));
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const { save, archive, errors: e } = useEntitySave("prompts", record, "Prompt card", onDone);
  const bump = useMutation({
    mutationFn: () => api.post<AdminPromptCard>(`/admin/prompts/${record?.id}/new-version`),
    onSuccess: (r) => { toast.success(`Now version ${r.version}`); qc.invalidateQueries({ queryKey: ["admin"] }); },
  });
  const found = placeholdersIn(f.template);
  const keys = f.variables.map((v) => v.key);
  const undeclared = found.filter((p) => !keys.includes(p));
  const unused = keys.filter((k) => k && !found.includes(k));
  const templateChanged = !!record && record.template !== f.template;

  return (
    <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); save.mutate({ ...f, verifyChecklist: f.verifyChecklist.filter((c) => c.trim()) }); }}>
      {record && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2 text-xs">
          <Badge className="font-mono">v{record.version}</Badge>
          <span className="flex items-center gap-1 text-muted"><Heart className="size-3" /> {record._count.favorites} favourites</span>
          <span className="flex items-center gap-1 text-muted"><Star className="size-3" /> {record._count.ratings} ratings</span>
          {!readOnly && <Button type="button" size="sm" variant="ghost" className="ml-auto" loading={bump.isPending} onClick={() => bump.mutate()}><GitBranch className="size-3.5" /> New version</Button>}
          {templateChanged && <span className="w-full text-warn">Template changed — save, then bump the version so learners see it&apos;s updated.</span>}
        </div>
      )}
      <fieldset disabled={readOnly} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title" htmlFor="pr-title" error={e.title}><Input id="pr-title" value={f.title} onChange={(x) => setF((p) => ({ ...p, title: x.target.value, slug: !record && (p.slug === "" || p.slug === slugify(p.title)) ? slugify(x.target.value) : p.slug }))} /></Field>
          <Field label="Slug" htmlFor="pr-slug" error={e.slug}><Input id="pr-slug" value={f.slug} onChange={(x) => set("slug", x.target.value)} className="font-mono" /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Topic (unlocks on mastery)" htmlFor="pr-topic" error={e.topicId} className="sm:col-span-2"><TopicSelect id="pr-topic" value={f.topicId} onChange={(v) => set("topicId", v)} /></Field>
          <Field label="Category" htmlFor="pr-cat" error={e.category}><Select id="pr-cat" value={f.category} onChange={(x) => set("category", x.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{human(c)}</option>)}</Select></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Task" htmlFor="pr-task" error={e.task}><Textarea id="pr-task" value={f.task} onChange={(x) => set("task", x.target.value)} maxLength={1000} className="min-h-20" /></Field>
          <Field label="When to use" htmlFor="pr-when" error={e.whenToUse}><Textarea id="pr-when" value={f.whenToUse} onChange={(x) => set("whenToUse", x.target.value)} maxLength={1000} className="min-h-20" /></Field>
        </div>
        <Field label="Template — use [UPPER_SNAKE] placeholders" htmlFor="pr-tpl" error={e.template}>
          <Textarea id="pr-tpl" value={f.template} onChange={(x) => set("template", x.target.value)} maxLength={10000} className="min-h-40 font-mono text-[13px]" spellCheck={false} />
        </Field>
        {(undeclared.length > 0 || unused.length > 0) && (
          <div role="status" className="space-y-1 rounded-lg border border-warn/30 bg-warn-soft p-3 text-xs text-warn">
            {undeclared.length > 0 && (
              <p className="flex flex-wrap items-center gap-1"><AlertTriangle className="size-3.5" /> Placeholders with no variable: {undeclared.map((u) => <code key={u} className="font-mono">[{u}]</code>)}
                {!readOnly && <Button type="button" size="sm" variant="ghost" onClick={() => set("variables", [...f.variables, ...undeclared.map((k) => ({ key: k, label: human(k) }))])}>Add them</Button>}
              </p>
            )}
            {unused.length > 0 && <p className="flex flex-wrap items-center gap-1"><AlertTriangle className="size-3.5" /> Variables not used in the template: {unused.map((u) => <code key={u} className="font-mono">{u}</code>)}</p>}
          </div>
        )}
        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 text-xs font-medium text-muted">Variables <span className="font-mono text-subtle">({f.variables.length}/20)</span></legend>
          {f.variables.map((v, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input value={v.key} onChange={(x) => set("variables", f.variables.map((y, j) => (j === i ? { ...y, key: x.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") } : y)))} placeholder="KEY" aria-label={`Variable ${i + 1} key`} className="h-9 w-48 font-mono text-xs" />
              <Input value={v.label} onChange={(x) => set("variables", f.variables.map((y, j) => (j === i ? { ...y, label: x.target.value } : y)))} placeholder="Label shown to learner" aria-label={`Variable ${i + 1} label`} className="h-9" />
              <RowControls index={i} count={f.variables.length} onMove={(d) => set("variables", move(f.variables, i, d))} onRemove={() => set("variables", f.variables.filter((_, j) => j !== i))} labelText={`variable ${i + 1}`} />
            </div>
          ))}
          {f.variables.length < 20 && <Button type="button" size="sm" variant="ghost" onClick={() => set("variables", [...f.variables, { key: "", label: "" }])}><Plus className="size-3.5" /> Add variable</Button>}
          {e.variables && <p role="alert" className="text-xs text-danger">{e.variables}</p>}
        </fieldset>
        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 text-xs font-medium text-muted">Why it works — annotate parts of the prompt</legend>
          {f.whyItWorks.map((w, i) => (
            <div key={i} className="grid gap-1.5 rounded-lg border border-border p-2 sm:grid-cols-[1fr_2fr_auto]">
              <Input value={w.part} onChange={(x) => set("whyItWorks", f.whyItWorks.map((y, j) => (j === i ? { ...y, part: x.target.value } : y)))} placeholder="Part" aria-label={`Part ${i + 1}`} className="h-9 font-mono text-xs" maxLength={300} />
              <Input value={w.why} onChange={(x) => set("whyItWorks", f.whyItWorks.map((y, j) => (j === i ? { ...y, why: x.target.value } : y)))} placeholder="Why it helps" aria-label={`Why part ${i + 1} works`} className="h-9" maxLength={1000} />
              <RowControls index={i} count={f.whyItWorks.length} onMove={(d) => set("whyItWorks", move(f.whyItWorks, i, d))} onRemove={() => set("whyItWorks", f.whyItWorks.filter((_, j) => j !== i))} labelText={`part ${i + 1}`} />
            </div>
          ))}
          {f.whyItWorks.length < 20 && <Button type="button" size="sm" variant="ghost" onClick={() => set("whyItWorks", [...f.whyItWorks, { part: "", why: "" }])}><Plus className="size-3.5" /> Add part</Button>}
        </fieldset>
        <ListEditor label="Verify checklist (≥1)" values={f.verifyChecklist} onChange={(v) => set("verifyChecklist", v)} max={20} placeholder="Run the tests the AI wrote" error={e.verifyChecklist} />
        <Field label="Sample output" htmlFor="pr-sample" error={e.sampleOutput}><Textarea id="pr-sample" value={f.sampleOutput} onChange={(x) => set("sampleOutput", x.target.value)} maxLength={10000} className="min-h-28 font-mono text-[12px]" /></Field>
        <Field label="Status" htmlFor="pr-status" error={e.status} className="max-w-xs"><StatusSelect id="pr-status" value={f.status} onChange={(v) => set("status", v as ContentStatus)} /></Field>
      </fieldset>
      <FormFooter save={save} archive={archive} isEdit={!!record} readOnly={readOnly} onDone={onDone} label="Prompt card" archived={record?.status === "ARCHIVED"} />
    </form>
  );
}

export default function PromptsPage() {
  return (
    <EntityPage<AdminPromptCard>
      path="prompts" label="Prompt card" eyebrow="Use AI like a pro" title="Prompt cards" write="AUTHOR"
      description="Reusable prompts unlocked after a learner masters the topic. Bump the version when the template changes."
      searchPlaceholder="Search title or task"
      headers={[{ label: "Prompt" }, { label: "Category" }, { label: "Topic" }, { label: "Ver", right: true }, { label: "♥ · ★", right: true }, { label: "Status" }]}
      row={(p, open) => (
        <tr key={p.id} className="cursor-pointer hover:bg-surface-2/40" onClick={open}>
          <Td><button className="text-left font-medium hover:text-accent" onClick={(e) => { e.stopPropagation(); open(); }}>{p.title}</button><div className="line-clamp-1 text-xs text-subtle">{p.task}</div></Td>
          <Td><Badge className="font-mono">{p.category}</Badge></Td>
          <Td className="text-xs text-muted">{p.topic?.title}</Td>
          <Td right mono>v{p.version}</Td>
          <Td right mono className="whitespace-nowrap">{p._count.favorites} · {p._count.ratings}</Td>
          <Td><StatusBadge status={p.status} /></Td>
        </tr>
      )}
      Form={PromptForm}
    />
  );
}
