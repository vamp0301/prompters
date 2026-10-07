"use client";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Languages, PlayCircle, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Input, Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { Tabs } from "@/components/ui/misc";
import { api, ApiError } from "@/lib/api/client";
import type { AdminTopicDetail, CodeFailure } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { stableJson } from "../diff";
import { FormError, Modal } from "../ui";
import { SECTION_META, SECTION_TYPES } from "./preview";

type SectionDraft = { content: Record<string, string>; codeJs: string; codePython: string };
type Drafts = Record<string, SectionDraft>;

const BASE_LOCALES = ["hinglish", "en", "hi"];
export const LOCALE_LABEL: Record<string, string> = { hinglish: "Hinglish", en: "English", hi: "हिन्दी" };
const TRANSLATABLE = ["hinglish", "en", "hi"];

function draftsOf(t: AdminTopicDetail): Drafts {
  return Object.fromEntries(
    SECTION_TYPES.map((type) => {
      const s = t.sections.find((x) => x.type === type);
      return [type, { content: { hinglish: "", en: "", ...(s?.content ?? {}) }, codeJs: s?.codeJs ?? "", codePython: s?.codePython ?? "" }];
    }),
  );
}

function SectionEditor({
  type, draft, locales, onChange, existed,
}: { type: string; draft: SectionDraft; locales: string[]; onChange: (d: SectionDraft) => void; existed: boolean }) {
  const [locale, setLocale] = useState("hinglish");
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const meta = SECTION_META[type];
  const value = draft.content[locale] ?? "";
  const source = locale === "en" ? "hinglish" : "en";
  const translate = useMutation({
    meta: { silent: true },
    mutationFn: () => api.post<{ draft: string }>("/admin/translations/draft", { text: draft.content[source], target: locale }),
    onSuccess: (r) => setAiDraft(r.draft),
    onError: (err) => {
      if (err instanceof ApiError && (err.status === 503 || err.code === "AI_UNAVAILABLE")) toast.error("No AI provider configured — translation drafts are unavailable on this server.");
      else toast.error(err instanceof Error ? err.message : "Translation failed");
    },
  });
  const filled = (l: string) => !!draft.content[l]?.trim();

  return (
    <section aria-labelledby={`sec-${type}`} className="rounded-xl border border-border bg-surface">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2.5">
        <h3 id={`sec-${type}`} className="flex items-baseline gap-2 text-sm font-semibold">
          <span className="font-mono text-xs text-accent">{meta.n}</span>{type}
          <span className="hidden font-normal text-muted sm:inline">· {meta.title}</span>
        </h3>
        {!existed && <Badge>new</Badge>}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Tabs
            value={locale}
            onChange={(l) => { setLocale(l); setAiDraft(null); }}
            items={locales.map((l) => ({ value: l, label: <span className="flex items-center gap-1">{LOCALE_LABEL[l] ?? l}<span aria-hidden className={cn("size-1.5 rounded-full", filled(l) ? "bg-accent" : "bg-border-strong")} /><span className="sr-only">{filled(l) ? "(written)" : "(empty)"}</span></span> }))}
          />
          {TRANSLATABLE.includes(locale) && (
            <Button type="button" size="sm" variant="ghost" disabled={!draft.content[source]?.trim()} loading={translate.isPending} onClick={() => translate.mutate()} title={`Draft from ${LOCALE_LABEL[source]}`}>
              <Languages className="size-3.5" /> Draft translation
            </Button>
          )}
        </div>
      </header>

      {aiDraft !== null && (
        <div className="border-b border-border bg-info-soft/50 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-info">AI draft ({LOCALE_LABEL[source]} → {LOCALE_LABEL[locale] ?? locale}) — review before using</span>
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => setAiDraft(null)}>Discard</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => { onChange({ ...draft, content: { ...draft.content, [locale]: aiDraft } }); setAiDraft(null); }}>Use this draft</Button>
            </div>
          </div>
          <Textarea value={aiDraft} onChange={(e) => setAiDraft(e.target.value)} aria-label="AI translation draft" className="min-h-28 font-mono text-[13px]" />
        </div>
      )}

      <div className="grid gap-0 lg:grid-cols-2">
        <div className="border-b border-border p-3 lg:border-b-0 lg:border-r">
          <label htmlFor={`md-${type}-${locale}`} className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-subtle">Markdown · {LOCALE_LABEL[locale] ?? locale}</label>
          <Textarea
            id={`md-${type}-${locale}`}
            value={value}
            onChange={(e) => onChange({ ...draft, content: { ...draft.content, [locale]: e.target.value } })}
            spellCheck={locale === "en"}
            className="min-h-48 font-mono text-[13px]"
            placeholder={locale === "hi" ? "Optional — falls back to English for students" : "Write in Markdown…"}
          />
          <div className="mt-1 text-right font-mono text-[10px] text-subtle">{value.length.toLocaleString()} / 20,000</div>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-3">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-subtle">Preview</div>
          {value.trim() ? <Markdown className="text-sm">{value}</Markdown> : <p className="text-sm text-subtle">Nothing written in {LOCALE_LABEL[locale] ?? locale} yet.</p>}
        </div>
      </div>

      {type === "CODE" && (
        <div className="grid gap-3 border-t border-border p-3 lg:grid-cols-2">
          <div>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-subtle">codeJs · runs in the sandbox before publish</div>
            <div className="h-64 overflow-hidden rounded-lg border border-border"><CodeEditor language="javascript" value={draft.codeJs} onChange={(v) => onChange({ ...draft, codeJs: v })} ariaLabel="JavaScript sample" /></div>
          </div>
          <div>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-subtle">codePython</div>
            <div className="h-64 overflow-hidden rounded-lg border border-border"><CodeEditor language="python" value={draft.codePython} onChange={(v) => onChange({ ...draft, codePython: v })} ariaLabel="Python sample" /></div>
          </div>
        </div>
      )}
    </section>
  );
}

export function CodeVerifyButton({ topicId }: { topicId: string }) {
  const [result, setResult] = useState<{ ok: boolean; failures: CodeFailure[] } | null>(null);
  const verify = useMutation({ mutationFn: () => api.post<{ ok: boolean; failures: CodeFailure[] }>(`/admin/topics/${topicId}/verify-code`), onSuccess: setResult });
  return (
    <>
      <Button type="button" variant="secondary" size="sm" loading={verify.isPending} onClick={() => verify.mutate()}><PlayCircle className="size-3.5" /> Verify code samples</Button>
      <Modal open={!!result} onClose={() => setResult(null)} title="Code sample check">
        {result?.ok ? (
          <p className="flex items-center gap-2 text-sm text-accent"><CheckCircle2 className="size-4" /> Every saved sample ran with exit code 0.</p>
        ) : (
          <ul className="space-y-2">
            {result?.failures.map((f, i) => (
              <li key={i} className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-danger"><XCircle className="size-4" /> {f.section} · {f.language}</div>
                <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] text-text/80">{f.error || "Non-zero exit"}</pre>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-subtle">Checks the saved samples — save first if you changed code.</p>
      </Modal>
    </>
  );
}

export function ContentTab({ topic }: { topic: AdminTopicDetail }) {
  const qc = useQueryClient();
  const [base, setBase] = useState(() => draftsOf(topic));
  const [drafts, setDrafts] = useState(base);
  const [extra, setExtra] = useState("");
  const [extraLocales, setExtraLocales] = useState<string[]>([]);
  const locales = useMemo(() => {
    const found = new Set<string>(BASE_LOCALES);
    Object.values(drafts).forEach((d) => Object.keys(d.content).forEach((k) => found.add(k)));
    extraLocales.forEach((l) => found.add(l));
    return [...found];
  }, [drafts, extraLocales]);
  const existing = new Set(topic.sections.map((s) => s.type));
  const changed = SECTION_TYPES.filter((t) => stableJson(base[t]) !== stableJson(drafts[t]));

  const save = useMutation({
    meta: { silent: true },
    mutationFn: () => {
      // Send sections that already exist or now have something in them — never create empty rows.
      const sections = SECTION_TYPES.filter((t) => existing.has(t) || Object.values(drafts[t].content).some((v) => v.trim()) || drafts[t].codeJs.trim() || drafts[t].codePython.trim()).map((type) => ({
        type,
        content: drafts[type].content,
        codeJs: drafts[type].codeJs || null,
        codePython: drafts[type].codePython || null,
      }));
      return api.put<{ saved: number }>(`/admin/topics/${topic.id}/sections`, { sections });
    },
    onSuccess: (r) => { toast.success(`Saved ${r.saved} sections`); setBase(drafts); qc.invalidateQueries({ queryKey: ["admin"] }); },
  });

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-20 -mx-1 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-bg/90 px-3 py-2 backdrop-blur">
        <span className="text-xs text-muted">{changed.length ? <span className="text-warn">{changed.length} section{changed.length > 1 ? "s" : ""} changed: {changed.join(", ")}</span> : "All sections saved"}</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); const k = extra.trim().toLowerCase(); if (/^[a-z]{2,12}$/.test(k)) { setExtraLocales((x) => [...x, k]); setExtra(""); } }}>
            <Input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="locale key" aria-label="Add a locale key" className="h-8 w-28 font-mono text-xs" />
            <Button type="submit" size="sm" variant="ghost" aria-label="Add locale"><Plus className="size-3.5" /></Button>
          </form>
          <CodeVerifyButton topicId={topic.id} />
          <Button size="sm" variant="ghost" disabled={!changed.length} onClick={() => setDrafts(base)}>Discard</Button>
          <Button size="sm" loading={save.isPending} disabled={!changed.length} onClick={() => save.mutate()}>Save all sections</Button>
        </div>
      </div>
      <FormError error={save.error} />
      {SECTION_TYPES.map((type) => (
        <SectionEditor key={type} type={type} draft={drafts[type]} locales={locales} existed={existing.has(type)} onChange={(d) => setDrafts((p) => ({ ...p, [type]: d }))} />
      ))}
    </div>
  );
}
