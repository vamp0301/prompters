"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { ErrorState, PageHeader, PageSkeleton, Stat } from "@/components/ui/misc";
import { CoverageBar } from "@/features/admin/charts";
import { EmptyRow, Meter, Panel, StatusBadge, TableWrap, Td, Th, Toggle, Toolbar } from "@/features/admin/ui";
import { api } from "@/lib/api/client";
import type { ContentHealth } from "@/lib/api/types";

export default function ContentHealthPage() {
  const [requiredOnly, setRequiredOnly] = useState(false);
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["admin", "content-health"], queryFn: () => api.get<ContentHealth>("/admin/content-health") });
  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} retry={() => refetch()} />;
  const rows = requiredOnly ? data.incomplete.filter((r) => r.missing.some((m) => m.required)) : data.incomplete;
  const t = data.totals;
  return (
    <>
      <PageHeader eyebrow="Quality" title="Content health" description="Every non-archived topic checked against the publish rules. Required gaps block publishing; optional gaps lower completeness." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Topics" value={t.topics} />
        <Stat label="With content" value={t.withContent} />
        <Stat label="Publishable" value={t.complete} />
        <Stat label="Blocked" value={t.incomplete} />
        <Stat label="Published" value={t.published} />
        <Stat label="Coming soon" value={t.comingSoon} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Panel title="Language coverage" description="Share of all topic sections written in each language" bodyClassName="space-y-4 p-4">
          <CoverageBar label="Hinglish" value={data.languages.hinglish} hint="required" />
          <CoverageBar label="English" value={data.languages.en} hint="required" />
          <CoverageBar label="Hindi" value={data.languages.hi} hint="optional" />
        </Panel>
        <Panel title="Asset coverage" description="Share of topics passing each check" bodyClassName="grid gap-4 p-4 sm:grid-cols-2">
          <CoverageBar label="Quiz pool ≥ quiz size" value={data.coverage.quiz} hint="required" />
          <CoverageBar label="Quiz pool ≥ 3× size" value={data.coverage.quizPool3x} />
          <CoverageBar label="Code samples (JS + Py)" value={data.coverage.code} hint="required" />
          <CoverageBar label="Interview questions" value={data.coverage.interview} hint="required" />
          <CoverageBar label="Build task" value={data.coverage.build} />
          <CoverageBar label="Visualization" value={data.coverage.visual} />
          <CoverageBar label="Prompt card" value={data.coverage.prompt} />
        </Panel>
      </div>

      <Panel className="mt-6" title={`Incomplete topics · ${rows.length}`} description="Topics below 100% completeness">
        <Toolbar><Toggle checked={requiredOnly} onChange={setRequiredOnly} label="Required gaps only" description="Hide topics that only miss optional items" /></Toolbar>
        <TableWrap>
          <thead><tr><Th>Topic</Th><Th>Stage</Th><Th>Status</Th><Th>Complete</Th><Th>Missing</Th><Th /></tr></thead>
          <tbody>
            {rows.length === 0 && <EmptyRow cols={6}>Everything here is complete. Nice.</EmptyRow>}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface-2/40">
                <Td><div className="font-medium">{r.title}</div><div className="font-mono text-[11px] text-subtle">{r.slug}</div></Td>
                <Td><span className="font-mono text-xs text-accent">{r.stage.code}</span> <span className="text-xs text-muted">{r.module}</span></Td>
                <Td><StatusBadge status={r.status} /></Td>
                <Td><Meter value={r.percent} /></Td>
                <Td>
                  <div className="flex max-w-md flex-wrap gap-1">
                    {r.missing.filter((m) => !requiredOnly || m.required).map((m) => <Badge key={m.label} tone={m.required ? "danger" : "warn"}>{m.required ? "✕" : "○"} {m.label}</Badge>)}
                  </div>
                </Td>
                <Td right><Link href={`/admin/topics/${r.id}`} className={buttonClass("secondary", "sm")}><Wrench className="size-3.5" /> Fix</Link></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <p className="px-3 py-2 text-[11px] text-subtle"><Badge tone="danger">✕</Badge> required — blocks publishing · <Badge tone="warn">○</Badge> optional</p>
      </Panel>
    </>
  );
}
