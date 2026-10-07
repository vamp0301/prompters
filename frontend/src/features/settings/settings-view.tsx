"use client";
import { PageHeader } from "@/components/ui/misc";
import { DataCard, PasswordCard, SessionsCard } from "./account";
import { LanguageCard, ThemeCard } from "./preferences";

export function SettingsView() {
  return (
    <div>
      <PageHeader eyebrow="Settings" title="Settings" description="Appearance, language, security and your data." />
      <div className="space-y-6">
        <section aria-labelledby="pref-h" className="space-y-4">
          <h2 id="pref-h" className="font-mono text-[11px] uppercase tracking-wider text-muted">Preferences</h2>
          <ThemeCard />
          <LanguageCard />
        </section>
        <section aria-labelledby="sec-h" className="space-y-4">
          <h2 id="sec-h" className="font-mono text-[11px] uppercase tracking-wider text-muted">Security</h2>
          <PasswordCard />
          <SessionsCard />
        </section>
        <section aria-labelledby="data-h" className="space-y-4">
          <h2 id="data-h" className="font-mono text-[11px] uppercase tracking-wider text-muted">Privacy</h2>
          <DataCard />
        </section>
      </div>
    </div>
  );
}
