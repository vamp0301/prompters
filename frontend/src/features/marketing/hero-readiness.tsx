"use client";
import { motion, useReducedMotion } from "motion/react";
import { ScoreRing } from "@/components/ui/progress";

/** Illustrative example on the landing page — clearly labelled as a sample. */
const SAMPLE = [
  ["Backend", 91],
  ["DSA", 72],
  ["Database", 84],
  ["DevOps", 61],
  ["System design", 54],
  ["Projects", 88],
] as const;

export function HeroReadiness() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl border border-border bg-surface p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
      aria-label="Example readiness dashboard"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Readiness score</span>
        <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-subtle">example</span>
      </div>
      <div className="mt-4 flex items-center gap-6">
        <ScoreRing value={78} size={128} label="Example readiness" sub="Backend" />
        <div className="text-sm">
          <div className="font-medium">Almost Backend interview ready</div>
          <div className="mt-1 text-muted">+6 in the last 7 days</div>
        </div>
      </div>
      <ul className="mt-5 space-y-2.5">
        {SAMPLE.map(([label, v], i) => (
          <li key={label} className="grid grid-cols-[110px_1fr_34px] items-center gap-3 text-sm">
            <span className="text-muted">{label}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-surface-2">
              <motion.span
                className="block h-full rounded-full bg-accent"
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${v}%` }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.08 }}
              />
            </span>
            <span className="text-right font-mono tabular-nums">{v}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 rounded-lg border border-border bg-surface-2 p-3 text-xs">
        <div className="mb-1 font-mono uppercase tracking-wider text-subtle">Next 3 actions</div>
        <div>→ Complete Redis caching</div>
        <div>→ Revise binary search</div>
        <div>→ Attempt backend mock test</div>
      </div>
    </motion.div>
  );
}
