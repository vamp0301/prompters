"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

/** Resume sections drawn on the sheet: heading width + body line widths (%), so the sheet reads like a CV. */
const SECTIONS = [
  { heading: 34, lines: [92, 78] },
  { heading: 26, lines: [88, 95, 70] },
  { heading: 30, lines: [96, 84, 62] },
  { heading: 22, lines: [80, 58] },
];
const LOOKING_FOR = ["Skills", "Projects", "Experience", "Achievements", "Claims"];
/** Index of each section's first body line, so every line gets its own scan delay. */
const OFFSETS = SECTIONS.map((_, i) => SECTIONS.slice(0, i).reduce((a, s) => a + s.lines.length, 0));

/**
 * "Your resume is being read": a sheet with a scan line passing over it. Chips on the right are
 * the real skills and projects found on the resume (from the server), never placeholders — until
 * they arrive it says what is being looked for. With reduced motion the scan line stays still.
 */
export function ResumeReader({
  reading,
  label,
  skills = [],
  projects = [],
  level,
  className,
}: {
  reading: boolean;
  label?: string;
  skills?: string[];
  projects?: string[];
  /** e.g. "Student / fresher · 6 months of experience" */
  level?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const found = skills.length + projects.length > 0;
  const scanning = reading && !reduce;

  return (
    <div className={cn("grid gap-5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-start", className)}>
      <div aria-hidden className="relative mx-auto aspect-[3/4] w-40 overflow-hidden rounded-lg border border-border bg-surface shadow-sm sm:w-full">
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
          <FileText className="size-3 text-accent" />
          <span className="truncate font-mono text-[9px] text-muted">{label ?? "resume"}</span>
        </div>
        <div className="space-y-2.5 px-3 py-2.5">
          {SECTIONS.map((s, i) => (
            <div key={i} className="space-y-1">
              <div className="h-1.5 rounded-full bg-text/50" style={{ width: `${s.heading}%` }} />
              {s.lines.map((w, j) => (
                <motion.div
                  key={j}
                  className={cn("h-1 rounded-full", scanning ? "bg-accent/70" : "bg-subtle/50")}
                  style={{ width: `${w}%` }}
                  // Lines light up as the scan line passes them, then settle once reading is done.
                  animate={scanning ? { opacity: [0.25, 1, 0.4] } : { opacity: found ? 0.9 : 0.6 }}
                  transition={scanning ? { duration: 2.4, delay: (OFFSETS[i] + j) * 0.16, repeat: Infinity, repeatDelay: 0.6 } : { duration: 0.3 }}
                />
              ))}
            </div>
          ))}
        </div>
        {reading && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-accent/25 to-transparent"
            style={{ top: reduce ? "40%" : undefined }}
            animate={reduce ? undefined : { top: ["-10%", "100%"] }}
            transition={reduce ? undefined : { duration: 2.4, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
          >
            <div className="absolute inset-x-0 top-1/2 h-px bg-accent shadow-[0_0_8px_var(--accent)]" />
          </motion.div>
        )}
      </div>

      <div className="min-w-0 space-y-3" role="status" aria-live="polite">
        <p className="text-sm font-medium">{reading ? "Reading your resume…" : found ? "Found on your resume" : "Resume read"}</p>
        {!found ? (
          <p className="text-xs text-muted">
            Looking for{" "}
            {LOOKING_FOR.map((x, i) => (
              <span key={x}>
                <span className="text-text">{x}</span>
                {i < LOOKING_FOR.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
        ) : (
          <>
            {level && <p className="text-xs text-muted">Questions pitched at: <span className="text-text">{level}</span></p>}
            <ChipGroup title="Skills" items={skills} reduce={!!reduce} />
            <ChipGroup title="Projects & roles" items={projects} reduce={!!reduce} />
          </>
        )}
      </div>
    </div>
  );
}

function ChipGroup({ title, items, reduce }: { title: string; items: string[]; reduce: boolean }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1.5 font-mono text-[10px] tracking-widest text-subtle uppercase">
        {title} · {items.length}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        <AnimatePresence initial={!reduce}>
          {items.map((x, i) => (
            <motion.li
              key={x}
              initial={reduce ? false : { opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, delay: reduce ? 0 : i * 0.06 }}
              className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs"
            >
              {x}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
