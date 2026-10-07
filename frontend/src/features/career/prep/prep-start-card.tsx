"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ListChecks, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Tape } from "@/components/ui/paper";
import { Field, Select } from "@/components/ui/input";
import { ErrorState, Skeleton, Tabs } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { CareerJob, CareerResume, PrepMeta, PrepPlanItem, PrepUsage } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import { DocumentForm } from "../document-form";
import { careerKeys, ConfirmButton, InlineError } from "../shared";

export function usePrepUsage() {
  return useQuery({ queryKey: careerKeys.prepUsage, queryFn: () => api.get<PrepUsage>("/career/prep/usage") });
}

export function usePrepMeta() {
  return useQuery({ queryKey: careerKeys.prepMeta, queryFn: () => api.get<PrepMeta>("/career/prep/meta"), staleTime: Infinity });
}

/** Upload resume → JD or target role → generate the personalised Top 100. */
export function PrepStartCard({ disabled }: { disabled: boolean }) {
  const uid = useId();
  const router = useRouter();
  const qc = useQueryClient();
  const meta = usePrepMeta();
  const usage = usePrepUsage();
  const resumes = useQuery({ queryKey: careerKeys.resumes, queryFn: () => api.get<CareerResume[]>("/career/resumes") });
  const jobs = useQuery({ queryKey: careerKeys.jobs, queryFn: () => api.get<CareerJob[]>("/career/jobs") });
  const [mode, setMode] = useState<"role" | "job">("role");
  const [resumeId, setResumeId] = useState("");
  const [jobId, setJobId] = useState("");
  const [role, setRole] = useState("backend");
  const rId = (resumes.data?.some((r) => r.id === resumeId) ? resumeId : resumes.data?.[0]?.id) ?? "";
  const jId = (jobs.data?.some((j) => j.id === jobId) ? jobId : jobs.data?.[0]?.id) ?? "";

  const create = useMutation({
    meta: { silent: true },
    mutationFn: () => api.post<{ id: string; reused: boolean }>("/career/prep", mode === "job" ? { resumeId: rId, jobId: jId } : { resumeId: rId, targetRole: role }),
    onSuccess: (p) => {
      // An existing plan for the same resume + target is opened rather than regenerated.
      qc.invalidateQueries({ queryKey: careerKeys.prepPlans });
      qc.invalidateQueries({ queryKey: careerKeys.prepUsage });
      router.push(`/career/prep/${p.id}`);
    },
  });

  const noResume = !resumes.isLoading && !resumes.data?.length;
  const ready = !!rId && (mode === "role" ? !!role : !!jId);

  return (
    <Card id="top-100" className="relative scroll-mt-20 border-accent/40">
      <Tape className="left-16" />
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" aria-hidden /> Your Top 100 Interview Questions
          </span>
        }
        description="Upload your resume once. Prompters reads your projects, skills, claims and achievements, then writes the 100 technical questions YOU are most likely to face — ranked, explained and ready to practise."
      />
      <CardBody className="space-y-4">
        {resumes.isLoading ? (
          <Skeleton className="h-24" />
        ) : noResume ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Step 1 · Upload your resume</p>
            <DocumentForm kind="resume" disabled={disabled} />
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (ready && !disabled) create.mutate();
            }}
          >
            <Field label="Resume" htmlFor={`${uid}-r`}>
              <Select id={`${uid}-r`} value={rId} onChange={(e) => setResumeId(e.target.value)} disabled={create.isPending}>
                {resumes.data?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted">Prepare for</p>
              <Tabs
                value={mode}
                onChange={setMode}
                items={[
                  { value: "role", label: "A target role" },
                  { value: "job", label: "A specific job description" },
                ]}
              />
              {mode === "role" ? (
                <Field label="Target role" htmlFor={`${uid}-role`} hint="No JD? Questions come from your resume and what interviewers expect for this role.">
                  <Select id={`${uid}-role`} value={role} onChange={(e) => setRole(e.target.value)} disabled={create.isPending}>
                    {meta.data?.roles.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : jobs.data?.length ? (
                <Field label="Job description" htmlFor={`${uid}-j`} hint="Questions also cover required skills your resume doesn't show yet.">
                  <Select id={`${uid}-j`} value={jId} onChange={(e) => setJobId(e.target.value)} disabled={create.isPending}>
                    {jobs.data.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                        {j.company ? ` — ${j.company}` : ""}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <p className="text-sm text-muted">
                  Add a job description in <a href="#job-descriptions" className="text-accent underline underline-offset-4">Job descriptions</a> below, or prepare for a target role instead.
                </p>
              )}
            </div>
            <InlineError error={create.error} />
            <Button type="submit" disabled={!ready || disabled} loading={create.isPending}>
              Generate my Top 100 <ArrowRight className="size-4" aria-hidden />
            </Button>
            <p className="text-xs text-subtle">
              Takes 2–4 minutes. You can leave this page — we&apos;ll keep working. If you already have a plan for this resume and target, we open it instead of generating again.
              {usage.data && (
                <>
                  {" "}
                  <span className={usage.data.remaining ? "text-muted" : "text-warn"}>
                    {usage.data.remaining} of {usage.data.limit} generations left today.
                  </span>
                </>
              )}
            </p>
          </form>
        )}
      </CardBody>
    </Card>
  );
}

const STATUS_BADGE = {
  QUEUED: { label: "Queued", tone: "neutral" },
  RUNNING: { label: "Generating…", tone: "info" },
  READY: { label: "Ready", tone: "accent" },
  FAILED: { label: "Failed", tone: "danger" },
} as const;

export function PrepPlansCard() {
  const qc = useQueryClient();
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: careerKeys.prepPlans,
    queryFn: () => api.get<PrepPlanItem[]>("/career/prep"),
    refetchInterval: (q) => (q.state.data?.some((p) => p.status === "QUEUED" || p.status === "RUNNING") ? 3000 : false),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/career/prep/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: careerKeys.prepPlans }),
  });
  if (!isLoading && !error && !data?.length) return null;
  return (
    <Card id="plans" className="scroll-mt-20">
      <CardHeader title="Your preparation plans" description="Each plan is a ranked Top 100 for one resume and one target." />
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : error ? (
          <ErrorState error={error} retry={() => refetch()} />
        ) : (
          <ul className="divide-y divide-border">
            {data!.map((p) => {
              const s = STATUS_BADGE[p.status];
              return (
                <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <ListChecks className="size-4 shrink-0 text-muted" aria-hidden />
                  <Link href={`/career/prep/${p.id}`} className="group min-w-0 flex-1">
                    <div className="truncate text-sm font-medium group-hover:text-accent">{p.title}</div>
                    <div className="truncate text-xs text-subtle">
                      {p.resume.label} · {formatDate(p.createdAt)}
                      {p.status === "READY" && ` · ${p._count.questions} questions`}
                    </div>
                  </Link>
                  <Badge tone={s.tone}>{s.label}</Badge>
                  <ConfirmButton
                    label={<span className="sr-only">Delete</span>}
                    icon={<Trash2 className="size-3.5" aria-hidden />}
                    ariaLabel={`Delete plan ${p.title}`}
                    title="Delete this preparation plan?"
                    body={<p>Its questions, practice attempts and downloaded packs are deleted. Your resume stays.</p>}
                    loading={del.isPending && del.variables === p.id}
                    onConfirm={() => del.mutate(p.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
