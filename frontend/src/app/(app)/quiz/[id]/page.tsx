"use client";
import { Suspense, use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Attempt, AttemptResult } from "@/lib/api/types";
import { ErrorState, PageSkeleton } from "@/components/ui/misc";
import { QuizRunner } from "@/features/quiz/quiz-runner";
import { QuizResult } from "@/features/quiz/quiz-result";

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="p-6"><PageSkeleton /></div>}>
      <QuizScreen id={id} />
    </Suspense>
  );
}

function QuizScreen({ id }: { id: string }) {
  const search = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const topicSlug = search.get("topic") ?? undefined;
  const title = search.get("title") ?? "Quiz";
  const [result, setResult] = useState<AttemptResult | null>(null);
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["attempt", id], queryFn: () => api.get<Attempt>(`/attempts/${id}`), refetchOnMount: "always", staleTime: 0 });

  const finished = (r: AttemptResult) => {
    setResult(r);
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["roadmap"] });
    if (topicSlug) qc.invalidateQueries({ queryKey: ["topic", topicSlug] });
    window.scrollTo({ top: 0 });
  };

  const retry = topicSlug
    ? async () => {
        const kind = data?.kind === "REVIEW" ? "review" : "quiz";
        const a = await api.post<Attempt>(`/topics/${topicSlug}/${kind}`);
        setResult(null);
        router.replace(`/quiz/${a.id}?topic=${topicSlug}&title=${encodeURIComponent(title)}`);
      }
    : undefined;

  if (isLoading) return <div className="p-6"><PageSkeleton /></div>;
  if (error) return <div className="mx-auto max-w-xl p-6"><ErrorState error={error} retry={() => refetch()} /></div>;
  if (result || data?.result) return <QuizResult result={(result ?? data!.result)!} topicSlug={topicSlug} onRetry={retry} />;
  return <QuizRunner attempt={data!} title={title} onFinished={finished} />;
}
