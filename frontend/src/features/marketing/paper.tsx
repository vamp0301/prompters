import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A physical-feeling paper card: warm surface, hairline border, soft contact shadow. */
export const paperCard = "rounded-lg border border-border bg-surface shadow-[0_1px_2px_rgba(30,27,22,0.06),0_12px_32px_-24px_rgba(30,27,22,0.35)]";

/** Small handwritten margin note. Decorative by default (the same meaning is always in nearby text). */
export function HandwrittenNote({ children, className, decorative = true }: { children: ReactNode; className?: string; decorative?: boolean }) {
  return (
    <span aria-hidden={decorative || undefined} className={cn("font-script text-[1.65rem] leading-none text-accent-2", className)}>
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, note, children, align = "left", id }: { eyebrow: string; title: ReactNode; note?: string; children?: ReactNode; align?: "left" | "center"; id?: string }) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">{eyebrow}</div>
      <h2 id={id} className="font-display mt-3 text-3xl font-semibold leading-[1.1] sm:text-[2.6rem]">
        {title}
      </h2>
      {note && <HandwrittenNote className="mt-2 inline-block -rotate-2">{note}</HandwrittenNote>}
      {children && <div className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{children}</div>}
    </div>
  );
}

export function PaperSection({ id, children, className, tinted }: { id?: string; children: ReactNode; className?: string; tinted?: boolean }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn("scroll-mt-20 border-b border-border/70", tinted && "bg-surface/45", className)}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">{children}</div>
    </section>
  );
}

/** "SAMPLE" stamp for any illustrative content, so nothing reads as real user data. */
export function SampleStamp({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex -rotate-3 items-center rounded-sm border border-accent-2/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.2em] text-accent-2", className)}>
      SAMPLE
    </span>
  );
}
