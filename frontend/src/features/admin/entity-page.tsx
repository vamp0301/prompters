"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { Role } from "@/lib/api/types";
import { useAdminList } from "./hooks";
import { ConfirmDialog, EmptyRow, fieldErrorsOf, FormError, Modal, Pager, RoleNotice, StatusSelect, TableWrap, Th, Toolbar, useDebounced, useRole } from "./ui";

export interface FormProps<T> {
  record?: T;
  prefill: { topicId?: string };
  readOnly: boolean;
  onDone: () => void;
}

/** Save + archive mutations for a CRUD resource, with inline field errors. */
export function useEntitySave<T extends { id: string }>(path: string, record: T | undefined, label: string, onDone: () => void) {
  const qc = useQueryClient();
  const save = useMutation({
    meta: { silent: true },
    mutationFn: (body: unknown) => (record ? api.patch<T>(`/admin/${path}/${record.id}`, body) : api.post<T>(`/admin/${path}`, body)),
    onSuccess: () => { toast.success(record ? `${label} saved` : `${label} created`); qc.invalidateQueries({ queryKey: ["admin"] }); onDone(); },
  });
  const archive = useMutation({
    mutationFn: () => api.post(`/admin/${path}/${record?.id}/archive`),
    onSuccess: () => { toast.success(`${label} archived`); qc.invalidateQueries({ queryKey: ["admin"] }); onDone(); },
  });
  return { save, archive, errors: fieldErrorsOf(save.error) };
}

export function FormFooter({ save, archive, isEdit, readOnly, onDone, label, archived }: {
  save: { isPending: boolean; error: unknown }; archive: { mutate: () => void; isPending: boolean }; isEdit: boolean; readOnly: boolean; onDone: () => void; label: string; archived?: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <FormError error={save.error} />
      <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-wrap justify-between gap-2 border-t border-border bg-surface px-5 py-3">
        {isEdit && !readOnly ? <Button type="button" variant="danger" disabled={archived} onClick={() => setConfirm(true)}>Archive</Button> : <span />}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>{readOnly ? "Close" : "Cancel"}</Button>
          {!readOnly && <Button type="submit" loading={save.isPending}>{isEdit ? `Save ${label.toLowerCase()}` : `Create ${label.toLowerCase()}`}</Button>}
        </div>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title={`Archive this ${label.toLowerCase()}?`} description="Archived items are hidden from learners. Nothing is deleted; history and audit logs keep it." tone="danger" confirmLabel="Archive" loading={archive.isPending} onConfirm={() => archive.mutate()} />
    </>
  );
}

function EditorDialog<T extends { id: string }>({ path, label, editId, prefill, open, onClose, readOnly, Form }: {
  path: string; label: string; editId: string | null; prefill: { topicId?: string }; open: boolean; onClose: () => void; readOnly: boolean;
  Form: (p: FormProps<T>) => ReactNode;
}) {
  const q = useQuery({ queryKey: ["admin", path, "one", editId], queryFn: () => api.get<T>(`/admin/${path}/${editId}`), enabled: open && !!editId });
  return (
    <Modal open={open} onClose={onClose} title={editId ? `Edit ${label.toLowerCase()}` : `New ${label.toLowerCase()}`} size="xl">
      {!open ? null : editId && !q.data ? (q.error ? <ErrorState error={q.error} /> : <Skeleton className="h-96" />) : (
        <Form key={q.data?.id ?? "new"} record={editId ? q.data : undefined} prefill={prefill} readOnly={readOnly} onDone={onClose} />
      )}
    </Modal>
  );
}

/**
 * List + editor page for a CRUD resource. `?edit=<id>` opens the editor,
 * `?new=1&topicId=<id>` opens a prefilled create form (used by the topic editor and global search).
 */
export function EntityPage<T extends { id: string }>({
  path, label, eyebrow, title, description, write, headers, row, Form, extraFilters, extraParams, searchPlaceholder, notice,
}: {
  path: string; label: string; eyebrow: string; title: string; description: ReactNode; write: Role;
  headers: { label: string; right?: boolean }[]; row: (item: T, open: () => void) => ReactNode;
  Form: (p: FormProps<T>) => ReactNode; extraFilters?: ReactNode; extraParams?: Record<string, string>; searchPlaceholder?: string; notice?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { can } = useRole();
  const canWrite = can(write);
  const editId = params.get("edit");
  const isNew = params.get("new") === "1";
  const prefill = { topicId: params.get("topicId") ?? undefined };
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const list = useAdminList<T>(path, { q: dq, status, page, ...extraParams });
  const go = (search: string) => router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={canWrite && <Button onClick={() => go("new=1")}><Plus className="size-4" /> New {label.toLowerCase()}</Button>} />
      {!canWrite && <div className="mb-4"><RoleNotice min={write} /></div>}
      {notice}
      <div className="rounded-xl border border-border bg-surface">
        <Toolbar>
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={searchPlaceholder ?? "Search"} aria-label={`Search ${title.toLowerCase()}`} className="h-9 max-w-xs" />
          <StatusSelect allowAll value={status} onChange={(v) => { setStatus(v); setPage(1); }} className="h-9 w-40" />
          {extraFilters}
        </Toolbar>
        {list.error ? <div className="p-4"><ErrorState error={list.error} retry={() => list.refetch()} /></div> : (
          <TableWrap className={list.isFetching ? "opacity-70" : undefined}>
            <thead><tr>{headers.map((h) => <Th key={h.label} right={h.right}>{h.label}</Th>)}</tr></thead>
            <tbody>
              {list.isLoading && <EmptyRow cols={headers.length}>Loading…</EmptyRow>}
              {list.data?.items.length === 0 && <EmptyRow cols={headers.length}>Nothing here yet.</EmptyRow>}
              {list.data?.items.map((item) => row(item, () => go(`edit=${item.id}`)))}
            </tbody>
          </TableWrap>
        )}
        {list.data && <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />}
      </div>
      <EditorDialog<T> path={path} label={label} editId={editId} prefill={prefill} open={!!editId || (isNew && canWrite)} onClose={() => go("")} readOnly={!canWrite} Form={Form} />
    </>
  );
}
