"use client";
import Link from "next/link";
import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Flag, KeyRound, RotateCcw, ShieldBan, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { ErrorState, PageSkeleton, Stat, Tabs } from "@/components/ui/misc";
import { ConfirmDialog, EmptyRow, fmt, label as human, Panel, StatusBadge, TableWrap, Td, Th, useRole } from "@/features/admin/ui";
import { api } from "@/lib/api/client";
import type { AdminUserDetail, Role } from "@/lib/api/types";
import { formatDate, relativeTime } from "@/lib/utils";

const dt = (v: string | null) => formatDate(v, { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

function ReadinessSpark({ points }: { points: { score: number; createdAt: string }[] }) {
  if (points.length < 2) return <p className="text-sm text-muted">{points.length ? `One snapshot: ${points[0].score}` : "No readiness snapshots yet."}</p>;
  const w = 320;
  const h = 64;
  const x = (i: number) => (i / (points.length - 1)) * (w - 8) + 4;
  const y = (v: number) => h - 4 - (v / 100) * (h - 8);
  const last = points[points.length - 1];
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" role="img" aria-label={`Readiness from ${points[0].score} to ${last.score} over ${points.length} snapshots`} preserveAspectRatio="none">
        <line x1={0} x2={w} y1={y(50)} y2={y(50)} stroke="var(--border)" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" points={points.map((p, i) => `${x(i)},${y(p.score)}`).join(" ")} />
      </svg>
      <figcaption className="mt-1 flex justify-between font-mono text-[11px] text-subtle"><span>{formatDate(points[0].createdAt)} · {points[0].score}</span><span>{formatDate(last.createdAt)} · <span className="text-text">{last.score}</span></span></figcaption>
    </figure>
  );
}

type Confirm = null | { kind: "role"; role: Role } | { kind: "status"; status: "ACTIVE" | "SUSPENDED" } | { kind: "revoke" } | { kind: "reset"; topicId: string; title: string };

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const { me, can } = useRole();
  const [tab, setTab] = useState<"journey" | "attempts" | "builds" | "activity" | "applications">("journey");
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [roleDraft, setRoleDraft] = useState<Role | "">("");
  const [reason, setReason] = useState("");
  const { data: u, error, isLoading, refetch } = useQuery({ queryKey: ["admin", "user", id], queryFn: () => api.get<AdminUserDetail>(`/admin/users/${id}`) });
  const done = (msg: string) => { toast.success(msg); setConfirm(null); setReason(""); qc.invalidateQueries({ queryKey: ["admin"] }); };
  const act = useMutation({
    mutationFn: (c: NonNullable<Confirm>) => {
      if (c.kind === "role") return api.patch(`/admin/users/${id}/role`, { role: c.role });
      if (c.kind === "status") return api.post(`/admin/users/${id}/status`, { status: c.status });
      if (c.kind === "revoke") return api.post(`/admin/users/${id}/revoke-sessions`);
      return api.post(`/admin/users/${id}/reset-topic`, { topicId: c.topicId, reason });
    },
    onSuccess: (_d, c) => done(c.kind === "role" ? "Role changed — their sessions were signed out" : c.kind === "status" ? (c.status === "SUSPENDED" ? "User suspended and signed out" : "User reactivated") : c.kind === "revoke" ? "All sessions revoked" : "Topic progress reset"),
  });

  if (isLoading) return <PageSkeleton />;
  if (error || !u) return <ErrorState error={error} retry={() => refetch()} />;
  const self = me?.id === u.id;
  const latest = u.readiness.at(-1)?.score ?? null;
  const mastered = u.masteries.filter((m) => m.masteredAt).length;
  const flagged = u.quizAttempts.filter((a) => a.flagged).length;
  const profile = Object.entries(u.profile ?? {}).filter(([k, v]) => k !== "userId" && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0));
  const canSuspend = can("ADMIN") && !self && (u.role !== "SUPER_ADMIN" || can("SUPER_ADMIN"));

  return (
    <>
      <Link href="/admin/users" className="mb-2 inline-flex items-center gap-1 text-xs text-muted hover:text-text"><ChevronLeft className="size-3.5" /> Users</Link>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-surface-2 font-semibold uppercase">{u.name.slice(0, 2)}</div>
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold">{u.name}<Badge className="font-mono" tone={u.role === "STUDENT" ? "neutral" : "info"}>{u.role}</Badge><StatusBadge status={u.status} />{self && <Badge>you</Badge>}</h1>
            <p className="text-sm text-muted">{u.email} · {u.googleId ? "Google sign-in" : "Email sign-in"} · joined {formatDate(u.createdAt)} · active {u.lastActiveAt ? relativeTime(u.lastActiveAt) : "never"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {can("SUPER_ADMIN") && (
            <div className="flex items-end gap-1.5">
              <Field label="Role" htmlFor="u-role">
                <Select id="u-role" value={roleDraft || u.role} disabled={self} onChange={(e) => setRoleDraft(e.target.value as Role)} className="h-8 w-36 text-xs">
                  {(["STUDENT", "AUTHOR", "ADMIN", "SUPER_ADMIN"] as Role[]).map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                </Select>
              </Field>
              <Button size="sm" variant="secondary" disabled={self || !roleDraft || roleDraft === u.role} onClick={() => roleDraft && setConfirm({ kind: "role", role: roleDraft })}><KeyRound className="size-3.5" /> Change</Button>
            </div>
          )}
          <Button size="sm" variant="secondary" disabled={!can("ADMIN")} onClick={() => setConfirm({ kind: "revoke" })}>Revoke sessions</Button>
          {u.status === "ACTIVE"
            ? <Button size="sm" variant="danger" disabled={!canSuspend} onClick={() => setConfirm({ kind: "status", status: "SUSPENDED" })}><ShieldBan className="size-3.5" /> Suspend</Button>
            : <Button size="sm" variant="secondary" disabled={!canSuspend} onClick={() => setConfirm({ kind: "status", status: "ACTIVE" })}><ShieldCheck className="size-3.5" /> Reactivate</Button>}
        </div>
      </div>
      {self && <p className="-mt-3 mb-4 text-xs text-subtle">You can&apos;t change your own role or suspend yourself.</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Readiness" value={fmt(latest)} />
        <Stat label="Topics mastered" value={mastered} hint={`${u.masteries.length} started`} />
        <Stat label="Quiz attempts" value={u.quizAttempts.length} hint={flagged ? `${flagged} flagged` : "last 30"} />
        <Stat label="Builds completed" value={u.submissions.filter((s) => s.status === "COMPLETED").length} hint={`${u.projectSubmissions.length} projects`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <Panel title="Profile" bodyClassName="p-4">
            {profile.length ? (
              <dl className="space-y-2 text-xs">
                {profile.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[110px_1fr] gap-2">
                    <dt className="text-subtle">{human(k.replace(/([A-Z])/g, "_$1"))}</dt>
                    <dd className="break-words">{Array.isArray(v) ? v.join(", ") : typeof v === "object" ? <code className="font-mono text-[11px]">{JSON.stringify(v)}</code> : /At$/.test(k) ? formatDate(String(v)) : String(v)}</dd>
                  </div>
                ))}
              </dl>
            ) : <p className="text-sm text-muted">No profile yet.</p>}
          </Panel>
          <Panel title="Readiness history" bodyClassName="p-4"><ReadinessSpark points={u.readiness} /></Panel>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="overflow-x-auto"><Tabs value={tab} onChange={setTab} items={[
            { value: "journey", label: `Journey · ${u.masteries.length}` },
            { value: "attempts", label: `Attempts · ${u.quizAttempts.length}` },
            { value: "builds", label: `Builds · ${u.submissions.length + u.projectSubmissions.length}` },
            { value: "activity", label: "Activity" },
            { value: "applications", label: `Applications · ${u.applications.length}` },
          ]} /></div>

          {tab === "journey" && (
            <Panel title="Topic mastery">
              <TableWrap>
                <thead><tr><Th>Topic</Th><Th>Status</Th><Th right>Best</Th><Th right>Last</Th><Th right>Tries</Th><Th right>Recall</Th><Th>Next review</Th><Th /></tr></thead>
                <tbody>
                  {u.masteries.length === 0 && <EmptyRow cols={8}>No topics started.</EmptyRow>}
                  {u.masteries.map((m) => (
                    <tr key={m.topicId}>
                      <Td>{m.topic.title}<div className="font-mono text-[11px] text-subtle">{m.topic.slug}</div></Td>
                      <Td><Badge tone={m.status === "MASTERED" ? "accent" : m.status === "NEEDS_REVIEW" ? "warn" : "info"} className="font-mono">{m.status}</Badge></Td>
                      <Td right mono>{Math.round(m.bestScore)}</Td>
                      <Td right mono>{fmt(m.lastScore === null ? null : Math.round(m.lastScore))}</Td>
                      <Td right mono>{m.attempts}</Td>
                      <Td right mono>{fmt(m.recallScore === null ? null : Math.round(m.recallScore))}</Td>
                      <Td className="whitespace-nowrap text-xs text-muted">{formatDate(m.nextReviewAt)}</Td>
                      <Td right>{can("SUPER_ADMIN") && <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: "reset", topicId: m.topicId, title: m.topic.title })}><RotateCcw className="size-3.5" /> Reset</Button>}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Panel>
          )}

          {tab === "attempts" && (
            <Panel title="Quiz & test attempts" description="Latest 30">
              <TableWrap>
                <thead><tr><Th>When</Th><Th>Kind</Th><Th>For</Th><Th right>Score</Th><Th>Result</Th><Th right>Integrity</Th><Th right>Events</Th></tr></thead>
                <tbody>
                  {u.quizAttempts.length === 0 && <EmptyRow cols={7}>No attempts.</EmptyRow>}
                  {u.quizAttempts.map((a) => (
                    <tr key={a.id}>
                      <Td className="whitespace-nowrap text-xs text-muted">{dt(a.startedAt)}</Td>
                      <Td><Badge className="font-mono">{a.kind}</Badge></Td>
                      <Td className="text-xs">{a.assessment?.title ?? a.topic?.title ?? "—"}</Td>
                      <Td right mono>{fmt(a.score === null ? null : Math.round(a.score), "%")}</Td>
                      <Td>{a.passed === null ? <span className="text-xs text-subtle">in progress</span> : a.passed ? <Badge tone="accent">passed</Badge> : <Badge tone="danger">failed</Badge>}{a.flagged && <Badge tone="warn" className="ml-1"><Flag className="size-3" /> flagged</Badge>}</Td>
                      <Td right mono>{fmt(a.integrityScore)}</Td>
                      <Td right mono>{a._count.integrityEvents}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Panel>
          )}

          {tab === "builds" && (
            <>
              <Panel title="Build task submissions">
                <TableWrap>
                  <thead><tr><Th>Task</Th><Th>Lang</Th><Th>Status</Th><Th right>Tests</Th><Th right>Hints</Th><Th right>Independence</Th><Th right>Score</Th><Th>Updated</Th></tr></thead>
                  <tbody>
                    {u.submissions.length === 0 && <EmptyRow cols={8}>No builds.</EmptyRow>}
                    {u.submissions.map((s) => (
                      <tr key={s.id}>
                        <Td>{s.buildTask.title}</Td><Td className="font-mono text-xs">{s.language}</Td><Td><Badge className="font-mono">{s.status}</Badge></Td>
                        <Td right mono>{s.passedCount}/{s.totalCount}</Td><Td right mono>{s.hintsUsed}</Td>
                        <Td right mono>{fmt(s.independenceScore === null ? null : Math.round(s.independenceScore))}</Td>
                        <Td right mono>{fmt(s.projectScore === null ? null : Math.round(s.projectScore))}</Td>
                        <Td className="whitespace-nowrap text-xs text-muted">{relativeTime(s.updatedAt)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              </Panel>
              <Panel title="Ladder projects">
                <TableWrap>
                  <thead><tr><Th>Project</Th><Th>Repo</Th><Th right>Explain</Th><Th right>Independence</Th><Th>Submitted</Th></tr></thead>
                  <tbody>
                    {u.projectSubmissions.length === 0 && <EmptyRow cols={5}>No projects.</EmptyRow>}
                    {u.projectSubmissions.map((p) => (
                      <tr key={p.id}>
                        <Td>{p.project.title}</Td>
                        <Td><a href={p.repoUrl} target="_blank" rel="noreferrer noopener" className="font-mono text-xs text-accent underline-offset-2 hover:underline">{p.repoUrl.replace(/^https?:\/\//, "")}</a></Td>
                        <Td right mono>{Math.round(p.explainScore)}</Td><Td right mono>{Math.round(p.independenceScore)}</Td>
                        <Td className="text-xs text-muted">{formatDate(p.createdAt)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              </Panel>
            </>
          )}

          {tab === "activity" && (
            <Panel title="Learning events" description="Latest 50">
              <ol className="divide-y divide-border/60">
                {u.events.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No events.</li>}
                {u.events.map((ev) => (
                  <li key={ev.id} className="flex flex-wrap items-center gap-3 px-4 py-2 text-xs">
                    <span className="w-32 shrink-0 font-mono text-subtle">{dt(ev.createdAt)}</span>
                    <Badge className="font-mono">{ev.type}</Badge>
                    {ev.meta != null && <code className="truncate font-mono text-[11px] text-muted">{JSON.stringify(ev.meta).slice(0, 140)}</code>}
                  </li>
                ))}
              </ol>
            </Panel>
          )}

          {tab === "applications" && (
            <Panel title="Job applications">
              <TableWrap>
                <thead><tr><Th>Company</Th><Th>Role</Th><Th>Status</Th><Th>Round</Th><Th>Applied</Th><Th>Result</Th></tr></thead>
                <tbody>
                  {u.applications.length === 0 && <EmptyRow cols={6}>No applications tracked.</EmptyRow>}
                  {u.applications.map((a) => (
                    <tr key={a.id}><Td>{a.company}</Td><Td>{a.role}</Td><Td><Badge className="font-mono">{a.status}</Badge></Td><Td className="text-xs">{a.round ?? "—"}</Td><Td className="text-xs text-muted">{formatDate(a.appliedAt)}</Td><Td className="text-xs">{a.result ?? "—"}</Td></tr>
                  ))}
                </tbody>
              </TableWrap>
            </Panel>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm?.kind === "role"} onClose={() => setConfirm(null)} title="Change role?" confirmLabel="Change role" loading={act.isPending}
        onConfirm={() => confirm && act.mutate(confirm)}
        description={confirm?.kind === "role" && <>Change <strong className="text-text">{u.name}</strong> from <span className="font-mono">{u.role}</span> to <span className="font-mono">{confirm.role}</span>? They&apos;ll be signed out everywhere and the change is audit-logged.</>}
      />
      <ConfirmDialog
        open={confirm?.kind === "status"} onClose={() => setConfirm(null)} tone={confirm?.kind === "status" && confirm.status === "SUSPENDED" ? "danger" : "primary"}
        title={confirm?.kind === "status" && confirm.status === "SUSPENDED" ? "Suspend this user?" : "Reactivate this user?"}
        confirmLabel={confirm?.kind === "status" && confirm.status === "SUSPENDED" ? "Suspend" : "Reactivate"} loading={act.isPending} onConfirm={() => confirm && act.mutate(confirm)}
        description={confirm?.kind === "status" && confirm.status === "SUSPENDED" ? "They are signed out immediately and can't log in until reactivated. Their data is kept." : "They'll be able to log in again."}
      />
      <ConfirmDialog open={confirm?.kind === "revoke"} onClose={() => setConfirm(null)} title="Revoke all sessions?" confirmLabel="Revoke" loading={act.isPending} onConfirm={() => confirm && act.mutate(confirm)} description="Signs the user out on every device. Their account stays active." />
      <ConfirmDialog
        open={confirm?.kind === "reset"} onClose={() => setConfirm(null)} tone="danger" title={`Reset progress on “${confirm?.kind === "reset" ? confirm.title : ""}”?`} confirmLabel="Reset progress"
        loading={act.isPending} disabled={reason.trim().length < 5} onConfirm={() => confirm && act.mutate(confirm)}
        description="Deletes this topic's mastery record so the learner must re-earn it. Quiz attempt history is kept. The reason is stored in the audit log."
      >
        <Field label="Reason (required, ≥ 5 characters)" htmlFor="reset-reason"><Textarea id="reset-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="e.g. Confirmed answer sharing after review with the learner" /></Field>
      </ConfirmDialog>
    </>
  );
}
