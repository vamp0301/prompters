"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import type { AdminQuestion, AdminTopicDetail } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { QuestionDialog } from "../question-editor";
import { EmptyRow, Panel, StatusBadge, TableWrap, Td, Th } from "../ui";

export function QuestionsTab({ topic }: { topic: AdminTopicDetail }) {
  const [editing, setEditing] = useState<AdminQuestion | "new" | null>(null);
  const published = topic.questions.filter((q) => q.status === "PUBLISHED").length;
  const target = topic.quizSize * 3;
  const pct = Math.min(100, Math.round((published / target) * 100));
  const byType = topic.questions.reduce<Record<string, number>>((a, q) => ({ ...a, [q.type]: (a[q.type] ?? 0) + 1 }), {});

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span>Published pool <span className="font-mono font-semibold tabular-nums">{published}</span><span className="text-muted"> / {target} target (quiz size {topic.quizSize} × 3)</span></span>
            <span className={cn("text-xs", published >= target ? "text-accent" : published >= topic.quizSize ? "text-warn" : "text-danger")}>
              {published >= target ? "Healthy pool" : published >= topic.quizSize ? "Enough to publish — repeats likely on retakes" : `Need ${topic.quizSize - published} more to publish`}
            </span>
          </div>
          <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Question pool vs target">
            <div className={cn("h-full rounded-full", published >= target ? "bg-accent" : published >= topic.quizSize ? "bg-warn" : "bg-danger")} style={{ width: `${pct}%` }} />
            <span aria-hidden className="absolute top-0 h-full w-px bg-text/60" style={{ left: `${(topic.quizSize / target) * 100}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">{Object.entries(byType).map(([t, n]) => <Badge key={t} className="font-mono">{t} {n}</Badge>)}</div>
        </div>
        <Button onClick={() => setEditing("new")}><Plus className="size-4" /> New question</Button>
      </div>
      <Panel title={`Questions · ${topic.questions.length}`} description="All statuses. Only published questions are drawn into quizzes." action={<Link href="/admin/questions" className="text-xs text-muted hover:text-text">Question bank <ArrowRight className="inline size-3" /></Link>}>
        <TableWrap>
          <thead><tr><Th>Prompt</Th><Th>Type</Th><Th right>Diff</Th><Th right>Pts</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>
            {topic.questions.length === 0 && <EmptyRow cols={6}>No questions yet.</EmptyRow>}
            {topic.questions.map((q) => (
              <tr key={q.id} className="hover:bg-surface-2/40">
                <Td><span className="line-clamp-2 max-w-xl">{q.prompt}</span></Td>
                <Td><Badge className="font-mono">{q.type}</Badge></Td>
                <Td right mono>{q.difficulty}</Td>
                <Td right mono>{q.points}</Td>
                <Td><StatusBadge status={q.status} /></Td>
                <Td right><Button size="sm" variant="ghost" onClick={() => setEditing(q)}>Edit</Button></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>
      <QuestionDialog open={editing !== null} onClose={() => setEditing(null)} questionId={editing && editing !== "new" ? editing.id : undefined} question={editing && editing !== "new" ? editing : undefined} topicId={topic.id} />
    </div>
  );
}

export function RelatedTab({ topic }: { topic: AdminTopicDetail }) {
  const groups = [
    { title: "Build tasks", path: "build-tasks", items: topic.buildTasks.map((b) => ({ id: b.id, title: b.title, sub: b.slug, status: b.status })), note: "Optional for publishing." },
    { title: "Prompt cards", path: "prompts", items: topic.promptCards.map((p) => ({ id: p.id, title: p.title, sub: p.slug, status: p.status })), note: "Optional. Unlocked for learners once they master the topic." },
    { title: "Interview questions", path: "interviews", items: topic.interviewQs.map((q) => ({ id: q.id, title: q.question, sub: "", status: q.status })), note: "At least one published is required to publish." },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {groups.map((g) => (
        <Panel key={g.path} title={`${g.title} · ${g.items.length}`} description={g.note} action={<Link href={`/admin/${g.path}?new=1&topicId=${topic.id}`} className={buttonClass("secondary", "sm")}><Plus className="size-3.5" /> New</Link>}>
          <ul className="divide-y divide-border/60">
            {g.items.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">None yet.</li>}
            {g.items.map((it) => (
              <li key={it.id}>
                <Link href={`/admin/${g.path}?edit=${it.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2/40">
                  <div className="min-w-0 flex-1"><div className="line-clamp-2 text-sm">{it.title}</div>{it.sub && <div className="font-mono text-[11px] text-subtle">{it.sub}</div>}</div>
                  <StatusBadge status={it.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
