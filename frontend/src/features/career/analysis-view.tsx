"use client";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, NotebookPen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Select, Textarea } from "@/components/ui/input";
import { ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { Progress, ScoreRing } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { BankQuestion, JobMatchDetail } from "@/lib/api/types";
import { cn, formatDate } from "@/lib/utils";
import { AiUnavailableNotice, useCareerStatus } from "./career-hub";
import { CATEGORY, CATEGORY_ORDER, LEVEL_LABEL, RISK, ResultBadge, SEVERITY_TONE, careerKeys, scoreTone } from "./shared";
import { StartInterviewDialog } from "./start-interview-dialog";

const BREAKDOWN: { key: keyof JobMatchDetail["breakdown"]; label: string }[] = [
  { key: "requiredSkills", label: "Required Skills" },
  { key: "technicalStack", label: "Technical Stack" },
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
  { key: "keywords", label: "Keywords" },
  { key: "responsibilities", label: "Responsibilities Match" },
  { key: "education", label: "Education" },
];

export function AnalysisView({ id }: { id: string }) {
  const status = useCareerStatus();
  const { data, error, isLoading, refetch } = useQuery({ queryKey: careerKeys.analysis(id), queryFn: () => api.get<JobMatchDetail>(`/career/analyses/${id}`) });
  const [startOpen, setStartOpen] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const m = data!;
  const available = !!status.data?.available;
  const inProgress = m.sessions.find((s) => s.status === "IN_PROGRESS");

  const startButton = inProgress ? (
    <Link href={`/career/live/${inProgress.id}`} className={buttonClass("primary", "md")}>
      Resume interview in progress
    </Link>
  ) : (
    <Button onClick={() => setStartOpen(true)} disabled={!available}>
      🎤 Start AI Technical Interview
    </Button>
  );

  return (
    <div className="space-y-6">
      <Link href="/career" className="inline-flex items-center gap-1 text-xs text-muted hover:text-text">
        <ArrowLeft className="size-3.5" aria-hidden /> Career AI
      </Link>
      <PageHeader
        eyebrow="Job match"
        title={m.job.title}
        description={
          <>
            {m.job.company ? `${m.job.company} · ` : ""}Resume: {m.resume.label} · Analysed {formatDate(m.createdAt)}
          </>
        }
        actions={startButton}
      />
      {status.data && !available && <AiUnavailableNotice />}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card>
          <CardBody className="flex flex-col items-center gap-3 text-center">
            <h2 className="text-sm font-semibold">Your Resume Match for this Job</h2>
            <ScoreRing value={m.score} size={170} stroke={12} label="Job-match score" sub="match" />
            <div className="text-sm font-medium">{m.job.title}</div>
            <p className="text-xs text-muted">The overall score is a weighted average of the seven categories, computed by code — not guessed by the AI.</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Score breakdown" description="Category score and its weight in the overall match." />
          <CardBody>
            <table className="w-full text-sm">
              <caption className="sr-only">Job-match breakdown by category</caption>
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th scope="col" className="pb-2 font-medium">Category</th>
                  <th scope="col" className="pb-2 font-medium">Score</th>
                  <th scope="col" className="pb-2 text-right font-medium">Weight</th>
                </tr>
              </thead>
              <tbody>
                {BREAKDOWN.map(({ key, label }) => {
                  const v = Math.round(m.breakdown[key] ?? 0);
                  return (
                    <tr key={key} className="border-t border-border">
                      <th scope="row" className="py-2 pr-3 text-left font-normal">{label}</th>
                      <td className="w-1/2 py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="w-9 font-mono text-xs tabular-nums">{v}%</span>
                          <Progress value={v} tone={scoreTone(v)} label={`${label} ${v}%`} />
                        </div>
                      </td>
                      <td className="py-2 text-right font-mono text-xs text-muted tabular-nums">{m.weights[key] ?? "—"}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Strong match" description="What the job asks for and your resume clearly shows." />
          <CardBody className="flex flex-wrap gap-1.5">
            {m.strong.length ? m.strong.map((s) => <Badge key={s} tone="accent">✓ {s}</Badge>) : <p className="text-sm text-muted">Nothing stood out as a strong match.</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Missing / weak match" description="Required by the job but missing or thin on your resume." />
          <CardBody className="flex flex-wrap gap-1.5">
            {m.missing.length ? m.missing.map((s) => <Badge key={s} tone="warn">⚠ {s}</Badge>) : <p className="text-sm text-muted">No obvious gaps found.</p>}
          </CardBody>
        </Card>
      </div>

      {m.risks.length > 0 && (
        <Card>
          <CardHeader title="Resume risk" description="Things a reviewer or interviewer is likely to notice." />
          <CardBody>
            <ul className="space-y-2">
              {m.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge tone={SEVERITY_TONE[r.severity]} className="mt-0.5 shrink-0">{r.severity}</Badge>
                  <span>{r.message}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {m.claims.length > 0 && (
        <section aria-labelledby="claims-h" className="space-y-3">
          <div>
            <h2 id="claims-h" className="text-sm font-semibold">Resume claims → Interview risk</h2>
            <p className="text-xs text-muted">Interviewers dig into what you claim. Be ready to explain each of these in depth.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {m.claims.map((c) => {
              const linked = m.questions.filter((q) => q.claimId === c.id);
              return (
                <Card key={c.id}>
                  <CardBody className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">“{c.claim}”</p>
                      <Badge tone={RISK[c.risk].tone} className="shrink-0">{RISK[c.risk].label}</Badge>
                    </div>
                    <p className="text-xs text-muted">{c.why}</p>
                    {c.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.skills.map((s) => <Badge key={s}>{s}</Badge>)}
                      </div>
                    )}
                    {linked.length > 0 && (
                      <ul className="space-y-1 border-t border-border pt-2 text-xs">
                        {linked.map((q) => (
                          <li key={q.id} className="flex gap-1.5">
                            <ChevronRight className="mt-0.5 size-3 shrink-0 text-subtle" aria-hidden />
                            {q.question}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <QuestionBank questions={m.questions} />

      <Card>
        <CardHeader title="Interviews for this match" description="Retake as often as you like — your progress is tracked." action={startButton} />
        <CardBody>
          {!m.sessions.length ? (
            <p className="text-sm text-muted">No interviews yet. When you&apos;re ready, start one — Manisha will pick questions from the bank above.</p>
          ) : (
            <ul className="divide-y divide-border">
              {m.sessions.map((s) => (
                <li key={s.id}>
                  <Link href={s.status === "IN_PROGRESS" ? `/career/live/${s.id}` : `/career/interview/${s.id}`} className="group flex flex-wrap items-center gap-3 py-2.5">
                    <span className="font-mono text-xs text-muted">{formatDate(s.startedAt)}</span>
                    {s.readinessScore !== null && <span className="font-mono text-sm tabular-nums">{s.readinessScore}/100</span>}
                    {s.status === "IN_PROGRESS" ? <Badge tone="info">In progress · Resume</Badge> : <ResultBadge result={s.result} status={s.status} />}
                    <ChevronRight className="ml-auto size-4 text-subtle group-hover:text-accent" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <StartInterviewDialog open={startOpen} onClose={() => setStartOpen(false)} matchId={m.id} interviewer={status.data?.interviewer} />
    </div>
  );
}

function QuestionBank({ questions }: { questions: BankQuestion[] }) {
  const uid = useId();
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [skill, setSkill] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const skills = useMemo(() => [...new Set(questions.map((q) => q.skill))].sort((a, b) => a.localeCompare(b)), [questions]);
  const filtered = questions.filter((q) => (!category || q.category === category) && (!level || q.level === Number(level)) && (!skill || q.skill === skill));
  const groups = CATEGORY_ORDER.map((c) => ({ c, items: filtered.filter((q) => q.category === c) })).filter((g) => g.items.length);

  return (
    <Card>
      <CardHeader title="Your question bank" description={`${questions.length} questions generated from your resume and this job. Practise drafting answers — notes are private and never sent anywhere.`} />
      <CardBody className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Category" htmlFor={`${uid}-c`}>
            <Select id={`${uid}-c`} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{CATEGORY[c].label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Level" htmlFor={`${uid}-l`}>
            <Select id={`${uid}-l`} value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">All levels</option>
              {[1, 2, 3, 4, 5].map((l) => (
                <option key={l} value={l}>{LEVEL_LABEL[l]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Skill" htmlFor={`${uid}-s`}>
            <Select id={`${uid}-s`} value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">All skills</option>
              {skills.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
        <p className="text-xs text-subtle" aria-live="polite">
          Showing {filtered.length} of {questions.length}
        </p>

        {!groups.length && <p className="text-sm text-muted">No questions match these filters.</p>}
        {groups.map(({ c, items }) => (
          <section key={c} aria-labelledby={`${uid}-${c}`} className="space-y-2">
            <h3 id={`${uid}-${c}`} className="flex items-center gap-2 text-sm font-semibold">
              {CATEGORY[c].label}
              <span className="font-mono text-xs font-normal text-subtle">{items.length}</span>
            </h3>
            <ul className="space-y-2">
              {items.map((q) => {
                const isOpen = !!open[q.id];
                return (
                  <li key={q.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm">{q.question}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge tone={CATEGORY[q.category].tone}>{CATEGORY[q.category].label}</Badge>
                      <Badge tone="info">{LEVEL_LABEL[q.level] ?? `L${q.level}`}</Badge>
                      <Badge>{q.skill}</Badge>
                      <button
                        type="button"
                        onClick={() => setOpen((o) => ({ ...o, [q.id]: !isOpen }))}
                        aria-expanded={isOpen}
                        aria-controls={`${uid}-p-${q.id}`}
                        className={cn("ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs", isOpen ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-text")}
                      >
                        <NotebookPen className="size-3.5" aria-hidden /> Practise
                      </button>
                    </div>
                    {q.why && <p className="mt-1.5 text-xs text-muted">Why: {q.why}</p>}
                    {isOpen && (
                      <div id={`${uid}-p-${q.id}`} className="mt-2">
                        <Field label="Private notes (stays on this page, never sent anywhere)" htmlFor={`${uid}-d-${q.id}`}>
                          <Textarea
                            id={`${uid}-d-${q.id}`}
                            value={drafts[q.id] ?? ""}
                            onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                            placeholder="Draft how you'd answer this out loud…"
                          />
                        </Field>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </CardBody>
    </Card>
  );
}
