"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import type { Visualization } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * Data-driven step-through visual. Admins configure kind + steps in the CMS —
 * no React change is needed for a new animation.
 */
export function Visualizer({ viz }: { viz: Visualization }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduce = useReducedMotion();
  const steps = viz.steps;
  const stacked = ["STACK", "QUEUE"].includes(viz.kind);

  useEffect(() => {
    if (!playing || i >= steps.length - 1) return;
    const t = setTimeout(() => {
      setI(i + 1);
      if (i + 1 >= steps.length - 1) setPlaying(false);
    }, steps[i].durationMs ?? 2200);
    return () => clearTimeout(t);
  }, [playing, i, steps]);

  return (
    <figure className="rounded-xl border border-border bg-surface-2/50 p-4" aria-label={`Visual: ${viz.title}`}>
      <figcaption className="mb-4 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{viz.title}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-subtle">{viz.kind.replace("_", " ")}</span>
      </figcaption>

      <div className={cn("flex gap-2 overflow-x-auto pb-2", stacked && "flex-col-reverse items-stretch")} role="list">
        {steps.map((s, idx) => (
          <div key={idx} role="listitem" className={cn("flex items-center gap-2", !stacked && "shrink-0")}>
            <button
              onClick={() => { setI(idx); setPlaying(false); }}
              aria-current={idx === i ? "step" : undefined}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-xs transition-all",
                stacked ? "w-full" : "min-w-28 max-w-40",
                idx === i ? "border-accent bg-accent-soft text-text shadow-[0_0_0_3px_var(--accent-soft)]" : idx < i ? "border-border-strong bg-surface text-muted" : "border-border bg-surface text-subtle",
              )}
            >
              <span className="block font-mono text-[10px] text-subtle">{String(idx + 1).padStart(2, "0")}</span>
              <span className="line-clamp-2 font-medium">{s.highlight ?? s.title}</span>
            </button>
            {!stacked && idx < steps.length - 1 && <span aria-hidden className={cn("text-subtle", idx < i && "text-accent")}>→</span>}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="mt-3 rounded-lg border border-border bg-surface p-4"
          aria-live="polite"
        >
          <div className="text-sm font-semibold">Step {i + 1}: {steps[i].title}</div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{steps[i].description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} aria-label="Previous step" className="rounded-md border border-border p-1.5 text-muted hover:text-text disabled:opacity-40"><ChevronLeft className="size-4" /></button>
        <button onClick={() => { if (i >= steps.length - 1) setI(0); setPlaying((p) => !p); }} aria-label={playing ? "Pause" : "Play"} className="rounded-md border border-border p-1.5 text-muted hover:text-text">
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button onClick={() => setI((x) => Math.min(steps.length - 1, x + 1))} disabled={i === steps.length - 1} aria-label="Next step" className="rounded-md border border-border p-1.5 text-muted hover:text-text disabled:opacity-40"><ChevronRight className="size-4" /></button>
        <button onClick={() => { setI(0); setPlaying(false); }} aria-label="Restart" className="rounded-md border border-border p-1.5 text-muted hover:text-text"><RotateCcw className="size-4" /></button>
        <div className="ml-2 h-1 flex-1 overflow-hidden rounded-full bg-surface"><div className="h-full bg-accent transition-[width]" style={{ width: `${((i + 1) / steps.length) * 100}%` }} /></div>
      </div>
    </figure>
  );
}
