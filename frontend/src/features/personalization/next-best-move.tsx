"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, Mic, Sparkles, Target } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { StickyNote, TapedNote, paperCard } from "@/components/ui/paper";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { PersonalNext, PersonalRec, PersonalSkillState } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const personalKeys = { next: ["personalization", "next"] as const };

const LEVEL_LABEL = { easy: "Beginner", medium: "Intermediate", hard: "Advanced" } as const;
// On the yellow note, colour only marks HIGH; the rest use the note's own ink (readable contrast).
const PRIORITY_TONE = { HIGH: "text-accent-2", MEDIUM: "", LOW: "" } as const;

/** Which model ranked this, in plain words — never claims ML when it was the baseline. */
function engineLine(d: PersonalNext) {
  const e = d.engine;
  if (!e) return null;
  if (e.mode === "ml") return `Ranked by ${e.modelName} v${e.modelVersion}, trained on real outcomes.`;
  const why = e.modelStatus === "cold_start" ? "the learning model isn't trained yet" : e.modelStatus === "not_configured" ? "the learning model isn't switched on" : "the learning model is unavailable right now";
  return `Ranked by a transparent scoring formula — ${why}.`;
}

function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}

function Panel({ title, icon, children, className }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn(paperCard, "p-4", className)} aria-label={title}>
      <h3 className="eyebrow flex items-center gap-1.5 text-text">
        {icon} {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SkillRow({ s, value, label }: { s: PersonalSkillState; value: number; label: string }) {
  return (
    <li className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="truncate font-medium">{s.label}</span>
        <span className="font-mono text-[11px] text-muted tabular-nums">{label}</span>
      </div>
      <Progress value={value * 100} label={`${s.label}: ${label}`} />
    </li>
  );
}

export function NextBestMove() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: personalKeys.next, queryFn: () => api.get<PersonalNext>("/personalization/next"), staleTime: 60_000 });
  const { mutate: send } = useMutation({ meta: { silent: true }, mutationFn: (b: { recommendationId: string; action: string }) => api.post("/personalization/feedback", b) });
  const skip = useMutation({
    meta: { silent: true },
    mutationFn: (id: string) => api.post("/personalization/feedback", { recommendationId: id, action: "SKIPPED" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: personalKeys.next }),
  });
  // Recorded once per recommendation (the server ignores repeats): it's what makes "ignored" measurable.
  const shownId = q.data?.next?.id;
  useEffect(() => {
    if (shownId) send({ recommendationId: shownId, action: "SHOWN" });
  }, [shownId, send]);

  if (q.isLoading) return <div className={cn(paperCard, "h-48 animate-pulse")} aria-label="Loading your next best move" />;
  // Personalization must never break the dashboard.
  if (q.error || !q.data) return null;
  const d = q.data;
  const next = d.next;
  const accept = (r: PersonalRec) => send({ recommendationId: r.id, action: "ACCEPTED" });

  return (
    <section aria-labelledby="nbm-title" className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <TapedNote tape="Your next best move" className="rotate-0">
        {next ? (
          <>
            <p className="font-mono text-[11px] tracking-wide uppercase">{next.actionLabel}</p>
            <h2 id="nbm-title" className="font-display mt-1 text-[2rem] leading-[1.1]">
              {next.subject}
            </h2>
            {next.title !== next.subject && <p className="mt-2 text-[14px] leading-snug">{next.title}</p>}
            <div className="mt-4 border-t border-current/20 pt-3">
              <p className="text-[14px] leading-relaxed">
                <span className="font-semibold">Why: </span>
                {next.why}
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Reasons">
                {next.reasons.map((r) => (
                  <li key={r.code} className="rounded-full border border-current/25 px-2 py-0.5 text-[11px]">
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
              <div>
                <dt className="inline font-mono text-[10px] uppercase">Priority </dt>
                <dd className={cn("inline font-semibold", PRIORITY_TONE[next.priority])}>{next.priority}</dd>
              </div>
              {next.difficulty && (
                <div>
                  <dt className="inline font-mono text-[10px] uppercase">Difficulty </dt>
                  <dd className="inline font-semibold">{LEVEL_LABEL[next.difficulty].toUpperCase()}</dd>
                </div>
              )}
            </dl>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href={next.href} onClick={() => accept(next)} className={buttonClass("primary", "md")}>
                {next.actionLabel} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <button type="button" className="text-[13px] underline underline-offset-4" onClick={() => skip.mutate(next.id)} disabled={skip.isPending}>
                Not now
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="nbm-title" className="font-display text-[1.8rem] leading-tight">
              You&apos;re all caught up
            </h2>
            <p className="mt-3 text-[14px]">Nothing needs your attention right now. Keep going on your roadmap.</p>
          </>
        )}
        <p className="mt-5 text-[11px]">{engineLine(d)}</p>
      </TapedNote>

      <div className="grid gap-3 sm:grid-cols-2">
        {d.coldStart && (
          <StickyNote className="sm:col-span-2 text-[13px]">
            <Sparkles className="mr-1 inline size-3.5 text-accent" aria-hidden />
            Still getting to know you ({d.evidence} answers so far): suggestions lean on your resume, target role and roadmap, and get more personal as you practise.
          </StickyNote>
        )}
        <Panel title="Skill gaps" icon={<Target className="size-3.5 text-accent-2" aria-hidden />}>
          {d.skillGaps.length ? (
            <ul className="space-y-2.5">
              {d.skillGaps.map((s) => (
                <SkillRow key={s.conceptId} s={s} value={s.mastery} label={`${pct(s.mastery)} · ${s.attempts} answer${s.attempts === 1 ? "" : "s"}`} />
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted">No weak skills with evidence yet. Practise a few questions to find them.</p>
          )}
        </Panel>
        <Panel title="Due revisions" icon={<CalendarClock className="size-3.5 text-info" aria-hidden />}>
          {d.dueRevisions.length ? (
            <ul className="space-y-2 text-[13px]">
              {d.dueRevisions.map((s) => (
                <li key={s.conceptId} className="flex items-baseline justify-between gap-2">
                  <span className="truncate">{s.label}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted">{s.nextReview && new Date(s.nextReview) <= new Date() ? "due now" : "due soon"}</span>
                </li>
              ))}
              <li>
                <Link href="/reviews" className="text-[12px] text-accent underline underline-offset-4">
                  Open reviews
                </Link>
              </li>
            </ul>
          ) : (
            <p className="text-[13px] text-muted">Nothing due. Mastered topics come back here when they need a refresh.</p>
          )}
        </Panel>
        <Panel title="Interview weaknesses" icon={<Mic className="size-3.5 text-pink" aria-hidden />}>
          {d.interviewWeaknesses.length ? (
            <ul className="space-y-2.5">
              {d.interviewWeaknesses.map((s) => (
                <SkillRow key={s.conceptId} s={s} value={s.interviewAverage ?? 0} label={`${pct(s.interviewAverage ?? 0)} in interview`} />
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted">
              No weak spots from interviews yet.{" "}
              <Link href="/career?tab=interview" className="text-accent underline underline-offset-4">
                Take a mock interview
              </Link>
            </p>
          )}
        </Panel>
        <Panel title="Recommended practice" icon={<ArrowRight className="size-3.5 text-accent" aria-hidden />}>
          {d.recommendedPractice.length ? (
            <ul className="space-y-2 text-[13px]">
              {d.recommendedPractice.map((r) => (
                <li key={r.id}>
                  <Link href={r.href} onClick={() => accept(r)} className="group block">
                    <span className="block truncate font-medium group-hover:text-accent">
                      {r.actionLabel}: {r.subject}
                    </span>
                    <span className="block truncate text-[11px] text-muted">{r.reasons.map((x) => x.label).join(" · ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted">Practice suggestions appear once you have a Top-100 plan or skill evidence.</p>
          )}
        </Panel>
      </div>
    </section>
  );
}
