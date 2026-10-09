"use client";
import { useDeferredValue, useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton, ErrorState } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { CareerCatalogue, CareerFamilyKey, CareerRoleSummary, ExperienceLevel, RoleClassification } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const roleKeys = { catalogue: ["roles", "catalogue"] as const, mine: ["me", "target-roles"] as const };

export const LEVELS: { value: ExperienceLevel; label: string; hint: string }[] = [
  { value: "STUDENT", label: "Student / fresher", hint: "Preparing for your first role" },
  { value: "JUNIOR", label: "0–2 years", hint: "Early career" },
  { value: "MID", label: "2–5 years", hint: "Experienced" },
  { value: "SENIOR", label: "5+ years", hint: "Senior / lead" },
];

export function useCatalogue() {
  return useQuery({ queryKey: roleKeys.catalogue, queryFn: () => api.get<CareerCatalogue>("/roles"), staleTime: 10 * 60_000 });
}

/**
 * Pick the career you're preparing for: search by name, browse by family, or type what you're
 * aiming for and get suggestions. Nothing is pre-selected — there's no default career.
 */
export function RolePicker({ value, onChange, exclude = [] }: { value: string | null; onChange: (role: CareerRoleSummary) => void; exclude?: string[] }) {
  const uid = useId();
  const catalogue = useCatalogue();
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<CareerFamilyKey | "all">("all");
  const query = useDeferredValue(q.trim());
  const [suggested, setSuggested] = useState<string[]>([]);

  // Free text ("APM at a fintech", "MBA marketing") → suggestions from the server's classifier.
  useEffect(() => {
    if (query.length < 3) return;
    let live = true;
    const t = setTimeout(() => {
      api.post<RoleClassification>("/roles/classify", { text: query }).then((r) => live && setSuggested(r.suggestions.map((s) => s.key))).catch(() => undefined);
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query]);

  if (catalogue.isLoading) return <Skeleton className="h-64" />;
  if (catalogue.error) return <ErrorState error={catalogue.error} retry={() => catalogue.refetch()} />;
  const { families, roles } = catalogue.data!;
  const lower = query.toLowerCase();
  const matches = roles
    .filter((r) => !exclude.includes(r.key))
    .filter((r) => family === "all" || r.family === family)
    .filter((r) => !lower || suggested.includes(r.key) || [r.name, r.familyName, r.description].some((t) => t.toLowerCase().includes(lower)))
    .sort((a, b) => (suggested.includes(b.key) ? 1 : 0) - (suggested.includes(a.key) ? 1 : 0));

  return (
    <div className="space-y-3">
      <label htmlFor={`${uid}-q`} className="sr-only">
        Search careers
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <Input id={`${uid}-q`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or describe it — e.g. Product Manager, MBA marketing, data analyst" className="pl-9" />
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Career family">
        {[{ key: "all" as const, name: "All" }, ...families].map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={family === f.key}
            onClick={() => setFamily(f.key)}
            className={cn("rounded-full border px-3 py-1 text-xs transition-colors", family === f.key ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-muted hover:text-text")}
          >
            {f.name}
          </button>
        ))}
      </div>
      {matches.length === 0 ? (
        <p className="text-sm text-muted">No career matches that yet. Try another word, or pick the closest one — you can add more careers later.</p>
      ) : (
        <ul className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2" aria-label="Careers" tabIndex={0}>
          {matches.map((r) => {
            const selected = value === r.key;
            return (
              <li key={r.key}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange(r)}
                  className={cn("flex h-full w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors", selected ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-border-strong")}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{r.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{r.familyName}{suggested.includes(r.key) && query ? " · suggested" : ""}</span>
                    <span className="mt-1 block text-xs text-muted">{r.description}</span>
                  </span>
                  {selected && <Check className="size-4 shrink-0 text-accent" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
