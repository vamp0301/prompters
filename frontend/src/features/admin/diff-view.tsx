"use client";
import { cn } from "@/lib/utils";
import { diffLines } from "./diff";

/** Unified line diff with +/- gutters. */
export function DiffView({ before, after, className }: { before: string; after: string; className?: string }) {
  const lines = diffLines(before, after);
  return (
    <pre className={cn("max-h-96 overflow-auto rounded-lg border border-border bg-code py-2 font-mono text-[12px] leading-5", className)}>
      {lines.map((l, i) => (
        <div key={i} className={cn("flex px-2", l.kind === "add" && "bg-accent-soft text-accent", l.kind === "del" && "bg-danger-soft text-danger")}>
          <span className="w-4 shrink-0 select-none text-subtle" aria-hidden>{l.kind === "add" ? "+" : l.kind === "del" ? "−" : " "}</span>
          <span className="sr-only">{l.kind === "add" ? "added: " : l.kind === "del" ? "removed: " : ""}</span>
          <span className="whitespace-pre-wrap break-words">{l.text || " "}</span>
        </div>
      ))}
    </pre>
  );
}

/** Two columns: left keeps unchanged + removed lines, right keeps unchanged + added lines. */
export function SideBySideDiff({ before, after, leftLabel, rightLabel }: { before: string; after: string; leftLabel: string; rightLabel: string }) {
  const lines = diffLines(before, after);
  const col = (keep: "del" | "add") => (
    <pre className="max-h-96 min-w-0 overflow-auto rounded-lg border border-border bg-code py-2 font-mono text-[12px] leading-5">
      {lines.filter((l) => l.kind === "same" || l.kind === keep).map((l, i) => (
        <div key={i} className={cn("px-2", l.kind === "add" && "bg-accent-soft text-accent", l.kind === "del" && "bg-danger-soft text-danger")}>
          <span className="sr-only">{l.kind === "add" ? "added: " : l.kind === "del" ? "removed: " : ""}</span>
          <span className="whitespace-pre-wrap break-words">{l.text || " "}</span>
        </div>
      ))}
    </pre>
  );
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <div className="min-w-0"><div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-subtle">{leftLabel}</div>{col("del")}</div>
      <div className="min-w-0"><div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-subtle">{rightLabel}</div>{col("add")}</div>
    </div>
  );
}
