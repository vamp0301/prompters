"use client";
import Link from "next/link";
import { useState } from "react";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ErrorState, PageHeader } from "@/components/ui/misc";
import { useAdminList } from "@/features/admin/hooks";
import { EmptyRow, fmt, Pager, StatusBadge, TableWrap, Td, Th, Toolbar, useDebounced, useRole } from "@/features/admin/ui";
import type { AdminUserRow } from "@/lib/api/types";
import { relativeTime } from "@/lib/utils";

export default function UsersPage() {
  const { can } = useRole();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const list = useAdminList<AdminUserRow>("users", { q: dq, role, status, page });
  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Users"
        description="Learners and team members. Password data is never exposed."
        actions={can("SUPER_ADMIN") && <a href="/api/admin/users/export.csv" download className={buttonClass("secondary")}><Download className="size-4" /> Export CSV</a>}
      />
      <div className="rounded-xl border border-border bg-surface">
        <Toolbar>
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name or email" aria-label="Search users" className="h-9 max-w-xs" />
          <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Role" className="h-9 w-40">
            <option value="">All roles</option>{["STUDENT", "AUTHOR", "ADMIN", "SUPER_ADMIN"].map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
          </Select>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Account status" className="h-9 w-36">
            <option value="">Any status</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option>
          </Select>
        </Toolbar>
        {list.error ? <div className="p-4"><ErrorState error={list.error} retry={() => list.refetch()} /></div> : (
          <TableWrap className={list.isFetching ? "opacity-70" : undefined}>
            <thead><tr><Th>User</Th><Th>Role</Th><Th>Status</Th><Th>Language</Th><Th>Goal</Th><Th right>Mastered</Th><Th right>Readiness</Th><Th>Last active</Th></tr></thead>
            <tbody>
              {list.isLoading && <EmptyRow cols={8}>Loading…</EmptyRow>}
              {list.data?.items.length === 0 && <EmptyRow cols={8}>No users match.</EmptyRow>}
              {list.data?.items.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2/40">
                  <Td><Link href={`/admin/users/${u.id}`} className="font-medium hover:text-accent">{u.name}</Link><div className="text-[11px] text-subtle">{u.email}</div></Td>
                  <Td><Badge tone={u.role === "STUDENT" ? "neutral" : u.role === "SUPER_ADMIN" ? "warn" : "info"} className="font-mono">{u.role}</Badge></Td>
                  <Td><StatusBadge status={u.status} /></Td>
                  <Td className="font-mono text-xs text-muted">{u.profile?.startLanguage ?? "—"}</Td>
                  <Td className="text-xs text-muted">{u.profile?.goalRole ?? "—"}</Td>
                  <Td right mono>{u._count.masteries}</Td>
                  <Td right mono>{fmt(u.readiness[0]?.score)}</Td>
                  <Td className="whitespace-nowrap text-xs text-muted">{u.lastActiveAt ? relativeTime(u.lastActiveAt) : "never"}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        {list.data && <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />}
      </div>
    </>
  );
}
