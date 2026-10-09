"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Lock, Search, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/misc";
import { ApiError, api } from "@/lib/api/client";
import type { PromptSummary } from "@/lib/api/types";
import { cn, pluralize } from "@/lib/utils";

export const prettyCategory = (c: string) => c.charAt(0) + c.slice(1).toLowerCase().replace(/_/g, " ");

const chip = (active: boolean) =>
  cn(
    "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    active ? "border-accent/40 bg-accent-soft text-accent" : "border-border bg-surface text-muted hover:border-border-strong hover:text-text",
  );

export function PromptLibrary() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["prompts"], queryFn: () => api.get<PromptSummary[]>("/prompts") });
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [favOnly, setFavOnly] = useState(false);

  const categories = useMemo(() => [...new Set((data ?? []).map((p) => p.category))].sort(), [data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (p) =>
        (!category || p.category === category) &&
        (!favOnly || p.favorite) &&
        (!q || [p.title, p.task ?? "", p.topic.title].some((s) => s.toLowerCase().includes(q))),
    );
  }, [data, category, favOnly, search]);

  const header = (
    <PageHeader
      eyebrow="Prompt library"
      title="Prompts that make you faster, not lazier"
      description="Learn first, then prompt — each prompt unlocks after you master its topic. Every card shows you why it works and how to verify what the AI gives back."
    />
  );

  if (isLoading) {
    return (
      <div>
        {header}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-busy="true" aria-label="Loading prompts">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      </div>
    );
  }
  if (error instanceof ApiError && error.status === 403 && error.code === "FEATURE_DISABLED") {
    return (
      <div>
        {header}
        <EmptyState
          icon={<Sparkles className="size-5" />}
          title="The prompt library isn't switched on for your account yet."
          description="Keep mastering topics in the meantime — every prompt you've earned will be waiting, already unlocked, when it goes live."
          action={<Link href="/learn" className={buttonClass("secondary", "sm")}>Open roadmap</Link>}
        />
      </div>
    );
  }
  if (error) return <div>{header}<ErrorState error={error} retry={() => refetch()} /></div>;

  const all = data ?? [];
  const unlockedCount = all.filter((p) => p.unlocked).length;
  const favCount = all.filter((p) => p.favorite).length;

  if (all.length === 0) {
    return (
      <div>
        {header}
        <EmptyState icon={<Sparkles className="size-5" />} title="No prompts published yet" description="Prompt cards are added alongside topics. Keep learning — they'll show up here as they're published." action={<Link href="/learn" className={buttonClass("secondary", "sm")}>Open roadmap</Link>} />
      </div>
    );
  }

  return (
    <div>
      {header}
      <div className="mb-5 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, task or topic" aria-label="Search prompts" className="pl-9" />
          </div>
          <div className="font-mono text-xs text-muted">
            <span className="text-text">{unlockedCount}</span>/{all.length} unlocked
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter prompts">
          <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)} className={chip(category === null)}>All</button>
          {categories.map((c) => (
            <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(category === c ? null : c)} className={chip(category === c)}>
              {prettyCategory(c)}
            </button>
          ))}
          <span className="mx-1 hidden w-px self-stretch bg-border sm:block" aria-hidden />
          <button type="button" aria-pressed={favOnly} onClick={() => setFavOnly((v) => !v)} className={chip(favOnly)}>
            <Star className={cn("size-3.5", favOnly && "fill-current")} aria-hidden /> Favourites
            <span className="font-mono">{favCount}</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        favOnly && favCount === 0 ? (
          <EmptyState icon={<Star className="size-5" />} title="No favourites yet" description="Open an unlocked prompt and tap the star to keep it one click away." action={<button type="button" onClick={() => setFavOnly(false)} className={buttonClass("secondary", "sm")}>Show all prompts</button>} />
        ) : (
          <EmptyState icon={<Search className="size-5" />} title="No prompts match" description="Try a different search or clear the filters." action={<button type="button" onClick={() => { setSearch(""); setCategory(null); setFavOnly(false); }} className={buttonClass("secondary", "sm")}>Clear filters</button>} />
        )
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => <li key={p.id}><PromptCardItem p={p} /></li>)}
        </ul>
      )}
    </div>
  );
}

function PromptCardItem({ p }: { p: PromptSummary }) {
  const meta = (
    <div className="flex items-center justify-between gap-2">
      <Badge tone={p.unlocked ? "accent" : "neutral"}>{prettyCategory(p.category)}</Badge>
      {p.unlocked ? (
        p.favorite && <Star className="size-4 fill-warn text-warn" aria-label="Favourite" />
      ) : (
        <Lock className="size-4 text-subtle" aria-label="Locked" />
      )}
    </div>
  );

  if (!p.unlocked) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-dashed border-border bg-surface/60 p-4">
        {meta}
        <h3 className="mt-3 font-medium text-muted">{p.title}</h3>
        <p className="mt-1 text-xs text-subtle">Topic: {p.topic.title}</p>
        <div className="mt-auto pt-4">
          <Link href={`/learn/topic/${p.topic.slug}`} className="inline-flex items-center gap-1 text-sm text-accent underline-offset-4 hover:underline">
            Master {p.topic.title} to unlock <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/prompts/${p.id}`}
      className="group flex h-full flex-col rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {meta}
      <h3 className="mt-3 font-medium group-hover:text-accent">{p.title}</h3>
      {p.task && <p className="mt-1 line-clamp-3 text-sm text-muted">{p.task}</p>}
      <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-subtle">
        <span className="truncate">{p.topic.title}</span>
        {p.rating ? (
          <span className="flex shrink-0 items-center gap-1 font-mono" aria-label={`Rated ${p.rating.average} out of 5 from ${pluralize(p.rating.count, "rating")}`}>
            <Star className="size-3.5 fill-current text-warn" aria-hidden /> {p.rating.average.toFixed(1)} <span className="text-subtle">({p.rating.count})</span>
          </span>
        ) : (
          <span className="shrink-0">No ratings yet</span>
        )}
      </div>
    </Link>
  );
}
