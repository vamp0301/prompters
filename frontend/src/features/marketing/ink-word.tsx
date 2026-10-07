"use client";
import { motion, useReducedMotion } from "motion/react";

/** The calligraphic "YOUR" with an ink stroke drawn underneath once (~1.2s). Static under reduced motion. */
export function InkWord({ children }: { children: string }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-block px-1">
      <span className="font-script relative z-10 text-[1.35em] font-normal leading-none text-accent-2">{children}</span>
      <svg aria-hidden viewBox="0 0 300 30" preserveAspectRatio="none" className="absolute -bottom-[0.12em] left-0 h-[0.32em] w-full overflow-visible">
        <motion.path
          d="M4 20 C 60 6, 120 26, 180 14 S 270 8, 296 16"
          fill="none"
          stroke="var(--accent-2)"
          strokeWidth="5"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0, opacity: 0.2 }}
          animate={{ pathLength: 1, opacity: 0.85 }}
          transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1], delay: 0.25 }}
        />
      </svg>
    </span>
  );
}
