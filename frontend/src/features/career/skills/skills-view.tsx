"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, BookOpenCheck, Network } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { KnowledgeTracks, ResumeSkillList } from "@/lib/api/types";
import { paperCard } from "@/components/ui/paper";
import { Progress } from "@/components/ui/progress";
import { mapHref } from "@/features/knowledge/map-view";
import { cn } from "@/lib/utils";

export const guideHref = (name: string) => `/career/skills/guide?name=${encodeURIComponent(name)}`;

/** Every skill on the latest resume, grouped — each opens a study guide. */
export function SkillsView() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["career", "skills"], queryFn: () => api.get<ResumeSkillList>("/career/skills") });
  const tracks = useQuery({ queryKey: ["knowledge", "tracks"], queryFn: () => api.get<KnowledgeTracks>("/career/knowledge") });
  const mastered = (key: string) => tracks.data?.skills.find((x) => x.key === key);
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const d = data!;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learn your resume"
        title="Every skill on your resume, explained"
        description="Each skill opens as a knowledge map: the exact concepts an interviewer can ask about, each one explained crisply with diagrams, code, trade-offs and interview questions — and mastered only when you can explain it."
      />

      <section aria-labelledby="tracks-h" className="space-y-3">
        <h2 id="tracks-h" className="eyebrow text-accent">Learning tracks</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {(tracks.data?.tracks ?? []).map((t) => (
            <li key={t.key}>
              <Link href={mapHref(t.name)} className={cn(paperCard, "paper-lift group flex h-full flex-col gap-3 p-5")}>
                <span className="flex items-start justify-between gap-2">
                  <span className="font-display text-2xl group-hover:text-accent">{t.name}</span>
                  <Network className="size-5 text-accent" aria-hidden />
                </span>
                <span className="text-xs text-muted">
                  {t.concepts} concepts across {t.domains} domains — from foundations to real case studies.
                </span>
                <Progress value={(t.mastered / t.concepts) * 100} label={`${t.name} mastered ${t.mastered} of ${t.concepts}`} />
                <span className="flex items-center justify-between text-xs">
                  <span className="text-muted">
                    {t.mastered} mastered · {t.started} started
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-accent">
                    Open track <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
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
                  <Card className="paper-lift h-full">
                    <CardBody className="flex h-full flex-col gap-2">
                      <Link href={mapHref(s.name)} className="font-display text-xl hover:text-accent">
                        {s.name}
                      </Link>
                      <p className="text-xs text-muted">{s.usedIn.length ? `Used in ${s.usedIn.join(", ")}` : "Listed on your resume"}</p>
                      <p className="text-xs text-muted">
                        {mastered(s.key)?.started ? `${mastered(s.key)!.mastered} concepts mastered · ${mastered(s.key)!.started} started` : "Not started yet"}
                        {s.questions ? ` · ${s.questions} Top-100 question${s.questions === 1 ? "" : "s"}` : ""}
                      </p>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                        <Link href={guideHref(s.name)} className="inline-flex items-center gap-1 text-muted hover:text-text">
                          <BookOpen className="size-3.5" aria-hidden /> Overview
                        </Link>
                        <Link href={mapHref(s.name)} className="inline-flex items-center gap-1 font-bold text-accent">
                          Knowledge map <ArrowRight className="size-3.5" aria-hidden />
                        </Link>
                      </div>
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
