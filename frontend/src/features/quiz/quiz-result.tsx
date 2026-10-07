"use client";
import Link from "next/link";
import { CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { buttonClass } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-editor";
import { Markdown } from "@/components/ui/markdown";
import type { AttemptResult, GradedQuestion } from "@/lib/api/types";
import { cn } from "@/lib/utils";

function answerText(q: GradedQuestion, which: "answer" | "correct") {
  if (q.type === "EXPLAIN") return which === "answer" ? (typeof q.answer === "string" && q.answer ? q.answer : "—") : null;
  const idx = which === "answer" ? q.answer : q.correctAnswer;
  if (idx === null || idx === undefined) return "—";
  const arr = Array.isArray(idx) ? idx : [idx as number];
  return q.type === "ORDER_STEPS" ? arr.map((i, n) => `${n + 1}. ${q.options[i]}`).join("\n") : arr.map((i) => q.options[i]).join(", ");
}

export function QuizResult({ result, topicSlug, onRetry }: { result: AttemptResult; topicSlug?: string; onRetry?: () => void }) {
  const reduce = useReducedMotion();
  const e = (result.effects ?? {}) as { mastered?: boolean; threshold?: number; promptsUnlocked?: number; backToPractice?: boolean; nextReviewInDays?: number; skippedTopics?: number; passedStages?: string[]; stagePassed?: boolean };
  const wrong = result.questions.filter((q) => !q.correct);
  const headline =
    result.kind === "PLACEMENT" ? "Placement complete"
    : result.passed === true ? (result.kind === "MASTERY" ? "Topic mastered" : "Passed")
    : result.passed === false ? "Not yet — let's fix the gaps"
    : "Practice complete";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-surface p-6 text-center">
        <div className={cn("mx-auto grid size-14 place-items-center rounded-full", result.passed === false ? "bg-warn-soft text-warn" : "bg-accent-soft text-accent")}>
          {result.passed === false ? <XCircle className="size-7" /> : <CheckCircle2 className="size-7" />}
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{headline}</h1>
        <div className="mt-2 font-mono text-5xl font-semibold tabular-nums">{Math.round(result.score ?? 0)}<span className="text-xl text-subtle">%</span></div>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
          {e.threshold && <Badge>Mastery needs {e.threshold}%</Badge>}
          {result.integrityScore !== null && <Badge tone={result.integrityScore >= 80 ? "accent" : "warn"}>Integrity {result.integrityScore}%</Badge>}
          {result.flagged && <Badge tone="warn">Flagged for review</Badge>}
          {result.status === "EXPIRED" && <Badge tone="warn">Time ran out — autosaved answers were graded</Badge>}
        </div>
        <div className="mx-auto mt-4 max-w-md space-y-1 text-sm text-muted">
          {!!e.promptsUnlocked && <p className="flex items-center justify-center gap-1.5 text-accent"><Sparkles className="size-4" /> {e.promptsUnlocked} professional prompt card unlocked</p>}
          {e.mastered && <p>This topic will come back for a quick review in 1 day so it sticks.</p>}
          {e.backToPractice && <p>Your recall dropped — this topic is back in your practice queue.</p>}
          {e.nextReviewInDays && !e.backToPractice && <p>Next review in {e.nextReviewInDays} days.</p>}
          {e.skippedTopics !== undefined && <p>You already know {e.skippedTopics} topics — they&apos;re marked mastered so you can skip ahead.{e.passedStages?.length ? ` Stages cleared: ${e.passedStages.join(", ")}.` : ""}</p>}
          {e.stagePassed && <p className="text-accent">Next stage unlocked.</p>}
          {result.passed === false && <p>Read the explanations below. Your retry will use new questions from the pool.</p>}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {topicSlug && <Link href={`/learn/topic/${topicSlug}`} className={buttonClass("secondary")}>Back to topic</Link>}
          {onRetry && result.passed === false && <button onClick={onRetry} className={buttonClass("primary")}>Retry with new questions</button>}
          <Link href="/dashboard" className={buttonClass(topicSlug ? "ghost" : "primary")}>Dashboard</Link>
        </div>
      </motion.div>

      <h2 className="mb-3 mt-10 font-semibold">{wrong.length ? `Review ${wrong.length} missed question${wrong.length > 1 ? "s" : ""}` : "Every answer, explained"}</h2>
      <ol className="space-y-3">
        {[...wrong, ...result.questions.filter((q) => q.correct)].map((q) => (
          <li key={q.questionId} className={cn("rounded-xl border bg-surface p-5", q.correct ? "border-border" : "border-danger/30")}>
            <div className="flex items-start gap-3">
              {q.correct ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" aria-label="Correct" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-label="Incorrect" />}
              <div className="min-w-0 flex-1 space-y-3">
                <p className="font-medium">{q.prompt}</p>
                {q.code && <CodeBlock code={q.code} />}
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-surface-2 p-3"><div className="mb-1 text-xs text-subtle">Your answer</div><div className="whitespace-pre-wrap">{answerText(q, "answer")}</div></div>
                  {q.type !== "EXPLAIN" ? (
                    <div className="rounded-lg bg-accent-soft p-3"><div className="mb-1 text-xs text-subtle">Correct answer</div><div className="whitespace-pre-wrap">{answerText(q, "correct")}</div></div>
                  ) : (
                    <div className="rounded-lg bg-surface-2 p-3 text-xs">
                      {q.matched?.length ? <div><span className="text-accent">Covered:</span> {q.matched.join(", ")}</div> : null}
                      {q.missing?.length ? <div className="mt-1"><span className="text-warn">Missing ideas:</span> {q.missing.join(", ")}</div> : null}
                    </div>
                  )}
                </div>
                <div className="rounded-lg border border-border p-3"><div className="mb-1 text-xs text-subtle">Why</div><Markdown className="text-sm">{q.explanation}</Markdown></div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
