"use client";
import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ErrorState, PageHeader } from "@/components/ui/misc";
import { stableJson } from "@/features/admin/diff";
import { DiffView } from "@/features/admin/diff-view";
import { EmptyRow, Pager, RoleNotice, TableWrap, Td, Th, Toolbar, useDebounced, useRole } from "@/features/admin/ui";
import { api, qs } from "@/lib/api/client";
import type { AuditLogRow, Paged } from "@/lib/api/types";
import { cn, formatDate } from "@/lib/utils";

const tone = (action: string) => (/ARCHIVED|SUSPENDED|RESET|REMOVED|OVERRIDE|REVOKED/.test(action) ? "danger" : /PUBLISHED|CREATED|REACTIVATED/.test(action) ? "accent" : /ROLE|SCORING|FLAG|EXPORT/.test(action) ? "warn" : "neutral");

export default function AuditLogsPage() {
  const { can } = useRole();
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const filters = { entityType: useDebounced(entityType.trim()), entityId: useDebounced(entityId.trim()), action: useDebounced(action.trim()), page };
  const list = useQuery({
    queryKey: ["admin", "audit-logs", filters],
    queryFn: () => api.get<Paged<AuditLogRow>>(`/admin/audit-logs${qs(filters)}`),
    enabled: can("SUPER_ADMIN"),
    placeholderData: (p) => p,
  });

  return (
    <>
      <PageHeader eyebrow="Platform" title="Audit log" description="Every admin write, with who did it and the before/after state." />
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2 text-xs text-muted"><Lock className="size-3.5" aria-hidden /> Append-only: entries can&apos;t be edited or deleted, from here or the API.</div>
      {!can("SUPER_ADMIN") ? <RoleNotice min="SUPER_ADMIN">The audit log is visible to Super Admins only.</RoleNotice> : (
        <div className="rounded-xl border border-border bg-surface">
          <Toolbar>
            <Input value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} placeholder="Action contains… (e.g. publish)" aria-label="Filter by action" className="h-9 max-w-56" />
            <Input value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} placeholder="Entity type (Topic, User…)" aria-label="Filter by entity type" className="h-9 max-w-48" />
            <Input value={entityId} onChange={(e) => { setEntityId(e.target.value); setPage(1); }} placeholder="Entity id" aria-label="Filter by entity id" className="h-9 max-w-56 font-mono text-xs" />
          </Toolbar>
          {list.error ? <div className="p-4"><ErrorState error={list.error} retry={() => list.refetch()} /></div> : (
            <TableWrap className={list.isFetching ? "opacity-70" : undefined}>
              <thead><tr><Th className="w-8" /><Th>Time</Th><Th>Actor</Th><Th>Action</Th><Th>Entity</Th></tr></thead>
              <tbody>
                {list.isLoading && <EmptyRow cols={5}>Loading…</EmptyRow>}
                {list.data?.items.length === 0 && <EmptyRow cols={5}>No entries match.</EmptyRow>}
                {list.data?.items.map((l) => {
                  const expanded = open === l.id;
                  const hasState = l.before != null || l.after != null;
                  return (
                    <Fragment key={l.id}>
                      <tr className={cn(hasState && "cursor-pointer hover:bg-surface-2/40")} onClick={() => hasState && setOpen(expanded ? null : l.id)}>
                        <Td>{hasState && <button aria-expanded={expanded} aria-label={expanded ? "Hide changes" : "Show changes"} onClick={(e) => { e.stopPropagation(); setOpen(expanded ? null : l.id); }} className="rounded p-0.5 text-subtle hover:text-text"><ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90")} /></button>}</Td>
                        <Td className="whitespace-nowrap font-mono text-xs text-muted">{formatDate(l.createdAt, { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</Td>
                        <Td><div className="text-sm">{l.actor.name}</div><div className="text-[11px] text-subtle">{l.actor.email}</div></Td>
                        <Td><Badge tone={tone(l.action)} className="font-mono">{l.action}</Badge></Td>
                        <Td><span className="text-xs">{l.entityType}</span>{l.entityId && <button className="ml-2 font-mono text-[11px] text-subtle hover:text-accent" onClick={(e) => { e.stopPropagation(); setEntityType(l.entityType); setEntityId(l.entityId ?? ""); setPage(1); }} title="Show history for this entity">{l.entityId}</button>}</Td>
                      </tr>
                      {expanded && (
                        <tr><td colSpan={5} className="border-b border-border bg-surface-2/30 p-3">
                          <div className="mb-1 flex gap-3 font-mono text-[10px] uppercase tracking-wider text-subtle"><span className="text-danger">− before</span><span className="text-accent">+ after</span></div>
                          <DiffView before={l.before == null ? "" : stableJson(l.before)} after={l.after == null ? "" : stableJson(l.after)} />
                        </td></tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
          {list.data && <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />}
        </div>
      )}
    </>
  );
}
