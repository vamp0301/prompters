"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Archive, CheckCircle2, Copy, Eye, GitCompare, History, Rocket, RotateCcw, Send, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ErrorState, Skeleton } from "@/components/ui/misc";
import { api, ApiError } from "@/lib/api/client";
import type { AdminTopicDetail, AdminTopicVersion, CodeFailure, TopicSnapshot } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import { stableJson } from "../diff";
import { SideBySideDiff } from "../diff-view";
import { ConfirmDialog, EmptyRow, Modal, Panel, RoleNotice, StatusBadge, TableWrap, Td, Th, useRole } from "../ui";
import { LOCALE_LABEL } from "./content";
import { SECTION_TYPES, TopicPreview } from "./preview";

type Blocked = { missing: string[]; codeFailures: CodeFailure[] };
const WORKING = "working";

function useSnapshot(topicId: string, v: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "topic-snapshot", topicId, v],
    enabled: enabled && !!v,
    queryFn: async (): Promise<TopicSnapshot> =>
      v === WORKING ? api.get<TopicSnapshot>(`/admin/topics/${topicId}/preview`) : (await api.get<AdminTopicVersion>(`/admin/topics/${topicId}/versions/${v}`)).snapshot,
  });
}

const sectionText = (s: TopicSnapshot, type: string, key: string) => {
  const sec = s.sections.find((x) => x.type === type);
  if (!sec) return "";
  if (key === "codeJs") return sec.codeJs ?? "";
  if (key === "codePython") return sec.codePython ?? "";
  return sec.content[key] ?? "";
};

function Compare({ a, b, aLabel, bLabel }: { a: TopicSnapshot; b: TopicSnapshot; aLabel: string; bLabel: string }) {
  const meta: [string, string, string][] = [
    ["Title", a.title, b.title],
    ["Difficulty · minutes", `${a.difficulty} · ${a.estMinutes}`, `${b.difficulty} · ${b.estMinutes}`],
    ["Objectives", a.objectives.join("\n"), b.objectives.join("\n")],
    ["Technical definition", a.technicalDefinition ?? "", b.technicalDefinition ?? ""],
    ["Prerequisites", a.prerequisites.map((p) => p.slug).join("\n"), b.prerequisites.map((p) => p.slug).join("\n")],
    ["Visualization", a.visualization ? stableJson(a.visualization) : "", b.visualization ? stableJson(b.visualization) : ""],
  ];
  const locales = new Set<string>();
  [...a.sections, ...b.sections].forEach((s) => Object.keys(s.content).forEach((k) => locales.add(k)));
  const keys = [...locales, "codeJs", "codePython"];
  const changes = SECTION_TYPES.flatMap((type) => keys.map((k) => ({ type, k, before: sectionText(a, type, k), after: sectionText(b, type, k) }))).filter((c) => c.before !== c.after);
  const changedSections = new Set(changes.map((c) => c.type));
  const changedMeta = meta.filter(([, x, y]) => x !== y);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {SECTION_TYPES.map((t) => <Badge key={t} tone={changedSections.has(t) ? "warn" : "neutral"} className="font-mono">{changedSections.has(t) ? "Δ " : ""}{t}</Badge>)}
      </div>
      {changedMeta.length === 0 && changes.length === 0 && <p className="flex items-center gap-2 text-sm text-accent"><CheckCircle2 className="size-4" /> No differences.</p>}
      {changedMeta.map(([label, x, y]) => (
        <div key={label}>
          <h4 className="mb-1.5 text-xs font-semibold">{label}</h4>
          <SideBySideDiff before={x} after={y} leftLabel={aLabel} rightLabel={bLabel} />
        </div>
      ))}
      {changes.map((c) => (
        <div key={`${c.type}-${c.k}`}>
          <h4 className="mb-1.5 flex items-center gap-2 text-xs font-semibold"><span className="font-mono text-accent">{c.type}</span><Badge>{LOCALE_LABEL[c.k] ?? c.k}</Badge></h4>
          <SideBySideDiff before={c.before} after={c.after} leftLabel={aLabel} rightLabel={bLabel} />
        </div>
      ))}
    </div>
  );
}

function CompareDialog({ topic, open, onClose }: { topic: AdminTopicDetail; open: boolean; onClose: () => void }) {
  const versions = topic.versions.map((v) => String(v.version));
  const [a, setA] = useState(versions[1] ?? versions[0] ?? "");
  const [b, setB] = useState(WORKING);
  const sa = useSnapshot(topic.id, a, open);
  const sb = useSnapshot(topic.id, b, open);
  const name = (v: string) => (v === WORKING ? "Working copy" : `v${v}`);
  const opts = [...versions.map((v) => ({ v, l: `v${v}` })), { v: WORKING, l: "Working copy" }];
  return (
    <Modal open={open} onClose={onClose} title="Compare versions" size="xl">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="From (left)" htmlFor="cmp-a"><Select id="cmp-a" value={a} onChange={(e) => setA(e.target.value)} className="w-40">{opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</Select></Field>
        <Field label="To (right)" htmlFor="cmp-b"><Select id="cmp-b" value={b} onChange={(e) => setB(e.target.value)} className="w-40">{opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</Select></Field>
      </div>
      {sa.error || sb.error ? <ErrorState error={sa.error ?? sb.error} /> : sa.data && sb.data ? <Compare a={sa.data} b={sb.data} aLabel={name(a)} bLabel={name(b)} /> : <Skeleton className="h-64" />}
    </Modal>
  );
}

function ViewVersion({ topicId, version, onClose }: { topicId: string; version: number | null; onClose: () => void }) {
  const [locale, setLocale] = useState("hinglish");
  const v = useQuery({ queryKey: ["admin", "topic-version", topicId, version], queryFn: () => api.get<AdminTopicVersion>(`/admin/topics/${topicId}/versions/${version}`), enabled: version !== null });
  return (
    <Modal open={version !== null} onClose={onClose} title={`Version ${version ?? ""} snapshot`} size="xl">
      {v.data && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted">
          Published {formatDate(v.data.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}{v.data.note && <> · “{v.data.note}”</>}
          <Select value={locale} onChange={(e) => setLocale(e.target.value)} aria-label="Language" className="ml-auto h-8 w-32 text-xs">
            {Object.entries(LOCALE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
        </div>
      )}
      {v.error ? <ErrorState error={v.error} /> : v.data ? <TopicPreview snapshot={v.data.snapshot} locale={locale} /> : <Skeleton className="h-96" />}
    </Modal>
  );
}

export function VersionsTab({ topic, onRestored }: { topic: AdminTopicDetail; onRestored: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { can } = useRole();
  const [note, setNote] = useState("");
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [confirm, setConfirm] = useState<null | "override" | "unpublish" | "archive" | { restore: number }>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const [comparing, setComparing] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const setStatus = useMutation({
    mutationFn: (status: "DRAFT" | "REVIEW") => api.post(`/admin/topics/${topic.id}/status`, { status }),
    onSuccess: (_d, s) => { toast.success(s === "REVIEW" ? "Sent for review" : "Moved back to draft"); refresh(); },
  });
  const publish = useMutation({
    meta: { silent: true },
    mutationFn: (override: boolean) => api.post<{ version: number; codeFailures: CodeFailure[] }>(`/admin/topics/${topic.id}/publish`, { note: note.trim() || undefined, override: override || undefined }),
    onSuccess: (r) => { toast.success(`Published v${r.version}`); setBlocked(null); setNote(""); setConfirm(null); refresh(); },
    onError: (err) => {
      setConfirm(null);
      if (err instanceof ApiError && err.code === "NOT_PUBLISHABLE") {
        const d = err.details as Partial<Blocked> | undefined;
        setBlocked({ missing: d?.missing ?? [], codeFailures: d?.codeFailures ?? [] });
      } else toast.error(err instanceof Error ? err.message : "Publish failed");
    },
  });
  const simple = useMutation({
    mutationFn: (action: "unpublish" | "archive") => api.post(`/admin/topics/${topic.id}/${action}`),
    onSuccess: (_d, a) => { toast.success(a === "unpublish" ? "Unpublished — now Coming soon" : "Archived"); setConfirm(null); refresh(); },
  });
  const duplicate = useMutation({
    mutationFn: () => api.post<{ id: string; slug: string }>(`/admin/topics/${topic.id}/duplicate`),
    onSuccess: (t) => { toast.success(`Duplicated as ${t.slug}`); refresh(); router.push(`/admin/topics/${t.id}`); },
  });
  const restore = useMutation({
    mutationFn: (v: number) => api.post<{ restored: number }>(`/admin/topics/${topic.id}/versions/${v}/restore`),
    onSuccess: (r) => { toast.success(`Restored v${r.restored} into the working copy. Publish to make it live.`); setConfirm(null); refresh(); onRestored(); },
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-4">
        <Panel title="Workflow" description="Draft → Review → Published. Students only see published versions." bodyClassName="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Status</span><StatusBadge status={topic.status} />
            <span className="text-muted">· live version</span><span className="font-mono">{topic.publishedVersion ? `v${topic.publishedVersion}` : "none"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={topic.status === "DRAFT"} loading={setStatus.isPending && setStatus.variables === "DRAFT"} onClick={() => setStatus.mutate("DRAFT")}><Undo2 className="size-3.5" /> Back to draft</Button>
            <Button size="sm" variant="secondary" disabled={topic.status === "REVIEW"} loading={setStatus.isPending && setStatus.variables === "REVIEW"} onClick={() => setStatus.mutate("REVIEW")}><Send className="size-3.5" /> Send for review</Button>
            <Button size="sm" variant="ghost" loading={duplicate.isPending} onClick={() => duplicate.mutate()}><Copy className="size-3.5" /> Duplicate</Button>
          </div>
          {topic.status === "PUBLISHED" && <p className="text-xs text-subtle">A published topic stays Published while you edit its working copy; republish to ship changes.</p>}
        </Panel>

        <Panel title="Publish" description="Runs the completeness rules and every code sample in the sandbox." bodyClassName="space-y-3 p-4">
          {!can("ADMIN") ? <RoleNotice min="ADMIN" /> : (
            <>
              <Field label="Release note (optional)" htmlFor="pub-note"><Input id="pub-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="What changed for learners?" /></Field>
              <div className="flex flex-wrap gap-2">
                <Button loading={publish.isPending && publish.variables === false} onClick={() => publish.mutate(false)}><Rocket className="size-4" /> Publish v{topic.publishedVersion + 1}</Button>
                <Button variant="secondary" disabled={topic.status !== "PUBLISHED"} onClick={() => setConfirm("unpublish")}>Unpublish</Button>
                <Button variant="danger" disabled={topic.status === "ARCHIVED"} onClick={() => setConfirm("archive")}><Archive className="size-4" /> Archive</Button>
              </div>
            </>
          )}
          {blocked && (
            <div role="alert" className="space-y-3 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-danger"><AlertTriangle className="size-4" /> Not publishable</p>
              {blocked.missing.length > 0 && (
                <div><div className="mb-1 text-xs text-muted">Missing required content</div><ul className="flex flex-wrap gap-1">{blocked.missing.map((m) => <li key={m}><Badge tone="danger">{m}</Badge></li>)}</ul></div>
              )}
              {blocked.codeFailures.length > 0 && (
                <div>
                  <div className="mb-1 text-xs text-muted">Code samples that failed to run</div>
                  <ul className="space-y-1.5">{blocked.codeFailures.map((f, i) => <li key={i} className="rounded border border-danger/20 bg-bg/40 p-2"><div className="font-mono text-xs">{f.section} · {f.language}</div><pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] text-muted">{f.error || "Non-zero exit"}</pre></li>)}</ul>
                </div>
              )}
              {can("SUPER_ADMIN") && <Button size="sm" variant="danger" onClick={() => setConfirm("override")}>Publish anyway…</Button>}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title={<span className="flex items-center gap-2"><History className="size-4 text-muted" /> Version history</span>}
        description="Every publish is an immutable snapshot. Learner history stays tied to the version they studied."
        action={<Button size="sm" variant="secondary" disabled={topic.versions.length === 0} onClick={() => setComparing(true)}><GitCompare className="size-3.5" /> Compare</Button>}
      >
        <TableWrap className="[&_table]:min-w-[480px]">
          <thead><tr><Th>Version</Th><Th>Published</Th><Th>Note</Th><Th /></tr></thead>
          <tbody>
            {topic.versions.length === 0 && <EmptyRow cols={4}>Never published.</EmptyRow>}
            {topic.versions.map((v) => (
              <tr key={v.version}>
                <Td mono>v{v.version}{v.version === topic.publishedVersion && <Badge tone="accent" className="ml-2">live</Badge>}</Td>
                <Td className="whitespace-nowrap text-xs text-muted">{formatDate(v.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Td>
                <Td className="text-xs">{v.note ?? <span className="text-subtle">—</span>}</Td>
                <Td right className="whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => setViewing(v.version)}><Eye className="size-3.5" /> View</Button>
                  {can("ADMIN") && <Button size="sm" variant="ghost" onClick={() => setConfirm({ restore: v.version })}><RotateCcw className="size-3.5" /> Restore</Button>}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>

      <ConfirmDialog
        open={confirm === "override"} onClose={() => setConfirm(null)} title="Publish without passing validation?" tone="danger" confirmLabel="Publish anyway"
        loading={publish.isPending} onConfirm={() => publish.mutate(true)}
        description={<>Learners will see this topic with the missing items above. This override is recorded in the audit log as <span className="font-mono">PUBLISHED_TOPIC_OVERRIDE</span>.</>}
      />
      <ConfirmDialog open={confirm === "unpublish"} onClose={() => setConfirm(null)} title="Unpublish topic?" confirmLabel="Unpublish" loading={simple.isPending} onConfirm={() => simple.mutate("unpublish")} description="It stays on the roadmap as Coming soon. Learner progress and history are kept." />
      <ConfirmDialog open={confirm === "archive"} onClose={() => setConfirm(null)} title="Archive topic?" tone="danger" confirmLabel="Archive" loading={simple.isPending} onConfirm={() => simple.mutate("archive")} description="Archived topics disappear from the roadmap and content health. Topics are never hard-deleted." />
      <ConfirmDialog
        open={typeof confirm === "object" && confirm !== null} onClose={() => setConfirm(null)} title={`Restore v${typeof confirm === "object" && confirm ? confirm.restore : ""}?`} confirmLabel="Restore into working copy"
        loading={restore.isPending} onConfirm={() => typeof confirm === "object" && confirm && restore.mutate(confirm.restore)}
        description="Replaces the working copy's title, objectives, sections, visualization and prerequisites with that snapshot. Unsaved edits in other tabs are discarded. Nothing goes live until you publish."
      />
      <ViewVersion topicId={topic.id} version={viewing} onClose={() => setViewing(null)} />
      {comparing && <CompareDialog topic={topic} open={comparing} onClose={() => setComparing(false)} />}
    </div>
  );
}
