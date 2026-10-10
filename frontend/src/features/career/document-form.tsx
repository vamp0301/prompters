"use client";
import { useId, useRef, useState, type DragEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Tabs } from "@/components/ui/misc";
import { FILE_STORAGE_OFF, useFileStorage } from "@/features/auth/use-me";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { ResumeReader } from "./prep/resume-reader";
import { careerKeys, InlineError, readDocument, type PickedFile } from "./shared";

type Kind = "resume" | "job";

/** Upload (drag & drop / picker) or paste a resume or job description, then parse it with AI. */
export function DocumentForm({ kind, disabled, onDone }: { kind: Kind; disabled?: boolean; onDone?: () => void }) {
  const uid = useId();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "text">(kind === "resume" ? "file" : "text");
  const keepsFiles = useFileStorage();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [text, setText] = useState("");
  const [label, setLabel] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");

  const create = useMutation({
    meta: { silent: true },
    mutationFn: () => {
      const doc = mode === "file" && file ? { fileBase64: file.base64, mimeType: file.mimeType, fileName: file.name } : { text };
      return kind === "resume"
        ? api.post<{ id: string }>("/career/resumes", { ...doc, label: label.trim() || undefined })
        : api.post<{ id: string }>("/career/jobs", { ...doc, title: title.trim() || undefined, company: company.trim() || undefined });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kind === "resume" ? careerKeys.resumes : careerKeys.jobs });
      setFile(null);
      setText("");
      setLabel("");
      setTitle("");
      setCompany("");
      onDone?.();
    },
  });

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setFileError(null);
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
    if (disabled || create.isPending) return;
    void pick(e.dataTransfer.files?.[0]);
  };

  const minText = kind === "resume" ? 150 : 80;
  const ready = mode === "file" ? !!file : text.trim().length >= minText;
  const noun = kind === "resume" ? "resume" : "job description";
  const busy = create.isPending;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !busy && !disabled) create.mutate();
      }}
    >
      <Tabs
        value={mode}
        onChange={(v) => setMode(v)}
        items={[
          { value: "file", label: "Upload PDF / TXT" },
          { value: "text", label: "Paste text" },
        ]}
      />

      {mode === "file" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
            dragging ? "border-accent bg-accent-soft" : "border-border bg-surface-2/40",
          )}
        >
          {file ? (
            <div className="flex w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left text-sm">
              <FileText className="size-4 shrink-0 text-accent" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="font-mono text-xs text-subtle">{(file.size / 1024).toFixed(0)} KB</span>
              <button type="button" onClick={() => setFile(null)} className="rounded p-0.5 text-muted hover:text-text" aria-label="Remove file" disabled={busy}>
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="size-5 text-muted" aria-hidden />
              <p className="text-sm text-muted">Drag & drop your {noun} here</p>
              <p className="text-xs text-subtle">PDF or .txt, up to 5 MB</p>
              {kind === "resume" && !keepsFiles && <p className="text-xs text-subtle">{FILE_STORAGE_OFF}</p>}
            </>
          )}
          <input
            ref={inputRef}
            id={`${uid}-file`}
            type="file"
            accept="application/pdf,text/plain,.pdf,.txt"
            aria-label={kind === "resume" ? "Choose a resume file (PDF or TXT)" : "Choose a job description file (PDF or TXT)"}
            className="sr-only"
            disabled={disabled || busy}
            onChange={(e) => {
              void pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={disabled || busy}>
            {file ? "Choose another file" : "Choose file"}
          </Button>
          {fileError && <p role="alert" className="text-xs text-danger">{fileError}</p>}
        </div>
      ) : (
        <Field label={kind === "resume" ? "Resume text" : "Job description"} htmlFor={`${uid}-text`} hint={`At least ${minText} characters.`}>
          <Textarea
            id={`${uid}-text`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={kind === "resume" ? "Paste your full resume…" : "Paste the full job description…"}
            className="min-h-40"
            maxLength={60000}
            disabled={disabled || busy}
          />
        </Field>
      )}

      {kind === "resume" ? (
        <Field label="Label (optional)" htmlFor={`${uid}-label`}>
          <Input id={`${uid}-label`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Backend resume v2" maxLength={120} disabled={disabled || busy} />
        </Field>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Job title (optional)" htmlFor={`${uid}-title`}>
            <Input id={`${uid}-title`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Backend Engineer" maxLength={160} disabled={disabled || busy} />
          </Field>
          <Field label="Company (optional)" htmlFor={`${uid}-company`}>
            <Input id={`${uid}-company`} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme" maxLength={160} disabled={disabled || busy} />
          </Field>
        </div>
      )}

      <InlineError error={create.error} />
      {busy && kind === "resume" && (
        <div className="rounded-lg border border-border bg-surface-2/40 p-4">
          <ResumeReader reading label={mode === "file" && file ? file.name : label.trim() || "Pasted resume"} />
          <p className="mt-3 text-xs text-subtle">Parsing usually takes 10–30 seconds.</p>
        </div>
      )}
      {busy && kind !== "resume" && (
        <p role="status" className="flex items-center gap-2 text-xs text-muted">
          <Loader2 className="size-3.5 animate-spin text-accent" aria-hidden />
          Reading and parsing your {noun} with AI — this can take 10–30 seconds.
        </p>
      )}
      <Button type="submit" size="sm" disabled={!ready || disabled} loading={busy}>
        {busy ? "Parsing…" : kind === "resume" ? "Add resume" : "Add job description"}
      </Button>
    </form>
  );
}
