"use client";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import type { AdminSearchResult } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Kbd, useDebounced } from "./ui";

/** Admin-wide search: debounced, grouped by type, arrow keys + Enter, ⌘/Ctrl+K focuses. */
export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const debounced = useDebounced(q.trim(), 250);
  const listId = useId();

  const { data, isFetching } = useQuery({
    queryKey: ["admin", "search", debounced],
    queryFn: () => api.get<{ query: string; results: AdminSearchResult[] }>(`/admin/search${qs({ q: debounced })}`),
    enabled: debounced.length >= 2,
    staleTime: 15_000,
  });
  const results = useMemo(() => (debounced.length >= 2 ? data?.results ?? [] : []), [data, debounced]);
  const groups = useMemo(() => {
    const m = new Map<string, { r: AdminSearchResult; i: number }[]>();
    results.forEach((r, i) => m.set(r.type, [...(m.get(r.type) ?? []), { r, i }]));
    return [...m.entries()];
  }, [results]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (r: AdminSearchResult) => {
    setOpen(false);
    setQ("");
    (document.activeElement as HTMLElement | null)?.blur();
    router.push(r.href);
  };

  const showPanel = open && debounced.length >= 2;
  const activeIdx = Math.min(active, Math.max(0, results.length - 1));

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showPanel && results[activeIdx] ? `${listId}-${activeIdx}` : undefined}
        aria-label="Search the admin"
        placeholder="Search topics, questions, users…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          else if (e.key === "Enter" && results[activeIdx]) { e.preventDefault(); go(results[activeIdx]); }
          else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
        }}
        className="h-9 w-full rounded-lg border border-border bg-surface-2 pl-8 pr-16 text-sm placeholder:text-subtle focus:border-accent focus:outline-none"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {isFetching ? <Loader2 className="size-3.5 animate-spin text-subtle" aria-hidden /> : <><Kbd>⌘</Kbd><Kbd>K</Kbd></>}
      </span>

      {showPanel && (
        <div id={listId} role="listbox" aria-label="Search results" className="absolute left-0 right-0 top-11 z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-2xl sm:-right-24">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">{isFetching ? "Searching…" : `No matches for “${debounced}”.`}</p>
          ) : (
            groups.map(([type, items]) => (
              <div key={type} role="group" aria-label={type} className="mb-1">
                <div className="px-2 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-subtle">{type}</div>
                {items.map(({ r, i }) => (
                  <div
                    key={`${r.type}-${r.id}-${i}`}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === activeIdx}
                    onMouseDown={(e) => { e.preventDefault(); go(r); }}
                    onMouseEnter={() => setActive(i)}
                    className={cn("cursor-pointer rounded-md px-2 py-1.5", i === activeIdx ? "bg-accent-soft" : "hover:bg-surface-2")}
                  >
                    <div className="truncate text-sm">{r.title}</div>
                    {r.subtitle && <div className="truncate font-mono text-[11px] text-subtle">{r.subtitle}</div>}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
