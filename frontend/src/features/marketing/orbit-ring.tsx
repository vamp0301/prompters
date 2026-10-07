"use client";
import { useState, type ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";

const RING = "RESUME • TOP 100 • PRACTICE • INTERVIEW • READINESS • RESUME • TOP 100 • PRACTICE • INTERVIEW • READINESS • ";

/** Chips orbit on their own radius and speed; each is counter-rotated so the label stays upright. */
const CHIPS = [
  { label: "Node.js", radius: 47, duration: 46, delay: 0 },
  { label: "React", radius: 48.5, duration: 58, delay: -14 },
  { label: "SQL", radius: 46.5, duration: 52, delay: -31 },
  { label: "REST APIs", radius: 49, duration: 64, delay: -45 },
  { label: "Docker", radius: 47.5, duration: 50, delay: -22 },
];

/**
 * An editorial orbit around the upload card: a slowly turning ring of text plus a few skill chips.
 * Purely decorative — the card works the same without it. Pauses on hover/focus and off-screen;
 * chips are hidden below 640px; everything is static under reduced motion.
 */
export function OrbitRing({ children }: { children: ReactNode }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [hold, setHold] = useState(false);
  const paused = !inView || hold;

  return (
    <div
      ref={ref}
      data-paused={paused}
      className="relative"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHold(false)}
    >
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 hidden aspect-square w-[128%] -translate-x-1/2 -translate-y-1/2 sm:block">
        <svg viewBox="0 0 600 600" className="anim size-full" style={{ animation: "spin-slow 40s linear infinite" }}>
          <defs>
            <path id="orbit-path" d="M300,300 m-270,0 a270,270 0 1,1 540,0 a270,270 0 1,1 -540,0" />
          </defs>
          <circle cx="300" cy="300" r="270" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 6" />
          <text className="fill-[var(--subtle)] font-mono" fontSize="13" letterSpacing="5">
            <textPath href="#orbit-path">{RING}</textPath>
          </text>
        </svg>
        {CHIPS.map((c) => (
          <div
            key={c.label}
            className="anim absolute inset-0"
            style={{ animation: `spin-slow ${c.duration}s linear infinite`, animationDelay: `${c.delay}s` }}
          >
            {/* `top` is relative to the square ring, so radius is a % of its size. */}
            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ top: `${50 - c.radius}%` }}>
              <span
                className="anim block rounded-sm border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-muted shadow-sm"
                style={{ animation: `spin-slow-reverse ${c.duration}s linear infinite`, animationDelay: `${c.delay}s` }}
              >
                {c.label}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
