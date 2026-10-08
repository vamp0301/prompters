"use client";
import { Suspense, use } from "react";
import { PageSkeleton } from "@/components/ui/misc";
import { ProjectView } from "@/features/career/projects/project-view";

export default function ProjectExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProjectView id={id} />
    </Suspense>
  );
}
