"use client";
import Link from "next/link";
import { useId, useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowUpRight, FileText, Plus, X } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api/client";
import type { Me } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { friendlyError, readDocument, type PickedFile } from "@/features/career/shared";
import { savePendingResume } from "./pending-resume";
import { startPreparing, TARGET_ROLES } from "./start-preparing";
import { DEFAULT_LANDING, type LandingContent } from "./landing-content";

type Outcome = { kind: "plan"; planId: string } | { kind: "signup"; stored: boolean; to: string };

/**
 * Landing-page resume card. Signed-in users upload straight to the career API. Visitors keep the
 * file in this browser until they have an account — nothing is sent to the server before that.
 */
export function VellumUpload({ content = DEFAULT_LANDING.upload }: { content?: LandingContent["upload"] }) {
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
      id="upload"
      aria-labelledby={`${uid}-title`}
      className="relative scroll-mt-24 rounded-xl border border-border bg-surface/90 px-6 pb-6 pt-9 shadow-[var(--shadow)] sm:px-[30px]"
      onSubmit={(e) => {
        e.preventDefault();
        if (busy) return;
        if (file) start.mutate();
        else inputRef.current?.click();
      }}
    >
      <span className="tape">{content.tape}</span>
      <p aria-hidden className="note-yellow mb-4 w-full px-0.5 py-1 text-[15px] leading-6 shadow-[0_3px_8px_rgba(0,0,0,0.06)]">
        {content.noteLine1}
        <br />
        <strong className="font-semibold">{content.noteLine2}</strong>
      </p>
      <span className="grid size-[54px] place-items-center rounded-full bg-accent-soft text-accent" aria-hidden>
        <FileText className="size-5" />
      </span>
      <h2 id={`${uid}-title`} className="font-display mt-5 text-[26px] leading-tight">
        {content.title}
      </h2>
      <p className="mt-2 text-[13px] text-muted">{content.subtitle}</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn("my-6 rounded-lg border border-dashed border-accent transition-colors", dragging ? "bg-accent-soft" : "bg-transparent")}
      >
        {file ? (
          <div className="flex items-center gap-2.5 px-4 py-5 text-left text-sm">
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
        ) : null}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn("flex w-full flex-col items-center gap-1.5 rounded-lg px-4 text-accent transition-colors hover:bg-accent-soft/60", file ? "border-t border-dashed border-accent/50 py-3" : "py-7")}
        >
          <Plus className="size-4" aria-hidden />
          <span className="text-[15px] font-bold">{file ? "Choose another file" : content.dropTitle}</span>
          {!file && <span className="text-[11px] text-muted">{content.dropHint}</span>}
        </button>
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
      </div>

      <label htmlFor={`${uid}-role`} className="eyebrow block text-text">
        Target role
      </label>
      <select
        id={`${uid}-role`}
        value={role}
        onChange={(e) => setRole(e.target.value)}
        disabled={busy}
        className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-[13px] text-text focus:border-accent focus:outline-none"
      >
        {TARGET_ROLES.map((r) => (
          <option key={r.key} value={r.key}>
            {r.label}
          </option>
        ))}
      </select>

      <Button type="submit" variant="ink" size="md" className="mt-4 w-full" disabled={busy} loading={start.isPending}>
        {content.button} <ArrowUpRight className="size-3.5" aria-hidden />
      </Button>

      <p role="status" aria-live="polite" className={cn("mt-3 min-h-4 text-center text-xs", fileError || start.error ? "text-danger" : "text-muted")}>
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
        <p className="text-center text-[10px] text-muted">{content.finePrint}</p>
      )}
    </form>
  );
}
