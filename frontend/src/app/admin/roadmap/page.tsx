"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Copy, Pencil, Plus, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { useModules, useStages } from "@/features/admin/hooks";
import {
  DifficultySelect, fieldErrorsOf, FormError, Modal, RoleNotice, StatusSelect, TagInput, useRole,
} from "@/features/admin/ui";
import { api } from "@/lib/api/client";
import type { AdminModule, AdminStage, ContentStatus } from "@/lib/api/types";

type StageDraft = Omit<AdminStage, "id" | "_count">;
type ModuleDraft = Pick<AdminModule, "stageId" | "slug" | "title" | "description" | "order" | "difficulty" | "status">;

function StageForm({ initial, id, onDone }: { initial: StageDraft; id?: string; onDone: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState(initial);
  const set = <K extends keyof StageDraft>(k: K, v: StageDraft[K]) => setF((p) => ({ ...p, [k]: v }));
  const save = useMutation({
    meta: { silent: true },
    mutationFn: () => (id ? api.patch(`/admin/stages/${id}`, f) : api.post("/admin/stages", f)),
    onSuccess: () => { toast.success(id ? "Stage saved" : "Stage created"); qc.invalidateQueries({ queryKey: ["admin", "stages"] }); onDone(); },
  });
  const e = fieldErrorsOf(save.error);
  return (
    <form className="space-y-3" onSubmit={(ev) => { ev.preventDefault(); save.mutate(); }}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Code" htmlFor="st-code" error={e.code} hint="e.g. S1"><Input id="st-code" value={f.code} onChange={(x) => set("code", x.target.value)} maxLength={8} /></Field>
        <Field label="Slug" htmlFor="st-slug" error={e.slug} className="sm:col-span-2"><Input id="st-slug" value={f.slug} onChange={(x) => set("slug", x.target.value)} className="font-mono" /></Field>
      </div>
      <Field label="Title" htmlFor="st-title" error={e.title}><Input id="st-title" value={f.title} onChange={(x) => set("title", x.target.value)} /></Field>
      <Field label="Description" htmlFor="st-desc" error={e.description}><Textarea id="st-desc" value={f.description} onChange={(x) => set("description", x.target.value)} maxLength={1000} /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Track" htmlFor="st-track" error={e.track}>
          <Select id="st-track" value={f.track} onChange={(x) => set("track", x.target.value as StageDraft["track"])}><option>COMMON</option><option>PYTHON</option><option>JAVASCRIPT</option></Select>
        </Field>
        <Field label="Order" htmlFor="st-order" error={e.order}><Input id="st-order" type="number" min={0} max={1000} value={f.order} onChange={(x) => set("order", Number(x.target.value))} /></Field>
        <Field label="Est. hours" htmlFor="st-hours" error={e.estHours}><Input id="st-hours" type="number" min={0} value={f.estHours} onChange={(x) => set("estHours", Number(x.target.value))} /></Field>
      </div>
      <Field label="Target roles" htmlFor="st-roles" error={e.targetRoles}><TagInput id="st-roles" value={f.targetRoles} onChange={(v) => set("targetRoles", v)} placeholder="BACKEND, FULLSTACK…" /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Icon" htmlFor="st-icon" error={e.icon} hint="lucide name"><Input id="st-icon" value={f.icon ?? ""} onChange={(x) => set("icon", x.target.value || null)} /></Field>
        <Field label="Color" htmlFor="st-color" error={e.color}><Input id="st-color" value={f.color ?? ""} onChange={(x) => set("color", x.target.value || null)} placeholder="#3fe08a" /></Field>
        <Field label="Status" htmlFor="st-status" error={e.status}><StatusSelect id="st-status" value={f.status} onChange={(v) => set("status", v as ContentStatus)} /></Field>
      </div>
      <FormError error={save.error} />
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onDone}>Cancel</Button><Button type="submit" loading={save.isPending}>{id ? "Save stage" : "Create stage"}</Button></div>
    </form>
  );
}

function ModuleForm({ initial, id, stages, onDone }: { initial: ModuleDraft; id?: string; stages: AdminStage[]; onDone: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState(initial);
  const set = <K extends keyof ModuleDraft>(k: K, v: ModuleDraft[K]) => setF((p) => ({ ...p, [k]: v }));
  const save = useMutation({
    meta: { silent: true },
    mutationFn: () => (id ? api.patch(`/admin/modules/${id}`, f) : api.post("/admin/modules", f)),
    onSuccess: () => { toast.success(id ? "Module saved" : "Module created"); qc.invalidateQueries({ queryKey: ["admin", "modules"] }); onDone(); },
  });
  const e = fieldErrorsOf(save.error);
  return (
    <form className="space-y-3" onSubmit={(ev) => { ev.preventDefault(); save.mutate(); }}>
      <Field label="Stage" htmlFor="md-stage" error={e.stageId}>
        <Select id="md-stage" value={f.stageId} onChange={(x) => set("stageId", x.target.value)}>
          {stages.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.title}</option>)}
        </Select>
      </Field>
      <Field label="Slug" htmlFor="md-slug" error={e.slug}><Input id="md-slug" value={f.slug} onChange={(x) => set("slug", x.target.value)} className="font-mono" /></Field>
      <Field label="Title" htmlFor="md-title" error={e.title}><Input id="md-title" value={f.title} onChange={(x) => set("title", x.target.value)} /></Field>
      <Field label="Description" htmlFor="md-desc" error={e.description}><Textarea id="md-desc" value={f.description} onChange={(x) => set("description", x.target.value)} maxLength={1000} /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Order" htmlFor="md-order" error={e.order}><Input id="md-order" type="number" min={0} max={1000} value={f.order} onChange={(x) => set("order", Number(x.target.value))} /></Field>
        <Field label="Difficulty" htmlFor="md-diff" error={e.difficulty}><DifficultySelect id="md-diff" value={f.difficulty} onChange={(v) => set("difficulty", v)} /></Field>
        <Field label="Status" htmlFor="md-status" error={e.status}><StatusSelect id="md-status" value={f.status} onChange={(v) => set("status", v as ContentStatus)} /></Field>
      </div>
      <FormError error={save.error} />
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onDone}>Cancel</Button><Button type="submit" loading={save.isPending}>{id ? "Save module" : "Create module"}</Button></div>
    </form>
  );
}

type Editing =
  | { kind: "stage"; stage?: AdminStage }
  | { kind: "module"; module?: AdminModule; stageId: string }
  | { kind: "report"; title: string; published: string[]; skipped: { slug: string; missing: unknown }[] }
  | null;

function describeSkip(missing: unknown) {
  if (typeof missing === "string") return missing;
  const m = missing as { missing?: string[]; codeFailures?: { section: string; language: string }[] } | undefined;
  const parts = [...(m?.missing ?? []), ...(m?.codeFailures ?? []).map((c) => `broken ${c.language} sample in ${c.section}`)];
  return parts.join(" · ") || "Not publishable";
}

export default function RoadmapPage() {
  const qc = useQueryClient();
  const { can } = useRole();
  const canEdit = can("ADMIN");
  const stages = useStages();
  const modules = useModules();
  const [editing, setEditing] = useState<Editing>(null);
  const close = () => setEditing(null);

  const patch = useMutation({
    mutationFn: ({ kind, id, body }: { kind: "stages" | "modules"; id: string; body: Partial<AdminStage & AdminModule> }) => api.patch(`/admin/${kind}/${id}`, body),
    onSettled: (_d, _e, v) => qc.invalidateQueries({ queryKey: ["admin", v.kind] }),
  });
  const duplicate = useMutation({
    mutationFn: (id: string) => api.post<AdminModule>(`/admin/modules/${id}/duplicate`),
    onSuccess: (m) => { toast.success(`Duplicated as ${m.slug}`); qc.invalidateQueries({ queryKey: ["admin", "modules"] }); },
  });
  const publish = useMutation({
    mutationFn: (m: AdminModule) => api.post<{ published: string[]; skipped: { slug: string; missing: unknown }[] }>(`/admin/modules/${m.id}/publish`).then((r) => ({ ...r, title: m.title })),
    onSuccess: (r) => { setEditing({ kind: "report", ...r }); qc.invalidateQueries({ queryKey: ["admin"] }); },
  });

  /** Swap `order` with the neighbour; if equal, nudge by one so the order actually changes. */
  const reorder = async (kind: "stages" | "modules", list: { id: string; order: number }[], i: number, dir: -1 | 1) => {
    const a = list[i];
    const b = list[i + dir];
    if (!b) return;
    const aOrder = a.order === b.order ? b.order + dir : b.order;
    await Promise.all([
      api.patch(`/admin/${kind}/${a.id}`, { order: Math.max(0, aOrder) }),
      api.patch(`/admin/${kind}/${b.id}`, { order: a.order }),
    ]).catch((err) => toast.error(err instanceof Error ? err.message : "Reorder failed"));
    qc.invalidateQueries({ queryKey: ["admin", kind] });
  };

  if (stages.isLoading || modules.isLoading) return <PageSkeleton />;
  if (stages.error || modules.error) return <ErrorState error={stages.error ?? modules.error} retry={() => { stages.refetch(); modules.refetch(); }} />;
  const allStages = stages.data ?? [];
  const allModules = modules.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Curriculum"
        title="Roadmap"
        description="Stages and modules in learner order. Publishing a module publishes every publishable draft topic in it and reports the rest."
        actions={canEdit && <Button onClick={() => setEditing({ kind: "stage" })}><Plus className="size-4" /> New stage</Button>}
      />
      {!canEdit && <div className="mb-4"><RoleNotice min="ADMIN" /></div>}

      <ol className="space-y-4">
        {allStages.map((s, si) => {
          const mods = allModules.filter((m) => m.stageId === s.id);
          return (
            <li key={s.id} className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-2/40 px-4 py-3">
                <span className="grid h-8 min-w-8 place-items-center rounded-md border border-accent/30 bg-accent-soft px-1.5 font-mono text-xs font-semibold text-accent">{s.code}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{s.title}</span>
                    <Badge className="font-mono">{s.track}</Badge>
                    <span className="font-mono text-[11px] text-subtle">#{s.order} · {s.estHours}h · {s._count.modules} modules</span>
                  </div>
                  {s.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{s.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <StatusSelect value={s.status} disabled={!canEdit} onChange={(v) => patch.mutate({ kind: "stages", id: s.id, body: { status: v as ContentStatus } })} className="h-8 w-36 text-xs" />
                  {canEdit && (
                    <>
                      <Button size="sm" variant="ghost" aria-label={`Move ${s.title} up`} disabled={si === 0} onClick={() => reorder("stages", allStages, si, -1)}><ArrowUp className="size-3.5" /></Button>
                      <Button size="sm" variant="ghost" aria-label={`Move ${s.title} down`} disabled={si === allStages.length - 1} onClick={() => reorder("stages", allStages, si, 1)}><ArrowDown className="size-3.5" /></Button>
                      <Button size="sm" variant="ghost" aria-label={`Edit ${s.title}`} onClick={() => setEditing({ kind: "stage", stage: s })}><Pencil className="size-3.5" /></Button>
                    </>
                  )}
                </div>
              </div>
              <ul className="divide-y divide-border/60">
                {mods.length === 0 && <li className="px-4 py-4 text-sm text-muted">No modules in this stage yet.</li>}
                {mods.map((m, mi) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                    <span className="w-8 font-mono text-[11px] text-subtle">{String(m.order).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/topics?moduleId=${m.id}`} className="text-sm font-medium hover:text-accent">{m.title}</Link>
                      <div className="font-mono text-[11px] text-subtle">{m.slug} · {m._count.topics} topics · difficulty {m.difficulty}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <StatusSelect value={m.status} disabled={!canEdit} onChange={(v) => patch.mutate({ kind: "modules", id: m.id, body: { status: v as ContentStatus } })} className="h-8 w-36 text-xs" />
                      {canEdit && (
                        <>
                          <Button size="sm" variant="ghost" aria-label={`Move ${m.title} up`} disabled={mi === 0} onClick={() => reorder("modules", mods, mi, -1)}><ArrowUp className="size-3.5" /></Button>
                          <Button size="sm" variant="ghost" aria-label={`Move ${m.title} down`} disabled={mi === mods.length - 1} onClick={() => reorder("modules", mods, mi, 1)}><ArrowDown className="size-3.5" /></Button>
                          <Button size="sm" variant="ghost" aria-label={`Edit ${m.title}`} onClick={() => setEditing({ kind: "module", module: m, stageId: s.id })}><Pencil className="size-3.5" /></Button>
                          <Button size="sm" variant="ghost" aria-label={`Duplicate ${m.title}`} loading={duplicate.isPending && duplicate.variables === m.id} onClick={() => duplicate.mutate(m.id)}><Copy className="size-3.5" /></Button>
                          <Button size="sm" variant="secondary" loading={publish.isPending && publish.variables?.id === m.id} onClick={() => publish.mutate(m)}><Rocket className="size-3.5" /> Publish</Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {canEdit && (
                <div className="border-t border-border/60 px-4 py-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing({ kind: "module", stageId: s.id })}><Plus className="size-3.5" /> Add module to {s.code}</Button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <Modal open={editing?.kind === "stage"} onClose={close} title={editing?.kind === "stage" && editing.stage ? `Edit stage ${editing.stage.code}` : "New stage"} size="lg">
        {editing?.kind === "stage" && (
          <StageForm
            key={editing.stage?.id ?? "new"}
            id={editing.stage?.id}
            onDone={close}
            initial={editing.stage
              ? { slug: editing.stage.slug, code: editing.stage.code, title: editing.stage.title, description: editing.stage.description, track: editing.stage.track, order: editing.stage.order, estHours: editing.stage.estHours, targetRoles: editing.stage.targetRoles, icon: editing.stage.icon, color: editing.stage.color, status: editing.stage.status }
              : { slug: "", code: `S${allStages.length + 1}`, title: "", description: "", track: "COMMON", order: (allStages.at(-1)?.order ?? 0) + 1, estHours: 0, targetRoles: [], icon: null, color: null, status: "DRAFT" }}
          />
        )}
      </Modal>
      <Modal open={editing?.kind === "module"} onClose={close} title={editing?.kind === "module" && editing.module ? "Edit module" : "New module"} size="lg">
        {editing?.kind === "module" && (
          <ModuleForm
            key={editing.module?.id ?? `new-${editing.stageId}`}
            id={editing.module?.id}
            stages={allStages}
            onDone={close}
            initial={editing.module
              ? { stageId: editing.module.stageId, slug: editing.module.slug, title: editing.module.title, description: editing.module.description, order: editing.module.order, difficulty: editing.module.difficulty, status: editing.module.status }
              : { stageId: editing.stageId, slug: "", title: "", description: "", order: (allModules.filter((m) => m.stageId === editing.stageId).at(-1)?.order ?? 0) + 1, difficulty: 1, status: "DRAFT" }}
          />
        )}
      </Modal>
      <Modal open={editing?.kind === "report"} onClose={close} title={editing?.kind === "report" ? `Publish report · ${editing.title}` : "Publish report"} size="lg">
        {editing?.kind === "report" && (
          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-accent">Published · {editing.published.length}</div>
              {editing.published.length ? <div className="flex flex-wrap gap-1">{editing.published.map((s) => <Badge key={s} tone="accent" className="font-mono">{s}</Badge>)}</div> : <p className="text-muted">No draft topics were publishable.</p>}
            </div>
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-danger">Skipped · {editing.skipped.length}</div>
              <ul className="space-y-1.5">
                {editing.skipped.map((s) => <li key={s.slug} className="rounded-lg border border-border bg-surface-2/50 p-2"><span className="font-mono text-xs">{s.slug}</span><p className="text-xs text-muted">{describeSkip(s.missing)}</p></li>)}
              </ul>
            </div>
            <p className="text-xs text-subtle">The module itself is now marked Published. Fix skipped topics from Content health.</p>
          </div>
        )}
      </Modal>
    </>
  );
}
