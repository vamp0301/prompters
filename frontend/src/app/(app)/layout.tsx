"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/ui/misc";
import { useMe } from "@/features/auth/use-me";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading } = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const needsOnboarding = me && !me.profile?.onboardedAt && pathname !== "/onboarding";

  useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
  }, [needsOnboarding, router]);

  // Full-bleed screens (workspace, timed tests) render without the sidebar.
  if (pathname.startsWith("/workspace") || pathname.startsWith("/quiz") || pathname.startsWith("/career/live") || pathname === "/onboarding") {
    return <>{children}</>;
  }
  return <AppShell>{isLoading || needsOnboarding ? <PageSkeleton /> : children}</AppShell>;
}
