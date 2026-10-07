"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Briefcase, FileText, Loader2, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { CareerOverview as Overview, PrepCategory, PrepPriority } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { PREP_CATEGORY, PREP_CATEGORY_ORDER, PRIORITY, PRIORITY_ORDER } from "@/features/career/prep/prep-shared";

const SKILL_GROUPS: { key: "languages" | "frameworks" | "databases" | "cloud" | "devops" | "other"; label: string }[] = [
  { key: "languages", label: "Languages" },
  { key: "frameworks", label: "Frameworks" },
  { key: "databases", label: "Databases" },
  { key: "cloud", label: "Cloud" },
  { key: "devops", label: "DevOps" },
  { key: "other", label: "Other" },
];
const RISK_TONE = { HIGH: "danger", MEDIUM: "warn", LOW: "neutral" } as const;
const BAR: Record<PrepPriority, string> = { INTENSE: "bg-danger", IMPORTANT: "bg-warn", GOOD: "bg-accent", MAY_BE_ASKED: "bg-subtle" };

/** One labelled bar: count and share of the plan; links to the Top 100 pre-filtered. */
function SplitBar({ label, count, total, href, barClass }: { label: string; count: number; total: number; href: string; barClass: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <Link href={href} className="group grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)_2.5rem] items-center gap-3 rounded-md px-1 py-1 text-sm hover:bg-surface-2">
      <span className="truncate group-hover:text-accent">{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <span className={cn("block h-full rounded-full transition-[width] duration-700", barClass)} style={{ width: `${pct}%` }} />
      </span>
      <span className="text-right font-mono text-xs tabular-nums text-muted">{count}</span>
    </Link>
  );
}

/** Dashboard block: what Career AI found in your resume, and your Top 100 split by priority and category. */
export function CareerOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["career", "overview"],
    queryFn: () => api.get<Overview>("/career/overview"),
    refetchInterval: (q) => (q.state.data?.plan && (q.state.data.plan.status === "QUEUED" || q.state.data.plan.status === "RUNNING") ? 5000 : false),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (error || !data) return null; // the rest of the dashboard still works if career data can't load

  if (!data.resume) {
    return (
      <Card className="glass">
        <CardBody className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="font-display text-lg font-semibold">Let Career AI read your resume</h2>
            <p className="text-sm text-muted">Upload it once — we&apos;ll show your skills, projects and the claims interviewers will probe, then build your Top 100 questions.</p>
          </div>
          <Link href="/career" className={buttonClass("primary")}>
            Upload resume <ArrowRight className="size-4" aria-hidden />
          </Link>
        </CardBody>
      </Card>
    );
  }

  const r = data.resume;
  const p = data.plan;
  const planHref = p ? `/career/prep/${p.id}` : "/career";
  const years = r.experienceMonths >= 12 ? `${Math.floor(r.experienceMonths / 12)}+ yr` : r.experienceMonths ? `${r.experienceMonths} mo` : "Fresher";
  const confident = p?.practice.CONFIDENT ?? 0;

  return (
    <section aria-labelledby="career-ai-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">Career AI</div>
          <h2 id="career-ai-title" className="font-display text-xl font-semibold">
            {r.name ? `${r.name.split(" ")[0]}'s` : "Your"} interview picture
          </h2>
        </div>
        <div className="flex gap-4 text-xs">
          <Link href="/career/skills" className="font-medium text-accent hover:underline">
            Learn each skill →
          </Link>
          <Link href="/career" className="text-muted hover:text-text">
            Manage resumes & jobs →
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 1 · Resume, decoded */}
        <Card className="min-w-0">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <FileText className="size-4 text-accent" aria-hidden /> Your resume, decoded
              </span>
            }
            description={`${r.label} · ${r.headline ?? "Resume"} · ${years}`}
          />
          <CardBody className="space-y-4 text-sm">
            {r.skills && (
              <dl className="space-y-2">
                {SKILL_GROUPS.filter((g) => r.skills![g.key].length).map((g) => (
                  <div key={g.key} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
                    <dt className="pt-0.5 text-xs text-muted">{g.label}</dt>
                    <dd className="flex flex-wrap gap-1">
                      {r.skills![g.key].map((s) => (
                        <Link key={s} href={`/career/skills/guide?name=${encodeURIComponent(s)}`} className="rounded-md transition-transform hover:-translate-y-px" title={`Learn ${s}`}>
                          <Badge>{s}</Badge>
                        </Link>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {r.projects.length > 0 && (
              <div>
                <h3 className="mb-1.5 text-xs font-medium text-muted">Projects</h3>
                <ul className="space-y-1.5">
                  {r.projects.slice(0, 4).map((x) => (
                    <li key={x.name}>
                      <span className="font-medium">{x.name}</span>
                      {x.technologies.length > 0 && <span className="text-muted"> · {x.technologies.slice(0, 5).join(", ")}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(r.experience.length > 0 || r.achievements.length > 0) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {r.experience.length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-medium text-muted">Experience</h3>
                    <ul className="space-y-1">
                      {r.experience.slice(0, 3).map((x) => (
                        <li key={`${x.role}-${x.company}`}>
                          {x.role} <span className="text-muted">@ {x.company}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {r.achievements.length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-medium text-muted">Achievements</h3>
                    <ul className="space-y-1">
                      {r.achievements.slice(0, 3).map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 2 · Claims interviewers will probe */}
        <Card className="min-w-0">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Target className="size-4 text-accent" aria-hidden /> What interviewers will probe
              </span>
            }
            description={r.analyzed ? `${r.claimCount} claims found in your resume — be ready to back each one up.` : "Claims appear once your first Top 100 is generated."}
          />
          <CardBody>
            {r.claims.length ? (
              <ul className="space-y-3 text-sm">
                {r.claims.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <Badge tone={RISK_TONE[c.risk]} className="mt-0.5 shrink-0">
                      {c.risk}
                    </Badge>
                    <div className="min-w-0">
                      <p>{c.claim}</p>
                      <p className="truncate text-xs text-muted">“{c.evidence}”</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No claims yet.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* 3 · Top 100, split */}
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" aria-hidden /> Your Top 100, split
            </span>
          }
          description={p ? `${p.title} · ${p.status === "READY" ? `${p.total} questions · ${confident} confident` : p.status === "FAILED" ? "Generation stopped — open it to retry" : "Generating…"}` : "Not generated yet"}
          action={
            <Link href={planHref} className={buttonClass("secondary", "sm")}>
              {p ? "Open" : "Generate"} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        />
        <CardBody>
          {!p ? (
            <p className="text-sm text-muted">Pick a target role on Career AI and we&apos;ll write the 100 questions you&apos;re most likely to face.</p>
          ) : p.status !== "READY" ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              {p.status !== "FAILED" && <Loader2 className="size-4 animate-spin text-accent" aria-hidden />}
              {p.status === "FAILED" ? "Your last plan didn't finish. Open it and press Retry — questions already made are kept." : "Your questions are being written. This page updates by itself."}
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div>
                <h3 className="mb-2 text-xs font-medium text-muted">By priority</h3>
                {PRIORITY_ORDER.map((k) => (
                  <SplitBar key={k} label={`${PRIORITY[k].emoji} ${PRIORITY[k].label}`} count={p.byPriority[k] ?? 0} total={p.total} href={`${planHref}?priority=${k}`} barClass={BAR[k]} />
                ))}
              </div>
              <div>
                <h3 className="mb-2 text-xs font-medium text-muted">By category</h3>
                {PREP_CATEGORY_ORDER.filter((c) => p.byCategory[c]).map((c: PrepCategory) => (
                  <SplitBar key={c} label={PREP_CATEGORY[c].short} count={p.byCategory[c] ?? 0} total={p.total} href={`${planHref}?category=${c}`} barClass="bg-info" />
                ))}
              </div>
              <div>
                <h3 className="mb-2 text-xs font-medium text-muted">Most likely to be asked</h3>
                <ol className="space-y-2 text-sm">
                  {p.intense.map((q) => (
                    <li key={q.id}>
                      <Link href={planHref} className="flex gap-2 hover:text-accent">
                        <span className="font-mono text-xs text-subtle tabular-nums">#{q.rank}</span>
                        <span className="line-clamp-2">{q.question}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
              {p.topics.length > 0 && (
                <div className="lg:col-span-3">
                  <h3 className="mb-2 text-xs font-medium text-muted">Topics · confident / total</h3>
                  <ul className="flex flex-wrap gap-2">
                    {p.topics.map((t) => (
                      <li key={t.topic} className="rounded-full border border-border bg-surface-2/60 px-3 py-1 text-xs">
                        {t.topic} <span className="font-mono text-muted tabular-nums">{t.confident}/{t.total}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {data.match && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Briefcase className="size-4" aria-hidden /> Last job match: <span className="text-text">{data.match.job.title}</span> · {data.match.score}% match
          {data.match.missing.length > 0 && <> · missing {data.match.missing.slice(0, 3).join(", ")}</>}
          {data.interview && <> · last interview readiness {data.interview.readinessScore}</>}
        </p>
      )}
    </section>
  );
}
