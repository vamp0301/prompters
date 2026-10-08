"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState, PageHeader, Tabs } from "@/components/ui/misc";
import { paperCard, TapedNote } from "@/components/ui/paper";
import { DiagramView } from "@/features/knowledge/diagram";
import { api } from "@/lib/api/client";
import type { ProjectModule } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { friendlyError, InlineError } from "../shared";
import { ProjectApis } from "./project-apis";
import { ProjectFacts } from "./project-facts";
import { ProjectQuestions } from "./project-questions";
import { ProjectGaps, ProjectTest } from "./project-test";
import { BasisBadge, EvidenceLegend, SectionTitle, SourcedText, track, WhyBlock } from "./project-ui";
import { projectKeys } from "./projects-list";

const TABS = ["overview", "decisions", "deep", "apis", "skills", "questions", "test", "gaps", "facts"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = { overview: "Overview", decisions: "Decisions", deep: "Deep dives", apis: "APIs", skills: "Skills", questions: "Questions", test: "Test", gaps: "Gaps", facts: "Facts" };
const SOURCE_LABEL = { PROJECT: "Project", EXPERIENCE: "Work experience", BOTH: "Project + work experience" } as const;

export function ProjectView({ id }: { id: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const initial = (TABS as readonly string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as Tab) : "overview";
  const [tab, setTab] = useState<Tab>(initial);
  // Opening builds the module if needed; refreshing an open module only reads it — rebuilding after a facts edit is the user's call.
  const q = useQuery({ queryKey: projectKeys.one(id), queryFn: () => api.get<ProjectModule>(`/career/projects/${id}${qc.getQueryData<ProjectModule>(projectKeys.one(id))?.content ? "?generate=0" : ""}`), staleTime: 60_000, retry: false });
  const rebuild = useMutation({ meta: { silent: true }, mutationFn: () => api.post<ProjectModule>(`/career/projects/${id}/regenerate`), onSuccess: (p) => qc.setQueryData(projectKeys.one(id), p) });
  const go = (t: Tab) => {
    setTab(t);
    router.replace(`/career/projects/${id}?tab=${t}`, { scroll: false });
  };

  if (q.isLoading)
    return (
      <div className={cn(paperCard, "p-8")} role="status" aria-live="polite">
        <p className="flex items-center gap-2 font-medium">
          <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> Building this project&apos;s module…
        </p>
        <p className="mt-2 text-sm text-muted">Reading what your resume says about it, then writing the explanations, decisions and 20 questions. The first time takes up to a minute; after that it opens instantly.</p>
      </div>
    );
  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const p = q.data!;

  return (
    <div className="space-y-6">
      <Link href="/career/projects" className="inline-flex items-center gap-1 text-xs text-muted hover:text-text">
        <ArrowLeft className="size-3.5" aria-hidden /> My projects
      </Link>
      <PageHeader
        eyebrow={<span className="flex flex-wrap items-center gap-2">Project experience <Badge tone={p.source === "PROJECT" ? "info" : "accent"}>{SOURCE_LABEL[p.source]}</Badge></span>}
        title={p.name}
        description={[p.role, p.company].filter(Boolean).join(" · ") || undefined}
        actions={
          p.stale ? (
            <Button variant="secondary" onClick={() => rebuild.mutate()} loading={rebuild.isPending}>
              <RefreshCw className="size-4" aria-hidden /> Rebuild with my facts
            </Button>
          ) : undefined
        }
      />
      <ul className="flex flex-wrap gap-1" aria-label="Technologies">
        {p.technologies.map((t) => (
          <li key={t} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs">
            {t}
          </li>
        ))}
      </ul>
      {rebuild.error && <InlineError error={rebuild.error} />}
      {!p.content ? (
        <p role="alert" className="text-sm text-muted">{friendlyError(q.error) || "This module hasn't been built yet."}</p>
      ) : (
        <>
          <EvidenceLegend />
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <Tabs value={tab} onChange={go} items={TABS.map((t) => ({ value: t, label: TAB_LABEL[t] }))} />
          </div>
          {tab === "overview" && <Overview p={p} />}
          {tab === "decisions" && <Decisions p={p} />}
          {tab === "deep" && <DeepDives p={p} />}
          {tab === "apis" && <ProjectApis project={p} />}
          {tab === "skills" && <SkillLadder p={p} />}
          {tab === "questions" && <ProjectQuestions project={p} />}
          {tab === "test" && <ProjectTest project={p} />}
          {tab === "gaps" && <ProjectGaps project={p} />}
          {tab === "facts" && <ProjectFacts project={p} />}
          {p.content.autoFixes.length > 0 && (
            <details className="text-xs text-subtle">
              <summary className="cursor-pointer">{p.content.autoFixes.length} statement{p.content.autoFixes.length === 1 ? " was" : "s were"} removed or filled in because your resume and facts didn&apos;t support {p.content.autoFixes.length === 1 ? "it" : "them"}</summary>
              <ul className="mt-1 list-disc pl-5">
                {p.content.autoFixes.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

// ───────────────────────── Overview ─────────────────────────

function Overview({ p }: { p: ProjectModule }) {
  const s = p.content!.story;
  const [pitch, setPitch] = useState<"sec30" | "sec60" | "min2" | "min5">("sec30");
  return (
    <div className="space-y-10">
      <section className="grid gap-3 md:grid-cols-3">
        {(["problem", "users", "whatBuilt"] as const).map((k) => (
          <div key={k} className={cn(paperCard, "p-4")}>
            <p className="eyebrow flex items-center justify-between gap-2 text-text">
              {k === "problem" ? "Problem solved" : k === "users" ? "Users" : "What was built"} <BasisBadge basis={s.overview[k].basis} />
            </p>
            <p className="mt-2 text-[14px]">
              <SourcedText {...s.overview[k]} projectId={p.id} />
            </p>
          </div>
        ))}
      </section>

      <section>
        <SectionTitle eyebrow="Say it out loud" title="Explain the project" />
        <Tabs
          value={pitch}
          onChange={(v) => {
            setPitch(v);
            track("PROJECT_EXPLANATION_VIEWED", p.id, { length: v });
          }}
          items={[
            { value: "sec30", label: "30 seconds" },
            { value: "sec60", label: "60 seconds" },
            { value: "min2", label: "2 minutes" },
            { value: "min5", label: "5 minutes" },
          ]}
        />
        <TapedNote tape={pitch === "sec30" ? "30-second answer" : pitch === "sec60" ? "60-second answer" : pitch === "min2" ? "2-minute answer" : "5-minute deep dive"} className="mt-4 rotate-0">
          {pitch === "sec30" || pitch === "sec60" ? (
            <p className="text-[15px] leading-relaxed">{s.pitches[pitch]}</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-[14px]">
              {s.pitches[pitch].map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </TapedNote>
      </section>

      <section>
        <SectionTitle eyebrow="My experience with this project" title="What you'll be asked about yourself" />
        <dl className="grid gap-3 md:grid-cols-2">
          {s.experience.map((e) => (
            <div key={e.question} className="rounded-lg border border-border bg-surface p-3">
              <dt className="flex items-start justify-between gap-2 text-[13px] font-semibold">
                {e.question} <BasisBadge basis={e.basis} />
              </dt>
              <dd className="mt-1 text-[14px]">
                <SourcedText text={e.answer} basis={e.basis} projectId={p.id} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <SectionTitle eyebrow="Architecture" title="How the pieces fit" />
        {s.architecture.diagram && <DiagramView diagram={s.architecture.diagram} />}
        {s.architecture.requestFlow.length > 0 && (
          <>
            <h3 className="eyebrow mt-5 text-text">Request flow</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[14px]">
              {s.architecture.requestFlow.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </>
        )}
      </section>

      {s.dataFlow.length > 0 && (
        <section>
          <SectionTitle eyebrow="Data flow" title="Each step: why it exists, what can fail, how it's handled" />
          <div className="overflow-x-auto" tabIndex={0}>
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                  <th scope="col" className="pb-2 font-medium">Step</th>
                  <th scope="col" className="pb-2 font-medium">Why</th>
                  <th scope="col" className="pb-2 font-medium">What can fail</th>
                  <th scope="col" className="pb-2 font-medium">Handling</th>
                </tr>
              </thead>
              <tbody>
                {s.dataFlow.map((d, i) => (
                  <tr key={i} className="border-t border-border align-top">
                    <td className="py-2 pr-3 font-medium">{d.step}</td>
                    <td className="py-2 pr-3">{d.why}</td>
                    <td className="py-2 pr-3">{d.whatCanFail}</td>
                    <td className="py-2">{d.handling}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <SectionTitle eyebrow="Verified" title="What your resume actually says">
          These are the only statements treated as fact (plus anything you add in Facts).
        </SectionTitle>
        <ul className="space-y-2 text-[13px]">
          {p.verified.chunks.map((c) => (
            <li key={c.title} className="rounded-md bg-surface-2 p-3">
              <span className="font-medium">{c.title}</span> — {c.text}
            </li>
          ))}
          {p.verified.claims.map((c) => (
            <li key={c.id} className="rounded-md border border-border p-3">
              Claim: <span className="font-medium">{c.claim}</span> <span className="text-muted">(resume: &ldquo;{c.evidence}&rdquo;)</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ───────────────────────── Decisions ─────────────────────────

const CHANGE_TONE = { KEEP: "accent", CONSIDER: "warn", BENCHMARK: "info" } as const;

function Decisions({ p }: { p: ProjectModule }) {
  const c = p.content!;
  return (
    <div className="space-y-10">
      <section>
        <SectionTitle eyebrow="Decision map" title="Every choice: why, instead of what, at what cost">
          Interviewers test engineering judgment, not tool preference. Each choice was right for this project&apos;s needs — and each alternative wins under other needs.
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {c.decisionMap.map((g) => (
            <div key={g.category} className={cn(paperCard, "p-4")}>
              <p className="eyebrow text-accent">{g.category}</p>
              {g.decisions.map((d) => (
                <div key={d.technology} className="mt-3 space-y-1 border-t border-border pt-3 text-[13px] first:mt-2 first:border-0 first:pt-0">
                  <p className="font-display text-lg">{d.technology}</p>
                  <p>
                    <span className="text-muted">Why: </span>
                    {d.why} {d.whyIsFact ? <BasisBadge basis="RESUME" /> : <BasisBadge basis="GENERAL" />}
                  </p>
                  <p>
                    <span className="text-muted">Instead of: </span>
                    {d.insteadOf}
                  </p>
                  <p>
                    <span className="text-muted">Trade-off: </span>
                    {d.tradeoff}
                  </p>
                  <Badge tone={CHANGE_TONE[d.change as keyof typeof CHANGE_TONE] ?? "neutral"}>{d.change === "KEEP" ? "Keep" : d.change === "CONSIDER" ? "Consider changing" : "Benchmark first"}</Badge>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Technology by technology" title="Why this — and why not that" />
        <div className="space-y-4">
          {c.technologies.map((t) => (
            <article key={t.technology} className={cn(paperCard, "p-4")} aria-label={`${t.technology} decision`}>
              <h3 className="font-display text-xl">{t.technology}</h3>
              <p className="mt-1 text-sm text-muted">{t.whatItIs}</p>
              <div className="mt-3 overflow-x-auto" tabIndex={0}>
                <table className="w-full min-w-[560px] text-[13px]">
                  <tbody>
                    {[
                      ["Used", t.technology],
                      ["Why?", <WhyBlock key="w" why={t.whyUsed} />],
                      ["Problem it solved", t.problemSolved],
                      ["How it was used", <span key="h">{t.howUsed.text} <BasisBadge basis={t.howUsed.basis} /></span>],
                      [`Why not ${t.alternative}?`, t.whyNotAlternative],
                      [`When ${t.alternative} wins`, t.alternativeBetterWhen],
                      [`When ${t.alternative} is worse`, t.worseWhen],
                      ["Trade-off", t.tradeoff],
                      ["Would I change it today?", <span key="c"><Badge tone={CHANGE_TONE[t.recommendation]}>{t.recommendation === "KEEP" ? "Keep" : t.recommendation === "CONSIDER" ? "Consider" : "Benchmark first"}</Badge> {t.recommendationReason}</span>],
                      ["Interview question", <span key="q" className="font-medium">&ldquo;{t.interviewQuestion}&rdquo;</span>],
                      ["Answer", t.answer],
                      ["Follow-up", t.followUp],
                      ["Deeper follow-up", t.deeperFollowUp],
                    ].map(([k, v]) => (
                      <tr key={String(k)} className="border-t border-border align-top first:border-0">
                        <th scope="row" className="w-48 py-2 pr-3 text-left font-mono text-[11px] font-medium uppercase tracking-wide text-muted">
                          {k}
                        </th>
                        <td className="py-2">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Alternatives" title="Decision matrix" />
        <div className="overflow-x-auto" tabIndex={0}>
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                {["Used", "Alternative", "Why used", "Why not the alternative", "Alternative better when"].map((h) => (
                  <th key={h} scope="col" className="pb-2 pr-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.technologies.map((t) => (
                <tr key={t.technology} className="border-t border-border align-top">
                  <td className="py-2 pr-3 font-medium">{t.technology}</td>
                  <td className="py-2 pr-3">{t.alternative}</td>
                  <td className="py-2 pr-3">{t.whyUsed.fact ?? t.whyUsed.explanation}</td>
                  <td className="py-2 pr-3">{t.whyNotAlternative}</td>
                  <td className="py-2">{t.alternativeBetterWhen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {c.ai && <AiDecision p={p} />}
    </div>
  );
}

function AiDecision({ p }: { p: ProjectModule }) {
  const ai = p.content!.ai!;
  return (
    <section className="space-y-5" aria-labelledby="ai-h">
      <div>
        <p className="eyebrow text-accent">AI technology decision</p>
        <h2 id="ai-h" className="font-display text-2xl">{ai.decision.question}</h2>
        <p className="mt-1 flex items-center gap-2 text-sm">
          <BasisBadge basis="RESUME" /> {ai.fact}
        </p>
      </div>
      <TapedNote tape="A judgment answer, not a vendor preference" className="rotate-0">
        <p className="text-[15px] leading-relaxed">{ai.decision.answer}</p>
        <p className="mt-3 text-[13px]">
          <span className="font-semibold">Recommendation:</span> {ai.decision.recommendation} — {ai.decision.why}
        </p>
      </TapedNote>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-3 text-[13px]">
          <p className="eyebrow text-text">The other option&apos;s potential advantages</p>
          <ul className="mt-1 list-disc pl-5">
            {ai.decision.otherAdvantages.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 text-[13px]">
          <p className="eyebrow text-text">…and its costs</p>
          <ul className="mt-1 list-disc pl-5">
            {ai.decision.otherDisadvantages.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
      <DiagramView diagram={ai.flow} />
      <div className="overflow-x-auto" tabIndex={0}>
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted">
              {["Option", "Type", "Potential advantages", "Costs & risks", "Choose when"].map((h) => (
                <th key={h} scope="col" className="pb-2 pr-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ai.comparison.map((o) => (
              <tr key={o.key} className="border-t border-border align-top">
                <td className="py-2 pr-3 font-medium">{o.option}</td>
                <td className="py-2 pr-3">{o.type}</td>
                <td className="py-2 pr-3">{o.potentialAdvantages.join("; ")}</td>
                <td className="py-2 pr-3">{o.costsAndRisks.join("; ")}</td>
                <td className="py-2">{o.chooseWhen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">{ai.note}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <h3 className="eyebrow text-text">What interviewers probe around AI</h3>
          <dl className="mt-2 space-y-2 text-[13px]">
            {ai.concerns.map((x) => (
              <div key={x.topic}>
                <dt className="font-medium">{x.topic}</dt>
                <dd className="text-muted">{x.practice}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h3 className="eyebrow text-text">Follow-ups to prepare</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
            {ai.followUps.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── Deep dives ─────────────────────────

function DeepDives({ p }: { p: ProjectModule }) {
  const s = p.content!.story;
  const perf = s.performance;
  return (
    <div className="space-y-10">
      {s.database && (
        <section>
          <SectionTitle eyebrow="Database" title={s.database.name} />
          <WhyBlock why={s.database.whyChosen} />
          <p className="mt-3 text-[14px]">
            <span className="text-muted">Data model: </span>
            <SourcedText {...s.database.dataModel} projectId={p.id} />
          </p>
          {s.database.entities.length > 0 && <p className="mt-1 text-[14px]"><span className="text-muted">Entities: </span>{s.database.entities.join(", ")}</p>}
          <dl className="mt-4 grid gap-3 md:grid-cols-2">
            {s.database.questions.map((q) => (
              <div key={q.q} className="rounded-lg border border-border bg-surface p-3">
                <dt className="text-[13px] font-semibold">{q.q}</dt>
                <dd className="mt-1 text-[13px]">{q.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {s.security.length > 0 && (
        <section>
          <SectionTitle eyebrow="Security" title="What applies here" />
          <div className="grid gap-3 md:grid-cols-2">
            {s.security.map((x) => (
              <div key={x.area} className="rounded-lg border border-border bg-surface p-3 text-[13px]">
                <p className="font-semibold">{x.area}</p>
                <p className="mt-1"><span className="text-muted">Why it applies: </span>{x.why}</p>
                <p><span className="text-muted">Risk: </span>{x.risk}</p>
                <p><span className="text-muted">What I&apos;d change: </span>{x.change}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle eyebrow="Performance" title="Problem → cause → fix → result" />
        <dl className="grid gap-3 md:grid-cols-2 text-[14px]">
          {(["problem", "cause", "identified", "solution"] as const).map((k) => (
            <div key={k}>
              <dt className="eyebrow flex items-center gap-2 text-text">{k === "identified" ? "How it was found" : k} <BasisBadge basis={perf[k].basis} /></dt>
              <dd className="mt-1"><SourcedText {...perf[k]} projectId={p.id} /></dd>
            </div>
          ))}
          <div>
            <dt className="eyebrow text-text">Why that solution</dt>
            <dd className="mt-1">{perf.whySolution}</dd>
          </div>
          <div>
            <dt className="eyebrow text-text">Trade-off</dt>
            <dd className="mt-1">{perf.tradeoff}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="eyebrow flex items-center gap-2 text-text">Result <BasisBadge basis={perf.result.basis} /></dt>
            <dd className="mt-1"><SourcedText {...perf.result} projectId={p.id} /></dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Challenges" title="Real ones" />
          {s.challenges.real.length ? (
            <ul className="space-y-1 text-[14px]">
              {s.challenges.real.map((c) => (
                <li key={c.text} className="flex gap-2"><BasisBadge basis={c.source} /> {c.text}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              Candidate input required — your resume doesn&apos;t name one.{" "}
              <Link href={`/career/projects/${p.id}?tab=facts`} className="text-accent underline underline-offset-4">Add your biggest challenge</Link>
            </p>
          )}
        </div>
        <div>
          <SectionTitle eyebrow="Hypothetical" title="Likely challenges for this kind of project" />
          <ul className="list-disc space-y-1 pl-5 text-[14px] text-muted">
            {s.challenges.likely.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>

      {s.tradeoffs.length > 0 && (
        <section>
          <SectionTitle eyebrow="Trade-offs" title="What this design gives up" />
          <ul className="list-disc space-y-1 pl-5 text-[14px]">
            {s.tradeoffs.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {s.scaling.length > 0 && (
        <section>
          <SectionTitle eyebrow="Scaling path" title="What breaks first, and what changes" />
          <ol className="grid gap-3 md:grid-cols-2">
            {s.scaling.map((x) => (
              <li key={x.at} className="rounded-lg border border-border bg-surface p-3 text-[13px]">
                <p className="font-mono text-sm font-semibold">At {x.at}</p>
                <p className="mt-1"><span className="text-muted">Bottleneck: </span>{x.bottleneck}</p>
                <p><span className="text-muted">Change: </span>{x.change}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {s.ifBuiltToday.length > 0 && (
        <section>
          <SectionTitle eyebrow="If I were building this today" title="Current implementation vs recommended improvement">
            Recommendations, not history: the left column is what exists.
          </SectionTitle>
          <div className="overflow-x-auto" tabIndex={0}>
            <table className="w-full min-w-[600px] text-[13px]">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                  <th scope="col" className="pb-2 pr-3 font-medium">Current</th>
                  <th scope="col" className="pb-2 pr-3 font-medium">Recommended</th>
                  <th scope="col" className="pb-2 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {s.ifBuiltToday.map((r) => (
                  <tr key={r.recommended} className="border-t border-border align-top">
                    <td className="py-2 pr-3">{r.current}</td>
                    <td className="py-2 pr-3 font-medium">{r.recommended}</td>
                    <td className="py-2">{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// ───────────────────────── Skills ─────────────────────────

const CONF = { HIGH: "Clearly used", MEDIUM: "Implied", LOW: "Adjacent", NONE: "Needs verification" } as const;

function SkillLadder({ p }: { p: ProjectModule }) {
  const ladder = p.content!.story.skillLadder;
  return (
    <section>
      <SectionTitle eyebrow="Skill map" title="From basics to system design">
        Being in the project isn&apos;t the same as mastering it: confidence says how clearly the project shows each skill. Your test results decide the rest.
      </SectionTitle>
      <ol className="space-y-3">
        {ladder.map((l) => (
          <li key={l.level} className={cn(paperCard, "p-4")}>
            <p className="font-mono text-sm font-semibold">L{l.level}</p>
            <ul className="mt-2 grid gap-2 md:grid-cols-2">
              {l.skills.map((s) => (
                <li key={s.name} className="text-[13px]">
                  <span className="font-medium">{s.name}</span>{" "}
                  <Badge tone={s.confidence === "HIGH" ? "accent" : s.confidence === "MEDIUM" ? "info" : "neutral"}>{CONF[s.confidence]}</Badge>
                  <span className="block text-xs text-muted">{s.evidence}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
