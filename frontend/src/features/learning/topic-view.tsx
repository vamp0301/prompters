"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpenCheck, Bot, CheckCircle2, ChevronDown, Clock, Code2, Hammer, Lock, MessageSquareQuote, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { Tabs } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { Attempt, Locale, Me, TopicPage } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { CodePlayground } from "./code-playground";
import { Visualizer } from "./visualizer";

const SECTION_META: Record<string, { n: string; title: string }> = {
  DEFINITION: { n: "01", title: "What is it?" },
  ANALOGY: { n: "02", title: "Explain like I'm new" },
  WHY: { n: "03", title: "Why does it exist?" },
  USAGE: { n: "04", title: "Where is it used?" },
  INTERNALS: { n: "05", title: "How does it work inside?" },
  CODE: { n: "06", title: "Implement it" },
  MISTAKES: { n: "07", title: "Common mistakes" },
  DEBUGGING: { n: "08", title: "Debugging" },
  TRADEOFFS: { n: "09", title: "Trade-offs" },
  REAL_PROJECT: { n: "10", title: "In a real project" },
};

const LOCALES: { value: Locale; label: string }[] = [
  { value: "hinglish", label: "Hinglish" },
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
];

function InterviewItem({ q }: { q: TopicPage["interview"][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-border bg-surface">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <span className="font-medium">{q.question}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-border p-4 text-sm">
          <div className="rounded-lg bg-accent-soft p-3">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-accent">Say it in 30 seconds</div>
            <p className="leading-relaxed">{q.short}</p>
          </div>
          <div>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-subtle">Deep answer</div>
            <Markdown className="text-sm">{q.deep}</Markdown>
          </div>
          {q.followUps.length > 0 && (
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-subtle">Likely follow-ups</div>
              <ul className="list-disc space-y-1 pl-5 text-muted">{q.followUps.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
          )}
          {q.commonMistake && <p className="rounded-lg bg-warn-soft p-3 text-warn"><strong>Common mistake:</strong> {q.commonMistake}</p>}
        </div>
      )}
    </li>
  );
}

function AiTutor({ topicSlug, enabled }: { topicSlug: string; enabled: boolean }) {
  const [question, setQuestion] = useState("");
  const status = useQuery({ queryKey: ["ai-status"], queryFn: () => api.get<{ available: boolean }>("/ai/status"), enabled });
  const ask = useMutation({ mutationFn: () => api.post<{ answer: string }>("/ai/explain", { topicSlug, question }) });
  if (!enabled || !status.data?.available) return null;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm font-semibold"><Bot className="size-4 text-accent" /> Still confused? Ask the tutor</div>
      <p className="mt-1 text-xs text-muted">The tutor explains concepts in your language. It never writes your build tasks or test answers, and it&apos;s switched off during tests.</p>
      <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); if (question.trim().length > 2) ask.mutate(); }}>
        <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Closure aur normal function mein kya fark hai?" aria-label="Your question" className="min-h-20" />
        <Button size="sm" loading={ask.isPending} type="submit">Explain</Button>
      </form>
      {ask.data && <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4"><Markdown className="text-sm">{ask.data.answer}</Markdown></div>}
    </Card>
  );
}

export function TopicView({ topic, me }: { topic: TopicPage; me: Me | undefined }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [locale, setLocale] = useState<Locale>(me?.profile?.explanationLocale ?? "hinglish");
  const defaultLang = me?.profile?.startLanguage === "PYTHON" ? "python" : "javascript";
  const mastered = !!topic.mastery?.masteredAt;

  const setLanguage = (l: Locale) => {
    setLocale(l);
    api.patch("/profile", { explanationLocale: l }).then(() => qc.invalidateQueries({ queryKey: ["me"] })).catch(() => undefined);
  };
  const text = (content: Record<string, string | undefined>) => content[locale]?.trim() || content.en || "";
  const missingHindi = locale === "hi" && topic.sections.some((s) => !s.content.hi);

  const markRead = useMutation({
    mutationFn: () => api.post(`/topics/${topic.slug}/read`),
    onSuccess: () => { toast.success("Marked as read. Next: the mastery quiz."); qc.invalidateQueries({ queryKey: ["topic", topic.slug] }); },
  });
  const startQuiz = useMutation({
    mutationFn: (kind: "quiz" | "review") => api.post<Attempt>(`/topics/${topic.slug}/${kind}`),
    onSuccess: (a) => router.push(`/quiz/${a.id}?topic=${topic.slug}&title=${encodeURIComponent(topic.title)}`),
  });

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_220px]">
      <article className="min-w-0 space-y-10">
        <header>
          <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <Link href="/learn" className="hover:text-text">Roadmap</Link><span>/</span>
            <Link href={`/learn/${topic.stage.slug}`} className="hover:text-text">Stage {topic.stage.code} · {topic.stage.title}</Link><span>/</span>
            <span>{topic.module.title}</span>
          </nav>
          <h1 className="text-3xl font-semibold tracking-tight">{topic.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {mastered ? <Badge tone="accent"><CheckCircle2 className="size-3" /> Mastered · best {Math.round(topic.mastery!.bestScore)}%</Badge> : topic.state === "IN_PROGRESS" ? <Badge tone="info">In progress</Badge> : <Badge>Not started</Badge>}
            {topic.state === "NEEDS_REVIEW" && <Badge tone="warn">Needs review</Badge>}
            <Badge><Clock className="size-3" /> {topic.estMinutes} min</Badge>
            <Badge>{["Beginner", "Intermediate", "Advanced"][topic.difficulty - 1]}</Badge>
            <Badge>v{topic.version}</Badge>
          </div>
          {topic.prerequisites.length > 0 && (
            <p className="mt-3 text-xs text-muted">Builds on: {topic.prerequisites.map((p, i) => <span key={p.slug}>{i > 0 && ", "}<Link className="text-text underline-offset-4 hover:underline" href={`/learn/topic/${p.slug}`}>{p.title}</Link></span>)}</p>
          )}
          {topic.objectives.length > 0 && (
            <Card className="mt-5 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted"><Target className="size-4" /> By the end you&apos;ll be able to</div>
              <ul className="grid gap-1.5 text-sm sm:grid-cols-2">{topic.objectives.map((o) => <li key={o} className="flex gap-2"><span className="text-accent">→</span>{o}</li>)}</ul>
            </Card>
          )}
          <div className="sticky top-14 z-20 -mx-1 mt-5 flex flex-wrap items-center justify-between gap-2 bg-bg/90 px-1 py-2 backdrop-blur lg:top-0">
            <Tabs value={locale} onChange={setLanguage} items={LOCALES} />
            {missingHindi && <span className="text-xs text-subtle">Some sections aren&apos;t in Hindi yet — showing English there.</span>}
          </div>
        </header>

        {topic.sections.map((s) => {
          const meta = SECTION_META[s.type] ?? { n: "··", title: s.type };
          return (
            <section key={s.type} id={s.type.toLowerCase()} aria-labelledby={`h-${s.type}`} className="scroll-mt-28">
              <h2 id={`h-${s.type}`} className="mb-3 flex items-baseline gap-3 text-lg font-semibold">
                <span className="font-mono text-xs text-accent">{meta.n}</span>{meta.title}
              </h2>
              <Markdown>{text(s.content)}</Markdown>
              {s.type === "DEFINITION" && topic.technicalDefinition && (
                <div className="mt-3 rounded-lg border border-border bg-surface p-3 text-sm">
                  <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-subtle">Technical English</span>{topic.technicalDefinition}
                </div>
              )}
              {s.type === "INTERNALS" && topic.visualization && <div className="mt-4"><Visualizer viz={topic.visualization} /></div>}
              {s.type === "CODE" && <div className="mt-4"><CodePlayground codeJs={s.codeJs} codePython={s.codePython} defaultLanguage={defaultLang} topicSlug={topic.slug} /></div>}
            </section>
          );
        })}

        {!topic.mastery?.readAt && (
          <div className="flex justify-center"><Button variant="secondary" onClick={() => markRead.mutate()} loading={markRead.isPending}><BookOpenCheck className="size-4" /> I&apos;ve read this topic</Button></div>
        )}

        <AiTutor topicSlug={topic.slug} enabled={!!me?.flags?.AI_TUTOR} />

        <section id="quiz" className="scroll-mt-28">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-mono text-xs text-accent">11 · Check your understanding</div>
                <h2 className="mt-1 text-lg font-semibold">Mastery quiz</h2>
                <p className="mt-1 text-sm text-muted">{topic.quiz.size} questions drawn fresh from a pool of {topic.quiz.poolSize}. Score 80% to master this topic and unlock its prompt card.</p>
                {topic.mastery && topic.mastery.attempts > 0 && <p className="mt-1 text-xs text-subtle">{topic.mastery.attempts} attempt{topic.mastery.attempts > 1 ? "s" : ""} · best {Math.round(topic.mastery.bestScore)}%</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                {mastered && <Button variant="secondary" onClick={() => startQuiz.mutate("review")} loading={startQuiz.isPending && startQuiz.variables === "review"}>Review</Button>}
                <Button onClick={() => startQuiz.mutate("quiz")} loading={startQuiz.isPending && startQuiz.variables === "quiz"}>{mastered ? "Retake" : "Start quiz"}</Button>
              </div>
            </div>
          </Card>
        </section>

        {topic.buildTasks.length > 0 && (
          <section aria-labelledby="h-build">
            <h2 id="h-build" className="mb-3 flex items-center gap-2 text-lg font-semibold"><Hammer className="size-5 text-accent" /> Build it without AI</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {topic.buildTasks.map((b) => (
                <Link key={b.slug} href={`/workspace/${b.slug}`} className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{b.title}</span>
                    <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <Badge><Code2 className="size-3" /> {b.estMinutes} min</Badge>
                    {b.submission?.status === "COMPLETED" ? <Badge tone="accent">Done · independence {Math.round(b.submission.independenceScore ?? 0)}</Badge> : b.submission ? <Badge tone="info">In progress</Badge> : <Badge>AI off</Badge>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="h-interview">
          <h2 id="h-interview" className="mb-3 flex items-center gap-2 text-lg font-semibold"><MessageSquareQuote className="size-5 text-accent" /> Interview corner</h2>
          {topic.interview.length ? <ul className="space-y-2">{topic.interview.map((q) => <InterviewItem key={q.id} q={q} />)}</ul> : <p className="text-sm text-muted">Interview questions for this topic are being prepared.</p>}
        </section>

        {topic.promptCards.length > 0 && (
          <section aria-labelledby="h-prompts">
            <h2 id="h-prompts" className="mb-3 flex items-center gap-2 text-lg font-semibold"><Sparkles className="size-5 text-accent" /> Use AI like a professional</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {topic.promptCards.map((p) =>
                p.locked ? (
                  <div key={p.id} className="rounded-xl border border-dashed border-border p-4">
                    <div className="flex items-center gap-2 font-medium text-muted"><Lock className="size-4" /> {p.title}</div>
                    <p className="mt-1 text-xs text-subtle">Learn first, then prompt — master this topic to unlock.</p>
                  </div>
                ) : (
                  <Link key={p.id} href={`/prompts/${p.id}`} className="rounded-xl border border-accent/30 bg-accent-soft p-4 hover:border-accent">
                    <div className="font-medium">{p.title}</div>
                    <p className="mt-1 text-xs text-muted">{p.task}</p>
                  </Link>
                ),
              )}
            </div>
          </section>
        )}

        {topic.next && (
          <Link href={`/learn/topic/${topic.next.slug}`} className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 hover:border-border-strong">
            <div><div className="text-xs text-muted">Next topic</div><div className="font-medium">{topic.next.title}</div></div>
            <ArrowRight className="size-5 text-muted" />
          </Link>
        )}
      </article>

      <aside className="hidden xl:block">
        <nav aria-label="On this page" className="sticky top-8 space-y-1 text-sm">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-subtle">On this page</div>
          {topic.sections.map((s) => (
            <a key={s.type} href={`#${s.type.toLowerCase()}`} className="block truncate py-0.5 text-muted hover:text-text">
              <span className="mr-2 font-mono text-[10px] text-subtle">{SECTION_META[s.type]?.n}</span>{SECTION_META[s.type]?.title}
            </a>
          ))}
          <a href="#quiz" className="block py-0.5 text-muted hover:text-text"><span className="mr-2 font-mono text-[10px] text-subtle">11</span>Mastery quiz</a>
        </nav>
      </aside>
    </div>
  );
}
