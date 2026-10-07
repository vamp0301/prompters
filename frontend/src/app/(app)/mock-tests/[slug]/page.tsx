"use client";
import { use } from "react";
import { MockTestRules } from "@/features/mock-tests/mock-test-rules";

export default function MockTestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <MockTestRules slug={slug} />;
}
