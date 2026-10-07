"use client";
import { use } from "react";
import { PrepView } from "@/features/career/prep/prep-view";

export default function CareerPrepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PrepView id={id} />;
}
