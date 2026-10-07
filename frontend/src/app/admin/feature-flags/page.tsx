"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { stableJson } from "@/features/admin/diff";
import { fieldErrorsOf, FormError, Modal, RoleNotice, TagInput, Toggle, useRole } from "@/features/admin/ui";
import { api } from "@/lib/api/client";
import type { FeatureFlag } from "@/lib/api/types";
import { relativeTime } from "@/lib/utils";

type Draft = { description: string; enabled: boolean; rolloutPercent: number; userIds: string[] };

function FlagCard({ flag, canEdit }: { flag: FeatureFlag; canEdit: boolean }) {
  const qc = useQueryClient();
  const [base, setBase] = useState<Draft>(() => ({ description: flag.description, enabled: flag.enabled, rolloutPercent: flag.rolloutPercent, userIds: flag.userIds }));
  const [d, setD] = useState(base);
  const dirty = stableJson(base) !== stableJson(d);
  const save = useMutation({
    meta: { silent: true },
    mutationFn: () => api.put<FeatureFlag>(`/admin/feature-flags/${flag.key}`, d),
    onSuccess: () => { toast.success(`${flag.key} saved`); setBase(d); qc.invalidateQueries({ queryKey: ["admin", "feature-flags"] }); },
  });
  const e = fieldErrorsOf(save.error);
  const sliderId = `roll-${flag.key}`;
  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Toggle checked={d.enabled} onChange={(v) => setD({ ...d, enabled: v })} disabled={!canEdit} label={flag.key} description={flag.updatedAt ? `updated ${relativeTime(flag.updatedAt)}` : "never configured — off"} />
        <div className="ml-auto flex items-center gap-2">
          {d.enabled ? <Badge tone="accent">{d.rolloutPercent === 100 ? "on for everyone" : `on for ${d.rolloutPercent}%`}</Badge> : <Badge>off{d.userIds.length ? ` · ${d.userIds.length} allow-listed` : ""}</Badge>}
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr_1.2fr]">
        <Field label="Description" htmlFor={`desc-${flag.key}`} error={e.description}><Input id={`desc-${flag.key}`} value={d.description} disabled={!canEdit} onChange={(x) => setD({ ...d, description: x.target.value })} maxLength={300} /></Field>
        <div>
          <label htmlFor={sliderId} className="mb-1.5 flex justify-between text-xs font-medium text-muted"><span>Rollout</span><span className="font-mono tabular-nums text-text">{d.rolloutPercent}%</span></label>
          <input id={sliderId} type="range" min={0} max={100} step={5} value={d.rolloutPercent} disabled={!canEdit} onChange={(x) => setD({ ...d, rolloutPercent: Number(x.target.value) })} className="h-10 w-full accent-[var(--accent)]" />
          <p className="text-[11px] text-subtle">Stable per-user bucket; only applies while enabled.</p>
        </div>
        <Field label="Always-on user IDs" htmlFor={`users-${flag.key}`} error={e.userIds} hint="These users get the feature even when it's off.">
          <TagInput id={`users-${flag.key}`} value={d.userIds} onChange={(v) => setD({ ...d, userIds: v })} max={1000} placeholder={canEdit ? "paste a user id" : ""} />
        </Field>
      </div>
      {canEdit && (dirty || save.error) && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
          <FormError error={save.error} />
          <Button size="sm" variant="ghost" onClick={() => setD(base)}>Discard</Button>
          <Button size="sm" loading={save.isPending} onClick={() => save.mutate()}>Save {flag.key}</Button>
        </div>
      )}
    </li>
  );
}

function NewFlag({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(false);
  const valid = /^[A-Z0-9_]{2,60}$/.test(key);
  const save = useMutation({
    meta: { silent: true },
    mutationFn: () => api.put(`/admin/feature-flags/${key}`, { key, description, enabled, rolloutPercent: 100, userIds: [] }),
    onSuccess: () => { toast.success(`${key} created`); qc.invalidateQueries({ queryKey: ["admin", "feature-flags"] }); onDone(); },
  });
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (valid) save.mutate(); }}>
      <Field label="Key" htmlFor="nf-key" error={key && !valid ? "Use UPPER_SNAKE_CASE (A–Z, 0–9, _), 2–60 characters." : undefined} hint="Code checks this key, e.g. isEnabled(&quot;NEW_EDITOR&quot;).">
        <Input id="nf-key" value={key} onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[\s-]+/g, "_"))} className="font-mono" placeholder="NEW_FEATURE" />
      </Field>
      <Field label="Description" htmlFor="nf-desc"><Input id="nf-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} /></Field>
      <Toggle checked={enabled} onChange={setEnabled} label="Enabled" description="Starts at 100% rollout when on." />
      <FormError error={save.error} />
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onDone}>Cancel</Button><Button type="submit" disabled={!valid} loading={save.isPending}>Create flag</Button></div>
    </form>
  );
}

export default function FeatureFlagsPage() {
  const { can } = useRole();
  const canEdit = can("SUPER_ADMIN");
  const [creating, setCreating] = useState(false);
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["admin", "feature-flags"], queryFn: () => api.get<FeatureFlag[]>("/admin/feature-flags") });
  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} retry={() => refetch()} />;
  return (
    <>
      <PageHeader eyebrow="Platform" title="Feature flags" description="Turn features on gradually. Every change is audit-logged." actions={canEdit && <Button onClick={() => setCreating(true)}><Plus className="size-4" /> New flag</Button>} />
      {!canEdit && <div className="mb-4"><RoleNotice min="SUPER_ADMIN" /></div>}
      <ul className="space-y-3">
        {data.map((f) => <FlagCard key={`${f.key}-${f.updatedAt ?? "new"}`} flag={f} canEdit={canEdit} />)}
      </ul>
      <Modal open={creating} onClose={() => setCreating(false)} title="New feature flag">{creating && <NewFlag onDone={() => setCreating(false)} />}</Modal>
    </>
  );
}
