import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scrapbook primitives for the "developer study notebook" look. Rule of thumb: 90% clean UI,
 * 10% paper personality — use one accent per card at most, and never for essential information.
 */

const cardShadow = "shadow-[0_1px_2px_rgba(30,27,22,0.06),0_12px_32px_-24px_rgba(30,27,22,0.35)]";

/** A plain physical-feeling sheet: warm surface, hairline border, soft contact shadow. */
export const paperCard = cn("rounded-lg border border-border bg-surface", cardShadow);

export function PaperCard({ className, lift, ...props }: HTMLAttributes<HTMLDivElement> & { lift?: boolean }) {
  return <div className={cn(paperCard, lift && "paper-lift", className)} {...props} />;
}

/** Index card: header label above a vermilion rule, faint ruling below, an optional punched hole. */
export function IndexCard({ label, aside, hole, className, children }: { label?: ReactNode; aside?: ReactNode; hole?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn(paperCard, "index-card relative px-4 pb-4 pt-2.5", className)}>
      <div className="flex h-7 items-center justify-between gap-2">
        {label && <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-accent-2">{label}</span>}
        <span className="ml-auto flex items-center gap-2">
          {aside}
          {hole && <span aria-hidden className="size-2.5 rounded-full border border-border-strong bg-bg shadow-inner" />}
        </span>
      </div>
      <div className="pt-3">{children}</div>
    </div>
  );
}

/** A sticky note for tips and nudges — slightly tilted, flat colour, readable ink. */
export function StickyNote({ className, children, tilt = 1 }: { className?: string; children: ReactNode; tilt?: number }) {
  return (
    <div
      className={cn("paper-tilt rounded-sm bg-sticky p-4 text-sm leading-relaxed text-sticky-ink shadow-[0_10px_20px_-14px_rgba(30,27,22,0.55)]", className)}
      style={{ rotate: `${tilt}deg` }}
    >
      {children}
    </div>
  );
}

/** A small paper clip holding a sheet (decorative). Place inside a `relative` container. */
export function PaperClip({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 60" className={cn("pointer-events-none absolute h-14 w-6 text-subtle", className)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 22 V46 a5 5 0 0 0 10 0 V14 a7 7 0 0 0 -14 0 V44" />
    </svg>
  );
}

/** A strip of masking tape across the top edge (decorative). Place inside a `relative` container. */
export function Tape({ className, tilt = -3 }: { className?: string; tilt?: number }) {
  return <span aria-hidden className={cn("paper-tilt pointer-events-none absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 bg-tape", className)} style={{ rotate: `${tilt}deg` }} />;
}

/** A handwritten margin note. Decorative by default — the same meaning must exist in nearby text. */
export function InkAnnotation({ children, className, decorative = true }: { children: ReactNode; className?: string; decorative?: boolean }) {
  return (
    <span aria-hidden={decorative || undefined} className={cn("font-script text-[1.6rem] leading-none text-accent-2", className)}>
      {children}
    </span>
  );
}

/** Highlighter stroke for a few important words. */
export function Highlight({ children, className }: { children: ReactNode; className?: string }) {
  return <mark className={cn("ink-highlight bg-transparent text-inherit", className)}>{children}</mark>;
}

const STAMP = {
  green: "border-accent/60 text-accent",
  red: "border-accent-2/60 text-accent-2",
  muted: "border-border-strong text-subtle",
} as const;

/** A rubber-stamp label: ✓ MASTERED, → CURRENT, ○ LOCKED, SAMPLE… Always carries real text. */
export function StudyStamp({ children, tone = "green", className }: { children: ReactNode; tone?: keyof typeof STAMP; className?: string }) {
  return (
    <span className={cn("paper-tilt inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.16em]", STAMP[tone], className)} style={{ rotate: "-2deg" }}>
      {children}
    </span>
  );
}

/** A long-form notebook page: faint ruled lines and a vermilion margin. Use for notes and reading, not for every card. */
export function NotebookSection({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(paperCard, "paper-ruled paper-margin py-5 pl-12 pr-5", className)}>{children}</div>;
}
