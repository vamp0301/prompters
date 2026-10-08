"use client";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, PageSkeleton } from "@/components/ui/misc";
import { LiveRoom } from "@/features/career/live/live-room";
import { api } from "@/lib/api/client";
import type { InterviewSessionView } from "@/lib/api/types";

export default function LiveInterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["career-session-live", id],
    queryFn: () => api.get<InterviewSessionView>(`/career/sessions/${id}`),
    staleTime: Infinity,
    refetchOnMount: "always",
  });
  const finished = data && data.status !== "IN_PROGRESS" && data.status !== "PAUSED";
  useEffect(() => {
    if (finished) router.replace(`/career/interview/${id}`);
  }, [finished, id, router]);

  if (isLoading || finished) return <div className="p-6"><PageSkeleton /></div>;
  if (error || !data) return <div className="mx-auto max-w-xl p-6"><ErrorState error={error} retry={() => refetch()} /></div>;
  return <LiveRoom key={id} session={data} />;
}
