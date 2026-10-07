"use client";
import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hourglass, Lock } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/ui/misc";
import { useMe } from "@/features/auth/use-me";
import { TopicView } from "@/features/learning/topic-view";
import { api, ApiError } from "@/lib/api/client";
import type { ComingSoonTopic, TopicPage } from "@/lib/api/types";

export default function TopicRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: me } = useMe();
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["topic", slug], queryFn: () => api.get<TopicPage | ComingSoonTopic>(`/topics/${slug}`) });

  if (isLoading) return <PageSkeleton />;
  if (error instanceof ApiError && error.status === 423) {
    const d = error.details as { reason?: string; missingPrerequisites?: { slug: string; title: string }[]; stage?: string } | undefined;
    return (
      <EmptyState
        icon={<Lock className="size-5" />}
        title={d?.reason === "PREREQUISITES" ? "One quick step first" : "This is locked for now"}
        description={error.message}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {d?.missingPrerequisites?.map((p) => <Link key={p.slug} href={`/learn/topic/${p.slug}`} className={buttonClass("primary", "sm")}>Learn {p.title}</Link>)}
            <Link href={d?.stage ? `/learn/${d.stage}` : "/learn"} className={buttonClass("secondary", "sm")}>Back to roadmap</Link>
          </div>
        }
      />
    );
  }
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  if (!data) return null;
  if (data.comingSoon) {
    return (
      <EmptyState
        icon={<Hourglass className="size-5" />}
        title={`${data.title} — content is being prepared`}
        description="Our engineers are writing and testing this topic. It stays on your roadmap and unlocks automatically when it's published."
        action={<Link href={`/learn/${data.stage.slug}`} className={buttonClass("secondary", "sm")}>Back to {data.stage.title}</Link>}
      />
    );
  }
  return <TopicView topic={data} me={me} />;
}
