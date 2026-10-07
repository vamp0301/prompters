"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Me, Role } from "@/lib/api/types";

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => api.get<Me>("/auth/me"), staleTime: 60_000 });
}

export function useLogout() {
  const qc = useQueryClient();
  return async () => {
    await api.post("/auth/logout").catch(() => undefined);
    qc.clear();
    // Full reload on purpose: drops all cached private data.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  };
}

const RANK: Record<Role, number> = { STUDENT: 0, AUTHOR: 1, ADMIN: 2, SUPER_ADMIN: 3 };
export const atLeast = (role: Role | undefined, min: Role) => !!role && RANK[role] >= RANK[min];
