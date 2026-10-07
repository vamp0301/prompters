"use client";
import { useQuery } from "@tanstack/react-query";
import { api, qs } from "@/lib/api/client";
import type { AdminModule, AdminStage, AdminTopicRow, Paged } from "@/lib/api/types";

/** Every topic (walks the paged list) — for selects and slug pickers. */
export function useAllTopics() {
  return useQuery({
    queryKey: ["admin", "topics", "all"],
    staleTime: 60_000,
    queryFn: async () => {
      const out: AdminTopicRow[] = [];
      for (let page = 1; page < 50; page++) {
        const res = await api.get<Paged<AdminTopicRow>>(`/admin/topics${qs({ page, pageSize: 100 })}`);
        out.push(...res.items);
        if (out.length >= res.total || res.items.length === 0) break;
      }
      return out;
    },
  });
}

export function useStages() {
  return useQuery({ queryKey: ["admin", "stages"], queryFn: () => api.get<AdminStage[]>("/admin/stages") });
}

export function useModules() {
  return useQuery({ queryKey: ["admin", "modules"], queryFn: () => api.get<AdminModule[]>("/admin/modules") });
}

/** Paged list of a CRUD resource. */
export function useAdminList<T>(path: string, params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ["admin", path, params],
    queryFn: () => api.get<Paged<T>>(`/admin/${path}${qs(params)}`),
    placeholderData: (prev) => prev,
  });
}
