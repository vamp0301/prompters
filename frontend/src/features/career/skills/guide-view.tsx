"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Lightbulb, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-editor";
import { ErrorState, Tabs } from "@/components/ui/misc";
import { useMe } from "@/features/auth/use-me";
import { api } from "@/lib/api/client";
import type { SkillGuide } from "@/lib/api/types";
import { PRIORITY } from "@/features/career/prep/prep-shared";
import { DiagramView } from "@/features/knowledge/diagram";
import { friendlyError } from "@/features/career/shared";

type Lang = SkillGuide["locale"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="fade-up min-w-0">
      <CardHeader title={title} />
      <CardBody className="text-sm leading-relaxed">{children}</CardBody>
    </Card>
  );
}

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="list-disc space-y-1.5 pl-5">
    {items.map((x) => (
      <li key={x}>{x}</li>
    ))}
  </ul>
);

/** The study guide for one resume skill: real-world use, implementation, perks and drawbacks. */
export function GuideView({ name }: { name: string }) {
  const { data: me } = useMe();
  const [lang, setLang] = useState<Lang | null>(null);
  const locale: Lang = lang ?? (me?.profile?.explanationLocale as Lang | undefined) ?? "en";
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["career", "skill-guide", name, locale],
    queryFn: () => api.get<SkillGuide>(`/career/skills/guide?name=${encodeURIComponent(name)}&lang=${locale}`),
    enabled: !!name,
    staleTime: Infinity,
  });
  const g = data?.content;

  return (
    <div className="space-y-6">
      <Link href="/career/skills" className="inline-flex items-center gap-1 text-xs text-muted hover:text-text">
        <ArrowLeft className="size-3.5" aria-hidden /> All my skills
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow mb-2 text-accent">Skill overview</div>
          <h1 className="font-display text-4xl">{data?.name ?? name}</h1>
        </div>
        <Tabs
          value={locale}
          onChange={(v) => setLang(v)}
          items={[
            { value: "en", label: "English" },
            { value: "hinglish", label: "Hinglish" },
            { value: "hi", label: "हिन्दी" },
          ]}
        />
      </div>

      {isLoading ? (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> Writing your guide… the first time takes a few seconds, then it&apos;s instant.
        </p>
      ) : error ? (
        <ErrorState error={new Error(friendlyError(error))} retry={() => refetch()} />
      ) : g ? (
        <>
          <p className="max-w-3xl text-lg leading-relaxed text-muted">{g.summary}</p>
          <Link
            href={`/career/skills/map?name=${encodeURIComponent(data?.name ?? name)}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm hover:border-accent"
          >
            <span>This is the big picture. Each concept — with diagrams, examples, a quiz and interview questions — is taught one at a time in the knowledge map.</span>
            <span className="inline-flex items-center gap-1 font-bold text-accent">
              Open the knowledge map <ArrowRight className="size-3.5" aria-hidden />
            </span>
          </Link>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="✓ Perks">
              <ul className="space-y-2">
                {g.perks.map((x) => (
                  <li key={x} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="✗ Drawbacks">
              <ul className="space-y-2">
                {g.drawbacks.map((x) => (
                  <li key={x} className="flex gap-2">
                    <X className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {g.flow && (
            <section aria-labelledby="skill-flow-h" className="space-y-2">
              <h2 id="skill-flow-h" className="font-mono text-[11px] tracking-widest text-muted uppercase">
                How it flows
              </h2>
              <DiagramView diagram={g.flow} />
            </section>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="How it works">
              <Bullets items={g.howItWorks} />
            </Section>
            <Section title="Where it's used in real software">
              <ul className="space-y-2">
                {g.realWorld.map((x) => (
                  <li key={x.where}>
                    <span className="font-medium">{x.where}</span> — <span className="text-muted">{x.how}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <Section title="Implement it in a real app">
            <ol className="list-decimal space-y-1.5 pl-5">
              {g.implementation.steps.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
            {g.implementation.code?.snippet && (
              <div className="mt-4">
                <CodeBlock code={g.implementation.code.snippet} language={g.implementation.code.language} />
              </div>
            )}
          </Section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Section title="Use it when">
              <Bullets items={g.whenToUse} />
            </Section>
            <Section title="Avoid it when">
              <Bullets items={g.whenNotToUse} />
            </Section>
            <Section title="Alternatives">
              <ul className="space-y-2">
                {g.alternatives.map((a) => (
                  <li key={a.name}>
                    <span className="font-medium">{a.name}</span> — <span className="text-muted">{a.whenBetter}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Common mistakes">
              <Bullets items={g.mistakes} />
            </Section>
            <Section title="Interview tips">
              <ul className="space-y-2">
                {g.interviewTips.map((x) => (
                  <li key={x} className="flex gap-2">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {(data.usedIn.length > 0 || data.questions.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.usedIn.length > 0 && (
                <Section title="From your resume">
                  <ul className="space-y-2">
                    {data.usedIn.map((p) => (
                      <li key={p.name}>
                        <span className="font-medium">{p.name}</span>
                        {p.description && <span className="text-muted"> — {p.description}</span>}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {data.questions.length > 0 && (
                <Section title="Your interview questions on this">
                  <ol className="space-y-2">
                    {data.questions.map((q) => (
                      <li key={q.id} className="flex gap-2">
                        <span className="font-mono text-xs text-subtle tabular-nums">#{q.rank}</span>
                        <span className="min-w-0 flex-1">{q.question}</span>
                        <Badge tone={PRIORITY[q.priority].tone} className="h-fit shrink-0 self-start">{PRIORITY[q.priority].label}</Badge>
                      </li>
                    ))}
                  </ol>
                  {data.planId && (
                    <Link href={`/career/prep/${data.planId}`} className={buttonClass("secondary", "sm", "mt-4")}>
                      Practise these
                    </Link>
                  )}
                </Section>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
