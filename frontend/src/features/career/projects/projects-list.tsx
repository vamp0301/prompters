"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FolderGit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/misc";
import { paperCard } from "@/components/ui/paper";
import { api } from "@/lib/api/client";
import type { ProjectSummary } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const projectKeys = { list: ["career", "projects"] as const, one: (id: string) => ["career", "projects", id] as const };

const SOURCE_LABEL = { PROJECT: "Project", EXPERIENCE: "Work experience", BOTH: "Project + work experience" } as const;

/** Every project and job on the resume, each a full interview-prep module. */
export function ProjectsList() {
  const q = useQuery({ queryKey: projectKeys.list, queryFn: () => api.get<{ resume: { id: string; label: string } | null; projects: ProjectSummary[] }>("/career/projects") });
  if (q.isLoading) return <Skeleton className="h-40" />;
  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const d = q.data!;
  if (!d.resume) return <EmptyState icon={<FolderGit2 className="size-4" />} title="Add your resume first" description="Every project on your resume becomes a module: what you built, why each technology, 20 interview questions and a drill-down test." />;
  if (!d.projects.length) return <EmptyState icon={<FolderGit2 className="size-4" />} title="No projects found on this resume" description="Add projects or work experience to your resume and upload it again." />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        From <span className="text-text">{d.resume.label}</span>: if an interviewer picks any of these and drills for 20 minutes, each module prepares you for that conversation.
      </p>
      <ul className="grid gap-3 md:grid-cols-2">
        {d.projects.map((p) => (
          <li key={p.id}>
            <Link href={`/career/projects/${p.id}`} className={cn(paperCard, "paper-lift group block h-full p-4")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-xl leading-tight group-hover:text-accent">{p.name}</p>
                  {(p.role || p.company) && <p className="text-xs text-muted">{[p.role, p.company].filter(Boolean).join(" · ")}</p>}
                </div>
                <Badge tone={p.source === "PROJECT" ? "info" : "accent"}>{SOURCE_LABEL[p.source]}</Badge>
              </div>
              <ul className="mt-3 flex flex-wrap gap-1" aria-label="Technologies">
                {p.technologies.slice(0, 8).map((t) => (
                  <li key={t} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px]">
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>
                  {p.claims} resume claim{p.claims === 1 ? "" : "s"} to defend ·{" "}
                  {p.lastTest?.overall != null ? `last test ${p.lastTest.overall}%` : p.generated ? (p.stale ? "facts changed — rebuilds on open" : "ready") : "builds on first open"}
                </span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
