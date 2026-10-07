"use client";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster, toast } from "sonner";
import { ApiError } from "@/lib/api/client";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
          },
        },
        queryCache: new QueryCache({
          onError: (err) => {
            if (err instanceof ApiError && err.status === 401 && typeof window !== "undefined" && !location.pathname.startsWith("/login")) {
              // Full reload on purpose: drops all cached private data.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/login?next=${encodeURIComponent(location.pathname)}`);
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (err, _v, _c, mutation) => {
            if (mutation.options.meta?.silent) return;
            toast.error(err instanceof Error ? err.message : "Something went wrong. Your progress is safe.");
          },
        }),
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster theme="system" position="bottom-right" toastOptions={{ className: "!bg-surface !border-border !text-text" }} />
    </QueryClientProvider>
  );
}
