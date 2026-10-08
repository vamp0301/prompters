"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page numbers to show: first, last, and a window around the current page, with gaps as "…". */
export function pageWindow(page: number, pages: number): (number | "…")[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

const cell = "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs tabular-nums transition-colors";

export function Pagination({ page, pages, onChange, label = "Pages", className }: { page: number; pages: number; onChange: (page: number) => void; label?: string; className?: string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label={label} className={cn("flex flex-wrap items-center justify-center gap-1", className)}>
      <button type="button" className={cn(cell, "gap-1 text-muted hover:bg-surface-2 hover:text-text disabled:pointer-events-none disabled:opacity-40")} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="size-3.5" aria-hidden /> Previous
      </button>
      {pageWindow(page, pages).map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className={cn(cell, "text-subtle")} aria-hidden>
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
            onClick={() => onChange(n)}
            className={cn(cell, n === page ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface-2 hover:text-text")}
          >
            {n}
          </button>
        ),
      )}
      <button type="button" className={cn(cell, "gap-1 text-muted hover:bg-surface-2 hover:text-text disabled:pointer-events-none disabled:opacity-40")} disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next <ChevronRight className="size-3.5" aria-hidden />
      </button>
    </nav>
  );
}
