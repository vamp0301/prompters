"use client";
import { PageHeader } from "@/components/ui/misc";
import { ProjectsList } from "@/features/career/projects/projects-list";

export default function MyProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Get hired" title="My projects" description="Every project and job on your resume, as a full interview-prep module: what you built, why each technology, its APIs, 20 interview questions and a drill-down test." />
      <ProjectsList />
    </div>
  );
}
