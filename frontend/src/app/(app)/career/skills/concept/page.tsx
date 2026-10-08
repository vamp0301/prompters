"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageSkeleton } from "@/components/ui/misc";
import { ConceptView } from "@/features/knowledge/concept-view";

function Concept() {
  const params = useSearchParams();
  const name = params.get("name") ?? "";
  const c = params.get("c") ?? "";
  return <ConceptView key={`${name}:${c}`} name={name} conceptKey={c} />;
}

export default function ConceptPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Concept />
    </Suspense>
  );
}
