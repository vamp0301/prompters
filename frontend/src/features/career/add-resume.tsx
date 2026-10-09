"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, Skeleton } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { CareerResume } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import { DocumentForm } from "./document-form";
import { careerKeys } from "./shared";

/** Upload another resume from anywhere in Career AI. Everything built from resumes refreshes. */
export function AddResumeDialog({ open, onClose, disabled }: { open: boolean; onClose: () => void; disabled?: boolean }) {
  const qc = useQueryClient();
  return (
    <Dialog open={open} onClose={onClose} title="Add a new resume" className="max-w-xl">
      <p className="mb-4 text-sm text-muted">Upload a PDF/TXT or paste the text. Your projects, Top-100 prep and interviews can then use the new version — older resumes and their history stay until you delete them.</p>
      <DocumentForm
        kind="resume"
        disabled={disabled}
        onDone={() => {
          // Projects and plans are listed per latest resume.
          void qc.invalidateQueries({ queryKey: ["career", "projects"], exact: true });
          onClose();
        }}
      />
    </Dialog>
  );
}

export function AddResumeButton({ disabled, size = "sm", variant = "secondary", label = "Add new resume" }: { disabled?: boolean; size?: "sm" | "md"; variant?: "primary" | "secondary" | "ghost"; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)} disabled={disabled}>
        <Plus className="size-4" aria-hidden /> {label}
      </Button>
      <AddResumeDialog open={open} onClose={() => setOpen(false)} disabled={disabled} />
    </>
  );
}

/** Career AI header strip: which resume is current, and the way to add a new one. */
export function ResumeBar({ disabled, open, onOpenChange, onManage }: { disabled: boolean; open: boolean; onOpenChange: (open: boolean) => void; onManage: () => void }) {
  const resumes = useQuery({ queryKey: careerKeys.resumes, queryFn: () => api.get<CareerResume[]>("/career/resumes") });
  const latest = resumes.data?.[0];
  return (
    <section aria-label="Your resume" className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <FileText className="size-4 shrink-0 text-muted" aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        {resumes.isLoading ? (
          <Skeleton className="h-4 w-48" />
        ) : latest ? (
          <>
            <span className="text-muted">Current resume: </span>
            <span className="font-medium">{latest.label}</span>
            <span className="text-subtle"> · added {formatDate(latest.createdAt)}{(resumes.data?.length ?? 0) > 1 ? ` · ${resumes.data!.length} resumes` : ""}</span>
          </>
        ) : (
          <span className="text-muted">No resume yet — add one to unlock your Top-100, projects and interviews.</span>
        )}
      </div>
      {latest && (
        <Button variant="ghost" size="sm" onClick={onManage}>
          Manage resumes
        </Button>
      )}
      <Button variant={latest ? "secondary" : "primary"} size="sm" onClick={() => onOpenChange(true)} disabled={disabled}>
        <Plus className="size-4" aria-hidden /> {latest ? "Add new resume" : "Add your resume"}
      </Button>
      <AddResumeDialog open={open} onClose={() => onOpenChange(false)} disabled={disabled} />
    </section>
  );
}

/** Dashboard: a pinned note pointing to the resume upload. */
export function ResumeNoteLink() {
  const resumes = useQuery({ queryKey: careerKeys.resumes, queryFn: () => api.get<CareerResume[]>("/career/resumes") });
  const latest = resumes.data?.[0];
  return (
    <>
      <p className="font-display text-xl leading-snug">{latest ? "Updated your resume?" : "Add your resume"}</p>
      <p className="mt-2 text-[13px] leading-relaxed">
        {latest ? (
          <>
            Current: <span className="font-semibold">{latest.label}</span> ({formatDate(latest.createdAt)}). Add the new one so your projects, Top-100 and interviews follow it.
          </>
        ) : (
          "Your projects, Top-100 questions and AI interviews are all built from it."
        )}
      </p>
      <Link href="/career?addResume=1" className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-note-yellow-fg px-3 py-1.5 text-[13px] font-semibold text-note-yellow hover:opacity-90">
        <Plus className="size-3.5" aria-hidden /> {latest ? "Add new resume" : "Add resume"}
      </Link>
    </>
  );
}
