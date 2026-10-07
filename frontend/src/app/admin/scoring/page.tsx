"use client";
import { Fragment, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { stableJson } from "@/features/admin/diff";
import { ConfirmDialog, EmptyRow, fieldErrorsOf, FormError, Panel, RoleNotice, TableWrap, Td, Th, Toggle, useRole } from "@/features/admin/ui";
import { api } from "@/lib/api/client";
import type { ScoringConfig, ScoringResponse } from "@/lib/api/types";
import { cn, formatDate } from "@/lib/utils";

/** Flattens a config into "a.b" → value for diffs. */
function flat(o: unknown, prefix = ""): Record<string, string> {
  if (o === null || typeof o !== "object" || Array.isArray(o)) return { [prefix]: JSON.stringify(o) };
  return Object.entries(o as Record<string, unknown>).reduce((acc, [k, v]) => ({ ...acc, ...flat(v, prefix ? `${prefix}.${k}` : k) }), {} as Record<string, string>);
}
function configDiff(a: object, b: object) {
  const fa = flat(a);
  const fb = flat(b);
  return [...new Set([...Object.keys(fa), ...Object.keys(fb)])].filter((k) => fa[k] !== fb[k]).map((k) => ({ key: k, from: fa[k] ?? "—", to: fb[k] ?? "—" }));
}

function Num({ id, label, value, onChange, min, max, step = 1, hint, error, disabled }: { id: string; label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; hint?: string; error?: string; disabled?: boolean }) {
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error}>
      <Input id={id} type="number" value={Number.isFinite(value) ? value : ""} min={min} max={max} step={step} disabled={disabled} onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))} className="font-mono" />
    </Field>
  );
}

function ScoringForm({ active, defaults, canEdit }: { active: ScoringConfig; defaults: ScoringConfig; canEdit: boolean }) {
  const qc = useQueryClient();
  const [c, setC] = useState(active);
  const [intervals, setIntervals] = useState(active.reviewIntervalsDays.join(", "));
  const [note, setNote] = useState("");
  const parsedIntervals = intervals.split(/[,\s]+/).filter(Boolean).map(Number);
  const intervalsError = parsedIntervals.length < 1 || parsedIntervals.length > 12 || parsedIntervals.some((n) => !Number.isInteger(n) || n <= 0) ? "1–12 positive whole numbers of days" : undefined;
  const config: ScoringConfig = { ...c, reviewIntervalsDays: intervalsError ? c.reviewIntervalsDays : parsedIntervals };
  const dirty = stableJson(config) !== stableJson(active);
  const save = useMutation({
    meta: { silent: true },
    mutationFn: () => api.post("/admin/scoring", { config, note: note.trim() || undefined }),
    onSuccess: () => { toast.success("New scoring version is active"); setNote(""); qc.invalidateQueries({ queryKey: ["admin", "scoring"] }); },
  });
  const e = fieldErrorsOf(save.error);
  const rw = c.readinessWeights;
  const rwSum = Object.values(rw).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  const pw = c.projectScoreWeights;
  const pwSum = pw.tests + pw.explanation + pw.independence;
  const set = (patch: Partial<ScoringConfig>) => setC((p) => ({ ...p, ...patch }));
  const d = !canEdit;
  const changes = configDiff(active, config);

  return (
    <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); if (!intervalsError) save.mutate(); }}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Mastery & reviews" bodyClassName="grid gap-3 p-4 sm:grid-cols-2">
          <Num id="sc-mt" label="Mastery threshold %" value={c.masteryThreshold} min={50} max={100} onChange={(v) => set({ masteryThreshold: v })} error={e.config} disabled={d} />
          <Num id="sc-se" label="Stage exam pass %" value={c.stageExamPassingScore} min={0} max={100} onChange={(v) => set({ stageExamPassingScore: v })} disabled={d} />
          <Field label="Review intervals (days)" htmlFor="sc-ri" error={intervalsError} hint="Spaced repetition steps, comma-separated" className="sm:col-span-2">
            <Input id="sc-ri" value={intervals} disabled={d} onChange={(ev) => setIntervals(ev.target.value)} className="font-mono" />
          </Field>
          <Toggle checked={c.stageGating} onChange={(v) => set({ stageGating: v })} label="Stage gating" description="Pass the stage exam to unlock the next stage" disabled={d} />
          <Toggle checked={c.topicGating} onChange={(v) => set({ topicGating: v })} label="Topic gating" description="Master prerequisites first" disabled={d} />
        </Panel>
        <Panel title="Quiz sizes" bodyClassName="grid grid-cols-3 gap-3 p-4">
          <Num id="sc-qm" label="Mastery" value={c.quiz.masterySize} min={3} max={20} onChange={(v) => set({ quiz: { ...c.quiz, masterySize: v } })} disabled={d} />
          <Num id="sc-qr" label="Review" value={c.quiz.reviewSize} min={2} max={20} onChange={(v) => set({ quiz: { ...c.quiz, reviewSize: v } })} disabled={d} />
          <Num id="sc-qp" label="Practice" value={c.quiz.practiceSize} min={5} max={30} onChange={(v) => set({ quiz: { ...c.quiz, practiceSize: v } })} disabled={d} />
          <p className="col-span-3 text-xs text-subtle">Per-topic quiz size (topic editor) overrides the mastery size.</p>
        </Panel>
        <Panel title="Builds & projects" bodyClassName="space-y-3 p-4">
          <div className="grid grid-cols-3 gap-3">
            {([0, 1, 2] as const).map((i) => (
              <Num key={i} id={`sc-h${i}`} label={`Hint ${i + 1} penalty`} value={c.hintPenalties[i]} min={0} onChange={(v) => { const h = [...c.hintPenalties] as ScoringConfig["hintPenalties"]; h[i] = v; set({ hintPenalties: h }); }} disabled={d} />
            ))}
          </div>
          <p className="text-xs text-subtle">Cumulative: using all three hints costs {c.hintPenalties.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)} independence points.</p>
          <Num id="sc-me" label="Min explain score %" value={c.minExplainScore} min={0} max={100} onChange={(v) => set({ minExplainScore: v })} disabled={d} />
          <div className="grid grid-cols-3 gap-3">
            <Num id="sc-pt" label="Weight · tests" value={pw.tests} step={0.05} onChange={(v) => set({ projectScoreWeights: { ...pw, tests: v } })} disabled={d} />
            <Num id="sc-pe" label="· explanation" value={pw.explanation} step={0.05} onChange={(v) => set({ projectScoreWeights: { ...pw, explanation: v } })} disabled={d} />
            <Num id="sc-pi" label="· independence" value={pw.independence} step={0.05} onChange={(v) => set({ projectScoreWeights: { ...pw, independence: v } })} disabled={d} />
          </div>
          <p className={cn("font-mono text-xs", Math.abs(pwSum - 1) > 0.001 ? "text-warn" : "text-subtle")}>sum = {Number.isFinite(pwSum) ? pwSum.toFixed(2) : "—"}{Math.abs(pwSum - 1) > 0.001 && " (project score weights usually sum to 1)"}</p>
        </Panel>
        <Panel title="Readiness weights" description="Normalised by their sum — only the ratios matter." bodyClassName="space-y-2 p-4">
          {(Object.keys(rw) as (keyof ScoringConfig["readinessWeights"])[]).map((k) => {
            const share = rwSum > 0 && Number.isFinite(rw[k]) ? (rw[k] / rwSum) * 100 : 0;
            return (
              <div key={k} className="grid grid-cols-[90px_80px_1fr_44px] items-center gap-2">
                <label htmlFor={`rw-${k}`} className="text-xs capitalize text-muted">{k}</label>
                <Input id={`rw-${k}`} type="number" min={0} value={Number.isFinite(rw[k]) ? rw[k] : ""} disabled={d} onChange={(ev) => set({ readinessWeights: { ...rw, [k]: ev.target.value === "" ? NaN : Number(ev.target.value) } })} className="h-8 font-mono text-xs" />
                <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-accent" style={{ width: `${share}%` }} /></div>
                <span className="text-right font-mono text-xs tabular-nums">{share.toFixed(0)}%</span>
              </div>
            );
          })}
          <p className="font-mono text-[11px] text-subtle">sum = {rwSum}</p>
          <div className="border-t border-border pt-3">
            <Num id="sc-ip" label="Integrity penalty per event" value={c.integrityPenaltyPerEvent} min={0} max={50} onChange={(v) => set({ integrityPenaltyPerEvent: v })} hint="Integrity score points lost per tab switch / paste / fullscreen exit" disabled={d} />
          </div>
        </Panel>
      </div>

      {canEdit && (
        <Panel title="Save as new version" description="Creates a new version and activates it immediately. Old versions stay in history." bodyClassName="space-y-3 p-4">
          {changes.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">{changes.map((ch) => <li key={ch.key}><Badge tone="warn" className="font-mono">{ch.key}: {ch.from} → {ch.to}</Badge></li>)}</ul>
          ) : <p className="text-xs text-subtle">No changes from the active config.</p>}
          <Field label="Change note" htmlFor="sc-note"><Input id="sc-note" value={note} onChange={(ev) => setNote(ev.target.value)} maxLength={300} placeholder="Why are we changing this?" /></Field>
          <FormError error={save.error} />
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { setC(defaults); setIntervals(defaults.reviewIntervalsDays.join(", ")); }}><RotateCcw className="size-3.5" /> Reset to defaults</Button>
            <Button type="button" variant="ghost" disabled={!dirty} onClick={() => { setC(active); setIntervals(active.reviewIntervalsDays.join(", ")); }}>Discard</Button>
            <Button type="submit" disabled={!dirty || !!intervalsError} loading={save.isPending}>Save & activate</Button>
          </div>
        </Panel>
      )}
    </form>
  );
}

export default function ScoringPage() {
  const qc = useQueryClient();
  const { can } = useRole();
  const canEdit = can("SUPER_ADMIN");
  const [open, setOpen] = useState<number | null>(null);
  const [activate, setActivate] = useState<number | null>(null);
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["admin", "scoring"], queryFn: () => api.get<ScoringResponse>("/admin/scoring") });
  const act = useMutation({
    mutationFn: (v: number) => api.post(`/admin/scoring/${v}/activate`),
    onSuccess: (_d, v) => { toast.success(`Version ${v} is now active`); setActivate(null); qc.invalidateQueries({ queryKey: ["admin", "scoring"] }); },
  });
  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} retry={() => refetch()} />;
  const activeVersion = data.versions.find((v) => v.active)?.version;

  return (
    <>
      <PageHeader eyebrow="Platform" title="Scoring rules" description={<>The live rules for mastery, gating, quizzes, hints, projects and readiness. {activeVersion ? <>Active: <span className="font-mono text-text">v{activeVersion}</span>.</> : "Running on built-in defaults."}</>} />
      {!canEdit && <div className="mb-4"><RoleNotice min="SUPER_ADMIN" /></div>}
      <ScoringForm key={stableJson(data.active)} active={data.active} defaults={data.defaults} canEdit={canEdit} />

      <Panel className="mt-6" title="Version history" description="Latest 30. Activating an old version doesn't create a new one.">
        <TableWrap>
          <thead><tr><Th>Version</Th><Th>Created</Th><Th>Note</Th><Th>Changes vs active</Th><Th /></tr></thead>
          <tbody>
            {data.versions.length === 0 && <EmptyRow cols={5}>No saved versions — the defaults are in use.</EmptyRow>}
            {data.versions.map((v) => {
              const merged = { ...data.defaults, ...v.config };
              const diff = configDiff(data.active, merged);
              return (
                <Fragment key={v.id}>
                  <tr>
                    <Td mono>v{v.version}{v.active && <Badge tone="accent" className="ml-2">active</Badge>}</Td>
                    <Td className="whitespace-nowrap text-xs text-muted">{formatDate(v.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Td>
                    <Td className="text-xs">{v.note ?? <span className="text-subtle">—</span>}</Td>
                    <Td>
                      {v.active ? <span className="text-xs text-subtle">—</span> : (
                        <button className="flex items-center gap-1 text-xs text-muted hover:text-text" aria-expanded={open === v.version} onClick={() => setOpen(open === v.version ? null : v.version)}>
                          {diff.length} field{diff.length === 1 ? "" : "s"} differ <ChevronDown className={cn("size-3.5 transition-transform", open === v.version && "rotate-180")} />
                        </button>
                      )}
                    </Td>
                    <Td right>{canEdit && !v.active && <Button size="sm" variant="secondary" onClick={() => setActivate(v.version)}>Activate</Button>}</Td>
                  </tr>
                  {open === v.version && (
                    <tr><td colSpan={5} className="border-b border-border bg-surface-2/30 px-3 py-2">
                      {diff.length ? (
                        <table className="w-full font-mono text-[12px]"><thead><tr className="text-left text-subtle"><th className="py-1 font-normal">field</th><th className="font-normal">active</th><th className="font-normal">v{v.version}</th></tr></thead>
                          <tbody>{diff.map((x) => <tr key={x.key}><td className="py-0.5 pr-4">{x.key}</td><td className="pr-4 text-danger">{x.from}</td><td className="text-accent">{x.to}</td></tr>)}</tbody></table>
                      ) : <p className="text-xs text-muted">Identical to the active config.</p>}
                    </td></tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </TableWrap>
      </Panel>
      <ConfirmDialog open={activate !== null} onClose={() => setActivate(null)} title={`Activate scoring v${activate ?? ""}?`} confirmLabel="Activate" loading={act.isPending} onConfirm={() => activate !== null && act.mutate(activate)} description="Takes effect for new attempts within ~30 seconds. Past scores aren't recalculated." />
    </>
  );
}
