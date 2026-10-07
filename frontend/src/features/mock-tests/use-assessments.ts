import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AssessmentSummary, AttemptSummary } from "@/lib/api/types";

export const useAssessments = () => useQuery({ queryKey: ["assessments"], queryFn: () => api.get<AssessmentSummary[]>("/assessments") });
export const useAttempts = () => useQuery({ queryKey: ["attempts"], queryFn: () => api.get<AttemptSummary[]>("/attempts") });

export const attemptsLeft = (a: AssessmentSummary) => (a.maxAttempts === null ? null : Math.max(0, a.maxAttempts - a.attemptsUsed));
