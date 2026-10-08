"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ErrorState, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { ConfirmDialog, FormError, Panel, RoleNotice, Toggle, useRole } from "@/features/admin/ui";
import { mergeLanding, type LandingContent } from "@/features/marketing/landing-content";
import { api } from "@/lib/api/client";
import { cn, relativeTime } from "@/lib/utils";

interface SiteRow {
  key: string;
  content: unknown;
  version: number;
  updatedAt: string | null;
  updatedBy: { name: string; email: string } | null;
}

type Path = (string | number)[];
type FieldDef = { path: Path; label: string; max: number; multiline?: boolean; required?: boolean; hint?: string };

const f = (path: Path, label: string, max: number, extra: Partial<FieldDef> = {}): FieldDef => ({ path, label, max, required: true, ...extra });

/** Every editable field, grouped as the page reads top to bottom. Limits match the API. */
const SECTIONS: { id: string; title: string; description: string; fields: FieldDef[] }[] = [
  {
    id: "hero",
    title: "Hero",
    description: "The first screen: headline, intro line, buttons and the three steps.",
    fields: [
      f(["hero", "eyebrow"], "Eyebrow", 80),
      f(["hero", "titleLead"], "Headline — first line", 40),
      f(["hero", "titleAccent"], "Headline — green italic word", 30),
      f(["hero", "titleTail"], "Headline — last line (gradient)", 40),
      f(["hero", "lede"], "Intro line", 200, { multiline: true }),
      f(["hero", "primaryCta"], "Main button", 40),
      f(["hero", "secondaryCta"], "Secondary link", 40),
      f(["hero", "steps", 0], "Step 1", 40),
      f(["hero", "steps", 1], "Step 2", 40),
      f(["hero", "steps", 2], "Step 3", 40),
    ],
  },
  {
    id: "upload",
    title: "Resume card",
    description: "The taped card where visitors choose their resume.",
    fields: [
      f(["upload", "tape"], "Tape label", 30),
      f(["upload", "noteLine1"], "Highlighter note — line 1", 40),
      f(["upload", "noteLine2"], "Highlighter note — line 2 (bold)", 40),
      f(["upload", "title"], "Card title", 80),
      f(["upload", "subtitle"], "Card subtitle", 200, { multiline: true }),
      f(["upload", "dropTitle"], "Drop area title", 40),
      f(["upload", "dropHint"], "Drop area hint", 60),
      f(["upload", "button"], "Button", 50),
      f(["upload", "finePrint"], "Fine print", 160),
    ],
  },
  {
    id: "loop",
    title: "The loop",
    description: "“Not another course” section with four cards.",
    fields: [
      f(["loop", "eyebrow"], "Eyebrow", 60),
      f(["loop", "title"], "Heading", 80),
      f(["loop", "titleAccent"], "Heading — green italic line", 80),
      ...[0, 1, 2, 3].flatMap((i) => [f(["loop", "cards", i, "title"], `Card ${i + 1} — title`, 40), f(["loop", "cards", i, "text"], `Card ${i + 1} — text`, 160, { multiline: true })]),
    ],
  },
  {
    id: "top100",
    title: "Your Top 100",
    description: "The Top 100 pitch and the blue sample note (always labelled SAMPLE on the page).",
    fields: [
      f(["top100", "eyebrow"], "Eyebrow", 60),
      f(["top100", "title"], "Heading", 60),
      f(["top100", "titleAccent"], "Heading — green italic line", 80),
      f(["top100", "body"], "Paragraph", 300, { multiline: true }),
      f(["top100", "cta"], "Button", 40),
      f(["top100", "sample", "meta"], "Sample — label line", 60),
      f(["top100", "sample", "question"], "Sample — question", 200, { multiline: true }),
      f(["top100", "sample", "why"], "Sample — why it's asked", 200, { multiline: true }),
      f(["top100", "sample", "resume"], "Sample — resume line", 120),
    ],
  },
  {
    id: "finalCta",
    title: "Closing section",
    description: "The last call to action before the footer.",
    fields: [
      f(["finalCta", "eyebrow"], "Eyebrow", 60),
      f(["finalCta", "line1"], "Heading", 120, { multiline: true }),
      f(["finalCta", "accent"], "Heading — green italic line", 120, { multiline: true }),
      f(["finalCta", "button"], "Button", 50),
    ],
  },
  {
    id: "footer",
    title: "Footer",
    description: "Shown under the logo on every public page.",
    fields: [f(["footer", "tagline"], "Tagline", 160, { multiline: true })],
  },
  {
    id: "seo",
    title: "Search & sharing",
    description: "How the landing page appears in search results and link previews. Leave empty to use the defaults.",
    fields: [
      f(["seo", "title"], "Page title", 70, { required: false, hint: "Empty = “Prompters — Learn. Build. Prove. Get Hired.”" }),
      f(["seo", "description"], "Description", 170, { required: false, multiline: true }),
    ],
  },
];

const get = (o: unknown, path: Path): unknown => path.reduce<unknown>((acc, k) => (acc as Record<string | number, unknown> | undefined)?.[k], o);
function set<T>(o: T, path: Path, value: unknown): T {
  const [k, ...rest] = path;
  const copy = (Array.isArray(o) ? [...o] : { ...(o as object) }) as Record<string | number, unknown>;
  copy[k] = rest.length ? set(copy[k], rest, value) : value;
  return copy as T;
}
const key = (p: Path) => p.join(".");
const HREF_OK = (v: string) => v === "" || (/^\/(?!\/)/.test(v) && !/[\s<>"']/.test(v)) || /^https:\/\/[^\s<>"']+$/.test(v);

function validate(c: LandingContent): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const s of SECTIONS)
    for (const fd of s.fields) {
      const v = String(get(c, fd.path) ?? "").trim();
      if (fd.required && !v) errors[key(fd.path)] = "Can't be empty.";
      else if (v.length > fd.max) errors[key(fd.path)] = `Keep it under ${fd.max} characters.`;
    }
  const a = c.announcement;
  if (a.enabled && !a.text.trim()) errors["announcement.text"] = "Write the announcement text, or turn it off.";
  if (!HREF_OK(a.linkHref.trim())) errors["announcement.linkHref"] = "Use a path like /pricing or an https:// link.";
  else if (!a.linkLabel.trim() !== !a.linkHref.trim()) errors["announcement.linkHref"] = "Give the link both a label and an address, or neither.";
  return errors;
}

export function WebsiteEditor() {
  const { me, can } = useRole();
  const allowed = can("SUPER_ADMIN");
  const q = useQuery({ queryKey: ["admin", "site", "landing"], queryFn: () => api.get<SiteRow>("/admin/site/landing"), enabled: allowed });
  if (!me) return <PageSkeleton />;
  if (!allowed)
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="Platform" title="Website" description="Edit the copy on the public website." />
        <RoleNotice min="SUPER_ADMIN">Only a <strong className="text-text">Super Admin</strong> can edit the public website.</RoleNotice>
      </div>
    );
  if (q.isLoading) return <PageSkeleton />;
  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  // Remount the form whenever a new version arrives so it starts from what was saved.
  return <Editor key={q.data!.version} row={q.data!} />;
}

function Editor({ row }: { row: SiteRow }) {
  const qc = useQueryClient();
  const saved = useMemo(() => mergeLanding(row.content), [row.content]);
  const [draft, setDraft] = useState<LandingContent>(saved);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const errors = validate(draft);
  const errorCount = Object.keys(errors).length;

  const refreshSite = () => fetch("/site-refresh", { method: "POST" }).catch(() => undefined);
  const save = useMutation({
    mutationFn: () => api.put<SiteRow>("/admin/site/landing", { content: draft, expectedVersion: row.version }),
    onSuccess: async (next) => {
      await refreshSite();
      qc.setQueryData(["admin", "site", "landing"], next);
      toast.success("Published. The website shows the new copy within a minute.");
    },
  });
  const reset = useMutation({
    mutationFn: () => api.delete<SiteRow>("/admin/site/landing"),
    onSuccess: async (next) => {
      await refreshSite();
      setConfirmReset(false);
      qc.setQueryData(["admin", "site", "landing"], next);
      toast.success("Back to the built-in copy.");
    },
  });

  const field = (fd: FieldDef) => {
    const id = `site-${key(fd.path)}`;
    const value = String(get(draft, fd.path) ?? "");
    const err = showErrors ? errors[key(fd.path)] : undefined;
    const Comp = fd.multiline ? Textarea : Input;
    return (
      <Field key={id} label={fd.label} htmlFor={id} error={err} hint={fd.hint}>
        <div className="relative">
          <Comp
            id={id}
            value={value}
            maxLength={fd.max}
            aria-invalid={!!err}
            onChange={(e) => setDraft((d) => set(d, fd.path, e.target.value))}
            className={cn(fd.multiline && "min-h-20", "pr-14")}
          />
          <span className={cn("pointer-events-none absolute right-2.5 top-2.5 font-mono text-[10px]", value.length > fd.max * 0.9 ? "text-warn" : "text-subtle")}>
            {value.length}/{fd.max}
          </span>
        </div>
      </Field>
    );
  };

  const a = draft.announcement;
  const setA = (patch: Partial<LandingContent["announcement"]>) => setDraft((d) => ({ ...d, announcement: { ...d.announcement, ...patch } }));

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        eyebrow="Platform"
        title="Website"
        description="Edit the public landing page without touching code. Saving publishes it; visitors see the change within a minute."
        actions={
          <a href="/" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-[13px] font-bold hover:border-accent">
            Open website <ExternalLink className="size-3.5" aria-hidden />
          </a>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-xs text-muted">
        {row.version ? (
          <>
            <Badge tone="accent">Live · v{row.version}</Badge>
            <span>
              Last published {row.updatedAt ? relativeTime(row.updatedAt) : ""}
              {row.updatedBy && <> by <strong className="text-text">{row.updatedBy.name}</strong></>}. Every change is in the audit log.
            </span>
          </>
        ) : (
          <>
            <Badge>Built-in copy</Badge>
            <span>Nothing saved yet — the website shows the built-in copy below.</span>
          </>
        )}
      </div>

      <Panel title="Announcement banner" description="A thin strip above the landing page hero — for launches, events or notices." bodyClassName="space-y-4 p-4">
        <Toggle checked={a.enabled} onChange={(v) => setA({ enabled: v })} label="Show the banner" description="Visitors see it at the top of the landing page." />
        <Field label="Banner text" htmlFor="site-ann-text" error={showErrors ? errors["announcement.text"] : undefined}>
          <Input id="site-ann-text" value={a.text} maxLength={200} onChange={(e) => setA({ text: e.target.value })} placeholder="e.g. Free during beta — invite your friends." />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Link label (optional)" htmlFor="site-ann-label">
            <Input id="site-ann-label" value={a.linkLabel} maxLength={40} onChange={(e) => setA({ linkLabel: e.target.value })} placeholder="See pricing" />
          </Field>
          <Field label="Link address (optional)" htmlFor="site-ann-href" error={showErrors ? errors["announcement.linkHref"] : undefined} hint="A path like /pricing or an https:// link.">
            <Input id="site-ann-href" value={a.linkHref} maxLength={300} onChange={(e) => setA({ linkHref: e.target.value })} placeholder="/pricing" />
          </Field>
        </div>
      </Panel>

      {SECTIONS.map((s) => (
        <Panel key={s.id} title={s.title} description={s.description} bodyClassName="grid gap-4 p-4 md:grid-cols-2">
          {s.fields.map(field)}
        </Panel>
      ))}

      <FormError error={save.error ?? reset.error} />

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/95 px-4 py-3 shadow-[var(--shadow)] backdrop-blur">
        <span className={cn("text-xs", showErrors && errorCount ? "text-danger" : dirty ? "text-warn" : "text-muted")}>
          {showErrors && errorCount ? `${errorCount} field${errorCount === 1 ? "" : "s"} to fix` : dirty ? "Unpublished changes" : "Everything is published"}
        </span>
        <div className="flex flex-wrap gap-2">
          {row.version > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="size-3.5" aria-hidden /> Reset to built-in copy
            </Button>
          )}
          <Button variant="secondary" size="sm" disabled={!dirty || save.isPending} onClick={() => { setDraft(saved); setShowErrors(false); }}>
            Discard
          </Button>
          <Button
            size="sm"
            disabled={!dirty}
            loading={save.isPending}
            onClick={() => {
              setShowErrors(true);
              if (errorCount) toast.error("Fix the highlighted fields first.");
              else save.mutate();
            }}
          >
            <Save className="size-3.5" aria-hidden /> Save & publish
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset the website copy?"
        description="The landing page goes back to the built-in copy. Your saved version stays in the audit log."
        confirmLabel="Reset"
        tone="danger"
        loading={reset.isPending}
        onConfirm={() => reset.mutate()}
      />
    </div>
  );
}

