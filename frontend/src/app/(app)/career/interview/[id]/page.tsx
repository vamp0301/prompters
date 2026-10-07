"use client";
import { use } from "react";
import { ReportView } from "@/features/career/report-view";

export default function CareerInterviewReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ReportView id={id} />;
}
