"use client";
import { useState } from "react";
import { AlertTriangle, BookOpen, Check, ChevronDown, Copy, Lightbulb, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { CodeBlock } from "@/components/ui/code-editor";
import { DiagramView } from "@/features/knowledge/diagram";
import type { TutorAnswer } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** Copies text and briefly shows a tick. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("Couldn't copy — select the text instead.");
        }
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-text"
      aria-label={label}
    >
      {done ? <Check className="size-3.5 text-accent" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-t border-border pt-3">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
        {title}
        <ChevronDown className="size-4 text-subtle transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-2 space-y-2 text-sm text-text/90">{children}</div>
    </details>
  );
}

const Bullets = ({ items, className }: { items: string[]; className?: string }) => (
  <ul className={cn("list-disc space-y-1 pl-5", className)}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
);

/**
 * The tutor's structured answer, solution first: the direct answer and steps up top, then the
 * example, code and diagram, then why it works, tests, pitfalls, the interview answer and sources.
 */
export function SolutionAnswer({ data }: { data: TutorAnswer }) {
  const a = data.structured;
  const hints = data.mode === "hints";
  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border bg-surface-2 p-4">
      <div className="rounded-lg border border-accent/30 bg-accent-soft p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-accent">
            {hints ? <Lightbulb className="size-3.5" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
            {hints ? "Hint" : "Solution"}
          </span>
          <CopyButton text={data.answer} label="Copy the whole answer" />
        </div>
        <p className="text-[15px] font-medium leading-relaxed">{a.answer}</p>
        {a.solution.summary && <p className="mt-2 text-sm text-muted">{a.solution.summary}</p>}
        {a.solution.steps.length > 0 && <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{a.solution.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>}
      </div>

      {a.examples.map((e, i) => (
        <div key={i} className="rounded-lg border border-border bg-surface p-3 text-sm">
          <div className="mb-1 font-semibold">{e.title}</div>
          <dl className="grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-x-3">
            {e.input && <><dt className="font-mono text-[11px] uppercase text-subtle">Input</dt><dd className="font-mono text-[13px]">{e.input}</dd></>}
            {e.output && <><dt className="font-mono text-[11px] uppercase text-subtle">Output</dt><dd className="font-mono text-[13px]">{e.output}</dd></>}
          </dl>
          {e.explanation && <p className="mt-1 text-muted">{e.explanation}</p>}
        </div>
      ))}

      {a.code.map((c, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-medium">{c.title || "Code"} <span className="font-mono text-[10px] uppercase text-subtle">{c.language}</span></span>
            <CopyButton text={c.code} label={`Copy ${c.title || "code"}`} />
          </div>
          <CodeBlock code={c.code} language={c.language} />
          {c.explanation.length > 0 && <Bullets items={c.explanation} className="mt-2 text-sm text-muted" />}
        </div>
      ))}

      {a.diagram && <DiagramView diagram={a.diagram} compact />}

      {(a.explanation.concept || a.explanation.whyItWorks || a.explanation.tradeoffs.length > 0) && (
        <Section title="Why it works">
          {a.explanation.concept && <p>{a.explanation.concept}</p>}
          {a.explanation.whyItWorks && <p>{a.explanation.whyItWorks}</p>}
          {a.explanation.tradeoffs.length > 0 && <><p className="font-medium">Trade-offs</p><Bullets items={a.explanation.tradeoffs} /></>}
        </Section>
      )}
      {a.testing.length > 0 && <Section title="How to check it works"><Bullets items={a.testing} /></Section>}
      {a.pitfalls.length > 0 && <Section title="Common mistakes" defaultOpen={false}><Bullets items={a.pitfalls} /></Section>}
      {a.interviewAnswer && (
        <Section title="Say it in an interview" defaultOpen={false}>
          <p className="italic">“{a.interviewAnswer}”</p>
        </Section>
      )}
      {a.nextActions.length > 0 && <Section title="Practise next" defaultOpen={false}><Bullets items={a.nextActions} /></Section>}

      <div className="space-y-1.5 border-t border-border pt-3 text-xs">
        {data.sources.length > 0 ? (
          <p className="flex flex-wrap items-center gap-1.5 text-muted">
            <ShieldCheck className="size-3.5 text-accent" aria-hidden /> Based on Prompters lessons:
            {data.sources.map((s) => <span key={s.id} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5"><BookOpen className="size-3" aria-hidden />{s.topicTitle} · {s.section.toLowerCase()}</span>)}
          </p>
        ) : null}
        {[...a.assumptions, ...a.limitations].map((x, i) => (
          <p key={i} className="flex items-start gap-1.5 text-warn"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />{x}</p>
        ))}
      </div>
    </div>
  );
}
