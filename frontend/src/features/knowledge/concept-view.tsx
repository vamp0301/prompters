"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Eye, Lightbulb, Mic, MicOff, Timer, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-editor";
import { Textarea } from "@/components/ui/input";
import { ErrorState, Tabs } from "@/components/ui/misc";
import { paperCard, TapedNote } from "@/components/ui/paper";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { ConceptChapter, ExplainResult } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useDictation } from "@/features/career/live/use-voice";
import { DiagramView } from "./diagram";
import { conceptHref, Dots, Frequency, IMPORTANCE, mapHref, STATUS } from "./map-view";

type Mode = "learn" | "visual" | "code" | "explain" | "interview";
type Lang = "en" | "hinglish" | "hi";
const LEVEL_LABEL = ["", "Beginner", "Developer", "Production", "System design", "Interview"];

function Section({ title, children, open, icon }: { title: string; children: React.ReactNode; open?: boolean; icon?: React.ReactNode }) {
  return (
    <details open={open} className={cn(paperCard, "group overflow-hidden")}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 font-display text-xl">
          {icon}
          {title}
        </span>
        <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-border px-5 py-4 text-[14px] leading-relaxed">{children}</div>
    </details>
  );
}

const Bullets = ({ items, tone = "accent" }: { items: string[]; tone?: "accent" | "warn" | "danger" }) => (
  <ul className="space-y-1.5">
    {items.map((x, i) => (
      <li key={i} className="flex gap-2">
        <span aria-hidden className={cn("mt-2 size-1.5 shrink-0 rounded-full", tone === "accent" ? "bg-accent" : tone === "warn" ? "bg-warn" : "bg-danger")} />
        {x}
      </li>
    ))}
  </ul>
);

export function ConceptView({ name, conceptKey }: { name: string; conceptKey: string }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>("learn");
  const [lang, setLang] = useState<Lang>("en");
  const key = ["knowledge", "concept", name, conceptKey, lang];
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: key,
    queryFn: () => api.get<ConceptChapter>(`/career/knowledge/concept?name=${encodeURIComponent(name)}&c=${encodeURIComponent(conceptKey)}&lang=${lang}`),
    enabled: !!name && !!conceptKey,
    staleTime: 60_000,
  });
  const mark = useMutation({
    mutationFn: (status: "LEARNING" | "UNDERSTOOD") => api.post<{ status: string }>("/career/knowledge/concept/progress", { name, c: conceptKey, status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["knowledge"] });
    },
  });

  const back = (
    <Link href={mapHref(name)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-text">
      <ArrowLeft className="size-3.5" aria-hidden /> {name} map
    </Link>
  );
  if (isLoading)
    return (
      <div className="space-y-6">
        {back}
        <div role="status" className={cn(paperCard, "space-y-3 p-6")}>
          <p className="text-sm text-muted">Writing this chapter — diagrams, examples and interview questions. The first time takes a little longer; after that it opens instantly for everyone.</p>
          <div className="shimmer h-6 w-2/3 rounded" />
          <div className="shimmer h-40 rounded-xl" />
        </div>
      </div>
    );
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const d = data!;
  const c = d.content;
  const status = d.progress.status;
  const S = STATUS[status];

  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        <Tabs value={lang} onChange={setLang} items={[{ value: "en", label: "English" }, { value: "hinglish", label: "Hinglish" }, { value: "hi", label: "हिन्दी" }]} />
      </div>

      <header className="space-y-3">
        <p className="eyebrow text-accent">
          {d.skill.name} · {d.domain.title}
        </p>
        <h1 className="font-display text-[2.4rem] leading-[1.05] sm:text-5xl">{d.concept.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
          <Badge tone={IMPORTANCE[d.concept.importance].tone}>{IMPORTANCE[d.concept.importance].label}</Badge>
          <span className="inline-flex items-center gap-1.5">
            Difficulty <Dots value={d.concept.difficulty} label="Difficulty" />
          </span>
          <span className="inline-flex items-center gap-1.5">
            Interview frequency <Frequency value={d.concept.frequency} />
          </span>
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", S.className)}>
            <S.icon className="size-3" aria-hidden /> {S.label}
            {d.progress.explainScore !== null && ` · ${d.progress.explainScore}`}
          </span>
        </div>
        {d.concept.prerequisites.length > 0 && (
          <p className="text-xs text-muted">
            Builds on:{" "}
            {d.concept.prerequisites.map((p, i) => (
              <span key={p.key}>
                {i > 0 && ", "}
                <Link href={conceptHref(name, p.key)} className="text-text underline underline-offset-2 hover:text-accent">
                  {p.title}
                </Link>
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="sticky top-[65px] z-10 -mx-1 overflow-x-auto bg-bg/85 px-1 py-2 backdrop-blur">
        <Tabs
          value={mode}
          onChange={setMode}
          items={[
            { value: "learn", label: "📖 Learn" },
            { value: "visual", label: "🎨 Visual" },
            { value: "code", label: "💻 Code" },
            { value: "explain", label: "🎤 Explain" },
            { value: "interview", label: "🔥 Interview" },
          ]}
        />
      </div>

      {mode === "learn" && (
        <div className="space-y-4">
          <p className="font-display text-2xl leading-snug sm:text-[1.75rem]">{c.oneLine}</p>

          <TapedNote tape="Explain like I'm new" className="rotate-0">
            {c.explainLikeNew && <p className="text-[15px] leading-relaxed">{c.explainLikeNew}</p>}
            <p className="font-display mt-3 text-2xl leading-snug">&ldquo;{c.mentalModel.analogy}&rdquo;</p>
            <p className="mt-2 text-[14px]">{c.mentalModel.explanation}</p>
          </TapedNote>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Problem", c.why.problem, "text-danger"],
              ["Solution", c.why.solution, "text-accent"],
              ["Trade-off", c.why.tradeoff, "text-warn"],
            ].map(([t, body, tone], i) => (
              <div key={t} className={cn(paperCard, "p-4")}>
                <div className={cn("eyebrow", tone)}>
                  {i + 1} · {t}
                </div>
                <p className="mt-2 text-[14px] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <section aria-labelledby="visual-h" className="space-y-3">
            <h2 id="visual-h" className="eyebrow text-accent">
              Visual explanation
            </h2>
            {c.visuals.length ? c.visuals.map((v, i) => <DiagramView key={i} diagram={v} />) : <p className="text-sm text-muted">No diagram for this chapter.</p>}
          </section>

          <Section title="How it works" open>
            <ol className="space-y-2">
              {c.howItWorks.map((st, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-mono text-xs text-accent-2">{String(i + 1).padStart(2, "0")}</span>
                  {st}
                </li>
              ))}
            </ol>
          </Section>

          {(c.deepDives ?? []).map((dd, i) => (
            <Section key={i} title={dd.title}>
              <p>{dd.body}</p>
              {dd.points.length > 0 && (
                <div className="mt-3">
                  <Bullets items={dd.points} />
                </div>
              )}
              {dd.visual && (
                <div className="mt-4">
                  <DiagramView diagram={dd.visual} compact />
                </div>
              )}
            </Section>
          ))}

          {c.realWorld.length > 0 && (
            <Section title="Where it's used">
              <ul className="space-y-2">
                {c.realWorld.map((r, i) => (
                  <li key={i}>
                    <span className="font-semibold">{r.where}</span> — <span className="text-muted">{r.how}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Implementation">
            {c.code ? (
              <div className="space-y-3">
                <CodeBlock code={c.code.snippet} language={c.code.language} />
                <p>{c.code.explanation}</p>
              </div>
            ) : (
              <p className="text-muted">{c.codeNote ?? "Code is not the best way to understand this concept."}</p>
            )}
          </Section>

          <Section title="When to use it — and when not to">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="eyebrow mb-2 text-accent">Use it when</div>
                <Bullets items={c.whenToUse} />
              </div>
              <div>
                <div className="eyebrow mb-2 text-danger">Don&apos;t reach for it when</div>
                <Bullets items={c.whenNotToUse} tone="danger" />
              </div>
            </div>
          </Section>
          <Section title="Trade-offs">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="eyebrow mb-2 text-accent">Advantages</div>
                <Bullets items={c.advantages} />
              </div>
              <div>
                <div className="eyebrow mb-2 text-warn">Costs</div>
                <Bullets items={c.disadvantages} tone="warn" />
              </div>
            </div>
            {(c.tradeoffs ?? []).length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <div className="eyebrow mb-2 text-muted">The trade-off in one line</div>
                <Bullets items={c.tradeoffs!} tone="warn" />
              </div>
            )}
          </Section>
          {c.mistakes.length > 0 && (
            <Section title="Common mistakes — wrong vs right">
              <ul className="space-y-3">
                {c.mistakes.map((m, i) => (
                  <li key={i} className="space-y-1">
                    <p className="flex gap-2 text-danger">
                      <X className="mt-0.5 size-4 shrink-0" aria-hidden /> <span>&ldquo;{m.wrong}&rdquo;</span>
                    </p>
                    <p className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> <span>{m.right}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {c.internals.length > 0 && (
            <Section title="What happens internally" icon={<Badge tone="info">Advanced</Badge>}>
              <Bullets items={c.internals} />
            </Section>
          )}
          <CheatSheet d={d} />
        </div>
      )}

      {mode === "visual" && (
        <div className="space-y-4">
          <p className="text-sm text-muted">{c.oneLine}</p>
          {c.visuals.length ? c.visuals.map((v, i) => <DiagramView key={i} diagram={v} />) : <p className="text-sm text-muted">This chapter has no diagrams.</p>}
          {(c.deepDives ?? []).filter((dd) => dd.visual).map((dd, i) => (
            <DiagramView key={`dd-${i}`} diagram={dd.visual!} />
          ))}
        </div>
      )}

      {mode === "code" && (
        <div className="space-y-4">
          {c.code ? (
            <>
              <CodeBlock code={c.code.snippet} language={c.code.language} />
              <p className={cn(paperCard, "p-4 text-[14px] leading-relaxed")}>{c.code.explanation}</p>
              {c.visuals.find((v) => v.kind === "flow") && <DiagramView diagram={c.visuals.find((v) => v.kind === "flow")!} compact />}
            </>
          ) : (
            <p className={cn(paperCard, "p-5 text-sm text-muted")}>{c.codeNote ?? "Code is not the best way to understand this concept."} Use the Visual and Interview modes instead.</p>
          )}
        </div>
      )}

      {mode === "explain" && <ExplainMode d={d} name={name} lang={lang} onDone={() => void qc.invalidateQueries({ queryKey: ["knowledge"] })} />}

      {mode === "interview" && <InterviewMode d={d} />}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <div className="flex flex-wrap gap-2">
          {status === "MASTERED" ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-accent">
              <CheckCircle2 className="size-4" aria-hidden /> Mastered — you explained it well.
            </span>
          ) : status === "UNDERSTOOD" ? (
            <Button variant="secondary" size="sm" onClick={() => mark.mutate("LEARNING")} loading={mark.isPending}>
              Mark as still learning
            </Button>
          ) : (
            <Button size="sm" onClick={() => mark.mutate("UNDERSTOOD")} loading={mark.isPending}>
              <Check className="size-3.5" aria-hidden /> I understand this
            </Button>
          )}
          {status !== "MASTERED" && (
            <Button variant="ghost" size="sm" onClick={() => setMode("explain")}>
              <Mic className="size-3.5" aria-hidden /> Prove it — explain in 60 s
            </Button>
          )}
        </div>
        <nav aria-label="Concept navigation" className="flex gap-2">
          {d.prev && (
            <Link href={conceptHref(name, d.prev.key)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent">
              <ArrowLeft className="size-3.5" aria-hidden /> {d.prev.title}
            </Link>
          )}
          {d.next && (
            <Link href={conceptHref(name, d.next.key)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent">
              {d.next.title} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </nav>
      </footer>
      {d.unlocks.length > 0 && (
        <p className="text-xs text-muted">
          Next, this unlocks:{" "}
          {d.unlocks.map((u, i) => (
            <span key={u.key}>
              {i > 0 && " · "}
              <Link href={conceptHref(name, u.key)} className="text-text underline underline-offset-2 hover:text-accent">
                {u.title}
              </Link>
            </span>
          ))}
        </p>
      )}
      <p className="text-[11px] text-subtle">Written by AI for Prompters and checked against a fixed format. If anything looks wrong, verify it before relying on it.</p>
    </article>
  );
}

function CheatSheet({ d }: { d: ConceptChapter }) {
  const s = d.content.cheatSheet;
  return (
    <section aria-labelledby="cheat-h" className="rounded-xl border-2 border-dashed border-border-strong bg-surface p-5">
      <h2 id="cheat-h" className="eyebrow text-accent">
        {d.concept.title} · cheat sheet
      </h2>
      <p className="font-display mt-2 text-xl">{s.definition}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="eyebrow mb-1.5 text-[9px] text-muted">Use for</div>
          <ul className="space-y-1 text-[13px]">
            {s.useFor.map((x, i) => (
              <li key={i}>✓ {x}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-1.5 text-[9px] text-muted">Remember</div>
          <ul className="space-y-1 text-[13px]">
            {s.remember.map((x, i) => (
              <li key={i}>→ {x}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 border-t border-border pt-3 text-[13px]">
        <span className="eyebrow mr-2 text-[9px] text-accent-2">Interview question</span>&ldquo;{s.interviewQuestion}&rdquo;
      </p>
    </section>
  );
}

function InterviewMode({ d }: { d: ConceptChapter }) {
  const [hints, setHints] = useState<Set<number>>(new Set());
  const [steps, setSteps] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const c = d.content;
  return (
    <div className="space-y-4">
      {(c.quiz ?? []).length > 0 && <Quiz quiz={c.quiz!} />}
      <section aria-labelledby="levels-h" className={cn(paperCard, "p-5")}>
        <h2 id="levels-h" className="font-display text-2xl">
          From zero to interview level
        </h2>
        <p className="mt-1 text-xs text-muted">Try each question out loud before you open the hint.</p>
        <ol className="mt-4 space-y-3">
          {c.levels.map((l, i) => (
            <li key={i} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="eyebrow text-accent-2">
                  Level {l.level} · {LEVEL_LABEL[l.level] ?? ""}
                </span>
                <button
                  type="button"
                  onClick={() => setHints((h) => new Set(h).add(i))}
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-text disabled:opacity-50"
                  disabled={hints.has(i)}
                >
                  <Lightbulb className="size-3.5" aria-hidden /> {hints.has(i) ? "Hint shown" : "Show hint"}
                </button>
              </div>
              <p className="mt-1.5 text-[15px] font-medium">{l.question}</p>
              {hints.has(i) && <p className="mt-2 rounded-md bg-info-soft p-2 text-[13px] text-info">{l.hint}</p>}
            </li>
          ))}
        </ol>
      </section>

      {c.interviewerExpects.length > 0 && (
        <section aria-labelledby="expects-h" className={cn(paperCard, "p-5")}>
          <h2 id="expects-h" className="font-display text-2xl">
            Interviewer thinking
          </h2>
          <p className="mt-1 text-xs text-muted">What a strong answer walks through, in order. Reveal one step at a time and say it before you look.</p>
          <ol className="mt-3 space-y-1.5 text-[14px]">
            {c.interviewerExpects.slice(0, steps).map((x, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-xs text-accent-2">{i + 1}.</span>
                {x}
              </li>
            ))}
          </ol>
          {steps < c.interviewerExpects.length && (
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => setSteps((s) => s + 1)}>
              <Eye className="size-3.5" aria-hidden /> Reveal step {steps + 1} of {c.interviewerExpects.length}
            </Button>
          )}
        </section>
      )}

      <section className={cn(paperCard, "p-5")}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl">Key points</h2>
          <Button size="sm" variant="ghost" onClick={() => setShowPoints((s) => !s)}>
            {showPoints ? "Hide" : "Show"}
          </Button>
        </div>
        {showPoints && (
          <div className="mt-3">
            <Bullets items={c.keyPoints} />
          </div>
        )}
      </section>
    </div>
  );
}

function Quiz({ quiz }: { quiz: NonNullable<ConceptChapter["content"]["quiz"]> }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const answered = Object.keys(picked).length;
  const right = quiz.filter((q, i) => picked[i] === q.answer).length;
  return (
    <section aria-labelledby="quiz-h" className={cn(paperCard, "p-5")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="quiz-h" className="font-display text-2xl">
          Quick check
        </h2>
        {answered > 0 && (
          <span className="font-mono text-xs text-muted" aria-live="polite">
            {right}/{answered} correct
          </span>
        )}
      </div>
      <ol className="mt-4 space-y-5">
        {quiz.map((q, i) => {
          const choice = picked[i];
          const done = choice !== undefined;
          return (
            <li key={i}>
              <fieldset>
                <legend className="text-[15px] font-medium">
                  {i + 1}. {q.question}
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {q.options.map((o, k) => (
                    <button
                      key={k}
                      type="button"
                      disabled={done}
                      aria-pressed={choice === k}
                      onClick={() => setPicked((p) => ({ ...p, [i]: k }))}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-[13px] transition-colors",
                        !done && "border-border hover:border-accent",
                        done && k === q.answer && "border-accent bg-accent-soft",
                        done && choice === k && k !== q.answer && "border-danger bg-danger-soft",
                        done && choice !== k && k !== q.answer && "border-border opacity-60",
                      )}
                    >
                      {o}
                    </button>
                  ))}
                </div>
                {done && (
                  <p className={cn("mt-2 text-[13px]", choice === q.answer ? "text-accent" : "text-danger")}>
                    {choice === q.answer ? "Correct. " : "Not quite. "}
                    <span className="text-text">{q.explanation}</span>
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const SECONDS = 60;

function ExplainMode({ d, name, lang, onDone }: { d: ConceptChapter; name: string; lang: Lang; onDone: () => void }) {
  const [answer, setAnswer] = useState("");
  const [left, setLeft] = useState<number | null>(null);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const append = useCallback((t: string) => setAnswer((a) => (a ? `${a} ${t}` : t)), []);
  const dictation = useDictation(append);
  const stopRef = useRef(dictation.stop);
  useEffect(() => {
    stopRef.current = dictation.stop;
  }, [dictation.stop]);

  const explain = useMutation({
    meta: { silent: true },
    mutationFn: () => api.post<ExplainResult>("/career/knowledge/concept/explain", { name, c: d.concept.key, answer: answer.trim(), lang }),
    onSuccess: (r) => {
      setResult(r);
      onDone();
    },
  });

  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s === null || s <= 1) {
          clearInterval(t);
          queueMicrotask(() => void stopRef.current());
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [left]);

  const start = () => {
    setResult(null);
    setAnswer("");
    setLeft(SECONDS);
  };

  return (
    <section aria-labelledby="explain-h" className={cn(paperCard, "space-y-4 p-5")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="explain-h" className="font-display text-2xl">
          Explain {d.concept.title} in 60 seconds
        </h2>
        <span className="text-xs text-muted">Score {d.progress.explainScore ?? "—"} · mastered at 75+</span>
      </div>
      <p className="text-sm text-muted">{d.content.explainTask ?? `Explain ${d.concept.title} in 60 seconds.`} Say it like you would in an interview — out loud, or type it. Manisha checks it against what an interviewer listens for.</p>
      {left !== null && (
        <div>
          <div className="flex items-center justify-between font-mono text-sm tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <Timer className="size-4" aria-hidden /> {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
            </span>
            {left === 0 && <span className="text-xs text-warn">Time&apos;s up — submit what you have.</span>}
          </div>
          <Progress value={(left / SECONDS) * 100} className="mt-1.5" label="Time left" />
        </div>
      )}
      {left === null ? (
        <Button onClick={start}>
          <Timer className="size-4" aria-hidden /> Start 60-second explanation
        </Button>
      ) : (
        <>
          <Textarea aria-label="Your explanation" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Explain it in your own words…" className="min-h-36" />
          {dictation.interim && <p className="text-xs italic text-subtle">{dictation.interim}</p>}
          {dictation.error === "mic-denied" && <p className="text-xs text-warn">Microphone permission is blocked — type your explanation instead.</p>}
          <div className="flex flex-wrap gap-2">
            {dictation.supported && (
              <Button variant="secondary" size="sm" onClick={() => (dictation.listening ? void dictation.stop() : dictation.start())} aria-pressed={dictation.listening} disabled={dictation.blocked}>
                {dictation.listening ? <MicOff className="size-3.5" aria-hidden /> : <Mic className="size-3.5" aria-hidden />}
                {dictation.listening ? "Stop speaking" : "Speak"}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                void dictation.stop();
                explain.mutate();
              }}
              disabled={answer.trim().length < 10}
              loading={explain.isPending}
            >
              Check my explanation
            </Button>
            <Button size="sm" variant="ghost" onClick={start}>
              Restart
            </Button>
          </div>
        </>
      )}
      {explain.error && (
        <p role="alert" className="flex gap-2 rounded-md border border-warn/30 bg-warn-soft p-3 text-sm text-warn">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {explain.error instanceof Error ? explain.error.message : "Couldn't check that right now. Your text is still here — try again."}
        </p>
      )}
      {result && (
        <div className={cn("space-y-3 rounded-xl border p-4", result.mastered ? "border-accent/40 bg-accent-soft/50" : "border-border bg-surface-2/50")} aria-live="polite">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-3xl tabular-nums">{result.score}</span>
            <span className="text-sm">{result.mastered ? "Mastered — that's an interview-ready explanation." : `Not yet — ${result.masteryScore}+ masters this concept.`}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {(["correctness", "completeness", "depth", "clarity"] as const).map((k) => (
              <div key={k} className="rounded-md border border-border bg-surface p-2">
                <div className="capitalize text-muted">{k}</div>
                <div className="font-mono text-base">{result.evaluation[k]}/10</div>
              </div>
            ))}
          </div>
          <p className="text-[14px]">{result.evaluation.feedback}</p>
          {result.evaluation.covered.length > 0 && (
            <p className="text-[13px]">
              <span className="font-semibold text-accent">Covered:</span> {result.evaluation.covered.join(" · ")}
            </p>
          )}
          {result.evaluation.missing.length > 0 && (
            <p className="text-[13px]">
              <span className="font-semibold text-warn">Missing:</span> {result.evaluation.missing.join(" · ")}
            </p>
          )}
          {result.evaluation.incorrect.length > 0 && (
            <p className="text-[13px]">
              <span className="font-semibold text-danger">Not quite right:</span> {result.evaluation.incorrect.join(" · ")}
            </p>
          )}
          {result.evaluation.unnecessary.length > 0 && (
            <p className="text-[13px] text-muted">
              <span className="font-semibold">Could drop:</span> {result.evaluation.unnecessary.join(" · ")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
