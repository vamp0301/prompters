"use client";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ErrorState, PageSkeleton } from "@/components/ui/misc";
import { AdminShell } from "@/features/admin/admin-shell";
import { atLeast, useMe } from "@/features/auth/use-me";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading, error, refetch } = useMe();
  const router = useRouter();
  const denied = !!me && !atLeast(me.role, "AUTHOR");

  useEffect(() => {
    if (denied) router.replace("/dashboard");
  }, [denied, router]);

  if (error) return <div className="p-6"><ErrorState error={error} retry={() => refetch()} /></div>;
  if (isLoading || !me || denied) return <div className="p-6"><PageSkeleton /></div>;
  return (
    <AdminShell>
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
    </AdminShell>
  );
}
