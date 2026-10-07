"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenCheck, Check } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { ResumeSkillList } from "@/lib/api/types";

export const guideHref = (name: string) => `/career/skills/guide?name=${encodeURIComponent(name)}`;

/** Every skill on the latest resume, grouped — each opens a study guide. */
export function SkillsView() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["career", "skills"], queryFn: () => api.get<ResumeSkillList>("/career/skills") });
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const d = data!;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learn your resume"
        title="Every skill on your resume, explained"
        description="Pick a skill to learn what it is, how it's built into real software, its perks and drawbacks, and the interview questions you'll face on it."
      />
      {!d.resume ? (
        <EmptyState
          icon={<BookOpenCheck className="size-4" />}
          title="Upload your resume first"
          description="We read your skills from it, then you can study each one."
          action={<Link href="/career" className={buttonClass("primary")}>Upload resume</Link>}
        />
      ) : (
        d.groups.map((g, gi) => (
          <section key={g.group} aria-label={g.group} className="fade-up space-y-3" style={{ animationDelay: `${gi * 60}ms` }}>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">{g.group}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.skills.map((s) => (
                <li key={s.key}>
                  <Link href={guideHref(s.name)} className="group block h-full">
                    <Card className="paper-lift h-full">
                      <CardBody className="flex h-full flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-display text-lg font-semibold group-hover:text-accent">{s.name}</span>
                          {s.guideReady && <Check className="size-4 text-accent" aria-label="Guide ready" />}
                        </div>
                        <p className="text-xs text-muted">{s.usedIn.length ? `Used in ${s.usedIn.join(", ")}` : "Listed on your resume"}</p>
                        <p className="mt-auto flex items-center justify-between pt-2 text-xs">
                          <span className="text-muted">{s.questions ? `${s.questions} interview question${s.questions === 1 ? "" : "s"} · ${s.confident} confident` : "No Top-100 questions yet"}</span>
                          <span className="inline-flex items-center gap-1 font-medium text-accent">
                            Learn <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                          </span>
                        </p>
                      </CardBody>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
