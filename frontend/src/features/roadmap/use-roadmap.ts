import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Roadmap } from "@/lib/api/types";

export const useRoadmap = () => useQuery({ queryKey: ["roadmap"], queryFn: () => api.get<Roadmap>("/roadmap") });
