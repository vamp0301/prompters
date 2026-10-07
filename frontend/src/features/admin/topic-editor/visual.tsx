"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Visualizer } from "@/features/learning/visualizer";
import { api } from "@/lib/api/client";
import type { AdminTopicDetail, VisualStep } from "@/lib/api/types";
import { stableJson } from "../diff";
import { ConfirmDialog, fieldErrorsOf, FormError, move, RowControls } from "../ui";

export const VIZ_KINDS = ["FLOW", "TIMELINE", "STACK", "QUEUE", "TREE", "GRAPH", "NETWORK", "REQUEST_RESPONSE", "CODE_EXECUTION", "CUSTOM_STEPS"] as const;

type StepDraft = { title: string; description: string; highlight: string; durationMs: string };
type VizDraft = { kind: string; title: string; steps: StepDraft[] };

const toDraft = (t: AdminTopicDetail): VizDraft =>
  t.visualization
    ? {
        kind: t.visualization.kind,
        title: t.visualization.title,
        steps: (Array.isArray(t.visualization.steps) ? t.visualization.steps : []).map((s) => ({ title: s.title ?? "", description: s.description ?? "", highlight: s.highlight ?? "", durationMs: s.durationMs ? String(s.durationMs) : "" })),
      }
    : { kind: "FLOW", title: `How ${t.title} works`, steps: [{ title: "", description: "", highlight: "", durationMs: "" }, { title: "", description: "", highlight: "", durationMs: "" }] };

const toSteps = (d: VizDraft): VisualStep[] =>
  d.steps.map((s) => ({
    title: s.title,
    description: s.description,
    ...(s.highlight.trim() ? { highlight: s.highlight.trim() } : {}),
    ...(s.durationMs.trim() ? { durationMs: Number(s.durationMs) } : {}),
  }));

export function VisualTab({ topic }: { topic: AdminTopicDetail }) {
  const qc = useQueryClient();
  const [base, setBase] = useState(() => toDraft(topic));
  const [d, setD] = useState(base);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const dirty = stableJson(base) !== stableJson(d);
  const steps = toSteps(d);
  const previewable = steps.length >= 1 && steps.every((s) => s.title.trim());

  const save = useMutation({
    meta: { silent: true },
    mutationFn: () => api.put(`/admin/topics/${topic.id}/visualization`, { kind: d.kind, title: d.title, steps }),
    onSuccess: () => { toast.success("Visualization saved"); setBase(d); qc.invalidateQueries({ queryKey: ["admin"] }); },
  });
  const remove = useMutation({
    mutationFn: () => api.put(`/admin/topics/${topic.id}/visualization`, { remove: true }),
    onSuccess: () => { toast.success("Visualization removed"); setConfirmRemove(false); qc.invalidateQueries({ queryKey: ["admin"] }); },
  });
  const e = fieldErrorsOf(save.error);
  const setStep = (i: number, patch: Partial<StepDraft>) => setD((p) => ({ ...p, steps: p.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); save.mutate(); }}>
        <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
          <Field label="Kind" htmlFor="vz-kind" error={e.kind}>
            <Select id="vz-kind" value={d.kind} onChange={(x) => setD({ ...d, kind: x.target.value })}>{VIZ_KINDS.map((k) => <option key={k} value={k}>{k.replace(/_/g, " ")}</option>)}</Select>
          </Field>
          <Field label="Title" htmlFor="vz-title" error={e.title}><Input id="vz-title" value={d.title} onChange={(x) => setD({ ...d, title: x.target.value })} maxLength={160} /></Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-muted">Steps <span className="font-mono text-subtle">({d.steps.length}/20, min 2)</span></legend>
          <ol className="space-y-2">
            {d.steps.map((s, i) => (
              <li key={i} className="rounded-lg border border-border bg-surface p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-[11px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <Input value={s.title} onChange={(x) => setStep(i, { title: x.target.value })} placeholder="Step title" aria-label={`Step ${i + 1} title`} maxLength={160} className="h-9" />
                  <RowControls index={i} count={d.steps.length} onMove={(dir) => setD((p) => ({ ...p, steps: move(p.steps, i, dir) }))} onRemove={d.steps.length > 2 ? () => setD((p) => ({ ...p, steps: p.steps.filter((_, j) => j !== i) })) : undefined} labelText={`step ${i + 1}`} />
                </div>
                <Textarea value={s.description} onChange={(x) => setStep(i, { description: x.target.value })} placeholder="What happens in this step" aria-label={`Step ${i + 1} description`} maxLength={1000} className="min-h-16" />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input value={s.highlight} onChange={(x) => setStep(i, { highlight: x.target.value })} placeholder="Highlight label (≤80)" aria-label={`Step ${i + 1} highlight`} maxLength={80} className="h-9 text-xs" />
                  <Input value={s.durationMs} onChange={(x) => setStep(i, { durationMs: x.target.value.replace(/\D/g, "") })} placeholder="Duration ms (300–20000)" aria-label={`Step ${i + 1} duration in milliseconds`} inputMode="numeric" className="h-9 font-mono text-xs" />
                </div>
              </li>
            ))}
          </ol>
          {d.steps.length < 20 && <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={() => setD((p) => ({ ...p, steps: [...p.steps, { title: "", description: "", highlight: "", durationMs: "" }] }))}><Plus className="size-3.5" /> Add step</Button>}
          {e.steps && <p role="alert" className="text-xs text-danger">{e.steps}</p>}
        </fieldset>
        <FormError error={save.error} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          {topic.visualization ? <Button type="button" variant="danger" size="sm" onClick={() => setConfirmRemove(true)}><Trash2 className="size-3.5" /> Remove visualization</Button> : <span className="text-xs text-subtle">Not saved yet — optional for publishing.</span>}
          <div className="flex items-center gap-2">
            {dirty && <span className="text-xs text-warn">Unsaved</span>}
            <Button type="submit" loading={save.isPending} disabled={!dirty && !!topic.visualization}>Save visualization</Button>
          </div>
        </div>
      </form>
      <div className="xl:sticky xl:top-20 xl:self-start">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-subtle">Live preview</div>
        {previewable ? <Visualizer key={`${steps.length}-${d.kind}`} viz={{ kind: d.kind, title: d.title || "Untitled", steps }} /> : <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">Give every step a title to preview.</p>}
        <p className="mt-2 text-xs text-subtle">Shown to students under “How does it work inside?”. STACK and QUEUE render vertically.</p>
      </div>
      <ConfirmDialog open={confirmRemove} onClose={() => setConfirmRemove(false)} title="Remove visualization?" description="The working copy loses its visual. Published versions keep theirs until you publish again." confirmLabel="Remove" tone="danger" loading={remove.isPending} onConfirm={() => remove.mutate()} />
    </div>
  );
}
