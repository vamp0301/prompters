"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { buttonClass } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ErrorState, PageHeader, PageSkeleton, Stat } from "@/components/ui/misc";
import { EmptyRow, Meter, StatusBadge, TableWrap, Td, Th, Toolbar } from "@/features/admin/ui";
import { api } from "@/lib/api/client";
import type { TranslationRow } from "@/lib/api/types";

const LOCALES = [
  { key: "hinglish", label: "Hinglish", required: true },
  { key: "en", label: "English", required: true },
  { key: "hi", label: "Hindi", required: false },
];

export default function TranslationsPage() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["admin", "translations"], queryFn: () => api.get<TranslationRow[]>("/admin/translations") });
  const [missing, setMissing] = useState("");
  const [q, setQ] = useState("");
  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} retry={() => refetch()} />;
  const rows = data
    .filter((r) => !missing || (r.coverage[missing] ?? 0) < 100)
    .filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()) || r.slug.includes(q.toLowerCase()));
  const avg = (k: string) => (data.length ? Math.round(data.reduce((a, r) => a + (r.coverage[k] ?? 0), 0) / data.length) : 0);
  const complete = (k: string) => data.filter((r) => (r.coverage[k] ?? 0) === 100).length;

  return (
    <>
      <PageHeader eyebrow="Localisation" title="Translations" description="Per-topic coverage of the 10 sections in each language. Hinglish and English are required to publish; Hindi falls back to English for students." />
      <div className="grid grid-cols-3 gap-3">
        {LOCALES.map((l) => <Stat key={l.key} label={`${l.label}${l.required ? "" : " · optional"}`} value={`${avg(l.key)}%`} hint={`${complete(l.key)} / ${data.length} topics complete`} />)}
      </div>
      <div className="mt-6 rounded-xl border border-border bg-surface">
        <Toolbar>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter topics" aria-label="Filter topics" className="h-9 max-w-xs" />
          <Select value={missing} onChange={(e) => setMissing(e.target.value)} aria-label="Missing language filter" className="h-9 w-48">
            <option value="">All topics</option>
            {LOCALES.map((l) => <option key={l.key} value={l.key}>Missing {l.label}</option>)}
          </Select>
          <span className="ml-auto font-mono text-xs text-subtle">{rows.length} topics</span>
        </Toolbar>
        <TableWrap>
          <thead><tr><Th>Topic</Th><Th>Status</Th>{LOCALES.map((l) => <Th key={l.key}>{l.label}</Th>)}<Th /></tr></thead>
          <tbody>
            {rows.length === 0 && <EmptyRow cols={6}>Nothing missing here.</EmptyRow>}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface-2/40">
                <Td><div className="font-medium">{r.title}</div><div className="font-mono text-[11px] text-subtle">{r.slug}</div></Td>
                <Td><StatusBadge status={r.status} /></Td>
                {LOCALES.map((l) => <Td key={l.key}><Meter value={r.coverage[l.key] ?? 0} tone={(r.coverage[l.key] ?? 0) === 100 ? "accent" : l.required ? "danger" : "warn"} /></Td>)}
                <Td right><Link href={`/admin/topics/${r.id}#content`} className={buttonClass("ghost", "sm")}>Edit content</Link></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </>
  );
}
