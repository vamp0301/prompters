"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Basis, Why } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const NOT_SPECIFIED = "Not specified — edit this answer.";
export const NOT_MEASURED = "Not provided — add actual measurement.";

/** Where a statement comes from. Every factual sentence on the page carries one. */
const BASIS: Record<Basis | "POSSIBLE", { label: string; cls: string; title: string }> = {
  RESUME: { label: "From resume", cls: "border-accent/40 bg-accent-soft text-accent", title: "Stated on your resume" },
  USER_FACT: { label: "Your facts", cls: "border-info/40 bg-info-soft text-info", title: "From the facts you entered" },
  GENERAL: { label: "General explanation", cls: "border-border bg-surface-2 text-muted", title: "General technical knowledge, not a claim about your project" },
  NOT_SPECIFIED: { label: "Not specified", cls: "border-warn/40 bg-warn-soft text-warn", title: "Unknown — add it in Facts" },
  POSSIBLE: { label: "Possible — verify", cls: "border-accent-2/60 bg-accent-2-soft text-text", title: "A guess, not a fact — confirm or correct it" },
};

export function BasisBadge({ basis }: { basis: Basis | "POSSIBLE" }) {
  const b = BASIS[basis];
  return (
    <span title={b.title} className={cn("inline-flex shrink-0 items-center rounded-full border px-1.5 py-px font-mono text-[10px] uppercase tracking-wide", b.cls)}>
      {b.label}
    </span>
  );
}

export function EvidenceLegend() {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted" aria-label="What the labels mean">
      {(["RESUME", "USER_FACT", "GENERAL", "POSSIBLE", "NOT_SPECIFIED"] as const).map((b) => (
        <BasisBadge key={b} basis={b} />
      ))}
      <span>— nothing here is presented as fact unless your resume or your facts say it.</span>
    </p>
  );
}

/** A sourced statement; unknowns point to the Facts editor instead of guessing. */
export function SourcedText({ text, basis, projectId }: { text: string; basis: Basis; projectId: string }) {
  if (basis === "NOT_SPECIFIED" || text === NOT_SPECIFIED || text === NOT_MEASURED)
    return (
      <span className="text-muted">
        {text}{" "}
        <Link href={`/career/projects/${projectId}?tab=facts`} className="text-accent underline underline-offset-4">
          Add it
        </Link>
      </span>
    );
  return <span>{text}</span>;
}

/** Why a choice was made, in its three evidence boxes. */
export function WhyBlock({ why }: { why: Why }) {
  return (
    <div className="space-y-1.5 text-[13px]">
      {why.fact && (
        <p className="flex gap-2">
          <BasisBadge basis="RESUME" /> <span>{why.fact}</span>
        </p>
      )}
      <p className="flex gap-2">
        <BasisBadge basis="GENERAL" /> <span>{why.explanation}</span>
      </p>
      {why.possibleReason && (
        <p className="flex gap-2">
          <BasisBadge basis="POSSIBLE" /> <span>Possible explanation — verify: {why.possibleReason}</span>
        </p>
      )}
    </div>
  );
}

const LEVEL_TONE = ["", "bg-accent-soft text-accent", "bg-info-soft text-info", "bg-surface-2 text-text", "bg-accent-2-soft text-accent-2", "bg-pink-soft text-pink"];
export function LevelBadge({ level }: { level: number }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-md px-1.5 py-px font-mono text-[11px] font-semibold", LEVEL_TONE[level])}>L{level}</span>;
}

export function Expand({ summary, children, onOpen, className }: { summary: ReactNode; children: ReactNode; onOpen?: () => void; className?: string }) {
  return (
    <details className={cn("group rounded-lg border border-border bg-surface", className)} onToggle={(e) => (e.currentTarget.open ? onOpen?.() : undefined)}>
      <summary className="flex cursor-pointer list-none items-start gap-2 px-3 py-2.5 text-[14px] [&::-webkit-details-marker]:hidden">
        <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
        <span className="min-w-0 flex-1">{summary}</span>
      </summary>
      <div className="border-t border-border px-3 py-3">{children}</div>
    </details>
  );
}

export function SectionTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-3">
      {eyebrow && <p className="eyebrow text-accent">{eyebrow}</p>}
      <h2 className="font-display text-2xl">{title}</h2>
      {children && <p className="mt-1 text-sm text-muted">{children}</p>}
    </div>
  );
}

/** Interaction signal for personalization (allow-listed server-side; never scores). */
export function track(eventType: "PROJECT_EXPLANATION_VIEWED" | "PROJECT_QUESTION_STARTED" | "PROJECT_REVISION_STARTED", projectId: string, metadata?: Record<string, string | number>) {
  void api.post("/personalization/events", { eventType, entityType: "PROJECT", entityId: projectId, metadata }).catch(() => undefined);
}
