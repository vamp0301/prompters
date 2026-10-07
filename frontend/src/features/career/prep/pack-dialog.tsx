"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Dialog } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { PrepPackItem, PrepPackLanguage, PrepPackVariant, PrepPlanDetail } from "@/lib/api/types";
import { cn, formatDate } from "@/lib/utils";
import { careerKeys, InlineError } from "../shared";
import { PACK_LANGUAGES, PACK_VARIANTS } from "./prep-shared";

const downloadUrl = (planId: string, packId: string) => `/api/career/prep/${planId}/packs/${packId}/download`;
const variantLabel = (v: PrepPackVariant) => PACK_VARIANTS.find((x) => x.value === v)?.label ?? v;
const languageLabel = (l: PrepPackLanguage) => PACK_LANGUAGES.find((x) => x.value === l)?.label ?? l;

export function PackDialog({ open, onClose, plan }: { open: boolean; onClose: () => void; plan: PrepPlanDetail }) {
  return (
    <Dialog open={open} onClose={onClose} title="Download your interview pack" className="max-w-xl">
      <PackForm plan={plan} />
    </Dialog>
  );
}

function PackForm({ plan }: { plan: PrepPlanDetail }) {
  const qc = useQueryClient();
  const [variant, setVariant] = useState<PrepPackVariant>("GUIDE");
  const [language, setLanguage] = useState<PrepPackLanguage>("en");
  const [packId, setPackId] = useState<string | null>(null);

  const request = useMutation({
    meta: { silent: true },
    mutationFn: () => api.post<PrepPackItem>(`/career/prep/${plan.id}/packs`, { variant, language }),
    onSuccess: (p) => setPackId(p.id),
  });
  const pack = useQuery({
    queryKey: ["career", "prep", "pack", packId],
    queryFn: async () => {
      const r = await api.get<PrepPackItem>(`/career/prep/${plan.id}/packs/${packId}`);
      if (r.status === "READY") qc.invalidateQueries({ queryKey: careerKeys.prepPlan(plan.id) });
      return r;
    },
    enabled: !!packId,
    refetchInterval: (q) => (q.state.data?.status === "READY" || q.state.data?.status === "FAILED" ? false : 1500),
  });
  const p = pack.data;
  const busy = request.isPending || (!!packId && (!p || p.status === "QUEUED" || p.status === "RUNNING"));
  const recent = plan.packs.filter((x) => x.status === "READY").slice(0, 5);

  return (
    <div className="space-y-5 text-sm">
      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">What to include</legend>
        {PACK_VARIANTS.map((v) => (
          <label key={v.value} className={cn("flex cursor-pointer gap-3 rounded-lg border p-3", variant === v.value ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-2")}>
            <input type="radio" name="variant" value={v.value} checked={variant === v.value} onChange={() => setVariant(v.value)} className="mt-1 accent-accent" disabled={busy} />
            <span>
              <span className="block font-medium">{v.label}</span>
              <span className="block text-xs text-muted">{v.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Language</legend>
        <div className="flex flex-wrap gap-2">
          {PACK_LANGUAGES.map((l) => (
            <label key={l.value} className={cn("cursor-pointer rounded-md border px-3 py-1.5 text-xs", language === l.value ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:text-text")}>
              <input type="radio" name="language" value={l.value} checked={language === l.value} onChange={() => setLanguage(l.value)} className="sr-only" disabled={busy} />
              {l.label}
            </label>
          ))}
        </div>
        {language !== "en" && <p className="mt-2 text-xs text-subtle">Translated with AI; technical terms stay in English. The first {languageLabel(language)} pack takes about a minute. Your interview with Manisha is still in English.</p>}
      </fieldset>

      <InlineError error={request.error} />
      {p?.status === "FAILED" && <InlineError error={new Error(p.error ?? "Couldn't build the PDF. Please try again.")} />}

      {p?.status === "READY" ? (
        <a href={downloadUrl(plan.id, p.id)} className={buttonClass("primary", "md")} download>
          <Download className="size-4" aria-hidden /> Download PDF
        </a>
      ) : (
        <Button onClick={() => request.mutate()} loading={busy} disabled={busy}>
          {busy ? "Preparing your PDF…" : "Generate PDF"}
        </Button>
      )}
      {busy && (
        <p role="status" className="flex items-center gap-2 text-xs text-muted">
          <Loader2 className="size-3.5 animate-spin text-accent" aria-hidden /> Building your {variantLabel(variant).toLowerCase()} in {languageLabel(language)}…
        </p>
      )}
      {p?.status === "READY" && (
        <button type="button" className="ml-3 text-xs text-muted underline underline-offset-4 hover:text-text" onClick={() => setPackId(null)}>
          Make another
        </button>
      )}

      {recent.length > 0 && (
        <div className="border-t border-border pt-3">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Recent packs</h3>
          <ul className="space-y-1.5">
            {recent.map((r) => (
              <li key={r.id}>
                <a href={downloadUrl(plan.id, r.id)} download className="flex items-center gap-2 text-xs hover:text-accent">
                  <FileText className="size-3.5 text-muted" aria-hidden />
                  {variantLabel(r.variant)} · {languageLabel(r.language)} · {formatDate(r.createdAt)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
