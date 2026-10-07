"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import type { AdminTopicDetail, Completeness } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useAllTopics, useModules } from "../hooks";
import { stableJson } from "../diff";
import { DifficultySelect, fieldErrorsOf, FormError, ListEditor, TagInput } from "../ui";

export function CompletenessPanel({ c }: { c: Completeness }) {
  const tone = c.percent >= 80 ? "bg-accent" : c.percent >= 50 ? "bg-warn" : "bg-danger";
  return (
    <section aria-labelledby="cmp-h" className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <h2 id="cmp-h" className="text-sm font-semibold">Completeness</h2>
        <span className="font-mono text-lg font-semibold tabular-nums">{c.percent}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={c.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Completeness">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${c.percent}%` }} />
      </div>
      <p className={cn("mt-2 text-xs", c.publishable ? "text-accent" : "text-danger")}>{c.publishable ? "All required items present — publishable." : `${c.missingRequired.length} required item${c.missingRequired.length > 1 ? "s" : ""} missing.`}</p>
      <ul className="mt-3 space-y-1">
        {c.checks.map((k) => (
          <li key={k.key} className="flex items-center gap-2 text-xs">
            <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center rounded font-mono text-[10px]", k.ok ? "bg-accent-soft text-accent" : k.required ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn")}>{k.ok ? "✓" : k.required ? "!" : "○"}</span>
            <span className={cn(k.ok ? "text-muted" : "text-text")}>{k.label}</span>
            <span className="sr-only">{k.ok ? "done" : k.required ? "missing, required" : "missing, optional"}</span>
            {!k.required && <Badge className="ml-auto">optional</Badge>}
          </li>
        ))}
      </ul>
    </section>
  );
}

type Meta = {
  moduleId: string; title: string; slug: string; order: number; difficulty: number; estMinutes: number; quizSize: number;
  objectives: string[]; technicalDefinition: string; tags: string[]; prerequisites: string[];
};

const metaOf = (t: AdminTopicDetail): Meta => ({
  moduleId: t.moduleId, title: t.title, slug: t.slug, order: t.order, difficulty: t.difficulty, estMinutes: t.estMinutes, quizSize: t.quizSize,
  objectives: t.objectives, technicalDefinition: t.technicalDefinition ?? "", tags: t.tags, prerequisites: t.prerequisites.map((p) => p.prerequisite.slug),
});

export function OverviewTab({ topic }: { topic: AdminTopicDetail }) {
  const qc = useQueryClient();
  const modules = useModules();
  const topics = useAllTopics();
  const [base, setBase] = useState(() => metaOf(topic));
  const [f, setF] = useState(base);
  const set = <K extends keyof Meta>(k: K, v: Meta[K]) => setF((p) => ({ ...p, [k]: v }));
  const dirty = stableJson(base) !== stableJson(f);
  const save = useMutation({
    meta: { silent: true },
    mutationFn: () => api.patch(`/admin/topics/${topic.id}`, { ...f, objectives: f.objectives.map((o) => o.trim()).filter(Boolean), technicalDefinition: f.technicalDefinition.trim() || null }),
    onSuccess: () => { toast.success("Topic details saved"); setBase(f); qc.invalidateQueries({ queryKey: ["admin"] }); },
  });
  const e = fieldErrorsOf(save.error);
  const knownSlugs = (topics.data ?? []).filter((t) => t.id !== topic.id).map((t) => t.slug);
  const unknownPrereqs = topics.data ? f.prerequisites.filter((p) => !knownSlugs.includes(p)) : [];

  return (
    <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); save.mutate(); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" htmlFor="tm-title" error={e.title}><Input id="tm-title" value={f.title} onChange={(x) => set("title", x.target.value)} /></Field>
        <Field label="Slug" htmlFor="tm-slug" error={e.slug} hint="Changing it changes the student URL."><Input id="tm-slug" value={f.slug} onChange={(x) => set("slug", x.target.value)} className="font-mono" /></Field>
      </div>
      <Field label="Module" htmlFor="tm-mod" error={e.moduleId}>
        <Select id="tm-mod" value={f.moduleId} onChange={(x) => set("moduleId", x.target.value)}>
          {(modules.data ?? [{ id: topic.moduleId, title: topic.module.title, stage: topic.module.stage }]).map((m) => <option key={m.id} value={m.id}>{m.stage.code} · {m.title}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Order" htmlFor="tm-order" error={e.order}><Input id="tm-order" type="number" min={0} max={1000} value={f.order} onChange={(x) => set("order", Number(x.target.value))} /></Field>
        <Field label="Difficulty" htmlFor="tm-diff" error={e.difficulty}><DifficultySelect id="tm-diff" value={f.difficulty} onChange={(v) => set("difficulty", v)} /></Field>
        <Field label="Est. minutes" htmlFor="tm-min" error={e.estMinutes}><Input id="tm-min" type="number" min={1} max={600} value={f.estMinutes} onChange={(x) => set("estMinutes", Number(x.target.value))} /></Field>
        <Field label="Quiz size" htmlFor="tm-quiz" error={e.quizSize} hint={`Pool target ${f.quizSize * 3}`}><Input id="tm-quiz" type="number" min={3} max={30} value={f.quizSize} onChange={(x) => set("quizSize", Number(x.target.value))} /></Field>
      </div>
      <ListEditor label="Learning objectives" values={f.objectives} onChange={(v) => set("objectives", v)} max={12} placeholder="Explain how … works" error={e.objectives} />
      <Field label="Technical definition (English, one or two sentences)" htmlFor="tm-def" error={e.technicalDefinition} hint="Required for publishing.">
        <Textarea id="tm-def" value={f.technicalDefinition} onChange={(x) => set("technicalDefinition", x.target.value)} maxLength={1000} className="min-h-20" />
      </Field>
      <Field label="Tags" htmlFor="tm-tags" error={e.tags}><TagInput id="tm-tags" value={f.tags} onChange={(v) => set("tags", v)} max={20} placeholder="type and press Enter" /></Field>
      <Field label="Prerequisites (topic slugs)" htmlFor="tm-pre" error={e.prerequisites ?? (unknownPrereqs.length ? `Unknown: ${unknownPrereqs.join(", ")}` : undefined)} hint="Learners must master these first when topic gating is on.">
        <TagInput id="tm-pre" value={f.prerequisites} onChange={(v) => set("prerequisites", v)} max={20} suggestions={knownSlugs} placeholder="start typing a slug" />
      </Field>
      <FormError error={save.error} />
      <div className="flex items-center justify-end gap-3">
        {dirty && <span className="text-xs text-warn">Unsaved changes</span>}
        <Button type="button" variant="ghost" disabled={!dirty} onClick={() => setF(base)}>Reset</Button>
        <Button type="submit" loading={save.isPending} disabled={!dirty}>Save details</Button>
      </div>
    </form>
  );
}
