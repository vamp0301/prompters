"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Activity, ArrowLeft, BookText, ClipboardCheck, FileQuestion, Flag, FolderKanban, Gauge, Hammer, HeartPulse, Languages,
  Globe, LayoutDashboard, Map, Menu, MessagesSquare, PlaySquare, ScrollText, ShieldAlert, Sparkles, Users, X,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { atLeast, useMe } from "@/features/auth/use-me";
import type { Role } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./global-search";

type Item = { href: string; label: string; icon: typeof Map; min: Role };
const NAV: { group: string; items: Item[] }[] = [
  {
    group: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, min: "ADMIN" },
      { href: "/admin/content-health", label: "Content health", icon: HeartPulse, min: "AUTHOR" },
    ],
  },
  {
    group: "Curriculum",
    items: [
      { href: "/admin/roadmap", label: "Roadmap", icon: Map, min: "AUTHOR" },
      { href: "/admin/topics", label: "Topics", icon: BookText, min: "AUTHOR" },
      { href: "/admin/questions", label: "Questions", icon: FileQuestion, min: "AUTHOR" },
      { href: "/admin/build-tasks", label: "Build tasks", icon: Hammer, min: "AUTHOR" },
      { href: "/admin/projects", label: "Projects", icon: FolderKanban, min: "AUTHOR" },
      { href: "/admin/visualizations", label: "Visualizations", icon: PlaySquare, min: "AUTHOR" },
      { href: "/admin/translations", label: "Translations", icon: Languages, min: "AUTHOR" },
      { href: "/admin/prompts", label: "Prompts", icon: Sparkles, min: "AUTHOR" },
      { href: "/admin/interviews", label: "Interviews", icon: MessagesSquare, min: "AUTHOR" },
      { href: "/admin/assessments", label: "Assessments", icon: ClipboardCheck, min: "AUTHOR" },
    ],
  },
  {
    group: "People",
    items: [
      { href: "/admin/integrity", label: "Integrity", icon: ShieldAlert, min: "ADMIN" },
      { href: "/admin/users", label: "Users", icon: Users, min: "ADMIN" },
    ],
  },
  {
    group: "Platform",
    items: [
      { href: "/admin/website", label: "Website", icon: Globe, min: "SUPER_ADMIN" },
      { href: "/admin/feature-flags", label: "Feature flags", icon: Flag, min: "ADMIN" },
      { href: "/admin/scoring", label: "Scoring", icon: Gauge, min: "ADMIN" },
      { href: "/admin/audit-logs", label: "Audit logs", icon: ScrollText, min: "SUPER_ADMIN" },
    ],
  },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: me } = useMe();
  return (
    <nav aria-label="Admin" className="space-y-5">
      {NAV.map((g) => {
        const items = g.items.filter((i) => atLeast(me?.role, i.min));
        if (!items.length) return null;
        return (
          <div key={g.group}>
            <div className="mb-1.5 px-2 font-mono text-[10px] uppercase tracking-wider text-subtle">{g.group}</div>
            <ul className="space-y-0.5">
              {items.map(({ href, label, icon: Icon }) => {
                const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                        active ? "bg-surface-2 text-text before:absolute before:-left-3 before:top-1.5 before:h-4 before:w-0.5 before:rounded-full before:bg-accent" : "text-muted hover:bg-surface-2 hover:text-text",
                      )}
                    >
                      <Icon className={cn("size-4", active && "text-accent")} aria-hidden />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="mb-6 flex items-center gap-2 px-2">
      <Logo href="/admin" />
      <span className="rounded border border-accent/30 bg-accent-soft px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-accent">admin</span>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: me } = useMe();
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-surface/60 px-3 py-4 lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto pl-1"><Nav /></div>
        <div className="mt-3 border-t border-border pt-3 text-xs text-subtle">
          <div className="truncate px-2 text-text">{me?.name}</div>
          <div className="truncate px-2">{me?.email}</div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)}>
          <div className="flex h-full w-72 max-w-[85vw] flex-col bg-surface px-3 py-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between"><Brand /><button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-md p-1 text-muted"><X className="size-5" /></button></div>
            <div className="flex-1 overflow-y-auto pl-1"><Nav onNavigate={() => setOpen(false)} /></div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-bg/85 px-3 backdrop-blur sm:px-5">
          <button onClick={() => setOpen(true)} aria-label="Open admin menu" className="rounded-md p-2 text-muted hover:bg-surface-2 lg:hidden"><Menu className="size-5" /></button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-3">
            {me && <Badge tone={me.role === "SUPER_ADMIN" ? "warn" : me.role === "ADMIN" ? "info" : "neutral"} className="hidden font-mono sm:inline-flex"><Activity className="size-3" />{me.role.replace("_", " ")}</Badge>}
            <Link href="/dashboard" className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted hover:text-text"><ArrowLeft className="size-3.5" /> <span className="hidden sm:inline">Back to app</span><span className="sm:hidden">App</span></Link>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
