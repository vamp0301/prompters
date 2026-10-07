"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageSkeleton } from "@/components/ui/misc";
import { GuideView } from "@/features/career/skills/guide-view";

function Guide() {
  const name = useSearchParams().get("name") ?? "";
  return <GuideView name={name} />;
}

export default function SkillGuidePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Guide />
    </Suspense>
  );
}
