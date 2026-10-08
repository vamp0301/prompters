"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaletteItem {
  href: string;
  label: string;
  group: string;
}

/** ⌘K / Ctrl+K jump-to-page palette over the app's real destinations. */
export function CommandPalette({ items, open, onClose }: { items: PaletteItem[]; open: boolean; onClose: () => void }) {
  // Mounted only while open, so every opening starts with an empty query.
  return open ? <Palette items={items} onClose={onClose} /> : null;
}

function Palette({ items, onClose }: { items: PaletteItem[]; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? items.filter((x) => x.label.toLowerCase().includes(t) || x.group.toLowerCase().includes(t)) : items;
  }, [items, q]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-start justify-items-center bg-black/30 px-4 pt-[12vh] backdrop-blur-[2px]" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Search pages" className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setI(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setI((x) => Math.min(x + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setI((x) => Math.max(x - 1, 0));
              } else if (e.key === "Enter" && results[i]) go(results[i].href);
            }}
            placeholder="Jump to a page…"
            aria-label="Search pages"
            aria-controls="palette-results"
            aria-activedescendant={results[i] ? `palette-${i}` : undefined}
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
          />
          <kbd className="rounded border border-border px-1.5 font-mono text-[10px] text-muted">Esc</kbd>
        </div>
        <ul id="palette-results" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No pages match &ldquo;{q}&rdquo;.</li>}
          {results.map((r, k) => (
            <li key={r.href} id={`palette-${k}`} role="option" aria-selected={k === i}>
              <button
                type="button"
                onMouseEnter={() => setI(k)}
                onClick={() => go(r.href)}
                className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm", k === i ? "bg-accent-soft text-text" : "text-muted")}
              >
                <span>{r.label}</span>
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-subtle">
                  {r.group}
                  {k === i && <CornerDownLeft className="size-3" aria-hidden />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
