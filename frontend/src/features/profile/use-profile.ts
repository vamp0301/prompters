"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { GoalRole, ProfileResponse } from "@/lib/api/types";

export const profileKey = ["profile"] as const;

export function useProfile() {
  return useQuery({ queryKey: profileKey, queryFn: () => api.get<ProfileResponse>("/profile") });
}

export const GOAL_ROLES: { value: GoalRole; label: string }[] = [
  { value: "BACKEND", label: "Backend Developer" },
  { value: "FRONTEND", label: "Frontend Developer" },
  { value: "FULLSTACK", label: "Full-stack Developer" },
  { value: "DEVOPS", label: "DevOps Engineer" },
  { value: "SDE", label: "Software Development Engineer" },
  { value: "AI", label: "AI Engineer" },
];

export const roleLabel = (r: GoalRole | null | undefined) => GOAL_ROLES.find((x) => x.value === r)?.label ?? null;

/** Link keys the profile form edits. Other keys already stored are preserved on save. */
export const LINK_KEYS = [
  { key: "github", label: "GitHub" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "portfolio", label: "Portfolio" },
] as const;

export type LinkKey = (typeof LINK_KEYS)[number]["key"];

/** The 8 checks the backend uses for the Readiness "Resume & profile" factor (readiness.service.ts). */
export interface ResumeCheckInput {
  name: string;
  education: string;
  goalRole: string;
  skills: string[];
  headline: string;
  summary: string;
  linkCount: number;
  targetCompanies: string[];
}

export function resumeChecks(v: ResumeCheckInput) {
  return [
    { label: "Name", done: v.name.trim().length > 0 },
    { label: "Education", done: v.education.trim().length > 0 },
    { label: "Target career", done: v.goalRole.length > 0 },
    { label: "At least 3 skills", done: v.skills.length >= 3 },
    { label: "Headline", done: v.headline.trim().length > 0 },
    { label: "Summary", done: v.summary.trim().length > 0 },
    { label: "At least one link", done: v.linkCount > 0 },
    { label: "Target companies", done: v.targetCompanies.length > 0 },
  ];
}

export const splitList = (s: string) =>
  [...new Set(s.split(",").map((x) => x.trim()).filter(Boolean))];

/** Accepts "github.com/me" or a full URL; returns a normalised https URL or null if invalid. */
export function normaliseUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}
