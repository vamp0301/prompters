"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";
import { SampleStamp } from "./paper";

type Priority = "INTENSE" | "IMPORTANT" | "GOOD" | "MAY BE ASKED";

/** Illustrative only — labelled SAMPLE. Real questions come from the visitor's own resume after sign-up. */
const SAMPLES: { priority: Priority; category: string; skill: string; question: string; why: string; resume: string; hint: string }[] = [
  {
    priority: "INTENSE",
    category: "Project",
    skill: "JWT",
    question: "How does JWT authentication work in your project, and where is the token verified?",
    why: "Tests whether you understand authentication beyond a memorised definition.",
    resume: "“Implemented JWT-based authentication with refresh tokens”",
    hint: "Walk through issue → store → send → verify → expire.",
  },
  {
    priority: "IMPORTANT",
    category: "Resume claim",
    skill: "MongoDB",
    question: "You cut API latency by 40% with indexes. How did you decide the field order of the compound index?",
    why: "A number on a resume is an invitation to drill into it.",
    resume: "“Reduced p95 latency by 40% using MongoDB compound indexes”",
    hint: "Equality fields first, then sort, then range.",
  },
  {
    priority: "GOOD",
    category: "Scenario",
    skill: "Node.js",
    question: "Your API slows down under load and CPU stays at 100%. How do you find what's blocking the event loop?",
    why: "Checks whether you can debug, not just build.",
    resume: "“Built REST APIs with Node.js and Express”",
    hint: "Profile first; look for synchronous work on the hot path.",
  },
  {
    priority: "MAY BE ASKED",
    category: "Conceptual",
    skill: "SQL",
    question: "What problem do database transactions solve, and when would you not use one?",
    why: "Fundamentals behind the databases on your resume.",
    resume: "“PostgreSQL” listed under skills",
    hint: "Think about partial writes and isolation.",
  },
];

const TONE: Record<Priority, string> = {
  INTENSE: "text-accent-2 border-accent-2/40 bg-accent-2-soft",
  IMPORTANT: "text-warn border-warn/40 bg-warn-soft",
  GOOD: "text-accent border-accent/40 bg-accent-soft",
  "MAY BE ASKED": "text-muted border-border-strong bg-surface-2",
};

export function PriorityTag({ priority }: { priority: Priority }) {
  return <span className={cn("rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em]", TONE[priority])}>{priority}</span>;
}

/**
 * Stacked interview-notebook cards. Auto-advances every ~3s while visible; pauses on hover/focus.
 * Under reduced motion it never auto-advances and changes cards without movement.
 */
export function QuestionPreview() {
  const reduce = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const q = SAMPLES[i];
  const go = (d: number) => setI((x) => (x + d + SAMPLES.length) % SAMPLES.length);

  useEffect(() => {
    if (reduce || hold || !inView) return;
    const t = setInterval(() => setI((x) => (x + 1) % SAMPLES.length), 3200);
    return () => clearInterval(t);
  }, [reduce, hold, inView]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHold(false)}
    >
      {/* Sheets underneath, for the stacked-paper look. */}
      <div aria-hidden className="absolute inset-x-6 -bottom-3 top-6 rotate-[2.5deg] rounded-lg border border-border bg-surface-2" />
      <div aria-hidden className="absolute inset-x-3 -bottom-1.5 top-3 -rotate-[1.5deg] rounded-lg border border-border bg-surface" />

      <section aria-roledescription="carousel" aria-label="Sample interview questions" className="relative rounded-lg border border-border bg-surface shadow-[0_18px_40px_-26px_rgba(30,27,22,0.45)]">
        <div className="min-h-[21rem] overflow-hidden rounded-xl p-5 sm:p-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={i}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SAMPLES.length}`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduce ? 0 : 0.28 }}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <PriorityTag priority={q.priority} />
                <span className="font-mono text-[11px] text-subtle">
                  {q.category} · {q.skill}
                </span>
                <SampleStamp className="ml-auto" />
              </div>
              <h3 className="font-display text-xl font-semibold leading-snug">{q.question}</h3>
              <dl className="space-y-2.5 text-sm">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">Why this is asked</dt>
                  <dd className="text-muted">{q.why}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">From the resume</dt>
                  <dd className="text-muted italic">{q.resume}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">Hint</dt>
                  <dd className="text-muted">{q.hint}</dd>
                </div>
              </dl>
            </motion.article>
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <button type="button" onClick={() => go(-1)} className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-text" aria-label="Previous sample question">
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <div className="flex gap-1.5" aria-hidden>
            {SAMPLES.map((_, k) => (
              <span key={k} className={cn("h-1 rounded-full transition-all", k === i ? "w-5 bg-text" : "w-1.5 bg-border-strong")} />
            ))}
          </div>
          <button type="button" onClick={() => go(1)} className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-text" aria-label="Next sample question">
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </section>
    </div>
  );
}
