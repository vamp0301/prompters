"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Clock, Maximize, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-editor";
import { Textarea } from "@/components/ui/input";
import { Dialog } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { AnswerValue, Attempt, AttemptResult, QuizQuestion } from "@/lib/api/types";
import { paperCard } from "@/components/ui/paper";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  MCQ: "Choose one",
  MULTI: "Choose all that apply",
  PREDICT_OUTPUT: "Predict the output",
  SPOT_BUG: "Spot the bug",
  FILL_CODE: "Fill in the code",
  SCENARIO: "Scenario",
  ORDER_STEPS: "Put the steps in order",
  EXPLAIN: "Explain in your own words",
};

type IntegrityType = "TAB_HIDDEN" | "WINDOW_BLUR" | "COPY" | "PASTE" | "CUT" | "FULLSCREEN_EXIT" | "CONTEXT_MENU" | "BLOCKED_SHORTCUT";

function isAnswered(q: QuizQuestion, a: AnswerValue | undefined) {
  if (a === undefined || a === null) return false;
  if (q.type === "EXPLAIN") return typeof a === "string" && a.trim().length > 0;
  if (Array.isArray(a)) return a.length > 0;
  return true;
}

function QuestionBody({ q, value, onChange, secure }: { q: QuizQuestion; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void; secure: boolean }) {
  // ORDER_STEPS starts as the displayed order; the learner moves items up/down.
  const order = q.type === "ORDER_STEPS" ? (Array.isArray(value) && value.length === q.options.length ? value : q.options.map((_, i) => i)) : [];
  useEffect(() => {
    if (q.type === "ORDER_STEPS" && !Array.isArray(value)) onChange(q.options.map((_, i) => i));
  }, [q, value, onChange]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone="info">{TYPE_LABEL[q.type]}</Badge>
        <Badge>{"●".repeat(q.difficulty)}<span className="sr-only">difficulty {q.difficulty}</span></Badge>
      </div>
      <h2 className="font-display text-xl font-semibold leading-relaxed">{q.prompt}</h2>
      {q.code && <div className="mt-4"><CodeBlock code={q.code} language={q.codeLanguage} /></div>}

      <div className="mt-5">
        {q.type === "EXPLAIN" ? (
          <Textarea
            aria-label="Your answer"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Apne words mein samjhao — Hinglish chalega. 2–4 sentences."
            className="min-h-36"
            onPaste={secure ? (e) => e.preventDefault() : undefined}
          />
        ) : q.type === "ORDER_STEPS" ? (
          <ol className="space-y-2" aria-label="Steps — use the arrows to reorder">
            {order.map((optIdx, pos) => (
              <li key={optIdx} className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-3">
                <span className="font-mono text-xs text-subtle">{pos + 1}</span>
                <span className="flex-1 text-sm">{q.options[optIdx]}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Move "${q.options[optIdx]}" up`}
                    disabled={pos === 0}
                    onClick={() => { const n = [...order]; [n[pos - 1], n[pos]] = [n[pos], n[pos - 1]]; onChange(n); }}
                    className="rounded p-1 text-muted hover:bg-surface hover:text-text disabled:opacity-30"
                  ><ArrowUp className="size-4" /></button>
                  <button
                    type="button"
                    aria-label={`Move "${q.options[optIdx]}" down`}
                    disabled={pos === order.length - 1}
                    onClick={() => { const n = [...order]; [n[pos + 1], n[pos]] = [n[pos], n[pos + 1]]; onChange(n); }}
                    className="rounded p-1 text-muted hover:bg-surface hover:text-text disabled:opacity-30"
                  ><ArrowDown className="size-4" /></button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <fieldset className="space-y-2">
            <legend className="sr-only">{TYPE_LABEL[q.type]}</legend>
            {q.options.map((opt, i) => {
              const multi = q.type === "MULTI";
              const checked = multi ? Array.isArray(value) && value.includes(i) : value === i;
              return (
                <label
                  key={i}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                    checked ? "border-accent bg-accent-soft" : "border-border bg-surface-2 hover:border-border-strong",
                  )}
                >
                  <input
                    type={multi ? "checkbox" : "radio"}
                    name={q.id}
                    checked={checked}
                    onChange={() => {
                      if (!multi) return onChange(i);
                      const cur = Array.isArray(value) ? value : [];
                      onChange(cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]);
                    }}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <span className="font-mono text-xs text-subtle">{String.fromCharCode(65 + i)}</span>
                  <span className="flex-1 whitespace-pre-wrap">{opt}</span>
                </label>
              );
            })}
          </fieldset>
        )}
      </div>
    </div>
  );
}

function Countdown({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, new Date(expiresAt).getTime() - now);
  useEffect(() => {
    if (left === 0 && !fired.current) {
      fired.current = true;
      onExpire();
    }
  }, [left, onExpire]);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <span role="timer" aria-live={left < 60000 ? "polite" : "off"} className={cn("inline-flex items-center gap-1.5 font-mono text-sm tabular-nums", left < 5 * 60000 && "text-warn", left < 60000 && "text-danger")}>
      <Clock className="size-4" aria-hidden /> {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export function QuizRunner({ attempt, title, onFinished }: { attempt: Attempt; title: string; onFinished: (r: AttemptResult) => void }) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(attempt.draftAnswers ?? {});
  const [index, setIndex] = useState(0);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [integrity, setIntegrity] = useState({ tabSwitches: 0, events: 0 });
  const rules = attempt.assessment ?? null;
  const secure = !!rules;
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const dirty = useRef(false);
  const done = useRef(false);

  const q = attempt.questions[index];
  const answeredCount = useMemo(() => attempt.questions.filter((x) => isAnswered(x, answers[x.id])).length, [attempt.questions, answers]);

  const submit = useCallback(async () => {
    if (done.current) return;
    done.current = true;
    setSubmitting(true);
    try {
      const r = await api.post<AttemptResult>(`/attempts/${attempt.id}/submit`, { answers: answersRef.current });
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      onFinished(r);
    } catch (e) {
      done.current = false;
      toast.error(e instanceof Error ? e.message : "Submit failed — your answers are saved, try again.");
    } finally {
      setSubmitting(false);
    }
  }, [attempt.id, onFinished]);

  // Autosave every 10 s (PRD: exam windows protected by autosave).
  useEffect(() => {
    const t = setInterval(() => {
      if (!dirty.current || done.current) return;
      dirty.current = false;
      api.put(`/attempts/${attempt.id}/draft`, { answers: answersRef.current }).catch(() => { dirty.current = true; });
    }, 10_000);
    return () => clearInterval(t);
  }, [attempt.id]);

  // Secure mode: log integrity events. Browsers can't stop a second device — we log, we don't spy.
  const log = useCallback(
    async (type: IntegrityType) => {
      if (!secure || done.current) return;
      setIntegrity((s) => ({ tabSwitches: s.tabSwitches + (type === "TAB_HIDDEN" ? 1 : 0), events: s.events + 1 }));
      try {
        const r = await api.post<{ autoSubmitted: boolean; result?: AttemptResult; tabSwitches?: number; tabSwitchLimit?: number }>(`/attempts/${attempt.id}/integrity`, { events: [{ type }] });
        if (r.autoSubmitted && r.result) {
          done.current = true;
          if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
          toast.warning("Your test was auto-submitted because you left the test window too many times.");
          onFinished(r.result);
        } else if (type === "TAB_HIDDEN" && r.tabSwitchLimit !== undefined) {
          toast.warning(`You left the test window (${r.tabSwitches}/${r.tabSwitchLimit}).`);
        }
      } catch {
        /* logging must never break the test */
      }
    },
    [attempt.id, onFinished, secure],
  );

  useEffect(() => {
    if (!secure) return;
    const onVis = () => document.visibilityState === "hidden" && log("TAB_HIDDEN");
    const onBlur = () => document.visibilityState === "visible" && log("WINDOW_BLUR");
    const clip = (type: "COPY" | "PASTE" | "CUT") => (e: ClipboardEvent) => {
      if (rules?.blockClipboard) e.preventDefault();
      log(type);
    };
    const onCopy = clip("COPY"), onPaste = clip("PASTE"), onCut = clip("CUT");
    const onMenu = (e: MouseEvent) => { e.preventDefault(); log("CONTEXT_MENU"); };
    const onFs = () => !document.fullscreenElement && !done.current && log("FULLSCREEN_EXIT");
    const onBeforeUnload = (e: BeforeUnloadEvent) => { if (!done.current) e.preventDefault(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("cut", onCut);
    document.addEventListener("contextmenu", onMenu);
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("contextmenu", onMenu);
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [secure, log, rules?.blockClipboard]);

  const setAnswer = useCallback((v: AnswerValue) => {
    dirty.current = true;
    setAnswers((a) => {
      const next = { ...a, [attempt.questions[index].id]: v };
      answersRef.current = next;
      return next;
    });
  }, [attempt.questions, index]);

  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const f = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-4 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <div className="eyebrow text-accent">{attempt.kind.replace("_", " ").toLowerCase()}</div>
          <h1 className="truncate font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          {secure && (
            <span className="hidden items-center gap-1.5 text-xs text-muted sm:inline-flex" title="Platform AI is off and integrity events are logged">
              <ShieldCheck className="size-4 text-accent" aria-hidden /> AI off · {integrity.tabSwitches}/{rules!.tabSwitchLimit} tab switches
            </span>
          )}
          {attempt.expiresAt && <Countdown expiresAt={attempt.expiresAt} onExpire={submit} />}
          <Button size="sm" onClick={() => setConfirm(true)} loading={submitting}>Submit</Button>
        </div>
      </header>

      {secure && rules?.requireFullscreen && !fullscreen && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-sm">
          <span>This test runs in fullscreen. Leaving fullscreen or switching tabs is logged.</span>
          <Button size="sm" variant="secondary" onClick={() => document.documentElement.requestFullscreen().catch(() => toast.error("Your browser blocked fullscreen."))}>
            <Maximize className="size-4" /> Enter fullscreen
          </Button>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Progress value={(answeredCount / attempt.questions.length) * 100} label="Answered" />
        <span className="shrink-0 font-mono text-xs text-muted">{answeredCount}/{attempt.questions.length}</span>
      </div>

      <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[1fr_200px]">
        <section aria-live="polite" className={cn(paperCard, "p-5 sm:p-6", secure && "select-none")}>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <span className="font-mono text-xs font-semibold tracking-[0.16em] text-accent-2">
              QUESTION {String(index + 1).padStart(2, "0")} / {String(attempt.questions.length).padStart(2, "0")}
            </span>
            <button
              onClick={() => setFlagged((f) => { const n = new Set(f); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; })}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-text"
              aria-pressed={flagged.has(q.id)}
            >
              {flagged.has(q.id) ? <BookmarkCheck className="size-4 text-warn" /> : <Bookmark className="size-4" />} Mark for review
            </button>
          </div>
          <QuestionBody key={q.id} q={q} value={answers[q.id]} onChange={setAnswer} secure={secure} />
          <div className="mt-8 flex justify-between">
            <Button variant="secondary" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}><ChevronLeft className="size-4" /> Previous</Button>
            {index < attempt.questions.length - 1 ? (
              <Button variant="secondary" onClick={() => setIndex((i) => i + 1)}>Next <ChevronRight className="size-4" /></Button>
            ) : (
              <Button onClick={() => setConfirm(true)}>Review & submit</Button>
            )}
          </div>
        </section>

        <nav aria-label="Questions" className="h-fit rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 text-xs font-medium text-muted">Questions</div>
          <div className="grid grid-cols-5 gap-1.5">
            {attempt.questions.map((x, i) => (
              <button
                key={x.id}
                onClick={() => setIndex(i)}
                aria-label={`Question ${i + 1}${isAnswered(x, answers[x.id]) ? ", answered" : ""}${flagged.has(x.id) ? ", marked for review" : ""}`}
                aria-current={i === index}
                className={cn(
                  "relative grid aspect-square place-items-center rounded-md border font-mono text-xs",
                  i === index ? "border-accent text-text" : "border-border text-muted",
                  isAnswered(x, answers[x.id]) && "bg-accent-soft",
                )}
              >
                {i + 1}
                {flagged.has(x.id) && <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-warn" />}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Submit your answers?">
        <p className="text-sm text-muted">
          You answered {answeredCount} of {attempt.questions.length}.
          {answeredCount < attempt.questions.length && " Unanswered questions count as wrong."}
          {flagged.size > 0 && ` ${flagged.size} marked for review.`}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm(false)}>Keep going</Button>
          <Button onClick={() => { setConfirm(false); submit(); }} loading={submitting}>Submit</Button>
        </div>
      </Dialog>
    </div>
  );
}
