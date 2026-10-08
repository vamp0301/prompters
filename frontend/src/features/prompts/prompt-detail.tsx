"use client";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CheckCircle2, ChevronDown, Copy, Eye, Lock, SearchX, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { apiDetails, apiStatus } from "@/features/shared/api-status";
import { ApiError, api } from "@/lib/api/client";
import type { PromptDetail, PromptSummary } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { prettyCategory } from "./prompt-library";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Splits a template into text and `[KEY]` placeholder segments for the known variable keys. */
function segmentTemplate(template: string, keys: string[]) {
  if (!keys.length) return [{ text: template, key: null as string | null }];
  const re = new RegExp(`\\[(${keys.map(escapeRe).join("|")})\\]`, "g");
  return template.split(re).map((text, i) => (i % 2 === 1 ? { text, key: text } : { text, key: null }));
}

export function PromptDetailView({ id }: { id: string }) {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["prompt", id], queryFn: () => api.get<PromptDetail>(`/prompts/${id}`) });

  if (isLoading) return <PageSkeleton />;
  if (apiStatus(error) === 423) {
    const topic = apiDetails<{ topic?: { slug: string; title: string } }>(error)?.topic;
    return (
      <EmptyState
        icon={<Lock className="size-5" />}
        title="Learn first, then prompt"
        description={topic ? `Master "${topic.title}" to unlock this prompt. Once you understand the concept, you'll be able to judge what the AI gives back.` : (error as ApiError).message}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {topic && <Link href={`/learn/topic/${topic.slug}`} className={buttonClass("primary", "sm")}>Master {topic.title}</Link>}
            <Link href="/prompts" className={buttonClass("secondary", "sm")}>Back to library</Link>
          </div>
        }
      />
    );
  }
  if (error instanceof ApiError && error.status === 403 && error.code === "FEATURE_DISABLED") {
    return <EmptyState title="The prompt library isn't switched on for your account yet." description="Keep mastering topics — your unlocked prompts will be ready when it goes live." action={<Link href="/learn" className={buttonClass("secondary", "sm")}>Open roadmap</Link>} />;
  }
  if (apiStatus(error) === 404) {
    return <EmptyState icon={<SearchX className="size-5" />} title="Prompt not found" description="It may have been unpublished or the link is wrong." action={<Link href="/prompts" className={buttonClass("secondary", "sm")}>Back to library</Link>} />;
  }
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  if (!data) return null;
  return <PromptBody key={data.id} prompt={data} />;
}

function PromptBody({ prompt: p }: { prompt: PromptDetail }) {
  const qc = useQueryClient();
  const uid = useId();
  const [values, setValues] = useState<Record<string, string>>({});
  const keys = useMemo(() => p.variables.map((v) => v.key), [p.variables]);
  const segments = useMemo(() => segmentTemplate(p.template, keys), [p.template, keys]);
  const filled = segments.map((s) => (s.key ? values[s.key]?.trim() ? values[s.key] : `[${s.key}]` : s.text)).join("");
  const blanksLeft = p.variables.filter((v) => !values[v.key]?.trim()).length;

  const markUsed = useMutation({ mutationFn: () => api.post(`/prompts/${p.id}/used`), meta: { silent: true } });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(filled);
    } catch {
      toast.error("Couldn't access the clipboard. Select the preview text and copy it manually.");
      return;
    }
    toast.success("Copied", { description: blanksLeft ? `${blanksLeft} blank${blanksLeft === 1 ? "" : "s"} still to fill in.` : "Now verify what comes back." });
    markUsed.mutate();
  };

  const fav = useMutation({
    mutationFn: () => api.post<{ favorite: boolean }>(`/prompts/${p.id}/favorite`),
    onSuccess: ({ favorite }) => {
      qc.setQueryData<PromptDetail>(["prompt", p.id], (old) => (old ? { ...old, favorite } : old));
      qc.setQueryData<PromptSummary[]>(["prompts"], (old) => old?.map((x) => (x.id === p.id ? { ...x, favorite } : x)));
      toast.success(favorite ? "Added to favourites" : "Removed from favourites");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/prompts" className="mb-4 inline-flex items-center gap-1 text-xs text-muted hover:text-text">
          <ArrowLeft className="size-3.5" aria-hidden /> Prompt library
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="accent">{prettyCategory(p.category)}</Badge>
              <Link href={`/learn/topic/${p.topic.slug}`} className="text-xs text-muted hover:text-text">Topic: {p.topic.title}</Link>
              <span className="font-mono text-[11px] text-subtle">v{p.version}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{p.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">{p.task}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => fav.mutate()} loading={fav.isPending} aria-pressed={p.favorite} className="self-start">
            {!fav.isPending && <Star className={cn("size-4", p.favorite && "fill-warn text-warn")} aria-hidden />}
            {p.favorite ? "Favourited" : "Favourite"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader title="When to use it" />
        <CardBody className="pt-2 text-sm leading-relaxed text-text/90">{p.whenToUse}</CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Fill in the blanks" description={p.variables.length ? `${p.variables.length - blanksLeft} of ${p.variables.length} filled` : "This prompt has no blanks — copy it as is."} />
          <CardBody className="space-y-4">
            {p.variables.map((v) => (
              <div key={v.key} className="space-y-1.5">
                <label htmlFor={`${uid}-${v.key}`} className="flex items-center justify-between gap-2 text-xs font-medium text-muted">
                  <span>{v.label}</span>
                  <span className="font-mono text-[10px] text-subtle">[{v.key}]</span>
                </label>
                <Textarea
                  id={`${uid}-${v.key}`}
                  value={values[v.key] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [v.key]: e.target.value }))}
                  className="min-h-16 font-mono text-[13px]"
                  rows={2}
                />
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="min-w-0">
          <CardHeader
            title="Your prompt"
            description={blanksLeft ? <span><span className="text-warn">Highlighted</span> blanks still need your input.</span> : "Ready to copy."}
            action={<Button size="sm" onClick={copy}><Copy className="size-4" aria-hidden /> Copy</Button>}
          />
          <CardBody>
            <pre aria-label="Prompt preview" className="max-h-128 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-code p-4 font-mono text-[13px] leading-6">
              {segments.map((s, i) =>
                s.key === null ? (
                  <span key={i}>{s.text}</span>
                ) : values[s.key]?.trim() ? (
                  <mark key={i} className="rounded bg-accent-soft px-0.5 text-accent">{values[s.key]}</mark>
                ) : (
                  <mark key={i} className="rounded border border-dashed border-warn/50 bg-warn-soft px-0.5 text-warn">[{s.key}]</mark>
                ),
              )}
            </pre>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Why each part matters" />
          <CardBody>
            <ol className="space-y-3">
              {p.whyItWorks.map((w, i) => (
                <li key={w.part} className="grid grid-cols-[auto_1fr] gap-3">
                  <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="text-sm font-medium">{w.part}</div>
                    <p className="mt-0.5 text-sm text-muted">{w.why}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
        <VerifyChecklist items={p.verifyChecklist} />
      </div>

      <Card>
        <CardHeader title="What good output looks like" description="A sample answer. Yours will differ — use it to judge shape and depth, not exact words." />
        <CardBody>
          <div className="rounded-lg border border-border bg-surface-2/50 p-4">
            <Markdown className="text-sm">{p.sampleOutput}</Markdown>
          </div>
        </CardBody>
      </Card>

      <PromptPractice prompt={p} />

      <RatePrompt promptId={p.id} initial={p.myRating} />
    </div>
  );
}

function VerifyChecklist({ items }: { items: string[] }) {
  const uid = useId();
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const toggle = (i: number) =>
    setChecked((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  return (
    <Card>
      <CardHeader
        title={<span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-accent" aria-hidden /> Verify, don&apos;t trust</span>}
        description="AI output is a draft. Check it before you use it."
        action={<span className="font-mono text-xs text-muted">{checked.size}/{items.length}</span>}
      />
      <CardBody className="space-y-3">
        <Progress value={items.length ? (checked.size / items.length) * 100 : 0} label="Verification checklist progress" />
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i}>
              <label htmlFor={`${uid}-${i}`} className="flex cursor-pointer items-start gap-3 rounded-md p-1.5 text-sm hover:bg-surface-2">
                <input id={`${uid}-${i}`} type="checkbox" checked={checked.has(i)} onChange={() => toggle(i)} className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]" />
                <span className={cn(checked.has(i) && "text-muted line-through")}>{it}</span>
              </label>
            </li>
          ))}
        </ul>
        {items.length > 0 && checked.size === items.length && (
          <p className="flex items-center gap-1.5 text-xs text-accent"><CheckCircle2 className="size-3.5" aria-hidden /> Verified. That&apos;s how professionals use AI.</p>
        )}
      </CardBody>
    </Card>
  );
}

function PromptPractice({ prompt: p }: { prompt: PromptDetail }) {
  const uid = useId();
  const [notes, setNotes] = useState("");
  const [revealed, setRevealed] = useState(false);
  return (
    <Card>
      <CardHeader title="Prompt practice: spot the difference" description="Most people type the weak version. Compare it with the expert template and write down what's missing before you reveal." />
      <CardBody className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-warn">Weak prompt</div>
            <pre className="whitespace-pre-wrap break-words rounded-lg border border-warn/30 bg-warn-soft/40 p-4 font-mono text-[13px] leading-6">{p.task}</pre>
          </div>
          <div className="min-w-0">
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-accent">Expert prompt</div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-accent/30 bg-code p-4 font-mono text-[13px] leading-6">{p.template}</pre>
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${uid}-notes`} className="block text-xs font-medium text-muted">What does the expert version add? (just for you — not saved)</label>
          <Textarea id={`${uid}-notes`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. It gives the AI a role, asks for intermediate steps…" />
        </div>
        <Button variant={revealed ? "ghost" : "secondary"} size="sm" onClick={() => setRevealed((r) => !r)} aria-expanded={revealed} aria-controls={`${uid}-reveal`}>
          <Eye className="size-4" aria-hidden /> {revealed ? "Hide answer" : "Reveal what the expert version adds"}
          <ChevronDown className={cn("size-4 transition-transform", revealed && "rotate-180")} aria-hidden />
        </Button>
        {revealed && (
          <ul id={`${uid}-reveal`} className="space-y-2">
            {p.whyItWorks.map((w) => (
              <li key={w.part} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                <span><span className="font-medium">{w.part}</span> <span className="text-muted">— {w.why}</span></span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function RatePrompt({ promptId, initial }: { promptId: string; initial: number | null }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState<number | null>(initial);
  const rate = useMutation({
    mutationFn: (value: number) => api.post<{ rating: number }>(`/prompts/${promptId}/rate`, { rating: value }),
    onMutate: (value) => {
      const prev = rating;
      setRating(value);
      return { prev };
    },
    onError: (_e, _v, ctx) => setRating(ctx?.prev ?? null),
    onSuccess: ({ rating: r }) => {
      qc.setQueryData<PromptDetail>(["prompt", promptId], (old) => (old ? { ...old, myRating: r } : old));
      qc.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Thanks — rating saved");
    },
  });
  const name = useId();
  return (
    <Card>
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">How useful was this prompt?</div>
          <p className="text-xs text-muted">Your rating helps other students pick the right prompt.</p>
        </div>
        <fieldset className="flex items-center gap-1" disabled={rate.isPending}>
          <legend className="sr-only">Rate this prompt from 1 to 5 stars</legend>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="group cursor-pointer rounded-md p-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
              <input
                type="radio"
                name={name}
                value={n}
                checked={rating === n}
                onChange={() => rate.mutate(n)}
                className="sr-only"
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
              />
              <Star className={cn("size-6 transition-colors", rating !== null && n <= rating ? "fill-warn text-warn" : "text-subtle group-hover:text-muted")} aria-hidden />
            </label>
          ))}
          <span className="ml-2 w-8 font-mono text-xs text-muted" aria-live="polite">{rating ? `${rating}/5` : "—"}</span>
        </fieldset>
      </CardBody>
    </Card>
  );
}
