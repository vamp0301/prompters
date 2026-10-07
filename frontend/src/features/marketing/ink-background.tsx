"use client";
import { useInView } from "@/hooks/use-in-view";

/**
 * Hero backdrop: faint graph paper plus slow ink-wash blobs. Blobs are radial gradients (no blur
 * filter) moving with transform only; they pause off-screen and stop under reduced motion.
 */
export function InkBackground() {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} data-paused={!inView} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="graph-paper absolute inset-0 opacity-70" />
      <div
        className="anim absolute -left-[12%] -top-[18%] h-[70%] w-[60%] rounded-full"
        style={{ background: "radial-gradient(closest-side, var(--ink-green), transparent)", animation: "ink-drift-a 32s ease-in-out infinite" }}
      />
      <div
        className="anim absolute -right-[10%] top-[10%] h-[65%] w-[50%] rounded-full"
        style={{ background: "radial-gradient(closest-side, var(--ink-red), transparent)", animation: "ink-drift-b 38s ease-in-out infinite" }}
      />
      <div
        className="anim absolute bottom-[-25%] left-[30%] hidden h-[60%] w-[45%] rounded-full sm:block"
        style={{ background: "radial-gradient(closest-side, var(--ink-indigo), transparent)", animation: "ink-drift-c 28s ease-in-out infinite" }}
      />
    </div>
  );
}
