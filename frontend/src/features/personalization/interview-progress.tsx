"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react";
import { paperCard } from "@/components/ui/paper";
import { api } from "@/lib/api/client";
import type { InterviewProgress as Progress } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);

/**
 * Interview → practice → next interview, per skill: "Caching 32% → 76%, after Cache-Aside".
 * Only real interview scores; skills asked in just one of the two interviews show a dash.
 */
export function InterviewProgress() {
  const q = useQuery({ queryKey: ["personalization", "interview-progress"], queryFn: () => api.get<Progress>("/personalization/interview-progress"), staleTime: 60_000 });
  if (!q.data || q.data.interviews === 0) return null;
  const d = q.data;
  const rows = d.skills.slice(0, 8);
  return (
    <section aria-labelledby="ip-title" className={cn(paperCard, "p-5")}>
      <p className="eyebrow text-accent">Interview progress</p>
      <h2 id="ip-title" className="font-display mt-1 text-2xl">
        {d.previous ? "Since your last interview" : "Your interview so far"}
      </h2>
      {!d.previous && (
        <p className="mt-1 text-xs text-muted">
          Take another mock interview after practising to see how each skill moved.{" "}
          <Link href="/career?tab=interview" className="text-accent underline underline-offset-4">
            Start one
          </Link>
        </p>
      )}
      <table className="mt-4 w-full text-[13px]">
        <thead>
          <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted">
            <th scope="col" className="pb-2 font-medium">Skill</th>
            {d.previous && <th scope="col" className="pb-2 text-right font-medium">Before</th>}
            <th scope="col" className="pb-2 text-right font-medium">{d.previous ? "Latest" : "Score"}</th>
            {d.previous && <th scope="col" className="pb-2 text-right font-medium">Change</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.skill} className="border-t border-border align-top">
              <td className="py-2">
                <span className="font-medium">{s.label}</span>
                {s.completedBetween.length > 0 && (
                  <span className="block text-[11px] text-muted">after: {s.completedBetween.map((r) => r.title).join(", ")}</span>
                )}
              </td>
              {d.previous && <td className="py-2 text-right font-mono tabular-nums text-muted">{pct(s.previous)}</td>}
              <td className="py-2 text-right font-mono tabular-nums">{pct(s.latest)}</td>
              {d.previous && (
                <td className={cn("py-2 text-right font-mono tabular-nums", s.change === null ? "text-muted" : s.change > 0 ? "text-accent" : s.change < 0 ? "text-danger" : "")}>
                  {s.change === null ? (
                    "—"
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      {s.change > 0 ? <TrendingUp className="size-3" aria-hidden /> : s.change < 0 ? <TrendingDown className="size-3" aria-hidden /> : null}
                      {s.change > 0 ? "+" : ""}
                      {Math.round(s.change * 100)}
                    </span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
