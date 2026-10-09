"use client";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The Prompters mark: a geometric P split in two. The bowl is a speech bubble (the prompt); the
 * detached leg is a text cursor. Read quickly it is a bold P; read slowly it is "a prompt, waiting".
 * Drawn on a 64-unit grid. Geometry lives here only — favicon/app icon/SVG files mirror these paths.
 */
export const MARK = {
  viewBox: "0 0 64 64",
  /** Bubble: outer shape, then the counter (even-odd fill cuts it out). */
  bubble: "M12 4H34A18.5 18.5 0 0 1 34 41H12ZM24 16V29H34A6.5 6.5 0 0 0 34 16Z",
  /** Cursor block: the P's leg, separated from the bubble by a 5-unit gap. */
  cursor: { x: 12, y: 46, width: 12, height: 14 },
} as const;

type Animate = false | "once" | "loop";
const CYCLE = 3;
/** Middle of the opening between the bubble (bottom y 41) and the cursor (top y 46). */
const GAP_Y = 43.5;

/**
 * Motion, 1.8 s (input → intelligence → learning → progress):
 * the bubble settles in; a point enters through the gap; it grows into the cursor; the cursor
 * blinks once. Static and complete at rest; no motion at all with prefers-reduced-motion.
 */
export function BrandMark({ size = 32, animate = false, accent = false, className, title }: { size?: number; animate?: Animate; accent?: boolean; className?: string; title?: string }) {
  const reduce = useReducedMotion();
  const on = !!animate && !reduce;
  // Loop: every part repeats on the same 3 s cycle (its own duration + a pause).
  const loop = (duration: number) => ({ duration, ...(animate === "loop" ? { repeat: Infinity, repeatDelay: CYCLE - duration } : {}) });
  const { x, y, width, height } = MARK.cursor;
  const cursorColor = accent ? "var(--accent)" : "currentColor";
  return (
    <svg viewBox={MARK.viewBox} width={size} height={size} className={cn("shrink-0", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <motion.path
        d={MARK.bubble}
        fill="currentColor"
        fillRule="evenodd"
        style={{ transformOrigin: "12px 22px", transformBox: "view-box" }}
        initial={on ? { opacity: 0, scale: 0.86 } : false}
        animate={on ? { opacity: [0, 1, 1], scale: [0.86, 1.02, 1] } : undefined}
        transition={on ? { ...loop(0.55), times: [0, 0.7, 1], ease: "easeOut" } : undefined}
      />
      {on && (
        // The point: travels in through the opening between bubble and leg (y 41–46).
        <motion.circle
          r={2.2}
          cy={GAP_Y}
          fill={cursorColor}
          initial={{ cx: -4, opacity: 0 }}
          animate={{ cx: [-4, -4, x + width / 2, x + width / 2], opacity: [0, 1, 1, 0] }}
          transition={{ ...loop(1.0), times: [0, 0.45, 0.85, 1], ease: "easeInOut" }}
        />
      )}
      <motion.rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={cursorColor}
        style={{ transformOrigin: `${x + width / 2}px ${y}px`, transformBox: "view-box" }}
        initial={on ? { scaleY: 0, opacity: 0 } : false}
        animate={on ? { scaleY: [0, 0, 1, 1, 1, 1], opacity: [0, 0, 1, 1, 0.2, 1] } : undefined}
        transition={on ? { ...loop(1.8), times: [0, 0.47, 0.62, 0.75, 0.85, 1], ease: "easeOut" } : undefined}
      />
    </svg>
  );
}

/** The lowercase wordmark. */
export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("font-extrabold leading-none tracking-[-0.055em]", className)}>prompters</span>;
}
