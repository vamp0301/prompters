import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InkAnnotation, StudyStamp } from "@/components/ui/paper";

// Shared scrapbook primitives live in components/ui/paper; these names are kept for the landing page.
export { paperCard, InkAnnotation as HandwrittenNote } from "@/components/ui/paper";

export function SectionHeading({ eyebrow, title, note, children, align = "left", id }: { eyebrow: string; title: ReactNode; note?: string; children?: ReactNode; align?: "left" | "center"; id?: string }) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">{eyebrow}</div>
      <h2 id={id} className="font-display mt-3 text-3xl font-semibold leading-[1.1] sm:text-[2.6rem]">
        {title}
      </h2>
      {note && <InkAnnotation className="mt-2 inline-block -rotate-2">{note}</InkAnnotation>}
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
    <StudyStamp tone="red" className={className}>
      SAMPLE
    </StudyStamp>
  );
}
