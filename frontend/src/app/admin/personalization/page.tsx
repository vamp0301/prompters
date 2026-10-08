"use client";
import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Info, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { EmptyRow, Panel, TableWrap, Td, Th } from "@/features/admin/ui";
import { api, qs } from "@/lib/api/client";
import type { PersonalDebug, PersonalDebugRec } from "@/lib/api/types";
import { cn, formatDate } from "@/lib/utils";

type StudentHit = { id: string; name: string; email: string; lastActiveAt: string | null };

const pct = (x: number | null | undefined) => (x === null || x === undefined ? "—" : `${Math.round(x * 100)}%`);
const num = (x: number | null | undefined, d = 2) => (x === null || x === undefined ? "—" : x.toFixed(d));

const OUTCOME_TONE: Record<string, "accent" | "warn" | "danger" | "info" | "neutral"> = { SUCCESS: "accent", NO_IMPROVEMENT: "warn", ABANDONED: "danger", NOT_ACTED_ON: "neutral", STARTED: "info", PENDING: "neutral" };

/** ADMIN: what the engine believes about one student, and why it recommends what it does. Every lookup is audited. */
export default function PersonalizationDebugPage() {
  const uid = useId();
  const [q, setQ] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const hits = useQuery({ queryKey: ["admin", "personalization", "students", q], queryFn: () => api.get<StudentHit[]>(`/admin/personalization/students${qs({ q })}`) });
  const debug = useQuery({ queryKey: ["admin", "personalization", "student", studentId], queryFn: () => api.get<PersonalDebug>(`/admin/personalization/students/${studentId}`), enabled: !!studentId });

  return (
    <>
      <PageHeader eyebrow="People" title="Personalization debug" description="Skill state, ranker, scores, reasons and outcomes for one student. Read-only; each lookup is recorded in the audit log." />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Panel title="Student" bodyClassName="p-3 space-y-3">
          <Field label="Search by email or name" htmlFor={`${uid}-q`}>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" aria-hidden />
              <Input id={`${uid}-q`} value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" placeholder="riya@…" />
            </div>
          </Field>
          <ul className="space-y-1" aria-label="Students">
            {(hits.data ?? []).map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => setStudentId(s.id)} aria-pressed={studentId === s.id} className={cn("w-full rounded-md px-2 py-1.5 text-left text-sm", studentId === s.id ? "bg-accent-soft text-accent" : "hover:bg-surface-2")}>
                  <span className="block truncate font-medium">{s.name}</span>
                  <span className="block truncate text-[11px] text-muted">{s.email}</span>
                </button>
              </li>
            ))}
            {hits.data && !hits.data.length && <li className="text-sm text-muted">No students match.</li>}
          </ul>
        </Panel>

        <div className="min-w-0 space-y-4">
          {!studentId ? (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">Pick a student to see what the engine knows about them.</p>
          ) : debug.isLoading ? (
            <PageSkeleton />
          ) : debug.error || !debug.data ? (
            <ErrorState error={debug.error} retry={() => debug.refetch()} />
          ) : (
            <Debug d={debug.data} />
          )}
        </div>
      </div>
    </>
  );
}

function Debug({ d }: { d: PersonalDebug }) {
  const e = d.ranker.current;
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Current ranker" bodyClassName="p-4 space-y-1.5 text-sm">
          <p className="font-mono text-lg font-semibold">{e ? (e.mode === "ml" ? "ML" : "BASELINE") : "—"}</p>
          <p>
            Model: <span className="font-mono">{e ? `${e.modelName}@${e.modelVersion}` : "—"}</span>
          </p>
          <p>
            Status: <span className="font-mono">{e?.modelStatus ?? "—"}</span>
          </p>
          <p>
            Arm: <span className="font-mono">{d.ranker.arm}</span> <span className="text-muted">({d.ranker.mlTrafficPercent}% of students in the ML arm)</span>
          </p>
          <p>ML service: {d.ranker.mlConfigured ? "configured" : "not configured"}</p>
          <p className="text-muted">
            Last training: {d.ranker.latestTraining ? `${d.ranker.latestTraining.status} · ${d.ranker.latestTraining.datasetSize} rows · ${formatDate(d.ranker.latestTraining.startedAt)}` : "never"}
          </p>
        </Panel>
        <Panel title="Difficulty" bodyClassName="p-4 text-sm space-y-1.5">
          {d.difficulty ? (
            <>
              <p className="font-mono text-lg font-semibold">{(d.difficulty.level ?? "—").toUpperCase()}</p>
              <p>
                Status: <span className="font-mono">{d.difficulty.status}</span> · trend <span className="font-mono">{d.difficulty.trend}</span>
              </p>
              <p>Confidence: {num(d.difficulty.confidence)}</p>
              <p className="text-muted">{d.difficulty.model}</p>
            </>
          ) : (
            <p className="text-muted">Not computed yet.</p>
          )}
        </Panel>
        <Panel title="Last interview" bodyClassName="p-4 text-sm">
          {d.interviewProgress.interviews === 0 ? (
            <p className="text-muted">No interviews yet.</p>
          ) : (
            <ul className="space-y-1">
              {d.interviewProgress.skills.slice(0, 6).map((s) => (
                <li key={s.skill} className="flex justify-between gap-2">
                  <span className="truncate">{s.label}</span>
                  <span className="font-mono tabular-nums">
                    {s.previous !== null && <span className="text-muted">{pct(s.previous)} → </span>}
                    {pct(s.latest)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Next recommendation" bodyClassName="p-4">
        {d.next ? <RecDetail r={d.next} /> : <p className="text-sm text-muted">No active recommendation.</p>}
      </Panel>

      <Panel title="Skill state" description={`${d.skillState.length} concepts`} bodyClassName="p-0">
        <TableWrap>
          <thead>
            <tr>
              <Th>Concept</Th>
              <Th>Mastery</Th>
              <Th right>Confidence</Th>
              <Th right>Forgetting</Th>
              <Th right>Evidence</Th>
              <Th right>Interview</Th>
              <Th>Next review</Th>
            </tr>
          </thead>
          <tbody>
            {d.skillState.length ? (
              d.skillState.map((s) => (
                <tr key={s.conceptId}>
                  <Td>
                    <span className="font-medium">{s.label}</span> <span className="font-mono text-[11px] text-subtle">{s.conceptId}</span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Progress value={s.mastery * 100} label={`${s.label} mastery`} className="w-24" />
                      <span className="font-mono text-[12px] tabular-nums">{pct(s.mastery)}</span>
                    </div>
                  </Td>
                  <Td right mono>{num(s.confidence)}</Td>
                  <Td right mono>{num(s.forgettingRisk)}</Td>
                  <Td right mono>{s.attempts}</Td>
                  <Td right mono>{pct(s.interviewAverage)}</Td>
                  <Td mono>{s.nextReview ? formatDate(s.nextReview) : "—"}</Td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={7}>No skill state yet (the student hasn&apos;t opened their dashboard since personalization launched).</EmptyRow>
            )}
          </tbody>
        </TableWrap>
      </Panel>

      <RecTable title="Active recommendations" rows={d.active} />
      <RecTable title="Resolved outcomes" rows={d.resolved} resolved />
    </>
  );
}

function RecDetail({ r }: { r: PersonalDebugRec }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
      <div className="space-y-2 text-sm">
        <p className="font-display text-xl">{r.subject}</p>
        <p className="text-muted">
          {r.actionLabel} · {r.title}
        </p>
        <p>{r.why}</p>
        <ul className="space-y-0.5" aria-label="Reasons">
          {r.reasons.map((x) => (
            <li key={x.code} className="flex items-center gap-1.5">
              <Check className="size-3.5 text-accent" aria-hidden /> {x.label} <span className="font-mono text-[11px] text-subtle">{x.code}</span>
            </li>
          ))}
        </ul>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:min-w-56">
        <dt className="text-muted">Score</dt>
        <dd className="font-mono tabular-nums">{num(r.score, 3)}</dd>
        <dt className="text-muted">Baseline</dt>
        <dd className="font-mono tabular-nums">{num(r.baselineScore, 3)}</dd>
        <dt className="text-muted">Priority</dt>
        <dd>{r.priority}</dd>
        <dt className="text-muted">Outcome</dt>
        <dd>
          <Badge tone={OUTCOME_TONE[r.outcome] ?? "neutral"}>{r.outcome}</Badge>
        </dd>
        <dt className="text-muted">Model</dt>
        <dd className="font-mono text-[12px]">
          {r.modelName}@{r.modelVersion}
        </dd>
        <dt className="text-muted">Arm</dt>
        <dd className="font-mono text-[12px]">{r.arm ?? "—"}</dd>
      </dl>
      {r.features && (
        <details className="md:col-span-2">
          <summary className="cursor-pointer text-sm text-muted">Features</summary>
          <pre tabIndex={0} className="mt-2 overflow-x-auto rounded-md bg-surface-2 p-3 font-mono text-[12px]">{JSON.stringify(r.features, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

function RecTable({ title, rows, resolved }: { title: string; rows: PersonalDebugRec[]; resolved?: boolean }) {
  return (
    <Panel title={title} description={`${rows.length}`} bodyClassName="p-0">
      <TableWrap>
        <thead>
          <tr>
            <Th>#</Th>
            <Th>Recommendation</Th>
            <Th right>Score</Th>
            <Th>Reasons</Th>
            <Th>Model / arm</Th>
            <Th>{resolved ? "Outcome & signals" : "Outcome"}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r) => (
              <tr key={r.id}>
                <Td mono>{resolved ? "" : r.rank}</Td>
                <Td>
                  <span className="font-medium">{r.actionLabel}</span>: {r.subject}
                  {r.shownAt && <span className="block text-[11px] text-muted">shown {formatDate(r.shownAt)}</span>}
                </Td>
                <Td right mono>{num(r.score, 3)}</Td>
                <Td className="text-[12px]">{r.reasons.map((x) => x.label).join(" · ")}</Td>
                <Td className="font-mono text-[11px]">
                  {r.modelName}@{r.modelVersion}
                  <br />
                  {r.arm ?? "—"}
                </Td>
                <Td className="text-[12px]">
                  <Badge tone={OUTCOME_TONE[r.outcome] ?? "neutral"}>{r.outcome}</Badge>
                  {resolved && r.signals && (
                    <span className="mt-1 block font-mono text-[11px] text-muted">
                      {Object.entries(r.signals)
                        .filter(([, v]) => v !== null && v !== false)
                        .map(([k, v]) => (typeof v === "number" ? `${k} ${v > 0 ? "+" : ""}${v}` : k))
                        .join(" · ")}
                    </span>
                  )}
                </Td>
              </tr>
            ))
          ) : (
            <EmptyRow cols={6}>
              <span className="inline-flex items-center gap-1.5">
                <Info className="size-3.5" aria-hidden /> Nothing yet.
              </span>
            </EmptyRow>
          )}
        </tbody>
      </TableWrap>
    </Panel>
  );
}
