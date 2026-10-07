"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { ErrorState, PageHeader } from "@/components/ui/misc";
import { useAdminList, useAllTopics } from "@/features/admin/hooks";
import { QuestionDialog } from "@/features/admin/question-editor";
import { EmptyRow, FormError, Modal, Pager, StatusBadge, StatusSelect, TableWrap, Td, Th, Toolbar, useDebounced } from "@/features/admin/ui";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import type { AdminQuestion } from "@/lib/api/types";
import { relativeTime } from "@/lib/utils";

const HEADER = "topicSlug,type,difficulty,prompt,code,codeLanguage,options,correct,keywords,explanation,tags";
type ImportReport = { valid: number; invalid: { row: number; errors: string[] }[]; warnings: { row: number; message: string }[]; committed: boolean; inserted: number };

function ImportCsv({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [csv, setCsv] = useState("");
  const [report, setReport] = useState<ImportReport | null>(null);
  const run = useMutation({
    meta: { silent: true },
    mutationFn: (commit: boolean) => api.post<ImportReport>("/admin/questions-import", { csv, commit }),
    onSuccess: (r) => {
      setReport(r);
      if (r.committed) { toast.success(`Imported ${r.inserted} questions`); qc.invalidateQueries({ queryKey: ["admin"] }); onDone(); }
    },
  });
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setCsv(await f.text());
    setReport(null);
  };
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-surface-2/50 p-3 text-xs">
        <div className="mb-1 text-muted">Expected header (lists use <span className="font-mono text-text">|</span>; <span className="font-mono">correct</span> is 0-based option indexes):</div>
        <code className="block overflow-x-auto whitespace-nowrap font-mono text-[11px] text-accent">{HEADER}</code>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className={buttonClass("secondary", "sm", "cursor-pointer")}>
          <Upload className="size-3.5" /> Upload .csv
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <span className="text-xs text-subtle">or paste below</span>
      </div>
      <Textarea value={csv} onChange={(e) => { setCsv(e.target.value); setReport(null); }} aria-label="CSV content" placeholder={`${HEADER}\nclosures,MCQ,1,"What does a closure capture?",,,"Variables|Nothing",0,,"It captures the lexical scope.",scope`} className="min-h-48 font-mono text-[12px]" spellCheck={false} />
      <FormError error={run.error} />
      {report && (
        <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{report.valid} valid</Badge>
            <Badge tone={report.invalid.length ? "danger" : "neutral"}>{report.invalid.length} invalid</Badge>
            <Badge tone={report.warnings.length ? "warn" : "neutral"}>{report.warnings.length} warnings</Badge>
          </div>
          {report.invalid.length > 0 && (
            <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
              {report.invalid.map((r) => <li key={r.row} className="rounded bg-danger-soft px-2 py-1"><span className="font-mono text-danger">row {r.row}</span> — {r.errors.join("; ")}</li>)}
            </ul>
          )}
          {report.warnings.length > 0 && (
            <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
              {report.warnings.map((w, i) => <li key={i} className="rounded bg-warn-soft px-2 py-1"><span className="font-mono text-warn">row {w.row}</span> — {w.message}</li>)}
            </ul>
          )}
          {report.invalid.length > 0 && <p className="text-xs text-muted">Import is all-or-nothing: fix invalid rows first.</p>}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" disabled={!csv.trim()} loading={run.isPending && run.variables === false} onClick={() => run.mutate(false)}>Validate</Button>
        <Button disabled={!report || report.invalid.length > 0 || report.valid === 0} loading={run.isPending && run.variables === true} onClick={() => run.mutate(true)}>Import {report?.valid ?? 0} questions</Button>
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const editId = params.get("edit");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [topicId, setTopicId] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const dq = useDebounced(q);
  const topics = useAllTopics();
  const list = useAdminList<AdminQuestion>("questions", { q: dq, status, topicId, page });
  const openEdit = (id: string | null) => router.replace(id ? `${pathname}?edit=${id}` : pathname, { scroll: false });

  return (
    <>
      <PageHeader
        eyebrow="Assessment"
        title="Question bank"
        description="Every question across topics. Quizzes draw fresh from published questions on each attempt."
        actions={
          <>
            <a href="/api/admin/questions-export.csv" className={buttonClass("secondary")} download><Download className="size-4" /> Export CSV</a>
            <Button variant="secondary" onClick={() => setImporting(true)}><Upload className="size-4" /> Import CSV</Button>
            <Button onClick={() => setCreating(true)}><Plus className="size-4" /> New question</Button>
          </>
        }
      />
      <div className="rounded-xl border border-border bg-surface">
        <Toolbar>
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search prompt text" aria-label="Search questions" className="h-9 max-w-xs" />
          <Select value={topicId} onChange={(e) => { setTopicId(e.target.value); setPage(1); }} aria-label="Topic" className="h-9 w-56">
            <option value="">All topics</option>
            {topics.data?.map((t) => <option key={t.id} value={t.id}>{t.module.stage.code} · {t.title}</option>)}
          </Select>
          <StatusSelect allowAll value={status} onChange={(v) => { setStatus(v); setPage(1); }} className="h-9 w-40" />
        </Toolbar>
        {list.error ? <div className="p-4"><ErrorState error={list.error} retry={() => list.refetch()} /></div> : (
          <TableWrap className={list.isFetching ? "opacity-70" : undefined}>
            <thead><tr><Th>Prompt</Th><Th>Topic</Th><Th>Type</Th><Th right>Diff</Th><Th right>Pts</Th><Th>Status</Th><Th>Updated</Th></tr></thead>
            <tbody>
              {list.isLoading && <EmptyRow cols={7}>Loading…</EmptyRow>}
              {list.data?.items.length === 0 && <EmptyRow cols={7}>No questions match.</EmptyRow>}
              {list.data?.items.map((x) => (
                <tr key={x.id} className="cursor-pointer hover:bg-surface-2/40" onClick={() => openEdit(x.id)}>
                  <Td><button className="line-clamp-2 max-w-lg text-left hover:text-accent" onClick={(e) => { e.stopPropagation(); openEdit(x.id); }}>{x.prompt}</button></Td>
                  <Td className="text-xs text-muted">{x.topic?.title ?? "—"}</Td>
                  <Td><Badge className="font-mono">{x.type}</Badge></Td>
                  <Td right mono>{x.difficulty}</Td>
                  <Td right mono>{x.points}</Td>
                  <Td><StatusBadge status={x.status} /></Td>
                  <Td className="whitespace-nowrap text-xs text-muted">{relativeTime(x.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        {list.data && <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />}
      </div>
      <QuestionDialog open={!!editId} onClose={() => openEdit(null)} questionId={editId ?? undefined} />
      <QuestionDialog open={creating} onClose={() => setCreating(false)} topicId={topicId || undefined} />
      <Modal open={importing} onClose={() => setImporting(false)} title="Bulk import questions" size="lg">
        {importing && <ImportCsv onDone={() => setImporting(false)} />}
      </Modal>
    </>
  );
}
