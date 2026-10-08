"use client";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/misc";
import { CareerHub } from "@/features/career/career-hub";

export default function CareerPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CareerHub />
    </Suspense>
  );
}
