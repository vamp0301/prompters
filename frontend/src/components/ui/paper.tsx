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

const STAT_TONE = { green: "text-accent", orange: "text-accent-2", blue: "text-info", pink: "text-pink" } as const;

/** Reference-style stat card: mono caps label, large coloured mono number, small hint. */
export function StatCard({ label, value, hint, tone = "green", className }: { label: ReactNode; value: ReactNode; hint?: ReactNode; tone?: keyof typeof STAT_TONE; className?: string }) {
  return (
    <div className={cn(paperCard, "p-[18px]", className)}>
      <div className="eyebrow text-[9px] text-text">{label}</div>
      <div className={cn("mt-5 font-mono text-[28px] leading-none tracking-tight tabular-nums", STAT_TONE[tone])}>{value}</div>
      {hint && <div className="mt-3 text-[10px] text-muted">{hint}</div>}
    </div>
  );
}

/** A yellow sticky note held by a push pin. The pin is decorative. */
export function PinnedNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("note-yellow relative rotate-[1.2deg] rounded-sm p-6 pt-9 shadow-[0_18px_40px_rgba(94,85,46,0.16)]", className)}>
      <svg viewBox="0 0 28 34" width="28" height="34" aria-hidden className="absolute -top-4 left-1/2 -translate-x-1/2 drop-shadow-[1px_3px_2px_rgba(0,0,0,0.25)]">
        <path d="M14 17 L15.4 32" stroke="#8a8378" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="14" cy="10" r="9" fill="var(--accent-2)" />
        <circle cx="14" cy="10" r="9" fill="url(#pin-shade)" />
        <circle cx="10.8" cy="6.8" r="2.6" fill="#fff" opacity="0.45" />
        <defs>
          <radialGradient id="pin-shade" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.28" />
          </radialGradient>
        </defs>
      </svg>
      {children}
    </div>
  );
}

/** A taped yellow sticky note. */
export function TapedNote({ tape, children, className }: { tape: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("note-yellow relative rotate-[-1.5deg] rounded-sm p-8 pt-14 shadow-[0_18px_40px_rgba(94,85,46,0.16)]", className)}>
      <span className="tape left-7 top-[-8px]">{tape}</span>
      {children}
    </div>
  );
}
