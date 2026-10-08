"use client";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, BriefcaseBusiness, ChevronRight, FileText, Loader2, Mic, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/input";
import { EmptyState, ErrorState, PageHeader, Skeleton, Tabs } from "@/components/ui/misc";
import { ProjectsList } from "./projects/projects-list";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { CareerAnalysisItem, CareerJob, CareerResume, CareerSessionItem, CareerStatus } from "@/lib/api/types";
import { cn, formatDate } from "@/lib/utils";
import { ScoreHistoryChart } from "@/features/readiness/score-history-chart";
import { DocumentForm } from "./document-form";
import { PrepPlansCard, PrepStartCard } from "./prep/prep-start-card";
import { AI_UNAVAILABLE_COPY, careerKeys, ConfirmButton, InlineError, ResultBadge, scoreTone } from "./shared";
import { StartInterviewDialog } from "./start-interview-dialog";
import { TARGET_ROLES } from "@/features/marketing/start-preparing";


export function useCareerStatus() {
  return useQuery({ queryKey: careerKeys.status, queryFn: () => api.get<CareerStatus>("/career/status") });
}

export function AiUnavailableNotice({ reason }: { reason?: "NO_PROVIDER" | "FEATURE_DISABLED" | null }) {
  return (
    <div role="status" className="flex items-start gap-2 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        {reason === "FEATURE_DISABLED" ? "AI interviews aren't enabled for your account yet." : AI_UNAVAILABLE_COPY} <span className="text-muted">You can still view your past analyses and interviews.</span>
      </p>
    </div>
  );
}

export function CareerHub() {
  const status = useCareerStatus();
  const disabled = !status.data?.available;
  const params = useSearchParams();
  const initial = params.get("tab");
  const [tab, setTab] = useState<"prep" | "interview" | "projects" | "match">(initial === "interview" || initial === "match" || initial === "projects" ? initial : "prep");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Career AI"
        title="Don't prepare for interviews. Prepare for YOUR interview."
        description="Upload your resume once. Get the 100 technical questions you're most likely to face — built from your projects, skills, claims and achievements — then practise them and download your personal interview pack."
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "prep", label: "Top 100 prep" },
          { value: "interview", label: "AI interview" },
          { value: "projects", label: "My projects" },
          { value: "match", label: "Job match" },
        ]}
      />

      {status.isLoading ? <Skeleton className="h-12" /> : status.error ? <ErrorState error={status.error} retry={() => status.refetch()} /> : disabled && <AiUnavailableNotice reason={status.data?.reason} />}

      {tab === "prep" ? (
        <div className="space-y-6">
          <PrepStartCard disabled={disabled} />
          <PrepPlansCard />
        </div>
      ) : tab === "interview" ? (
        <div className="space-y-6">
          <InterviewStartCard disabled={disabled} onNeedResume={() => setTab("match")} />
          <SessionsCard />
        </div>
      ) : tab === "projects" ? (
        <ProjectsList />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted">Match a resume to a real job description. From an analysis you can take an interview built around that exact job.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <ResumesCard disabled={disabled} />
            <JobsCard disabled={disabled} />
          </div>
          <AnalyseCard disabled={disabled} />
          <AnalysesCard />
        </div>
      )}
    </div>
  );
}

function topSkills(r: CareerResume) {
  const s = r.parsed?.skills ?? {};
  return [...(s.languages ?? []), ...(s.frameworks ?? []), ...(s.databases ?? []), ...(s.cloud ?? []), ...(s.devops ?? []), ...(s.other ?? [])].slice(0, 6);
}

function ResumesCard({ disabled }: { disabled: boolean }) {
  const qc = useQueryClient();
  const { data, error, isLoading, refetch } = useQuery({ queryKey: careerKeys.resumes, queryFn: () => api.get<CareerResume[]>("/career/resumes") });
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/career/resumes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["career"] }),
  });
  return (
    <Card id="resumes" className="scroll-mt-20">
      <CardHeader title="1 · Resumes" description="Upload a PDF/TXT or paste your resume. AI extracts your skills, projects and claims." />
      <CardBody className="space-y-4">
        <DocumentForm kind="resume" disabled={disabled} />
        <div className="border-t border-border pt-4">
          {isLoading ? (
            <Skeleton className="h-16" />
          ) : error ? (
            <ErrorState error={error} retry={() => refetch()} />
          ) : !data?.length ? (
            <p className="text-sm text-muted">No resumes yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.map((r) => (
                <li key={r.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.label}</div>
                    <div className="text-xs text-subtle">Added {formatDate(r.createdAt)}</div>
                    {topSkills(r).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {topSkills(r).map((s) => (
                          <Badge key={s}>{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <ConfirmButton
                    label={<span className="sr-only sm:not-sr-only">Delete</span>}
                    icon={<Trash2 className="size-3.5" aria-hidden />}
                    ariaLabel={`Delete resume ${r.label}`}
                    title="Delete this resume?"
                    body={<p>This also deletes every job-match analysis and interview (including recordings) made from <strong className="text-text">{r.label}</strong>. This can&apos;t be undone.</p>}
                    loading={del.isPending && del.variables === r.id}
                    onConfirm={() => del.mutate(r.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function JobsCard({ disabled }: { disabled: boolean }) {
  const qc = useQueryClient();
  const { data, error, isLoading, refetch } = useQuery({ queryKey: careerKeys.jobs, queryFn: () => api.get<CareerJob[]>("/career/jobs") });
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/career/jobs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["career"] }),
  });
  return (
    <Card id="job-descriptions" className="scroll-mt-20">
      <CardHeader title="2 · Job descriptions" description="Paste the job description you're targeting (or upload it). AI extracts required skills and responsibilities." />
      <CardBody className="space-y-4">
        <DocumentForm kind="job" disabled={disabled} />
        <div className="border-t border-border pt-4">
          {isLoading ? (
            <Skeleton className="h-16" />
          ) : error ? (
            <ErrorState error={error} retry={() => refetch()} />
          ) : !data?.length ? (
            <p className="text-sm text-muted">No job descriptions yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.map((j) => (
                <li key={j.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <BriefcaseBusiness className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{j.title}</div>
                    <div className="text-xs text-subtle">
                      {j.company ? `${j.company} · ` : ""}Added {formatDate(j.createdAt)}
                    </div>
                  </div>
                  <ConfirmButton
                    label={<span className="sr-only sm:not-sr-only">Delete</span>}
                    icon={<Trash2 className="size-3.5" aria-hidden />}
                    ariaLabel={`Delete job description ${j.title}`}
                    title="Delete this job description?"
                    body={<p>This also deletes every analysis and interview (including recordings) made for <strong className="text-text">{j.title}</strong>. This can&apos;t be undone.</p>}
                    loading={del.isPending && del.variables === j.id}
                    onConfirm={() => del.mutate(j.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

const ANALYSIS_STEPS = [
  "Reading your resume profile…",
  "Comparing it with the job requirements…",
  "Scoring 7 match categories…",
  "Finding resume claims an interviewer will probe…",
  "Writing your personalised question bank…",
  "Almost there — finalising the report…",
];

/** Rendered only while the analysis request is pending; state updates come from the interval callback. */
function AnalysingProgress() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const step = Math.min(ANALYSIS_STEPS.length - 1, Math.floor(elapsed / 6));
  return (
    <div role="status" aria-live="polite" className="space-y-2 rounded-lg border border-border bg-surface-2/50 p-3">
      <ol className="space-y-1 text-xs">
        {ANALYSIS_STEPS.map((s, i) => (
          <li key={s} className={cn("flex items-center gap-2", i < step ? "text-subtle line-through" : i === step ? "text-text" : "text-subtle/60")}>
            {i === step ? <Loader2 className="size-3 animate-spin text-accent" aria-hidden /> : <span className="inline-block size-3 text-center font-mono text-[10px]">{i < step ? "✓" : "·"}</span>}
            {s}
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">
        This usually takes 20–60 seconds. <span className="font-mono tabular-nums">{elapsed}s</span>
      </p>
    </div>
  );
}

function AnalyseCard({ disabled }: { disabled: boolean }) {
  const uid = useId();
  const router = useRouter();
  const qc = useQueryClient();
  const resumes = useQuery({ queryKey: careerKeys.resumes, queryFn: () => api.get<CareerResume[]>("/career/resumes") });
  const jobs = useQuery({ queryKey: careerKeys.jobs, queryFn: () => api.get<CareerJob[]>("/career/jobs") });
  const [resumeId, setResumeId] = useState("");
  const [jobId, setJobId] = useState("");
  const rId = (resumes.data?.some((r) => r.id === resumeId) ? resumeId : resumes.data?.[0]?.id) ?? "";
  const jId = (jobs.data?.some((j) => j.id === jobId) ? jobId : jobs.data?.[0]?.id) ?? "";

  const analyse = useMutation({
    meta: { silent: true },
    mutationFn: () => api.post<{ id: string }>("/career/analyses", { resumeId: rId, jobId: jId }),
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: careerKeys.analyses });
      router.push(`/career/analysis/${m.id}`);
    },
  });

  const none = !resumes.data?.length || !jobs.data?.length;
  return (
    <Card id="job-match" className="scroll-mt-20">
      <CardHeader title="3 · Analyse a match" description="Pick a resume and a job. You'll get a weighted match score, resume risks and a question bank built from your own claims." />
      <CardBody className="space-y-3">
        {none && !resumes.isLoading && !jobs.isLoading ? (
          <p className="text-sm text-muted">Add at least one resume and one job description above to run an analysis.</p>
        ) : (
          <form
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (rId && jId && !disabled) analyse.mutate();
            }}
          >
            <Field label="Resume" htmlFor={`${uid}-r`}>
              <Select id={`${uid}-r`} value={rId} onChange={(e) => setResumeId(e.target.value)} disabled={analyse.isPending}>
                {resumes.data?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Job description" htmlFor={`${uid}-j`}>
              <Select id={`${uid}-j`} value={jId} onChange={(e) => setJobId(e.target.value)} disabled={analyse.isPending}>
                {jobs.data?.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                    {j.company ? ` — ${j.company}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" disabled={!rId || !jId || disabled} loading={analyse.isPending}>
              {analyse.isPending ? "Analysing…" : "Analyse match"}
            </Button>
          </form>
        )}
        {analyse.isPending && <AnalysingProgress />}
        <InlineError error={analyse.error} />
      </CardBody>
    </Card>
  );
}

function AnalysesCard() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: careerKeys.analyses, queryFn: () => api.get<CareerAnalysisItem[]>("/career/analyses") });
  return (
    <Card>
      <CardHeader title="4 · Your analyses" description="Each analysis has its own question bank and interviews." />
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : error ? (
          <ErrorState error={error} retry={() => refetch()} />
        ) : !data?.length ? (
          <p className="text-sm text-muted">No analyses yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((a) => (
              <li key={a.id}>
                <Link href={`/career/analysis/${a.id}`} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-border font-mono text-sm font-semibold tabular-nums">
                    <span className={cn(scoreTone(a.score) === "accent" ? "text-accent" : scoreTone(a.score) === "warn" ? "text-warn" : "text-danger")}>{a.score}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium group-hover:text-accent">
                      {a.job.title}
                      {a.job.company && <span className="text-muted"> · {a.job.company}</span>}
                    </div>
                    <div className="truncate text-xs text-subtle">
                      {a.resume.label} · {formatDate(a.createdAt)} · {a._count.sessions} interview{a._count.sessions === 1 ? "" : "s"}
                    </div>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-subtle group-hover:text-accent" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function InterviewStartCard({ disabled, onNeedResume }: { disabled: boolean; onNeedResume: () => void }) {
  const uid = useId();
  const status = useCareerStatus();
  const { data: resumes, isLoading } = useQuery({ queryKey: careerKeys.resumes, queryFn: () => api.get<CareerResume[]>("/career/resumes") });
  const [resumeId, setResumeId] = useState("");
  const [role, setRole] = useState("fullstack");
  const [open, setOpen] = useState(false);
  const chosen = resumeId || resumes?.[0]?.id || "";
  const roleLabel = TARGET_ROLES.find((r) => r.key === role)?.label ?? role;

  return (
    <Card className="border-accent/30">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Mic className="size-4 text-accent" aria-hidden /> Interview with Manisha
          </span>
        }
        description="A realistic technical interview built from your resume and target role — one question at a time, follow-ups on what you say, and a detailed report at the end. No job description needed."
      />
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : !resumes?.length ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted">Add your resume first — Manisha asks about your own projects and claims.</span>
            <Button variant="secondary" size="sm" onClick={onNeedResume}>
              Add a resume
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="Resume" htmlFor={`${uid}-resume`}>
              <Select id={`${uid}-resume`} value={chosen} onChange={(e) => setResumeId(e.target.value)}>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Target role" htmlFor={`${uid}-role`}>
              <Select id={`${uid}-role`} value={role} onChange={(e) => setRole(e.target.value)}>
                {TARGET_ROLES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button onClick={() => setOpen(true)} disabled={disabled || !chosen}>
              <Mic className="size-4" aria-hidden /> Set up interview
            </Button>
          </div>
        )}
      </CardBody>
      {chosen && (
        <StartInterviewDialog open={open} onClose={() => setOpen(false)} source={{ resumeId: chosen, targetRole: role, roleLabel }} interviewer={status.data?.interviewer} />
      )}
    </Card>
  );
}

function SessionsCard() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: careerKeys.sessions, queryFn: () => api.get<CareerSessionItem[]>("/career/sessions") });
  const completed = (data ?? []).filter((s) => s.status !== "IN_PROGRESS" && s.status !== "PAUSED" && s.readinessScore !== null).reverse();
  const points = completed.map((s) => ({ score: s.readinessScore!, createdAt: s.endedAt ?? s.startedAt }));

  return (
    <Card id="interviews" className="scroll-mt-20">
      <CardHeader title="My interviews" description="Every AI technical interview you've taken. Compare how each dimension moves over time." />
      <CardBody className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-32" />
        ) : error ? (
          <ErrorState error={error} retry={() => refetch()} />
        ) : !data?.length ? (
          <EmptyState icon={<Mic className="size-4" />} title="No interviews yet" description="Start one above for your target role, or from a job-match analysis." />
        ) : (
          <>
            {points.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
                <div>
                  <div className="text-xs text-muted">Readiness progress</div>
                  <div className="font-mono text-sm tabular-nums" aria-label={`Readiness scores oldest to newest: ${points.map((p) => p.score).join(", ")}`}>
                    {points.slice(-8).map((p, i, arr) => (
                      <span key={i}>
                        <span className={i === arr.length - 1 ? "font-semibold text-accent" : "text-text"}>{p.score}</span>
                        {i < arr.length - 1 && <span className="text-subtle"> → </span>}
                      </span>
                    ))}
                  </div>
                </div>
                {points.length > 1 && (
                  <div className="min-w-0">
                    <ScoreHistoryChart points={points} label="Interview readiness history" height={120} />
                  </div>
                )}
              </div>
            )}
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[900px] text-sm">
                <caption className="sr-only">Interview history with scores by dimension</caption>
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th scope="col" className="py-2 pr-3 font-medium">Date</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Role</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Duration</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Overall</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Technical</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Projects</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Problem solving</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Communication</th>
                    <th scope="col" className="py-2 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((s) => {
                    const live = s.status === "IN_PROGRESS" || s.status === "PAUSED";
                    const d = s.dimensions;
                    const cell = (v: number | null | undefined) => (v === null || v === undefined ? <span className="text-subtle">—</span> : <span className={`font-mono tabular-nums ${v >= 75 ? "text-accent" : v >= 55 ? "text-warn" : "text-danger"}`}>{v}</span>);
                    return (
                      <tr key={s.id} className="hover:bg-surface-2/50">
                        <td className="py-2.5 pr-3 font-mono text-xs whitespace-nowrap text-muted">{formatDate(s.startedAt)}</td>
                        <td className="max-w-[220px] py-2.5 pr-3">
                          {live ? (
                            <span className="block truncate">{s.role}</span>
                          ) : (
                            <Link href={`/career/interview/${s.id}`} className="block truncate hover:text-accent">
                              {s.role}
                              {s.match?.job.company && <span className="text-muted"> · {s.match.job.company}</span>}
                            </Link>
                          )}
                          <span className="text-[11px] text-subtle">{s.difficulty === "HARD" ? "Hard" : "Standard"}{s.matchId ? " · job match" : " · role"}</span>
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-xs whitespace-nowrap text-muted">{s.durationMinutes} min</td>
                        <td className="py-2.5 pr-3 text-xs whitespace-nowrap">
                          {({ IN_PROGRESS: "In progress", PAUSED: "Paused", COMPLETED: "Completed", ENDED_INTEGRITY: "Ended early", ABANDONED: "Not finished" } as Record<string, string>)[s.status] ?? s.status}
                        </td>
                        <td className="py-2.5 pr-3">
                          {s.readinessScore !== null ? (
                            <div className="flex items-center gap-2">
                              <span className="w-7 font-mono tabular-nums">{s.readinessScore}</span>
                              <Progress value={s.readinessScore} tone={scoreTone(s.readinessScore)} className="w-12" label={`Overall ${s.readinessScore}`} />
                            </div>
                          ) : (
                            <span className="text-subtle">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3">{cell(d?.technical)}</td>
                        <td className="py-2.5 pr-3">{cell(d?.projectUnderstanding)}</td>
                        <td className="py-2.5 pr-3">{cell(d?.problemSolving)}</td>
                        <td className="py-2.5 pr-3">{cell(d?.communication)}</td>
                        <td className="py-2.5">
                          {live ? (
                            <Link href={`/career/live/${s.id}`} className={buttonClass("primary", "sm")}>
                              {s.status === "PAUSED" ? "Continue" : "Resume"}
                            </Link>
                          ) : (
                            <Link href={`/career/interview/${s.id}`} className="inline-flex items-center gap-1" aria-label={`View report for ${s.role}`}>
                              <ResultBadge result={s.result} status={s.status} />
                              <ChevronRight className="size-3.5 text-subtle" aria-hidden />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
