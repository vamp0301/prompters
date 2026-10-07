"use client";
import Link from "next/link";
import { useId, useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, FileText, Upload, X } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api/client";
import type { Me } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { friendlyError, readDocument, type PickedFile } from "@/features/career/shared";
import { savePendingResume } from "./pending-resume";
import { startPreparing, TARGET_ROLES } from "./start-preparing";

type Outcome = { kind: "plan"; planId: string } | { kind: "signup"; stored: boolean; to: string };

/**
 * Landing-page resume card. Signed-in users upload straight to the career API. Visitors keep the
 * file in this browser until they have an account — nothing is sent to the server before that.
 */
export function VellumUpload() {
  const uid = useId();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [role, setRole] = useState("fullstack");
  const [dragging, setDragging] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);

  const start = useMutation<Outcome>({
    meta: { silent: true },
    mutationFn: async () => {
      if (!file) throw new Error("Choose your resume first.");
      // Checked at click time, not on page load: a 401 on page load would bounce visitors to /login.
      let me: Me | null = null;
      try {
        me = await api.get<Me>("/auth/me");
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) throw e;
      }
      if (me?.profile?.onboardedAt) return { kind: "plan", planId: await startPreparing(file, role) };
      const stored = await savePendingResume({ name: file.name, mimeType: file.mimeType, base64: file.base64, size: file.size, targetRole: role, savedAt: Date.now() });
      return { kind: "signup", stored, to: me ? "/onboarding" : "/register" };
    },
    onSuccess: (r) => {
      if (r.kind === "plan") router.push(`/career/prep/${r.planId}`);
      else if (r.stored) router.push(r.to);
      else setBlocked(r.to);
    },
  });

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setFileError(null);
    start.reset();
    try {
      setFile(await readDocument(f));
    } catch (e) {
      setFile(null);
      setFileError(e instanceof Error ? e.message : "Couldn't read that file.");
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!start.isPending) void pick(e.dataTransfer.files?.[0]);
  };

  const busy = start.isPending || start.isSuccess;
  const status = fileError
    ? fileError
    : start.error
      ? friendlyError(start.error)
      : start.isPending
        ? "Preparing…"
        : file
          ? `${file.name} selected. Choose your target role, then start preparing.`
          : "";

  return (
    <form
      aria-labelledby={`${uid}-title`}
      className="vellum relative rounded-xl p-5 sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        if (file && !busy) start.mutate();
      }}
    >
      <h2 id={`${uid}-title`} className="font-display text-2xl font-semibold">
        Upload your resume
      </h2>
      <p className="mt-1 font-mono text-[11px] text-subtle">PDF or TXT · Max 5MB</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "mt-5 flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-7 text-center transition-colors",
          dragging ? "border-accent bg-accent-soft" : "border-border-strong bg-bg/40",
        )}
      >
        {file ? (
          <div className="flex w-full items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2.5 text-left text-sm">
            <FileText className="size-4 shrink-0 text-accent" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <span className="font-mono text-xs text-subtle">{Math.max(1, Math.round(file.size / 1024))} KB</span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                start.reset();
              }}
              disabled={busy}
              className="rounded p-1 text-muted hover:text-text"
              aria-label={`Remove ${file.name}`}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ) : (
          <>
            <Upload className="size-5 text-muted" aria-hidden />
            <p className="text-sm">Drop your resume here</p>
            <p className="text-xs text-subtle">or</p>
          </>
        )}
        <input
          ref={inputRef}
          id={`${uid}-file`}
          type="file"
          accept="application/pdf,text/plain,.pdf,.txt"
          className="sr-only"
          tabIndex={-1}
          disabled={busy}
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {file ? "Choose another file" : "Choose file"}
        </Button>
      </div>

      <label htmlFor={`${uid}-role`} className="mt-5 block text-xs font-medium text-muted">
        Target role
      </label>
      <select
        id={`${uid}-role`}
        value={role}
        onChange={(e) => setRole(e.target.value)}
        disabled={busy}
        className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-text"
      >
        {TARGET_ROLES.map((r) => (
          <option key={r.key} value={r.key}>
            {r.label}
          </option>
        ))}
      </select>

      <Button type="submit" size="lg" className="mt-5 w-full" disabled={!file || busy} loading={start.isPending}>
        Start preparing <ArrowRight className="size-4" aria-hidden />
      </Button>

      <p role="status" aria-live="polite" className={cn("mt-3 min-h-5 text-xs", fileError || start.error ? "text-danger" : "text-muted")}>
        {status}
      </p>
      {blocked ? (
        <div role="alert" className="mt-2 rounded-md border border-warn/40 bg-warn-soft p-3 text-xs text-warn">
          Your browser blocked temporary storage, so we can&apos;t hold your resume here. Create your account, then upload it from Career AI.
          <Link href={blocked} className={buttonClass("secondary", "sm", "mt-2 w-full")}>
            Continue
          </Link>
        </div>
      ) : (
        <p className="text-xs text-subtle">Not signed in? Your resume is uploaded only after you create a free account.</p>
      )}
    </form>
  );
}
