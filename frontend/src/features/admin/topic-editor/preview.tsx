"use client";
import { useState } from "react";
import { Clock, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-editor";
import { Markdown } from "@/components/ui/markdown";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton, Tabs } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import { Visualizer } from "@/features/learning/visualizer";
import type { TopicSnapshot } from "@/lib/api/types";

export const SECTION_META: Record<string, { n: string; title: string }> = {
  DEFINITION: { n: "01", title: "What is it?" },
  ANALOGY: { n: "02", title: "Explain like I'm new" },
  WHY: { n: "03", title: "Why does it exist?" },
  USAGE: { n: "04", title: "Where is it used?" },
  INTERNALS: { n: "05", title: "How does it work inside?" },
  CODE: { n: "06", title: "Implement it" },
  MISTAKES: { n: "07", title: "Common mistakes" },
  DEBUGGING: { n: "08", title: "Debugging" },
  TRADEOFFS: { n: "09", title: "Trade-offs" },
  REAL_PROJECT: { n: "10", title: "In a real project" },
};
export const SECTION_TYPES = Object.keys(SECTION_META);

function CodeSample({ js, py }: { js: string | null; py: string | null }) {
  const [lang, setLang] = useState<"js" | "py">(js ? "js" : "py");
  if (!js && !py) return <p className="rounded-lg border border-dashed border-warn/40 p-3 text-xs text-warn">No code samples yet.</p>;
  return (
    <div className="space-y-2">
      <Tabs value={lang} onChange={setLang} items={[{ value: "js", label: "JavaScript" }, { value: "py", label: "Python" }]} />
      <CodeBlock code={(lang === "js" ? js : py) ?? "// missing"} language={lang === "js" ? "javascript" : "python"} />
    </div>
  );
}

/**
 * Read-only student rendering of a topic snapshot (working copy or a published
 * version). No progress actions — previews must never write learner data.
 */
export function TopicPreview({ snapshot, locale }: { snapshot: TopicSnapshot; locale: string }) {
  const text = (c: Record<string, string>) => c[locale]?.trim() || c.en || "";
  const fallbacks = snapshot.sections.filter((s) => !s.content[locale]?.trim()).length;
  return (
    <article className="@container space-y-8">
      <header>
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap gap-1.5 text-xs text-muted">
          <span>Roadmap</span><span>/</span><span>Stage {snapshot.stage.code} · {snapshot.stage.title}</span><span>/</span><span>{snapshot.module.title}</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight @2xl:text-3xl">{snapshot.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge><Clock className="size-3" /> {snapshot.estMinutes} min</Badge>
          <Badge>{["Beginner", "Intermediate", "Advanced"][snapshot.difficulty - 1]}</Badge>
          {fallbacks > 0 && <Badge tone="warn">{fallbacks} section{fallbacks > 1 ? "s" : ""} fall back to English</Badge>}
        </div>
        {snapshot.prerequisites.length > 0 && <p className="mt-3 text-xs text-muted">Builds on: {snapshot.prerequisites.map((p) => p.title).join(", ")}</p>}
        {snapshot.objectives.length > 0 && (
          <div className="mt-5 rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted"><Target className="size-4" /> By the end you&apos;ll be able to</div>
            <ul className="grid gap-1.5 text-sm @2xl:grid-cols-2">{snapshot.objectives.map((o) => <li key={o} className="flex gap-2"><span className="text-accent">→</span>{o}</li>)}</ul>
          </div>
        )}
      </header>
      {snapshot.sections.length === 0 && <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">No sections written yet.</p>}
      {snapshot.sections.map((s) => {
        const meta = SECTION_META[s.type] ?? { n: "··", title: s.type };
        return (
          <section key={s.type}>
            <h2 className="mb-3 flex items-baseline gap-3 text-lg font-semibold"><span className="font-mono text-xs text-accent">{meta.n}</span>{meta.title}</h2>
            <Markdown>{text(s.content) || "_(empty)_"}</Markdown>
            {s.type === "DEFINITION" && snapshot.technicalDefinition && (
              <div className="mt-3 rounded-lg border border-border bg-surface p-3 text-sm"><span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-subtle">Technical English</span>{snapshot.technicalDefinition}</div>
            )}
            {s.type === "INTERNALS" && snapshot.visualization && Array.isArray(snapshot.visualization.steps) && snapshot.visualization.steps.length > 0 && (
              <div className="mt-4"><Visualizer viz={snapshot.visualization} /></div>
            )}
            {s.type === "CODE" && <div className="mt-4"><CodeSample js={s.codeJs} py={s.codePython} /></div>}
          </section>
        );
      })}
    </article>
  );
}

const DEVICES = { desktop: { w: 1280, label: "Desktop" }, tablet: { w: 768, label: "Tablet" }, mobile: { w: 375, label: "Mobile" } } as const;

/** "View as student" — the working copy rendered like the student page, at a chosen device width. */
export function PreviewTab({ topicId, active }: { topicId: string; active: boolean }) {
  const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");
  const [locale, setLocale] = useState("hinglish");
  const q = useQuery({ queryKey: ["admin", "topic-snapshot", topicId, "working"], queryFn: () => api.get<TopicSnapshot>(`/admin/topics/${topicId}/preview`), enabled: active, refetchOnMount: "always" });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={device} onChange={setDevice} items={(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map((k) => ({ value: k, label: `${DEVICES[k].label} · ${DEVICES[k].w}` }))} />
        <Tabs value={locale} onChange={setLocale} items={[{ value: "hinglish", label: "Hinglish" }, { value: "en", label: "English" }, { value: "hi", label: "हिन्दी" }]} />
        <Button size="sm" variant="ghost" onClick={() => q.refetch()} loading={q.isFetching}>Refresh</Button>
        <span className="text-xs text-subtle">Shows saved content only. Quiz, builds and progress actions are hidden in preview.</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-2/40 p-3">
        <div className="mx-auto rounded-lg border border-border bg-bg p-4 shadow-xl transition-[width] duration-300 sm:p-6" style={{ width: DEVICES[device].w, maxWidth: "none" }}>
          {q.error ? <ErrorState error={q.error} retry={() => q.refetch()} /> : q.data ? <TopicPreview snapshot={q.data} locale={locale} /> : <Skeleton className="h-96" />}
        </div>
      </div>
    </div>
  );
}
