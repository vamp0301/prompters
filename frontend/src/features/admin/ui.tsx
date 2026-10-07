"use client";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Lock, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Dialog } from "@/components/ui/misc";
import { atLeast, useMe } from "@/features/auth/use-me";
import { ApiError } from "@/lib/api/client";
import type { ContentStatus, Role } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/* ───────────── Roles ───────────── */

export function useRole() {
  const { data: me } = useMe();
  return { me, role: me?.role, can: (min: Role) => atLeast(me?.role, min) };
}

export function RoleNotice({ min, children }: { min: Role; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-xs text-muted">
      <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{children ?? <>Read-only for your role. Changes here need <strong className="text-text">{min.replace("_", " ")}</strong>.</>}</span>
    </div>
  );
}

/* ───────────── Modal with stable onClose (the base Dialog refocuses when onClose identity changes) ───────────── */

export function Modal({ open, onClose, title, children, size = "md" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; size?: "md" | "lg" | "xl" }) {
  const latest = useRef(onClose);
  useLayoutEffect(() => {
    latest.current = onClose;
  });
  const close = useCallback(() => latest.current(), []);
  return (
    <Dialog open={open} onClose={close} title={title} className={cn(size === "lg" && "max-w-3xl", size === "xl" && "max-w-5xl")}>
      {children}
    </Dialog>
  );
}

export function ConfirmDialog({
  open, onClose, title, description, confirmLabel = "Confirm", tone = "primary", onConfirm, loading, disabled, children,
}: {
  open: boolean; onClose: () => void; title: string; description?: ReactNode; confirmLabel?: string; tone?: "primary" | "danger";
  onConfirm: () => void; loading?: boolean; disabled?: boolean; children?: ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {description && <div className="text-sm text-muted">{description}</div>}
      {children && <div className="mt-4">{children}</div>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading} disabled={disabled}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

/* ───────────── Status ───────────── */

export const STATUSES: ContentStatus[] = ["DRAFT", "REVIEW", "PUBLISHED", "COMING_SOON", "ARCHIVED"];
const STATUS_TONE: Record<string, "neutral" | "accent" | "warn" | "info" | "danger"> = {
  DRAFT: "neutral", REVIEW: "info", PUBLISHED: "accent", COMING_SOON: "warn", ARCHIVED: "danger",
  ACTIVE: "accent", SUSPENDED: "danger",
};
export const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"} className="font-mono uppercase tracking-wide">{status.replace(/_/g, " ")}</Badge>;
}

export function StatusSelect({ value, onChange, id, disabled, allowAll, className }: { value: string; onChange: (v: string) => void; id?: string; disabled?: boolean; allowAll?: boolean; className?: string }) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={className} aria-label={id ? undefined : "Status"}>
      {allowAll && <option value="">All statuses</option>}
      {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
    </Select>
  );
}

export function DifficultySelect({ value, onChange, id }: { value: number; onChange: (v: number) => void; id?: string }) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      <option value={1}>1 · Beginner</option>
      <option value={2}>2 · Intermediate</option>
      <option value={3}>3 · Advanced</option>
    </Select>
  );
}

/* ───────────── Tables ───────────── */

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}
export function Th({ children, className, right }: { children?: ReactNode; className?: string; right?: boolean }) {
  return <th scope="col" className={cn("whitespace-nowrap border-b border-border bg-surface-2/40 px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-wider text-subtle", right && "text-right", className)}>{children}</th>;
}
export function Td({ children, className, right, mono }: { children?: ReactNode; className?: string; right?: boolean; mono?: boolean }) {
  return <td className={cn("border-b border-border/60 px-3 py-2 align-middle", right && "text-right", mono && "font-mono tabular-nums text-[13px]", className)}>{children}</td>;
}
export function EmptyRow({ cols, children }: { cols: number; children: ReactNode }) {
  return <tr><td colSpan={cols} className="px-3 py-10 text-center text-sm text-muted">{children}</td></tr>;
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs text-muted">
      <span className="font-mono tabular-nums">{from}–{Math.min(total, page * pageSize)} of {total}</span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page"><ChevronLeft className="size-4" /></Button>
        <span className="font-mono tabular-nums">{page}/{pages}</span>
        <Button size="sm" variant="ghost" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page"><ChevronRight className="size-4" /></Button>
      </div>
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">{children}</div>;
}

/* ───────────── Errors ───────────── */

export type FieldErrors = Record<string, string | undefined>;

/** Turns a zod `flatten()` VALIDATION_ERROR into { field: firstMessage }. */
export function fieldErrorsOf(err: unknown): FieldErrors {
  if (!(err instanceof ApiError) || err.code !== "VALIDATION_ERROR") return {};
  const d = err.details as { fieldErrors?: Record<string, string[]> } | undefined;
  return Object.fromEntries(Object.entries(d?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]));
}

export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : "Something went wrong.";
  const d = error instanceof ApiError ? (error.details as { formErrors?: string[]; fieldErrors?: Record<string, string[]> } | undefined) : undefined;
  const fields = Object.entries(d?.fieldErrors ?? {});
  return (
    <div role="alert" className="flex gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <p className="font-medium">{message}</p>
        {d?.formErrors?.map((f) => <p key={f} className="text-xs">{f}</p>)}
        {fields.length > 0 && <p className="mt-1 text-xs opacity-90">Check: {fields.map(([k]) => k).join(", ")}</p>}
      </div>
    </div>
  );
}

/* ───────────── Inputs ───────────── */

export function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function Toggle({ checked, onChange, label: text, description, disabled, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: ReactNode; disabled?: boolean; id?: string }) {
  const auto = useId();
  const tid = id ?? auto;
  return (
    <div className="flex items-start gap-3">
      <button
        id={tid}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors disabled:opacity-50", checked ? "border-accent bg-accent" : "border-border-strong bg-surface-2")}
      >
        <span className={cn("absolute top-0.5 size-3.5 rounded-full transition-all", checked ? "left-[18px] bg-accent-fg" : "left-0.5 bg-muted")} />
      </button>
      <label htmlFor={tid} className="cursor-pointer text-sm">
        <span className="font-medium">{text}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </label>
    </div>
  );
}

/** Chip input: Enter or comma adds, Backspace on empty removes the last chip. */
export function TagInput({ value, onChange, id, placeholder, suggestions, max }: { value: string[]; onChange: (v: string[]) => void; id?: string; placeholder?: string; suggestions?: string[]; max?: number }) {
  const [draft, setDraft] = useState("");
  const listId = useId();
  const add = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean).filter((s) => !value.includes(s));
    if (parts.length) onChange([...value, ...parts].slice(0, max ?? 999));
    setDraft("");
  };
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1 rounded-lg border border-border bg-surface-2 px-2 py-1.5 focus-within:border-accent">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px]">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="text-subtle hover:text-danger"><X className="size-3" /></button>
        </span>
      ))}
      <input
        id={id}
        list={suggestions ? listId : undefined}
        value={draft}
        placeholder={value.length ? "" : placeholder}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); add(draft); }
          else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft.trim() && add(draft)}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
      />
      {suggestions && <datalist id={listId}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>}
    </div>
  );
}

export function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function RowControls({ index, count, onMove, onRemove, labelText }: { index: number; count: number; onMove: (dir: -1 | 1) => void; onRemove?: () => void; labelText: string }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${labelText} up`} className="rounded p-1 text-subtle hover:bg-surface-2 hover:text-text disabled:opacity-30"><ArrowUp className="size-3.5" /></button>
      <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move ${labelText} down`} className="rounded p-1 text-subtle hover:bg-surface-2 hover:text-text disabled:opacity-30"><ArrowDown className="size-3.5" /></button>
      {onRemove && <button type="button" onClick={onRemove} aria-label={`Remove ${labelText}`} className="rounded p-1 text-subtle hover:bg-danger-soft hover:text-danger"><Trash2 className="size-3.5" /></button>}
    </div>
  );
}

/** Ordered list of single-line strings. */
export function ListEditor({ label: text, values, onChange, placeholder, max = 50, error, id }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string; max?: number; error?: string; id?: string }) {
  return (
    <fieldset className="space-y-1.5" id={id}>
      <legend className="mb-1.5 text-xs font-medium text-muted">{text} <span className="font-mono text-subtle">({values.length}/{max})</span></legend>
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-5 shrink-0 text-right font-mono text-[10px] text-subtle">{i + 1}</span>
          <Input value={v} onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))} placeholder={placeholder} aria-label={`${text} ${i + 1}`} className="h-9" />
          <RowControls index={i} count={values.length} onMove={(d) => onChange(move(values, i, d))} onRemove={() => onChange(values.filter((_, j) => j !== i))} labelText={`${text} ${i + 1}`} />
        </div>
      ))}
      {values.length < max && (
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange([...values, ""])}><Plus className="size-3.5" /> Add</Button>
      )}
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </fieldset>
  );
}

/* ───────────── Formatting & small bits ───────────── */

export const fmt = (n: number | null | undefined, suffix = "") => (n === null || n === undefined ? "—" : `${n.toLocaleString("en-IN")}${suffix}`);
export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
export const splitList = (s: string) => s.split("|").map((x) => x.trim()).filter(Boolean);

export function Meter({ value, tone }: { value: number; tone?: "accent" | "warn" | "danger" | "info" }) {
  const t = tone ?? (value >= 80 ? "accent" : value >= 50 ? "warn" : "danger");
  const color = { accent: "bg-accent", warn: "bg-warn", danger: "bg-danger", info: "bg-info" }[t];
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted">{value}%</span>
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-border bg-surface px-1 font-mono text-[10px] text-subtle">{children}</kbd>;
}

export function Panel({ title, description, action, children, className, bodyClassName }: { title: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-surface", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        {action}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
