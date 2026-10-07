"use client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import type { AdminExplainQ } from "@/lib/api/types";
import { useAllTopics } from "./hooks";
import { move, RowControls, TagInput } from "./ui";

export function TopicSelect({ id, value, onChange, optional, disabled }: { id?: string; value: string; onChange: (v: string) => void; optional?: boolean; disabled?: boolean }) {
  const topics = useAllTopics();
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <option value="">{optional ? "No topic" : "Choose a topic…"}</option>
      {topics.data?.map((t) => <option key={t.id} value={t.id}>{t.module.stage.code} · {t.title}</option>)}
      {!topics.data && value && <option value={value}>Loading…</option>}
    </Select>
  );
}

/** "Explain your solution" questions graded by keywords. */
export function ExplainEditor({ value, onChange, max, error }: { value: AdminExplainQ[]; onChange: (v: AdminExplainQ[]) => void; max: number; error?: string }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1.5 text-xs font-medium text-muted">Explain questions <span className="font-mono text-subtle">({value.length}/{max}, ≥1)</span></legend>
      {value.map((q, i) => (
        <div key={i} className="space-y-1.5 rounded-lg border border-border p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-5 shrink-0 text-right font-mono text-[10px] text-subtle">{i + 1}</span>
            <Input value={q.question} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} placeholder="Why did you choose…?" aria-label={`Explain question ${i + 1}`} className="h-9" />
            <RowControls index={i} count={value.length} onMove={(d) => onChange(move(value, i, d))} onRemove={() => onChange(value.filter((_, j) => j !== i))} labelText={`explain question ${i + 1}`} />
          </div>
          <div className="pl-6"><TagInput value={q.keywords} onChange={(k) => onChange(value.map((x, j) => (j === i ? { ...x, keywords: k } : x)))} max={10} placeholder="keywords the answer should mention (a|b for alternatives)" /></div>
        </div>
      ))}
      {value.length < max && <Button type="button" size="sm" variant="ghost" onClick={() => onChange([...value, { question: "", keywords: [] }])}><Plus className="size-3.5" /> Add question</Button>}
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </fieldset>
  );
}
