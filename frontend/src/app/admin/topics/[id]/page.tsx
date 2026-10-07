"use client";
import Link from "next/link";
import { use, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { ErrorState, PageSkeleton } from "@/components/ui/misc";
import { ContentTab } from "@/features/admin/topic-editor/content";
import { CompletenessPanel, OverviewTab } from "@/features/admin/topic-editor/overview";
import { PreviewTab } from "@/features/admin/topic-editor/preview";
import { QuestionsTab, RelatedTab } from "@/features/admin/topic-editor/questions";
import { VersionsTab } from "@/features/admin/topic-editor/versions";
import { VisualTab } from "@/features/admin/topic-editor/visual";
import { StatusBadge } from "@/features/admin/ui";
import { api } from "@/lib/api/client";
import type { AdminTopicDetail } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "content", label: "Content" },
  { value: "visual", label: "Visual" },
  { value: "questions", label: "Questions" },
  { value: "related", label: "Build · Prompt · Interview" },
  { value: "versions", label: "Versions & publish" },
  { value: "preview", label: "Preview" },
] as const;
type Tab = (typeof TABS)[number]["value"];

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  window.addEventListener("popstate", cb);
  return () => { window.removeEventListener("hashchange", cb); window.removeEventListener("popstate", cb); };
};
const readHash = () => window.location.hash.slice(1);

export default function TopicEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Deep links like /admin/topics/:id#visual (from global search) pick the tab; clicks override.
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const [picked, setPicked] = useState<Tab | null>(null);
  const tab: Tab = picked ?? TABS.find((t) => t.value === hash)?.value ?? "overview";
  const [rev, setRev] = useState(0);
  const { data: topic, error, isLoading, refetch } = useQuery({ queryKey: ["admin", "topic", id], queryFn: () => api.get<AdminTopicDetail>(`/admin/topics/${id}`) });
  const setTab = (t: Tab) => {
    setPicked(t);
    history.replaceState(null, "", `#${t}`);
  };

  if (isLoading) return <PageSkeleton />;
  if (error || !topic) return <ErrorState error={error} retry={() => refetch()} />;
  const published = topic.questions.filter((q) => q.status === "PUBLISHED").length;
  const counts: Partial<Record<Tab, string>> = {
    questions: `${published}/${topic.quizSize * 3}`,
    related: String(topic.buildTasks.length + topic.promptCards.length + topic.interviewQs.length),
    versions: topic.versions.length ? `v${topic.versions[0].version}` : undefined,
  };

  return (
    <>
      <div className="mb-5">
        <Link href="/admin/topics" className="mb-2 inline-flex items-center gap-1 text-xs text-muted hover:text-text"><ChevronLeft className="size-3.5" /> Topics</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{topic.title}</h1>
          <StatusBadge status={topic.status} />
          <span className="font-mono text-xs text-subtle">{topic.publishedVersion ? `live v${topic.publishedVersion}` : "never published"}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-subtle">
          <span className="text-accent">{topic.module.stage.code}</span><span>{topic.module.title}</span><span>/</span><span>{topic.slug}</span>
          {topic.status === "PUBLISHED" && <Link href={`/learn/topic/${topic.slug}`} target="_blank" className="inline-flex items-center gap-0.5 hover:text-text">student page <ExternalLink className="size-3" /></Link>}
        </div>
      </div>

      <div className="-mx-4 mb-5 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
        <div role="tablist" aria-label="Topic editor sections" className="flex min-w-max gap-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              role="tab"
              id={`tab-${t.value}`}
              aria-selected={tab === t.value}
              aria-controls={`panel-${t.value}`}
              onClick={() => setTab(t.value)}
              className={cn("-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors", tab === t.value ? "border-accent text-text" : "border-transparent text-muted hover:text-text")}
            >
              {t.label}
              {counts[t.value] && <span className="rounded bg-surface-2 px-1 font-mono text-[10px] text-subtle">{counts[t.value]}</span>}
            </button>
          ))}
        </div>
      </div>

      <div key={`${id}-${rev}`} className={cn("grid gap-6", tab !== "preview" && "xl:grid-cols-[minmax(0,1fr)_260px]")}>
        <div className="min-w-0">
          {/* Panels stay mounted so unsaved edits survive tab switches. */}
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" hidden={tab !== "overview"}><OverviewTab topic={topic} /></div>
          <div role="tabpanel" id="panel-content" aria-labelledby="tab-content" hidden={tab !== "content"}><ContentTab topic={topic} /></div>
          <div role="tabpanel" id="panel-visual" aria-labelledby="tab-visual" hidden={tab !== "visual"}><VisualTab topic={topic} /></div>
          <div role="tabpanel" id="panel-questions" aria-labelledby="tab-questions" hidden={tab !== "questions"}><QuestionsTab topic={topic} /></div>
          <div role="tabpanel" id="panel-related" aria-labelledby="tab-related" hidden={tab !== "related"}><RelatedTab topic={topic} /></div>
          <div role="tabpanel" id="panel-versions" aria-labelledby="tab-versions" hidden={tab !== "versions"}><VersionsTab topic={topic} onRestored={() => { refetch().then(() => setRev((r) => r + 1)); }} /></div>
          <div role="tabpanel" id="panel-preview" aria-labelledby="tab-preview" hidden={tab !== "preview"}><PreviewTab topicId={topic.id} active={tab === "preview"} /></div>
        </div>
        {tab !== "preview" && <aside className="xl:sticky xl:top-20 xl:self-start"><CompletenessPanel c={topic.completeness} /></aside>}
      </div>
    </>
  );
}
