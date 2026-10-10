"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Me, Role } from "@/lib/api/types";

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => api.get<Me>("/auth/me"), staleTime: 60_000 });
}

/** False when the server runs with code execution disabled (SANDBOX_DRIVER=disabled). Assumed on while loading. */
export function useCodeExecution() {
  const { data: me } = useMe();
  return me?.flags?.CODE_EXECUTION !== false;
}

/** False when the server keeps no files (STORAGE_DRIVER=none): only the text of an upload is saved. */
export function useFileStorage() {
  const { data: me } = useMe();
  return me?.flags?.FILE_STORAGE !== false;
}

/** Interview audio recording is offered only when the server says so. Assumed off while loading. */
export function useAudioRecording() {
  const { data: me } = useMe();
  return me?.flags?.AUDIO_RECORDING === true;
}

export const FILE_STORAGE_OFF = "Only the text is saved — this server doesn't keep the original file.";

export const CODE_EXECUTION_OFF = "Running code is turned off on this server for now. You can still read, write and explain your code — everything else keeps working.";

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
