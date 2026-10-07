"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Native radio group styled as cards: arrow keys, focus ring and labels work out of the box. */
export function RadioCards<T extends string>({
  name,
  legend,
  value,
  onChange,
  options,
  disabled,
}: {
  name: string;
  legend: string;
  value: T | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string; icon?: ReactNode }[];
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/60",
                checked ? "border-accent bg-accent-soft" : "border-border bg-surface-2 hover:border-border-strong",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} className="sr-only" />
              {o.icon && <span className={cn("mt-0.5 shrink-0", checked ? "text-accent" : "text-muted")} aria-hidden>{o.icon}</span>}
              <span className="min-w-0">
                <span className="block text-sm font-medium">{o.label}</span>
                {o.hint && <span className="mt-0.5 block text-xs text-muted">{o.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
