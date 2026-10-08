"use client";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Info } from "lucide-react";
import { Tabs } from "@/components/ui/misc";
import { paperCard, StudyStamp } from "@/components/ui/paper";
import { cn } from "@/lib/utils";
import { BY_GOAL, LANGS, MARKET, SYLLABUS, type SyllabusLang } from "./data";

/** "Which language is most in demand?" — survey usage, clearly labelled, plus a pick by career goal. */
export function MarketDemand() {
  const reduce = useReducedMotion();
  const max = Math.max(...MARKET.usage.map((u) => u.pct));
  return (
    <section aria-labelledby="demand-heading" className="space-y-5">
      <div>
        <h2 id="demand-heading" className="font-display text-3xl leading-tight">Which language is most in demand?</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          By developer usage, <strong className="text-text">JavaScript</strong> is the most used of the four, with <strong className="text-text">Python</strong> close behind. Java and C++ are used
          by fewer developers overall but remain core in enterprise backends and performance-critical software.
        </p>
      </div>

      <div className={cn(paperCard, "p-5 sm:p-6")}>
        <ul className="space-y-4">
          {MARKET.usage.map((u, i) => (
            <li key={u.lang}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{u.lang}</span>
                <span className="font-mono text-xs tabular-nums text-muted">
                  {u.pct.toFixed(1)}% · #{u.rank} overall
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  className={cn("h-full rounded-full", i === 0 ? "bg-accent" : "bg-text/70")}
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${(u.pct / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : i * 0.08, ease: "easeOut" }}
                  style={reduce ? { width: `${(u.pct / max) * 100}%` } : undefined}
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-xs leading-relaxed text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <p>
            Share of all respondents who used the language in the past year — <strong className="text-text">usage, not the number of job openings</strong>. Job demand changes by role, city and
            company. Source:{" "}
            <a href={MARKET.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-text underline underline-offset-2">
              {MARKET.source}
              <ArrowUpRight className="size-3" aria-hidden />
            </a>
            , checked {MARKET.checked}.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Pick by the job you want</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BY_GOAL.map((g) => (
            <div key={g.goal} className={cn(paperCard, "paper-lift p-4")}>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">{g.goal}</div>
              <div className="mt-1.5 font-semibold text-accent">{g.pick}</div>
              <p className="mt-1 text-sm text-muted">{g.why}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type View = SyllabusLang | "compare";

/** The same 16 modules for every language; each tab shows only that language's topics. */
export function SyllabusBrowser({ roadmapHref = "/roadmap" }: { roadmapHref?: string }) {
  const [view, setView] = useState<View>("python");
  const lang = LANGS.find((l) => l.key === view);
  const total = SYLLABUS.reduce((n, m) => n + m.topics.python.length, 0);

  return (
    <section aria-labelledby="syllabus-heading" className="space-y-5">
      <div>
        <h2 id="syllabus-heading" className="font-display text-3xl leading-tight">One syllabus, four languages</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Python, JavaScript, Java and C++ follow exactly the same {SYLLABUS.length} modules and {total} topics in the same order. Every topic inside a track belongs to that language only.
        </p>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <Tabs value={view} onChange={setView} items={[...LANGS.map((l) => ({ value: l.key as View, label: l.label })), { value: "compare" as View, label: "Compare all" }]} />
      </div>

      {lang && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          {lang.inPlatform ? (
            <>
              <StudyStamp>GUIDED LESSONS</StudyStamp>
              Lessons, quizzes and runnable code for {lang.label} are on the{" "}
              <Link href={roadmapHref} className="text-text underline underline-offset-2">
                roadmap
              </Link>
              .
            </>
          ) : (
            <>
              <StudyStamp tone="muted">SYLLABUS ONLY</StudyStamp>
              In-browser {lang.label} lessons and code running are not available yet — use this as your study checklist.
            </>
          )}
        </p>
      )}

      {view === "compare" ? <CompareTable /> : <LanguageModules lang={view} />}
    </section>
  );
}

function LanguageModules({ lang }: { lang: SyllabusLang }) {
  return (
    <ol className="grid gap-3 md:grid-cols-2">
      {SYLLABUS.map((m) => (
        <li key={m.n} className={cn(paperCard, "fade-up p-4")}>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs font-semibold text-accent tabular-nums">{String(m.n).padStart(2, "0")}</span>
            <div className="min-w-0">
              <h3 className="font-semibold">{m.title}</h3>
              <p className="text-xs text-subtle">{m.goal}</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
            {m.topics[lang].map((t) => (
              <li key={t} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function CompareTable() {
  return (
    <div className={cn(paperCard, "overflow-x-auto")}>
      <table className="w-full min-w-224 text-left text-sm">
        <caption className="sr-only">Same modules across Python, JavaScript, Java and C++</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="w-48 px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-subtle">
              Module
            </th>
            {LANGS.map((l) => (
              <th key={l.key} scope="col" className="px-4 py-3 font-semibold">
                {l.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SYLLABUS.map((m) => (
            <tr key={m.n} className="border-b border-border align-top last:border-0">
              <th scope="row" className="px-4 py-3 font-medium">
                <span className="mr-2 font-mono text-xs text-accent">{String(m.n).padStart(2, "0")}</span>
                {m.title}
              </th>
              {LANGS.map((l) => (
                <td key={l.key} className="px-4 py-3 text-muted">
                  <ul className="space-y-1">
                    {m.topics[l.key].map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
