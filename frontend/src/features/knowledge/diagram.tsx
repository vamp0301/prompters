"use client";
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight, GitBranch } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Diagram } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * Renders the six Prompters diagram kinds as real HTML (themable, readable on a phone, never an
 * image). Every diagram states what it teaches and offers a plain-text version for screen readers.
 */

const box = "rounded-lg border border-border bg-surface px-3 py-2 text-center text-[13px] font-semibold leading-snug shadow-[0_1px_0_var(--line)]";
const down = <ArrowDown className="mx-auto size-4 text-subtle" aria-hidden />;

/** The component highlighted by the current walkthrough step (matched by label). */
const ActiveLabel = createContext<string | null>(null);

function Node({ label, note, tone }: { label: string; note?: string; tone?: "accent" | "info" | "warn" }) {
  const active = useContext(ActiveLabel);
  const on = !!active && active.toLowerCase() === label.toLowerCase();
  return (
    <div
      data-active={on || undefined}
      className={cn(
        box,
        "transition-[box-shadow,background-color] duration-200",
        tone === "accent" && "border-accent/40 bg-accent-soft",
        tone === "info" && "border-info/40 bg-info-soft",
        tone === "warn" && "border-warn/40 bg-warn-soft",
        on && "border-accent-2 bg-accent-2-soft ring-2 ring-accent-2/60",
      )}
    >
      {label}
      {note && <div className="mt-0.5 text-[11px] font-normal text-muted">{note}</div>}
    </div>
  );
}

function Architecture({ d }: { d: Extract<Diagram, { kind: "architecture" }> }) {
  return (
    <div className="space-y-2">
      {d.layers.map((layer, i) => (
        <div key={i}>
          {i > 0 && <div className="mb-2">{down}</div>}
          <div className="grid items-center gap-2 sm:grid-cols-[110px_1fr]">
            <span className="eyebrow text-[9px] text-muted sm:text-right">{layer.label ?? ""}</span>
            <div className="flex flex-wrap justify-center gap-2">
              {layer.nodes.map((n, k) => (
                <div key={k} className="min-w-[96px] flex-1 sm:max-w-[200px]">
                  <Node label={n.label} note={n.note} tone={i === 0 ? "info" : i === d.layers.length - 1 ? "accent" : undefined} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Flow({ d }: { d: Extract<Diagram, { kind: "flow" }> }) {
  return (
    <div className="mx-auto max-w-xl space-y-2">
      {d.steps.map((s, i) => (
        <div key={i} className="space-y-2">
          {i > 0 && down}
          <Node label={s.label} note={s.note} tone={i === 0 ? "info" : i === d.steps.length - 1 && !s.branches ? "accent" : undefined} />
          {s.branches && (
            <div className={cn("grid gap-3 pt-1", s.branches.length === 2 ? "grid-cols-2" : s.branches.length === 3 ? "grid-cols-3" : "grid-cols-1")}>
              {s.branches.map((b, k) => (
                <div key={k} className="space-y-2 rounded-lg border border-dashed border-border-strong p-2">
                  <div className="eyebrow text-center text-[9px] text-accent-2">{b.label}</div>
                  {b.steps.map((t, j) => (
                    <div key={j} className="space-y-2">
                      {j > 0 && down}
                      <Node label={t} tone={j === b.steps.length - 1 ? "accent" : undefined} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Comparison({ d }: { d: Extract<Diagram, { kind: "comparison" }> }) {
  const side = (s: { title: string; points: string[] }, tone: "info" | "accent") => (
    <div className={cn("rounded-xl border p-4", tone === "info" ? "border-info/30 bg-info-soft/60" : "border-accent/30 bg-accent-soft/60")}>
      <div className="font-display text-xl">{s.title}</div>
      <ul className="mt-2 space-y-1.5 text-[13px]">
        {s.points.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", tone === "info" ? "bg-info" : "bg-accent")} />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
      {side(d.left, "info")}
      <span className="eyebrow self-center text-center text-muted">vs</span>
      {side(d.right, "accent")}
    </div>
  );
}

function Timeline({ d }: { d: Extract<Diagram, { kind: "timeline" }> }) {
  const n = d.actors.length;
  const col = (a: string) => d.actors.indexOf(a);
  return (
    <>
      {/* Sequence diagram on wider screens */}
      <div className="hidden overflow-x-auto sm:block">
        <div className="min-w-[480px]">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {d.actors.map((a) => (
              <Node key={a} label={a} tone="info" />
            ))}
          </div>
          <div className="relative mt-2 space-y-3 py-2">
            {/* lifelines */}
            <div aria-hidden className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {d.actors.map((a) => (
                <div key={a} className="mx-auto w-px bg-border-strong" />
              ))}
            </div>
            {d.events.map((e, i) => {
              const a = col(e.from);
              const b = col(e.to);
              const lo = Math.min(a, b);
              const hi = Math.max(a, b);
              const self = a === b;
              return (
                <div key={i} className="relative grid items-center" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
                  <div className="relative" style={{ gridColumn: `${lo + 1} / ${hi + 2}`, marginLeft: `calc(50% / ${hi - lo + 1})`, marginRight: `calc(50% / ${hi - lo + 1})` }}>
                    <div className="mb-0.5 text-center text-[11px] font-medium">
                      <span className="mr-1 font-mono text-subtle">{i + 1}.</span>
                      {e.label}
                    </div>
                    {!self && (
                      <div className={cn("relative h-px bg-accent", b < a && "scale-x-[-1]")}>
                        <span aria-hidden className="absolute -right-0.5 -top-[5px] text-[10px] leading-none text-accent">▶</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Numbered list on phones */}
      <ol className="space-y-2 sm:hidden">
        {d.events.map((e, i) => (
          <li key={i} className="flex flex-wrap items-center gap-1.5 text-[13px]">
            <span className="font-mono text-xs text-subtle">{i + 1}.</span>
            <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-semibold">{e.from}</span>
            <ArrowRight className="size-3.5 text-accent" aria-hidden />
            <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-semibold">{e.to}</span>
            <span className="text-muted">— {e.label}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

function StateDiagram({ d }: { d: Extract<Diagram, { kind: "state" }> }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {d.states.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span className="text-subtle" aria-hidden>·</span>}
            <span className={cn("rounded-full border px-3 py-1 font-mono text-[11px] font-medium tracking-wide", i === 0 ? "border-info/40 bg-info-soft" : "border-border bg-surface")}>{s}</span>
          </span>
        ))}
      </div>
      <ul className="mx-auto max-w-lg space-y-1.5">
        {d.transitions.map((t, i) => (
          <li key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[12px]">
            <span className="justify-self-end rounded-full border border-border bg-surface px-2.5 py-0.5 font-mono">{t.from}</span>
            <span className="flex flex-col items-center text-[10px] text-muted">
              <ArrowRight className="size-4 text-accent" aria-hidden />
              {t.label}
            </span>
            <span className="justify-self-start rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 font-mono">{t.to}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Decision({ d }: { d: Extract<Diagram, { kind: "decision" }> }) {
  return (
    <div className="space-y-3">
      <div className="mx-auto max-w-sm">
        <Node label={d.question} tone="info" />
      </div>
      <div className={cn("grid gap-3", d.branches.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {d.branches.map((b, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-dashed border-border-strong p-2">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-accent-2">
              <GitBranch className="size-3.5" aria-hidden /> {b.answer}
            </div>
            {b.result && <Node label={b.result} tone="accent" />}
            {b.question && <Node label={b.question} tone="info" />}
            {b.branches && (
              <div className="grid grid-cols-2 gap-2">
                {b.branches.map((c, k) => (
                  <div key={k} className="space-y-1">
                    <div className="text-center text-[10px] font-bold text-accent-2">{c.answer}</div>
                    <Node label={c.result} tone="accent" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Plain-text version of a diagram (for screen readers and copy-paste revision). */
export function diagramText(d: Diagram): string[] {
  switch (d.kind) {
    case "architecture":
      return d.layers.map((l, i) => `${i + 1}. ${l.label ? `${l.label}: ` : ""}${l.nodes.map((n) => n.label + (n.note ? ` (${n.note})` : "")).join(", ")}`);
    case "flow":
      return d.steps.flatMap((s, i) => [`${i + 1}. ${s.label}${s.note ? ` — ${s.note}` : ""}`, ...(s.branches ?? []).map((b) => `   If ${b.label}: ${b.steps.join(" → ")}`)]);
    case "comparison":
      return [`${d.left.title}: ${d.left.points.join("; ")}`, `${d.right.title}: ${d.right.points.join("; ")}`];
    case "timeline":
      return d.events.map((e, i) => `${i + 1}. ${e.from} → ${e.to}: ${e.label}`);
    case "state":
      return [`States: ${d.states.join(", ")}`, ...d.transitions.map((t) => `${t.from} → ${t.to}${t.label ? ` (${t.label})` : ""}`)];
    case "decision":
      return [d.question, ...d.branches.flatMap((b) => [`${b.answer}: ${b.result ?? b.question ?? ""}`, ...(b.branches ?? []).map((c) => `   ${c.answer}: ${c.result}`)])];
  }
}

const KIND_LABEL: Record<Diagram["kind"], string> = { architecture: "Architecture", flow: "Flow", comparison: "Comparison", timeline: "Sequence", state: "States", decision: "Decision" };

export function DiagramView({ diagram, compact }: { diagram: Diagram; compact?: boolean }) {
  const steps = diagram.walkthrough ?? [];
  const [step, setStep] = useState(0);
  const current = steps.length ? steps[Math.min(step, steps.length - 1)] : null;
  let body: ReactNode;
  switch (diagram.kind) {
    case "architecture":
      body = <Architecture d={diagram} />;
      break;
    case "flow":
      body = <Flow d={diagram} />;
      break;
    case "comparison":
      body = <Comparison d={diagram} />;
      break;
    case "timeline":
      body = <Timeline d={diagram} />;
      break;
    case "state":
      body = <StateDiagram d={diagram} />;
      break;
    case "decision":
      body = <Decision d={diagram} />;
      break;
  }
  return (
    <figure className={cn("rounded-xl border border-border bg-bg/60 p-4 sm:p-5", !compact && "bg-grid")}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-xl">{diagram.title}</h3>
        <span className="eyebrow text-[9px] text-muted">{KIND_LABEL[diagram.kind]}</span>
      </div>
      <ActiveLabel.Provider value={current?.highlight ?? null}>
        <div aria-hidden>{body}</div>
      </ActiveLabel.Provider>
      {diagram.alt && <p className="sr-only">{diagram.alt}</p>}
      <ul className="sr-only">
        {diagramText(diagram).map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
      {current && (
        <div className="mt-4 rounded-lg border border-border bg-surface p-3">
          <p aria-live="polite" className="text-[13px]">
            <span className="eyebrow mr-2 text-[9px] text-accent-2">
              Step {step + 1} / {steps.length}
            </span>
            {current.label}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs hover:border-accent disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" aria-hidden /> Previous
            </button>
            <span className="flex gap-1" aria-hidden>
              {steps.map((_, i) => (
                <span key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-4 bg-accent-2" : "w-1.5 bg-border-strong")} />
              ))}
            </span>
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={step === steps.length - 1}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs hover:border-accent disabled:opacity-40"
            >
              Next <ChevronRight className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>
      )}
      <figcaption className="mt-4 text-xs text-muted">
        <span className="font-semibold text-text">What this shows:</span> {diagram.objective}
      </figcaption>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-muted hover:text-text">Text version</summary>
        <ul className="mt-2 space-y-1 font-mono text-[11px]">
          {diagramText(diagram).map((t, i) => (
            <li key={i} className="whitespace-pre-wrap">
              {t}
            </li>
          ))}
        </ul>
      </details>
    </figure>
  );
}
