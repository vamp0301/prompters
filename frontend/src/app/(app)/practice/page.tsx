"use client";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/misc";
import { PracticeView } from "@/features/practice/practice-view";

export default function PracticePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PracticeView />
    </Suspense>
  );
}
