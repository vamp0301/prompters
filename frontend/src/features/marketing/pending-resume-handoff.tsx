"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMe } from "@/features/auth/use-me";
import { friendlyError } from "@/features/career/shared";
import { clearPendingResume, loadPendingResume } from "./pending-resume";
import { startPreparing } from "./start-preparing";

/**
 * Runs inside the signed-in app shell. Once the user is onboarded, a resume they chose on the
 * landing page before signing up is uploaded, its Top-100 plan is started and they're taken to it.
 */
export function PendingResumeHandoff() {
  const { data: me } = useMe();
  const router = useRouter();
  const started = useRef(false);
  const ready = !!me?.profile?.onboardedAt;

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    void (async () => {
      const pending = await loadPendingResume();
      if (!pending) return;
      const id = toast.loading(`Uploading ${pending.name} and preparing your Top 100…`);
      try {
        const planId = await startPreparing(pending, pending.targetRole);
        await clearPendingResume();
        toast.success("Your resume is in. Generating your Top 100 now.", { id });
        router.replace(`/career/prep/${planId}`);
      } catch (e) {
        // Cleared even on failure so it doesn't retry on every page load; the user can upload again from Career AI.
        await clearPendingResume();
        toast.error(`${friendlyError(e)} You can upload it again from Career AI.`, {
          id,
          duration: 12_000,
          action: { label: "Open Career AI", onClick: () => router.push("/career") },
        });
      }
    })();
  }, [ready, router]);

  return null;
}
