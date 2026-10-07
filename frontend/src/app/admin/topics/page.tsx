"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ErrorState, PageHeader } from "@/components/ui/misc";
import { useAdminList, useModules, useStages } from "@/features/admin/hooks";
import {
  DifficultySelect, EmptyRow, fieldErrorsOf, FormError, Meter, Modal, Pager, slugify, StatusBadge, StatusSelect, TableWrap, Td, Th, Toolbar, useDebounced,
} from "@/features/admin/ui";
import { api } from "@/lib/api/client";
import type { AdminModule, AdminTopicRow } from "@/lib/api/types";
import { relativeTime } from "@/lib/utils";

function CreateTopic({ modules, defaultModuleId, onDone }: { modules: AdminModule[]; defaultModuleId?: string; onDone: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [f, setF] = useState({ moduleId: defaultModuleId ?? modules[0]?.id ?? "", slug: "", title: "", order: 1, difficulty: 1, estMinutes: 15, quizSize: 5 });
  const save = useMutation({
    meta: { silent: true },
    mutationFn: () => api.post<{ id: string }>("/admin/topics", f),
    onSuccess: (t) => { toast.success("Topic created"); qc.invalidateQueries({ queryKey: ["admin"] }); onDone(); router.push(`/admin/topics/${t.id}`); },
  });
  const e = fieldErrorsOf(save.error);
  return (
    <form className="space-y-3" onSubmit={(ev) => { ev.preventDefault(); save.mutate(); }}>
      <Field label="Module" htmlFor="nt-mod" error={e.moduleId}>
        <Select id="nt-mod" value={f.moduleId} onChange={(x) => setF({ ...f, moduleId: x.target.value })}>
          {modules.map((m) => <option key={m.id} value={m.id}>{m.stage.code} · {m.title}</option>)}
        </Select>
      </Field>
      <Field label="Title" htmlFor="nt-title" error={e.title}>
        <Input id="nt-title" value={f.title} onChange={(x) => {
          const title = x.target.value;
          const auto = f.slug === "" || f.slug === slugify(f.title);
          setF({ ...f, title, slug: auto ? slugify(title) : f.slug });
        }} />
      </Field>
      <Field label="Slug" htmlFor="nt-slug" error={e.slug} hint="lowercase-with-dashes; used in student URLs"><Input id="nt-slug" value={f.slug} onChange={(x) => setF({ ...f, slug: x.target.value })} className="font-mono" /></Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Order" htmlFor="nt-order" error={e.order}><Input id="nt-order" type="number" min={0} value={f.order} onChange={(x) => setF({ ...f, order: Number(x.target.value) })} /></Field>
        <Field label="Difficulty" htmlFor="nt-diff" error={e.difficulty}><DifficultySelect id="nt-diff" value={f.difficulty} onChange={(v) => setF({ ...f, difficulty: v })} /></Field>
        <Field label="Minutes" htmlFor="nt-min" error={e.estMinutes}><Input id="nt-min" type="number" min={1} value={f.estMinutes} onChange={(x) => setF({ ...f, estMinutes: Number(x.target.value) })} /></Field>
        <Field label="Quiz size" htmlFor="nt-quiz" error={e.quizSize}><Input id="nt-quiz" type="number" min={3} max={30} value={f.quizSize} onChange={(x) => setF({ ...f, quizSize: Number(x.target.value) })} /></Field>
      </div>
      <FormError error={save.error} />
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onDone}>Cancel</Button><Button type="submit" loading={save.isPending}>Create & open editor</Button></div>
    </form>
  );
}

export default function TopicsPage() {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [stageId, setStageId] = useState("");
  const [moduleId, setModuleId] = useState(params.get("moduleId") ?? "");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const dq = useDebounced(q);
  const stages = useStages();
  const modules = useModules();
  const list = useAdminList<AdminTopicRow>("topics", { q: dq, status, stageId, moduleId, page });
  const currentModule = modules.data?.find((m) => m.id === moduleId);

  return (
    <>
      <PageHeader eyebrow="Curriculum" title="Topics" description="Working copies of every topic. Students only ever see the latest published version." actions={<Button onClick={() => setCreating(true)} disabled={!modules.data?.length}><Plus className="size-4" /> New topic</Button>} />
      <div className="rounded-xl border border-border bg-surface">
        <Toolbar>
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search title or slug" aria-label="Search topics" className="h-9 max-w-xs" />
          <StatusSelect allowAll value={status} onChange={(v) => { setStatus(v); setPage(1); }} className="h-9 w-40" />
          <Select value={stageId} onChange={(e) => { setStageId(e.target.value); setModuleId(""); setPage(1); }} aria-label="Stage" className="h-9 w-48">
            <option value="">All stages</option>
            {stages.data?.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.title}</option>)}
          </Select>
          {currentModule && <Badge tone="info">Module: {currentModule.title} <button onClick={() => setModuleId("")} aria-label="Clear module filter" className="ml-1">✕</button></Badge>}
        </Toolbar>
        {list.error ? <div className="p-4"><ErrorState error={list.error} retry={() => list.refetch()} /></div> : (
          <TableWrap className={list.isFetching ? "opacity-70" : undefined}>
            <thead><tr><Th>Topic</Th><Th>Module</Th><Th>Status</Th><Th>Complete</Th><Th>Missing (required)</Th><Th right>Ver</Th><Th right>Q · B · I · P</Th><Th>Updated</Th></tr></thead>
            <tbody>
              {list.isLoading && <EmptyRow cols={8}>Loading…</EmptyRow>}
              {list.data?.items.length === 0 && <EmptyRow cols={8}>No topics match.</EmptyRow>}
              {list.data?.items.map((t) => (
                <tr key={t.id} className="hover:bg-surface-2/40">
                  <Td><Link href={`/admin/topics/${t.id}`} className="font-medium hover:text-accent">{t.title}</Link><div className="font-mono text-[11px] text-subtle">{t.slug}</div></Td>
                  <Td className="text-xs text-muted"><span className="font-mono text-accent">{t.module.stage.code}</span> {t.module.title}</Td>
                  <Td><StatusBadge status={t.status} /></Td>
                  <Td><Meter value={t.completeness} /></Td>
                  <Td>{t.missing.length ? <span className="line-clamp-2 max-w-56 text-xs text-danger">{t.missing.join(", ")}</span> : <span className="text-xs text-accent">Publishable</span>}</Td>
                  <Td right mono>{t.publishedVersion ? `v${t.publishedVersion}` : "—"}</Td>
                  <Td right mono className="whitespace-nowrap text-muted">{t.counts.questions} · {t.counts.buildTasks} · {t.counts.interviewQs} · {t.counts.promptCards}</Td>
                  <Td className="whitespace-nowrap text-xs text-muted">{relativeTime(t.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        {list.data && <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />}
      </div>
      <p className="mt-2 text-[11px] text-subtle">Counts are published questions · build tasks · interview questions · prompt cards.</p>
      <Modal open={creating} onClose={() => setCreating(false)} title="New topic" size="lg">
        {creating && modules.data && <CreateTopic modules={modules.data} defaultModuleId={moduleId || undefined} onDone={() => setCreating(false)} />}
      </Modal>
    </>
  );
}
