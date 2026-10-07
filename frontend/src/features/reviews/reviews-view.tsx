"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { Attempt, MasteryRow, ReviewsDue } from "@/lib/api/types";
import { formatDate, pluralize, relativeTime } from "@/lib/utils";

const recall = (m: MasteryRow) => Math.round(m.recallScore ?? m.bestScore);

function DueRow({ m }: { m: MasteryRow }) {
  const router = useRouter();
  const start = useMutation({
    mutationFn: () => api.post<Attempt>(`/topics/${m.topic.slug}/review`),
    onSuccess: (a) => router.push(`/quiz/${a.id}?topic=${encodeURIComponent(m.topic.slug)}&title=${encodeURIComponent(`Review: ${m.topic.title}`)}`),
  });
  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/learn/topic/${m.topic.slug}`} className="truncate font-medium hover:text-accent">{m.topic.title}</Link>
          {m.status === "NEEDS_REVIEW" && <Badge tone="warn"><RefreshCw className="size-3" aria-hidden /> Needs review</Badge>}
        </div>
        <div className="mt-0.5 text-xs text-muted">
          Recall <span className="font-mono tabular-nums text-text">{recall(m)}%</span>
          {m.nextReviewAt && <> · due {relativeTime(m.nextReviewAt)}</>}
          {m.lastReviewedAt && <> · last reviewed {relativeTime(m.lastReviewedAt)}</>}
        </div>
      </div>
      <Button size="sm" onClick={() => start.mutate()} loading={start.isPending} className="self-start sm:self-auto" aria-label={`Review ${m.topic.title}`}>
        Review
      </Button>
    </li>
  );
}

export function ReviewsView() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["reviews"], queryFn: () => api.get<ReviewsDue>("/reviews/due") });
  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;
  const { due, upcoming } = data!;

  return (
    <>
      <PageHeader
        eyebrow="Spaced review"
        title="Reviews"
        description="Every mastered topic comes back after 1, 3, 7, 14 and 30 days. A short review now keeps it ready for interview day."
        actions={<Link href="/practice" className={buttonClass("secondary", "sm")}>Practice 10 instead</Link>}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title={due.length ? `${pluralize(due.length, "review")} due` : "Due now"} description="Four quick questions each. Pass to push the next review further out." />
          <CardBody className="pt-2">
            {due.length ? (
              <ul className="divide-y divide-border">{due.map((m) => <DueRow key={m.topicId} m={m} />)}</ul>
            ) : (
              <EmptyState
                icon={<CheckCircle2 className="size-5" />}
                title="You're all caught up"
                description="Your next review will appear here when it's due. Meanwhile, keep learning new topics."
                action={<Link href="/learn" className={buttonClass("secondary", "sm")}>Continue learning</Link>}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Coming up" description="Next 20 scheduled reviews" />
          <CardBody className="pt-2">
            {upcoming.length ? (
              <ul className="divide-y divide-border">
                {upcoming.map((m) => (
                  <li key={m.topicId} className="flex items-center gap-3 py-2.5 text-sm">
                    <CalendarClock className="size-4 shrink-0 text-subtle" aria-hidden />
                    <Link href={`/learn/topic/${m.topic.slug}`} className="min-w-0 flex-1 truncate hover:text-accent">{m.topic.title}</Link>
                    <time dateTime={m.nextReviewAt!} title={formatDate(m.nextReviewAt)} className="shrink-0 font-mono text-xs text-muted">{relativeTime(m.nextReviewAt!)}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-sm text-muted">Nothing scheduled yet. Master a topic and its first review is set for tomorrow.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
