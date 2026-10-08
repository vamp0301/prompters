import { PublicFooter, PublicHeader } from "@/components/layout/public-header";
import { loadLanding } from "@/features/marketing/load-landing";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { footer } = await loadLanding();
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main id="main" className="flex-1">{children}</main>
      <PublicFooter tagline={footer.tagline} />
    </div>
  );
}
