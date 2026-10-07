import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Clean paper primitives: warm surfaces, hairline edges, soft depth. Calligraphy is an accent
 * for a word or two — never for labels, buttons or anything you need to read quickly.
 */

/** A sheet of paper: warm surface, hairline border, soft shadow. */
export const paperCard = "rounded-xl border border-border bg-surface shadow-[var(--shadow)]";

export function PaperCard({ className, lift, ...props }: HTMLAttributes<HTMLDivElement> & { lift?: boolean }) {
  return <div className={cn(paperCard, lift && "paper-lift", className)} {...props} />;
}

/** A labelled card (e.g. "TOP 01" on a question): small mono label row, then content. */
export function IndexCard({ label, aside, className, children }: { label?: ReactNode; aside?: ReactNode; hole?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn(paperCard, "relative p-4", className)}>
      {(label || aside) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {label && <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-accent">{label}</span>}
          <span className="ml-auto flex items-center gap-2">{aside}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/** A soft callout for tips and nudges. */
export function StickyNote({ className, children }: { className?: string; children: ReactNode; tilt?: number }) {
  return <div className={cn("rounded-lg border border-accent/25 bg-accent-soft p-4 text-sm leading-relaxed", className)}>{children}</div>;
}

/** A calligraphy accent (decorative by default — the meaning must also exist in nearby text). */
export function InkAnnotation({ children, className, decorative = true }: { children: ReactNode; className?: string; decorative?: boolean }) {
  return (
    <span aria-hidden={decorative || undefined} className={cn("font-script text-[1.7rem] leading-none text-accent", className)}>
      {children}
    </span>
  );
}

/** Soft emphasis behind a few important words. */
export function Highlight({ children, className }: { children: ReactNode; className?: string }) {
  return <mark className={cn("ink-highlight bg-transparent text-inherit", className)}>{children}</mark>;
}

const STATUS = {
  green: "border-accent/30 bg-accent-soft text-accent",
  red: "border-accent-2/30 bg-accent-2-soft text-accent-2",
  blue: "border-info/30 bg-info-soft text-info",
  muted: "border-border bg-surface-2 text-muted",
} as const;

/** A status pill: ✓ PASSED, → CURRENT, ○ LOCKED, SAMPLE… Always carries real text. */
export function StudyStamp({ children, tone = "green", className }: { children: ReactNode; tone?: keyof typeof STATUS; className?: string; tilt?: number }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.12em]", STATUS[tone], className)}>{children}</span>;
}

/** A calm content panel for long-form reading. */
export function NotebookSection({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(paperCard, "p-5 sm:p-6", className)}>{children}</div>;
}
