"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageSkeleton } from "@/components/ui/misc";
import { MapView } from "@/features/knowledge/map-view";

function Map() {
  const name = useSearchParams().get("name") ?? "";
  return <MapView key={name} name={name} />;
}

export default function SkillMapPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Map />
    </Suspense>
  );
}
