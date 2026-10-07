"use client";
import { useState } from "react";
import { ErrorState, PageHeader, PageSkeleton, Tabs } from "@/components/ui/misc";
import { ProfileForm } from "./profile-form";
import { ResumeTab } from "./resume";
import { useProfile } from "./use-profile";

type Tab = "profile" | "resume";

export function ProfileView() {
  const [tab, setTab] = useState<Tab>("profile");
  const { data, error, isLoading, refetch } = useProfile();

  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} retry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title="Profile & resume"
        description="Keep your profile complete — it powers your roadmap, your Readiness score and a resume built only from work you've actually done."
      />
      <Tabs<Tab>
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "profile", label: "Profile" },
          { value: "resume", label: "Resume" },
        ]}
      />
      <div role="tabpanel" aria-label={tab === "profile" ? "Profile" : "Resume"}>
        {/* Keyed by updatedAt so the form re-seeds from fresh server data after a save elsewhere. */}
        {tab === "profile" ? <ProfileForm key={data.profile?.updatedAt ?? "new"} data={data} /> : <ResumeTab profile={data} />}
      </div>
    </div>
  );
}
