"use client";
import { use } from "react";
import { ProjectDetailView } from "@/features/projects/project-detail";

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <ProjectDetailView slug={slug} />;
}
