"use client";
import { useSyncExternalStore } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/misc";
import { useMe } from "@/features/auth/use-me";
import { api } from "@/lib/api/client";
import type { Locale } from "@/lib/api/types";
import { RadioCards } from "./radio-cards";
import { applyTheme, readTheme, subscribeTheme, type Theme } from "@/lib/theme";

export function ThemeCard() {
  const theme = useSyncExternalStore<Theme | undefined>(subscribeTheme, readTheme, () => undefined);
  return (
    <Card>
      <CardHeader title="Theme" description="Saved on this device." />
      <CardBody>
        <RadioCards<Theme>
          name="theme"
          legend="Theme"
          value={theme}
          onChange={applyTheme}
          options={[
            { value: "light", label: "Paper", hint: "Default · warm paper, dark ink", icon: <Sun className="size-4" /> },
            { value: "dark", label: "Night", hint: "Archival paper, easy at night", icon: <Moon className="size-4" /> },
            { value: "system", label: "System", hint: "Follow your OS setting", icon: <Monitor className="size-4" /> },
          ]}
        />
      </CardBody>
    </Card>
  );
}

const LOCALES: { value: Locale; label: string; hint: string }[] = [
  { value: "hinglish", label: "Hinglish", hint: "Hindi + English mix" },
  { value: "en", label: "English", hint: "Plain English" },
  { value: "hi", label: "हिन्दी", hint: "Hindi (where available)" },
];

export function LanguageCard() {
  const qc = useQueryClient();
  const { data: me, isLoading } = useMe();
  const save = useMutation({
    mutationFn: (explanationLocale: Locale) => api.patch("/profile", { explanationLocale }),
    onSuccess: () => {
      toast.success("Explanation language updated.");
      for (const key of [["me"], ["profile"], ["topic"]]) qc.invalidateQueries({ queryKey: key });
    },
  });
  const current = save.isPending ? save.variables : (me?.profile?.explanationLocale ?? "hinglish");

  return (
    <Card>
      <CardHeader title="Explanation language" description="Topic explanations use this language. Code and technical terms stay in English." />
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : (
          <RadioCards<Locale> name="locale" legend="Explanation language" value={current} onChange={(v) => v !== current && save.mutate(v)} options={LOCALES} disabled={save.isPending} />
        )}
      </CardBody>
    </Card>
  );
}
