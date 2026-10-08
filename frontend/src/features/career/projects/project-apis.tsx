"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { paperCard } from "@/components/ui/paper";
import { DiagramView } from "@/features/knowledge/diagram";
import type { ProjectModule } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { BasisBadge, Expand, LevelBadge, SectionTitle } from "./project-ui";

/**
 * API & Integration map. Built from the resume and the candidate's facts (no AI): what the project
 * talks to, grouped by kind, with general guides, a failure matrix that separates what was built
 * from what is recommended, and the questions an interviewer would drill into.
 */
export function ProjectApis({ project }: { project: ProjectModule }) {
  const m = project.integrations;
  const factsLink = `/career/projects/${project.id}?tab=facts`;
  if (!m.kinds.length)
    return (
      <p className="text-sm text-muted">
        Your resume doesn&apos;t name any APIs or services for this project.{" "}
        <Link href={factsLink} className="text-accent underline underline-offset-4">
          Add them in Facts
        </Link>{" "}
        (important APIs, internal services, browser APIs).
      </p>
    );
  return (
    <div className="space-y-8">
      <section>
        <SectionTitle eyebrow="API & integration map" title="What this project talks to">
          A database is infrastructure, not a REST API — each kind is asked about differently. Explanations are general knowledge; only names come from your resume or facts.
        </SectionTitle>
        <ul className="grid gap-3 md:grid-cols-2">
          {m.kinds.map((k) => (
            <li key={k.kind} className={cn(paperCard, "p-4")}>
              <p className="eyebrow text-accent">{k.label}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {k.items.map((i) => (
                  <li key={i.name} className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[13px]">
                    {i.name} <BasisBadge basis={i.basis} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {m.methods.length > 0 && (
        <section>
          <SectionTitle eyebrow="Your REST API" title="Endpoints and methods" />
          <p className="mb-3 text-[13px]">
            {m.endpoints ? (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <BasisBadge basis="USER_FACT" />
                {m.endpoints.map((e) => (
                  <code key={e} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
                    {e}
                  </code>
                ))}
              </span>
            ) : (
              <span className="text-muted">
                Your endpoints aren&apos;t listed.{" "}
                <Link href={factsLink} className="text-accent underline underline-offset-4">
                  Add your important APIs
                </Link>{" "}
                and the questions below will use them.
              </span>
            )}
          </p>
          <div className="overflow-x-auto" tabIndex={0}>
            <table className="w-full min-w-[560px] text-[13px]">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                  <th scope="col" className="pb-2 font-medium">Method</th>
                  <th scope="col" className="pb-2 font-medium">What it means</th>
                  <th scope="col" className="pb-2 font-medium">Typical use</th>
                </tr>
              </thead>
              <tbody>
                {m.methods.map((x) => (
                  <tr key={x.method} className="border-t border-border align-top">
                    <td className="py-2 pr-3 font-mono font-semibold">{x.method}</td>
                    <td className="py-2 pr-3">{x.meaning}</td>
                    <td className="py-2">{x.typicalUse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <SectionTitle eyebrow="How each kind works" title="Guides and interview questions" />
        <div className="space-y-2">
          {m.kinds.flatMap((k) =>
            k.guides.map((g) => (
              <Expand key={`${k.kind}-${g.key}`} summary={<span className="flex flex-wrap items-center gap-2"><span className="font-medium">{g.title}</span><BasisBadge basis="GENERAL" /></span>}>
                <div className="grid gap-4 lg:grid-cols-2">
                  <DiagramView diagram={g.flow} compact />
                  <div className="space-y-3 text-[13px]">
                    <ul className="list-disc space-y-1 pl-5">
                      {g.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                    <div>
                      <p className="eyebrow text-muted">Questions interviewers ask</p>
                      <ol className="mt-1 list-decimal space-y-1 pl-5">
                        {g.questions.map((q) => (
                          <li key={q}>{q}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </Expand>
            )),
          )}
        </div>
      </section>

      {m.browser.length > 0 && (
        <section>
          <SectionTitle eyebrow="Browser APIs" title="Capabilities the page relies on">
            Support differs between browsers — check MDN before relying on one.
          </SectionTitle>
          <div className="overflow-x-auto" tabIndex={0}>
            <table className="w-full min-w-[820px] text-[13px]">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                  {["API", "What it does", "Permission", "Security / privacy", "Support", "Fallback"].map((h) => (
                    <th key={h} scope="col" className="pb-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {m.browser.map((b) => (
                  <tr key={b.name} className="border-t border-border align-top">
                    <td className="py-2 pr-3 font-mono">{b.name}</td>
                    <td className="py-2 pr-3">{b.what}</td>
                    <td className="py-2 pr-3">{b.permission}</td>
                    <td className="py-2 pr-3">{b.security}</td>
                    <td className="py-2 pr-3">{b.support}</td>
                    <td className="py-2">{b.fallback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <SectionTitle eyebrow="Dependency failures" title="What happens when something is down">
          Only fallbacks you listed in Facts are marked as built. Everything else is a recommendation, not a claim about your project.
        </SectionTitle>
        <div className="overflow-x-auto" tabIndex={0}>
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                <th scope="col" className="pb-2 font-medium">Dependency</th>
                <th scope="col" className="pb-2 font-medium">Failure</th>
                <th scope="col" className="pb-2 font-medium">Response</th>
              </tr>
            </thead>
            <tbody>
              {m.failures.map((f, i) => (
                <tr key={i} className="border-t border-border align-top">
                  <td className="py-2 pr-3 font-medium">{f.dependency}</td>
                  <td className="py-2 pr-3">{f.failure}</td>
                  <td className="py-2">
                    <span className="flex flex-wrap items-center gap-1.5">
                      {f.status === "IMPLEMENTED" ? <BasisBadge basis="USER_FACT" /> : <Badge tone="neutral">Recommended fallback</Badge>}
                      {f.response}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className={cn(paperCard, "p-4 text-[13px]")}>
          <p className="eyebrow text-accent">Performance</p>
          <p className="mt-2 flex flex-wrap items-center gap-1.5">
            <BasisBadge basis={m.measurements.basis} /> {m.measurements.value}
          </p>
          <p className="mt-2 text-muted">What to measure: {m.checklists.performance.join(" · ")}</p>
        </div>
        <div className={cn(paperCard, "p-4 text-[13px]")}>
          <p className="eyebrow text-accent">Testing</p>
          <p className="mt-2 flex flex-wrap items-center gap-1.5">
            <BasisBadge basis={m.testing.basis} /> {m.testing.value}
          </p>
          <p className="mt-2 text-muted">Tests interviewers expect: {m.checklists.testing.join(" · ")}</p>
        </div>
        <div className={cn(paperCard, "p-4 text-[13px]")}>
          <p className="eyebrow text-accent">Security checklist</p>
          <p className="mt-2 text-muted">{m.checklists.security.join(" · ")}</p>
        </div>
        <div className={cn(paperCard, "p-4 text-[13px]")}>
          <p className="eyebrow text-accent">Observability checklist</p>
          <p className="mt-2 text-muted">{m.checklists.observability.join(" · ")}</p>
        </div>
      </section>

      <section>
        {m.chain.length > 0 && (
          <>
            <SectionTitle eyebrow="Drill-down" title="One endpoint, from “what” to “design it for other teams”" />
            <QuestionList items={m.chain} />
          </>
        )}
        <SectionTitle eyebrow="Final architecture test" title="The whole system, across every dependency" />
        <QuestionList items={m.architecture} />
        <p className="mt-3 text-sm text-muted">
          Practise these out loud in the{" "}
          <Link href={`/career/projects/${project.id}?tab=test`} className="text-accent underline underline-offset-4">
            API interview
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

function QuestionList({ items }: { items: ProjectModule["integrations"]["chain"] }) {
  return (
    <ol className="mb-6 space-y-2">
      {items.map((q) => (
        <li key={q.key} className="flex items-start gap-2 text-[14px]">
          <LevelBadge level={q.level} /> <span>{q.question}</span>
        </li>
      ))}
    </ol>
  );
}
