"use client";
import { use } from "react";
import { AnalysisView } from "@/features/career/analysis-view";

export default function CareerAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AnalysisView id={id} />;
}
