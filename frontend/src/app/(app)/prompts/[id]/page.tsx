"use client";
import { use } from "react";
import { PromptDetailView } from "@/features/prompts/prompt-detail";

export default function PromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PromptDetailView id={id} />;
}
