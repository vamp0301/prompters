"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Compass, Flame, Map, RefreshCw, Target, Zap } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { apiStatus } from "@/features/shared/api-status";
import { api } from "@/lib/api/client";
import type { Attempt } from "@/lib/api/types";

const MIX = [
  { icon: Target, title: "Weak topics first", text: "Topics where your best or recall score is below the mastery bar get the most questions." },
  { icon: RefreshCw, title: "Due reviews", text: "Mastered topics whose spaced-review date has arrived are mixed in so they stay fresh." },
  { icon: Flame, title: "One stretch question", text: "A harder question from the next topic on your roadmap — a preview of what's coming." },
];

export function PracticeView() {
  const router = useRouter();
  const placement = useSearchParams().get("placement") === "1";

  const practice = useMutation({
    mutationFn: () => api.post<Attempt>("/practice"),
    onSuccess: (a) => router.push(`/quiz/${a.id}?title=${encodeURIComponent("Practice 10")}`),
    // 409 = no quiz history yet; rendered as an empty state below instead of a toast.
    meta: { silent: true },
  });
  const placementTest = useMutation({
    mutationFn: () => api.post<Attempt>("/placement"),
    onSuccess: (a) => router.push(`/quiz/${a.id}?title=${encodeURIComponent("Placement test")}`),
  });

  const noHistory = apiStatus(practice.error) === 409;
  const otherError = practice.error && !noHistory ? practice.error : null;

  return (
    <>
      <PageHeader
        eyebrow="Daily practice"
        title="Practice 10"
        description="Ten questions picked from your own history — about 10 minutes. Do it daily and your weak spots shrink before interview day."
      />

      {placement && (
        <Card className="mb-6 border-info/30">
          <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-info-soft text-info"><Compass className="size-5" aria-hidden /></span>
              <div>
                <h2 className="font-semibold">Placement test</h2>
                <p className="mt-0.5 max-w-xl text-sm text-muted">
                  Two easy questions per Foundations and language topic, 30 minutes. Topics you clearly know get marked so you can skip ahead. Guessing only
                  hurts you — leave a question blank if you don&apos;t know it.
                </p>
              </div>
            </div>
            <Button onClick={() => placementTest.mutate()} loading={placementTest.isPending} className="shrink-0">
              Start placement test <ArrowRight className="size-4" />
            </Button>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="What's in your 10" description="The mix is rebuilt every time you start, from your real mastery data." />
          <CardBody>
            <ul className="space-y-4">
              {MIX.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-accent"><Icon className="size-4" aria-hidden /></span>
                  <div>
                    <div className="text-sm font-medium">{title}</div>
                    <p className="text-sm text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Ready?" description="Untimed. Every answer comes with an explanation." />
          <CardBody className="flex flex-1 flex-col justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-5xl font-semibold tabular-nums">10</span>
              <span className="text-sm text-muted">questions · ~10 min</span>
            </div>
            {otherError ? (
              <p role="alert" className="text-sm text-danger">{otherError instanceof Error ? otherError.message : "Couldn't start practice. Please try again."}</p>
            ) : null}
            <Button size="lg" onClick={() => practice.mutate()} loading={practice.isPending} disabled={noHistory}>
              <Zap className="size-4" aria-hidden /> Start Practice 10
            </Button>
          </CardBody>
        </Card>
      </div>

      {noHistory && (
        <EmptyState
          className="mt-6"
          icon={<Map className="size-5" />}
          title="Practice 10 needs a little history first"
          description="Take your first mastery quiz on any topic. After that, Practice 10 mixes your weak and due topics automatically."
          action={<Link href="/learn" className={buttonClass("primary", "sm")}>Open your roadmap</Link>}
        />
      )}
    </>
  );
}
