"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlaySquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState, PageHeader, PageSkeleton, Tabs } from "@/components/ui/misc";
import { useAllTopics } from "@/features/admin/hooks";
import { EmptyRow, StatusBadge, TableWrap, Td, Th, Toolbar } from "@/features/admin/ui";
import { api } from "@/lib/api/client";
import type { ContentHealth } from "@/lib/api/types";

/**
 * There is no list endpoint for visualizations; a topic lacks one exactly when
 * Content health lists "Visual" among its missing items.
 */
export default function VisualizationsPage() {
  const topics = useAllTopics();
  const health = useQuery({ queryKey: ["admin", "content-health"], queryFn: () => api.get<ContentHealth>("/admin/content-health") });
  const [filter, setFilter] = useState<"all" | "with" | "without">("all");
  const [q, setQ] = useState("");
  if (topics.isLoading || health.isLoading) return <PageSkeleton />;
  if (topics.error || health.error) return <ErrorState error={topics.error ?? health.error} retry={() => { topics.refetch(); health.refetch(); }} />;
  const missing = new Set(health.data?.incomplete.filter((r) => r.missing.some((m) => m.label === "Visual")).map((r) => r.id));
  const rows = (topics.data ?? [])
    .filter((t) => t.status !== "ARCHIVED")
    .map((t) => ({ ...t, hasViz: !missing.has(t.id) }))
    .filter((t) => (filter === "all" ? true : filter === "with" ? t.hasViz : !t.hasViz))
    .filter((t) => !q || t.title.toLowerCase().includes(q.toLowerCase()) || t.slug.includes(q.toLowerCase()));
  const withCount = (topics.data ?? []).filter((t) => t.status !== "ARCHIVED" && !missing.has(t.id)).length;

  return (
    <>
      <PageHeader eyebrow="Curriculum" title="Visualizations" description="Step-through animations are data, not code: pick a kind, write the steps, preview live. Open a topic to edit its visual." />
      <div className="rounded-xl border border-border bg-surface">
        <Toolbar>
          <Tabs value={filter} onChange={setFilter} items={[{ value: "all", label: "All" }, { value: "with", label: `Has visual · ${withCount}` }, { value: "without", label: `Missing · ${missing.size}` }]} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter topics" aria-label="Filter topics" className="h-9 max-w-xs" />
        </Toolbar>
        <TableWrap>
          <thead><tr><Th>Topic</Th><Th>Module</Th><Th>Visual</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>
            {rows.length === 0 && <EmptyRow cols={5}>No topics match.</EmptyRow>}
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-surface-2/40">
                <Td><div className="font-medium">{t.title}</div><div className="font-mono text-[11px] text-subtle">{t.slug}</div></Td>
                <Td className="text-xs text-muted"><span className="font-mono text-accent">{t.module.stage.code}</span> {t.module.title}</Td>
                <Td>{t.hasViz ? <Badge tone="accent"><PlaySquare className="size-3" /> configured</Badge> : <Badge tone="warn">missing</Badge>}</Td>
                <Td><StatusBadge status={t.status} /></Td>
                <Td right><Link href={`/admin/topics/${t.id}#visual`} className={buttonClass(t.hasViz ? "ghost" : "secondary", "sm")}>{t.hasViz ? "Edit" : "Create"}</Link></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </>
  );
}
