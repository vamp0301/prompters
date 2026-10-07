"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatDate } from "@/lib/utils";

export interface ScorePoint {
  score: number;
  createdAt: string;
}

const fmt = (d: string) => formatDate(d, { day: "numeric", month: "short" });
const fmtLong = (d: string) => formatDate(d, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

/** Tracks an element's width via ResizeObserver (state is set from the observer callback, never synchronously in the effect). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Readiness score over time (0–100, one series). Accessible: role="img" with a
 * summary label, keyboard-navigable points (←/→) and a visually hidden data table.
 * `compact` renders a sparkline without axes.
 */
export function ScoreHistoryChart({ points, label = "Readiness score history", compact = false, height }: { points: ScorePoint[]; label?: string; compact?: boolean; height?: number }) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();
  const h = height ?? (compact ? 56 : 220);
  const pad = compact ? { t: 6, r: 6, b: 6, l: 6 } : { t: 12, r: 40, b: 26, l: 32 };
  const innerW = Math.max(0, width - pad.l - pad.r);
  const innerH = h - pad.t - pad.b;

  const times = points.map((p) => new Date(p.createdAt).getTime());
  const t0 = times[0] ?? 0;
  const t1 = times[times.length - 1] ?? 0;
  const span = t1 - t0 || 1;
  const x = (i: number) => pad.l + (points.length === 1 ? innerW / 2 : ((times[i] - t0) / span) * innerW);
  const y = (v: number) => pad.t + innerH - (Math.max(0, Math.min(100, v)) / 100) * innerH;
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const area = points.length > 1 ? `${path} L${x(points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z` : "";

  const first = points[0];
  const last = points[points.length - 1];
  const summary = points.length
    ? `${label}: ${points.length} data point${points.length === 1 ? "" : "s"} from ${fmt(first.createdAt)} to ${fmt(last.createdAt)}. Started at ${Math.round(first.score)}, now ${Math.round(last.score)} out of 100.`
    : `${label}: no data yet.`;

  const nearest = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    return best;
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => points.length && setActive(nearest(e.clientX, e.currentTarget.getBoundingClientRect()));
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!points.length) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const cur = active ?? points.length - 1;
      setActive(Math.max(0, Math.min(points.length - 1, cur + (e.key === "ArrowRight" ? 1 : -1))));
    } else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(points.length - 1);
  };

  const hovered = active !== null ? points[active] : null;
  const tipLeft = active !== null ? Math.min(Math.max(x(active), 60), Math.max(60, width - 60)) : 0;

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height: h }}>
      {width > 0 && (
        <svg
          width={width}
          height={h}
          role="img"
          aria-labelledby={titleId}
          tabIndex={points.length ? 0 : -1}
          onPointerMove={onMove}
          onPointerLeave={() => setActive(null)}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
          className="block touch-pan-y overflow-visible rounded-md"
        >
          <title id={titleId}>{summary}</title>
          {!compact &&
            [0, 25, 50, 75, 100].map((v) => (
              <g key={v} aria-hidden>
                <line x1={pad.l} x2={pad.l + innerW} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} />
                <text x={pad.l - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--subtle)" className="font-mono">{v}</text>
              </g>
            ))}
          {!compact && first && (
            <g aria-hidden fontSize={10} fill="var(--subtle)">
              <text x={x(0)} y={h - 6} textAnchor={points.length === 1 ? "middle" : "start"}>{fmt(first.createdAt)}</text>
              {points.length > 1 && <text x={x(points.length - 1)} y={h - 6} textAnchor="end">{fmt(last.createdAt)}</text>}
            </g>
          )}
          {area && <path d={area} fill="var(--accent)" opacity={0.1} aria-hidden />}
          {points.length > 1 && <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" aria-hidden />}
          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1={pad.t} y2={pad.t + innerH} stroke="var(--border-strong)" strokeWidth={1} aria-hidden />
          )}
          {last && (
            <circle cx={x(points.length - 1)} cy={y(last.score)} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} aria-hidden />
          )}
          {hovered && active !== null && (
            <circle cx={x(active)} cy={y(hovered.score)} r={5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} aria-hidden />
          )}
          {!compact && last && (
            <text x={x(points.length - 1) + 8} y={y(last.score)} dy="0.32em" fontSize={11} fill="var(--text)" className="font-mono" aria-hidden>
              {Math.round(last.score)}
            </text>
          )}
        </svg>
      )}
      {hovered && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-border bg-surface px-2 py-1 text-xs shadow-lg"
          style={{ left: tipLeft }}
        >
          <div className="text-muted">{fmtLong(hovered.createdAt)}</div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 rounded bg-accent" aria-hidden />
            Score <span className="font-mono font-semibold">{Math.round(hovered.score)}</span>
          </div>
        </div>
      )}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Score</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={i}>
              <td>{fmtLong(p.createdAt)}</td>
              <td>{Math.round(p.score)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
