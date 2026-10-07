"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMe } from "@/features/auth/use-me";
import { api } from "@/lib/api/client";
import type { Locale } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type Code = "PYTHON" | "JAVASCRIPT";

function Segmented<T extends string>({ label, value, options, onChange, disabled }: { label: string; value: T | undefined; options: { value: T; label: string }[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-2">
      <span className="text-xs text-muted">{label}</span>
      <div className="inline-flex rounded-full border border-border bg-surface p-0.5">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => !on && onChange(o.value)}
              className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", on ? "bg-accent text-accent-fg shadow-sm" : "text-muted hover:text-text")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Choose the programming language you study in and the language explanations are written in. */
export function StudyLanguage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: (patch: { startLanguage?: Code; explanationLocale?: Locale }) => api.patch("/profile", patch),
    onSuccess: (_d, patch) => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success(patch.startLanguage ? `Now studying in ${patch.startLanguage === "PYTHON" ? "Python" : "JavaScript"}` : "Explanation language updated");
    },
  });
  const code = save.isPending && save.variables?.startLanguage ? save.variables.startLanguage : (me?.profile?.startLanguage ?? undefined);
  const locale = save.isPending && save.variables?.explanationLocale ? save.variables.explanationLocale : (me?.profile?.explanationLocale ?? "hinglish");
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <Segmented<Code>
        label="Code in"
        value={code}
        disabled={save.isPending}
        onChange={(v) => save.mutate({ startLanguage: v })}
        options={[
          { value: "PYTHON", label: "Python" },
          { value: "JAVASCRIPT", label: "JavaScript" },
        ]}
      />
      <Segmented<Locale>
        label="Explain in"
        value={locale}
        disabled={save.isPending}
        onChange={(v) => save.mutate({ explanationLocale: v })}
        options={[
          { value: "en", label: "English" },
          { value: "hinglish", label: "Hinglish" },
          { value: "hi", label: "हिन्दी" },
        ]}
      />
    </div>
  );
}
