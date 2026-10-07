import { cn } from "@/lib/utils";

export function Progress({ value, className, tone = "accent", label }: { value: number; className?: string; tone?: "accent" | "warn" | "danger" | "info"; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const color = { accent: "bg-accent", warn: "bg-warn", danger: "bg-danger", info: "bg-info" }[tone];
  return (
    <div role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-700", color)} style={{ width: `${v}%` }} />
    </div>
  );
}

/** Circular score (Readiness, project scores). */
export function ScoreRing({ value, size = 140, stroke = 10, label, sub }: { value: number; size?: number; stroke?: number; label?: string; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-mono text-3xl font-semibold tabular-nums" aria-label={label ? `${label}: ${Math.round(v)} out of 100` : undefined}>
          {Math.round(v)}
          <span className="text-sm text-subtle">/100</span>
        </div>
        {sub && <div className="text-[11px] text-muted">{sub}</div>}
      </div>
    </div>
  );
}
