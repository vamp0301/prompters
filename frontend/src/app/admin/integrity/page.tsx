"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flag, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { HBars } from "@/features/admin/charts";
import { EmptyRow, fmt, Pager, Panel, TableWrap, Td, Th } from "@/features/admin/ui";
import { api, qs } from "@/lib/api/client";
import type { IntegrityRow, Paged } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";

type IntegrityResponse = Paged<IntegrityRow> & { byType: { type: string; count: number }[] };

const offset = (start: string, at: string) => {
  const s = Math.max(0, Math.round((new Date(at).getTime() - new Date(start).getTime()) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function IntegrityPage() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "integrity", page],
    queryFn: () => api.get<IntegrityResponse>(`/admin/integrity${qs({ page })}`),
    placeholderData: (p) => p,
  });
  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} retry={() => refetch()} />;
  return (
    <>
      <PageHeader eyebrow="Assessment" title="Integrity review" description="Attempts that were flagged or logged integrity events." />
      <div role="note" className="mb-5 flex gap-2 rounded-xl border border-info/30 bg-info-soft p-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
        <p><strong>Integrity signals are evidence for review, not proof of cheating.</strong> <span className="text-muted">Tab switches and fullscreen exits happen for innocent reasons (notifications, flaky screens). Talk to the learner before acting; resetting progress is logged.</span></p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Panel title="Events by type" description="All time" bodyClassName="p-4">
          {data.byType.length ? <HBars data={data.byType.map((b) => ({ label: b.type.replace(/_/g, " ").toLowerCase(), value: b.count }))} className="[&_li]:grid-cols-[96px_1fr_40px]" /> : <p className="text-sm text-muted">No events logged.</p>}
        </Panel>
        <Panel title={`Attempts · ${data.total}`}>
          <TableWrap className={isFetching ? "opacity-70" : undefined}>
            <thead><tr><Th>Learner</Th><Th>Assessment</Th><Th right>Score</Th><Th right>Integrity</Th><Th>Flag</Th><Th>Event timeline</Th><Th>Started</Th></tr></thead>
            <tbody>
              {data.items.length === 0 && <EmptyRow cols={7}>No flagged attempts.</EmptyRow>}
              {data.items.map((a) => (
                <tr key={a.id} className="align-top hover:bg-surface-2/40">
                  <Td><Link href={`/admin/users/${a.user.id}`} className="font-medium hover:text-accent">{a.user.name}</Link><div className="text-[11px] text-subtle">{a.user.email}</div></Td>
                  <Td className="text-xs">{a.assessment?.title ?? <span className="font-mono text-muted">{a.kind}</span>}</Td>
                  <Td right mono>{fmt(a.score === null ? null : Math.round(a.score), "%")}</Td>
                  <Td right mono className={a.integrityScore !== null && a.integrityScore < 70 ? "text-warn" : undefined}>{fmt(a.integrityScore)}</Td>
                  <Td>{a.flagged ? <Badge tone="warn"><Flag className="size-3" /> flagged</Badge> : <span className="text-xs text-subtle">—</span>}</Td>
                  <Td>
                    <ol className="flex max-w-md flex-wrap gap-1" aria-label="Integrity events in order">
                      {a.integrityEvents.map((ev, i) => (
                        <li key={i}><Badge tone="info" className="font-mono" ><span className="text-subtle">{offset(a.startedAt, ev.createdAt)}</span> {ev.type.toLowerCase()}</Badge></li>
                      ))}
                      {a.integrityEvents.length === 0 && <li className="text-xs text-subtle">no events</li>}
                    </ol>
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-muted">{formatDate(a.startedAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
        </Panel>
      </div>
    </>
  );
}
