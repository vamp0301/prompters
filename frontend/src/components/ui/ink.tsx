"use client";
import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** A hand-drawn ellipse that draws itself around a word when it scrolls into view. */
export function ScribbleCircle({ children, className, color = "var(--stamp-red)" }: { children: ReactNode; className?: string; color?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className={cn("relative inline-block px-2", className)}>
      <span className="relative z-10">{children}</span>
      <svg aria-hidden viewBox="0 0 200 80" preserveAspectRatio="none" className="pointer-events-none absolute -inset-x-1 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+0.5rem)] overflow-visible">
        <motion.path
          d="M30 12 C 90 -2, 190 8, 194 38 C 198 70, 70 82, 18 64 C -12 52, 6 22, 46 10"
          fill="none"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1], delay: 0.2 }}
        />
      </svg>
    </span>
  );
}

/** A pen underline that draws in under a phrase. */
export function ScribbleUnderline({ children, className, color = "var(--stamp-red)" }: { children: ReactNode; className?: string; color?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className={cn("relative inline-block", className)}>
      {children}
      <svg aria-hidden viewBox="0 0 300 20" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-2 left-0 h-3 w-full overflow-visible">
        <motion.path
          d="M3 12 C 70 4, 150 16, 220 8 S 290 9, 297 11"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1], delay: 0.3 }}
        />
      </svg>
    </span>
  );
}

/**
 * Typewriter reveal: types the text once (caret only while typing). Screen readers get the
 * full text immediately; under reduced motion it renders complete at once.
 */
export function TypeOut({ text, className, speed = 55, startDelay = 250 }: { text: string; className?: string; speed?: number; startDelay?: number }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduce) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      i += 1;
      setN(i);
      if (i < text.length) timer = setTimeout(tick, speed);
    };
    timer = setTimeout(tick, startDelay);
    return () => clearTimeout(timer);
  }, [text, speed, startDelay, reduce]);
  const shown = reduce ? text : text.slice(0, n);
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {/* The untyped remainder is laid out invisibly, so nothing shifts while typing. */}
      <span aria-hidden>
        {shown}
        {!reduce && n < text.length && <span className="type-caret inline-block w-[0.07em] translate-y-[0.08em] bg-current" style={{ height: "0.85em" }} />}
        <span className="invisible">{text.slice(shown.length)}</span>
      </span>
    </span>
  );
}
