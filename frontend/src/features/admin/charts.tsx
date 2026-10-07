"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const niceMax = (v: number) => {
  if (v <= 0) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = [1, 2, 2.5, 5, 10].find((m) => m * p >= v) ?? 10;
  return n * p;
};
const shortDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export interface Point { x: string; y: number | null }

/**
 * Single-series time chart (line or bars). One series per chart — never two y-scales.
 * Hover/focus shows a tooltip; a data table is available for screen readers and exact values.
 */
export function TimeChart({ title, data, kind = "line", unit = "", height = 160, max }: { title: string; data: Point[]; kind?: "line" | "bar"; unit?: string; height?: number; max?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 32, r: 8, t: 10, b: 22 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const top = max ?? niceMax(Math.max(0, ...data.map((d) => d.y ?? 0)));
  const step = data.length ? iw / data.length : iw;
  const x = (i: number) => pad.l + step * i + step / 2;
  const y = (v: number) => pad.t + ih - (v / top) * ih;
  const ticks = [0, top / 2, top];

  // Line path, broken at null values.
  let path = "";
  let pen = false;
  data.forEach((d, i) => {
    if (d.y === null) { pen = false; return; }
    path += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(d.y).toFixed(1)}`;
    pen = true;
  });
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(iw / 70))));
  const h = hover !== null ? data[hover] : null;
  const total = data.reduce((a, d) => a + (d.y ?? 0), 0);
  const last = [...data].reverse().find((d) => d.y !== null);

  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted">{title}</span>
        <span className="font-mono text-[11px] tabular-nums text-subtle">
          {kind === "bar" ? `Σ ${Math.round(total).toLocaleString("en-IN")}${unit}` : last ? `latest ${last.y}${unit}` : "no data"}
        </span>
      </figcaption>
      <div ref={ref} className="relative">
        <svg width={width} height={height} role="img" aria-label={`${title}, ${data.length} days`} className="block overflow-visible" onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={pad.l - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-subtle font-mono text-[10px]">{Number.isInteger(t) ? t : t.toFixed(1)}</text>
            </g>
          ))}
          {data.map((d, i) => i % labelEvery === 0 && (
            <text key={d.x} x={x(i)} y={height - 6} textAnchor="middle" className="fill-subtle font-mono text-[10px]">{shortDay(d.x)}</text>
          ))}
          {kind === "bar"
            ? data.map((d, i) => {
                const v = d.y ?? 0;
                const bw = Math.max(2, Math.min(18, step - 2));
                const bh = Math.max(v > 0 ? 2 : 0, (v / top) * ih);
                return <rect key={d.x} x={x(i) - bw / 2} y={pad.t + ih - bh} width={bw} height={bh} rx={Math.min(3, bw / 2)} fill="var(--accent)" opacity={hover === null || hover === i ? 1 : 0.45} />;
              })
            : (
              <>
                <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {hover !== null && h?.y != null && <circle cx={x(hover)} cy={y(h.y)} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />}
              </>
            )}
          {hover !== null && kind === "line" && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--border-strong)" />}
          {data.map((d, i) => (
            <rect key={`hit-${d.x}`} x={pad.l + step * i} y={pad.t} width={step} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
          ))}
        </svg>
        {h && hover !== null && (
          <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-[11px] shadow-lg" style={{ left: Math.min(width - 50, Math.max(50, x(hover))) }}>
            <span className="text-muted">{shortDay(h.x)}</span> <span className="font-mono font-medium tabular-nums">{h.y === null ? "—" : `${h.y}${unit}`}</span>
          </div>
        )}
      </div>
      <details className="mt-1">
        <summary className="cursor-pointer text-[11px] text-subtle hover:text-muted">Data table</summary>
        <div className="mt-1 max-h-40 overflow-y-auto">
          <table className="w-full font-mono text-[11px]">
            <tbody>{data.map((d) => <tr key={d.x} className="border-b border-border/50"><td className="py-0.5 text-muted">{d.x}</td><td className="text-right tabular-nums">{d.y ?? "—"}{d.y !== null && unit}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/** Horizontal bars for a short categorical distribution, value labels in text ink. */
export function HBars({ data, unit = "", className }: { data: { label: string; value: number }[]; unit?: string; className?: string }) {
  const top = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className={cn("space-y-2", className)}>
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[72px_1fr_48px] items-center gap-2 text-xs" title={`${d.label}: ${d.value}${unit}`}>
          <span className="font-mono text-muted">{d.label}</span>
          <span className="h-3 overflow-hidden rounded-r bg-surface-2">
            <span className="block h-full rounded-r bg-accent" style={{ width: `${(d.value / top) * 100}%` }} />
          </span>
          <span className="text-right font-mono tabular-nums">{d.value.toLocaleString("en-IN")}{unit}</span>
        </li>
      ))}
    </ul>
  );
}

/** Labeled percentage bar (coverage). */
export function CoverageBar({ label, value, hint }: { label: string; value: number; hint?: string }) {
  const tone = value >= 80 ? "bg-accent" : value >= 50 ? "bg-warn" : "bg-danger";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted">{label}{hint && <span className="ml-1 text-subtle">· {hint}</span>}</span>
        <span className="font-mono tabular-nums">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
