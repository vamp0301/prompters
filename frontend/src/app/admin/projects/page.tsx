"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { EntityPage, FormFooter, useEntitySave, type FormProps } from "@/features/admin/entity-page";
import { useStages } from "@/features/admin/hooks";
import { ExplainEditor } from "@/features/admin/shared-fields";
import { DifficultySelect, ListEditor, move, RowControls, slugify, StatusBadge, StatusSelect, TagInput, Td } from "@/features/admin/ui";
import type { AdminExplainQ, AdminProject, ContentStatus } from "@/lib/api/types";

function ProjectForm({ record, readOnly, onDone }: FormProps<AdminProject>) {
  const stages = useStages();
  const [f, setF] = useState(() => ({
    slug: record?.slug ?? "",
    rung: record?.rung ?? 1,
    title: record?.title ?? "",
    description: record?.description ?? "",
    skills: record?.skills ?? [],
    technologies: record?.technologies ?? [],
    requirements: record?.requirements ?? [""],
    milestones: record?.milestones ?? [{ title: "", description: "" }],
    explainQuestions: (record?.explainQuestions ?? [{ question: "", keywords: [] }]) as AdminExplainQ[],
    hints: record?.hints ?? [],
    stageSlug: record?.stageSlug ?? "",
    difficulty: record?.difficulty ?? 1,
    status: (record?.status ?? "DRAFT") as ContentStatus,
  }));
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const { save, archive, errors: e } = useEntitySave("projects", record, "Project", onDone);
  const submit = () => save.mutate({ ...f, stageSlug: f.stageSlug || null, requirements: f.requirements.filter((r) => r.trim()), hints: f.hints.filter((h) => h.trim()) });

  return (
    <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); submit(); }}>
      <fieldset disabled={readOnly} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[100px_1fr_1fr]">
          <Field label="Rung" htmlFor="pj-rung" error={e.rung} hint="unique"><Input id="pj-rung" type="number" min={1} max={100} value={f.rung} onChange={(x) => set("rung", Number(x.target.value))} className="font-mono" /></Field>
          <Field label="Title" htmlFor="pj-title" error={e.title}><Input id="pj-title" value={f.title} onChange={(x) => setF((p) => ({ ...p, title: x.target.value, slug: !record && (p.slug === "" || p.slug === slugify(p.title)) ? slugify(x.target.value) : p.slug }))} /></Field>
          <Field label="Slug" htmlFor="pj-slug" error={e.slug}><Input id="pj-slug" value={f.slug} onChange={(x) => set("slug", x.target.value)} className="font-mono" /></Field>
        </div>
        <Field label="Description (Markdown)" htmlFor="pj-desc" error={e.description}><Textarea id="pj-desc" value={f.description} onChange={(x) => set("description", x.target.value)} className="min-h-32 font-mono text-[13px]" maxLength={10000} /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Stage" htmlFor="pj-stage" error={e.stageSlug}>
            <Select id="pj-stage" value={f.stageSlug} onChange={(x) => set("stageSlug", x.target.value)}>
              <option value="">Any stage</option>
              {stages.data?.map((s) => <option key={s.id} value={s.slug}>{s.code} · {s.title}</option>)}
            </Select>
          </Field>
          <Field label="Difficulty" htmlFor="pj-diff" error={e.difficulty}><DifficultySelect id="pj-diff" value={f.difficulty} onChange={(v) => set("difficulty", v)} /></Field>
          <Field label="Status" htmlFor="pj-status" error={e.status}><StatusSelect id="pj-status" value={f.status} onChange={(v) => set("status", v as ContentStatus)} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Skills" htmlFor="pj-skills" error={e.skills}><TagInput id="pj-skills" value={f.skills} onChange={(v) => set("skills", v)} max={20} placeholder="REST, auth…" /></Field>
          <Field label="Technologies" htmlFor="pj-tech" error={e.technologies}><TagInput id="pj-tech" value={f.technologies} onChange={(v) => set("technologies", v)} max={20} placeholder="Express, Postgres…" /></Field>
        </div>
        <ListEditor label="Requirements" values={f.requirements} onChange={(v) => set("requirements", v)} max={30} error={e.requirements} />
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-xs font-medium text-muted">Milestones <span className="font-mono text-subtle">({f.milestones.length}/20, ≥1)</span></legend>
          {f.milestones.map((m, i) => (
            <div key={i} className="space-y-1.5 rounded-lg border border-border p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-5 text-right font-mono text-[10px] text-subtle">{i + 1}</span>
                <Input value={m.title} onChange={(x) => set("milestones", f.milestones.map((y, j) => (j === i ? { ...y, title: x.target.value } : y)))} placeholder="Milestone title" aria-label={`Milestone ${i + 1} title`} className="h-9" />
                <RowControls index={i} count={f.milestones.length} onMove={(d) => set("milestones", move(f.milestones, i, d))} onRemove={() => set("milestones", f.milestones.filter((_, j) => j !== i))} labelText={`milestone ${i + 1}`} />
              </div>
              <Textarea value={m.description} onChange={(x) => set("milestones", f.milestones.map((y, j) => (j === i ? { ...y, description: x.target.value } : y)))} placeholder="What done looks like" aria-label={`Milestone ${i + 1} description`} className="ml-6 min-h-16 w-[calc(100%-1.5rem)]" maxLength={2000} />
            </div>
          ))}
          {f.milestones.length < 20 && <Button type="button" size="sm" variant="ghost" onClick={() => set("milestones", [...f.milestones, { title: "", description: "" }])}><Plus className="size-3.5" /> Add milestone</Button>}
          {e.milestones && <p role="alert" className="text-xs text-danger">{e.milestones}</p>}
        </fieldset>
        <ListEditor label="Hints (concept → step → partial code)" values={f.hints} onChange={(v) => set("hints", v)} max={3} error={e.hints} />
        <ExplainEditor value={f.explainQuestions} onChange={(v) => set("explainQuestions", v)} max={8} error={e.explainQuestions} />
      </fieldset>
      <FormFooter save={save} archive={archive} isEdit={!!record} readOnly={readOnly} onDone={onDone} label="Project" archived={record?.status === "ARCHIVED"} />
    </form>
  );
}

export default function ProjectsPage() {
  return (
    <EntityPage<AdminProject>
      path="projects" label="Project" eyebrow="Project ladder" title="Projects" write="ADMIN"
      description="Portfolio projects ordered by rung. Learners climb one rung at a time."
      searchPlaceholder="Search title or slug"
      headers={[{ label: "Rung", right: true }, { label: "Project" }, { label: "Stage" }, { label: "Milestones", right: true }, { label: "Subs", right: true }, { label: "Status" }]}
      row={(p, open) => (
        <tr key={p.id} className="cursor-pointer hover:bg-surface-2/40" onClick={open}>
          <Td right mono className="text-accent">{String(p.rung).padStart(2, "0")}</Td>
          <Td><button className="text-left font-medium hover:text-accent" onClick={(e) => { e.stopPropagation(); open(); }}>{p.title}</button><div className="font-mono text-[11px] text-subtle">{p.slug} · {p.technologies.slice(0, 4).join(", ")}</div></Td>
          <Td className="font-mono text-xs text-muted">{p.stageSlug ?? "—"}</Td>
          <Td right mono>{p.milestones.length}</Td>
          <Td right mono>{p._count.submissions}</Td>
          <Td><StatusBadge status={p.status} /></Td>
        </tr>
      )}
      Form={ProjectForm}
    />
  );
}
