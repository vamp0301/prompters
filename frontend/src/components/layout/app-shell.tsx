"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BookOpen, Briefcase, BriefcaseBusiness, Code2, Gauge, GraduationCap, History, LayoutDashboard, LogOut, Map, Menu, MessagesSquare,
  RefreshCw, Settings, Shield, Sparkles, Timer, User, X, Zap,
} from "lucide-react";
import { Logo } from "./logo";
import { PendingResumeHandoff } from "@/features/marketing/pending-resume-handoff";
import { atLeast, useLogout, useMe } from "@/features/auth/use-me";
import { cn } from "@/lib/utils";

const NAV: { group: string; items: { href: string; label: string; icon: typeof BookOpen }[] }[] = [
  {
    group: "Learn",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/learn", label: "Roadmap", icon: Map },
      { href: "/practice", label: "Practice 10", icon: Zap },
      { href: "/reviews", label: "Reviews", icon: RefreshCw },
    ],
  },
  {
    group: "Build",
    items: [
      { href: "/build", label: "Build tasks", icon: Code2 },
      { href: "/projects", label: "Project ladder", icon: GraduationCap },
      { href: "/prompts", label: "Prompt library", icon: Sparkles },
    ],
  },
  {
    group: "Get hired",
    items: [
      { href: "/career", label: "Career AI", icon: BriefcaseBusiness },
      { href: "/interviews", label: "Interview prep", icon: MessagesSquare },
      { href: "/mock-tests", label: "Mock tests", icon: Timer },
      { href: "/readiness", label: "Readiness", icon: Gauge },
      { href: "/journey", label: "My journey", icon: History },
      { href: "/applications", label: "Applications", icon: Briefcase },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: me } = useMe();
  return (
    <nav aria-label="Main" className="space-y-5">
      {NAV.map((g) => (
        <div key={g.group}>
          <div className="mb-1.5 px-2 font-mono text-[10px] uppercase tracking-wider text-subtle">{g.group}</div>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn("flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors", active ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2 hover:text-text")}
                  >
                    <Icon className={cn("size-4", active && "text-accent")} aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {atLeast(me?.role, "AUTHOR") && (
        <div>
          <div className="mb-1.5 px-2 font-mono text-[10px] uppercase tracking-wider text-subtle">Team</div>
          <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-text">
            <Shield className="size-4" aria-hidden /> Admin
          </Link>
        </div>
      )}
    </nav>
  );
}

function UserMenu() {
  const { data: me } = useMe();
  const logout = useLogout();
  return (
    <div className="border-t border-border pt-3">
      <div className="flex items-center gap-2 px-2">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold uppercase">{me?.name?.slice(0, 2) ?? "··"}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{me?.name ?? " "}</div>
          <div className="truncate text-xs text-subtle">{me?.email ?? " "}</div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1">
        <Link href="/profile" aria-label="Profile" className="grid place-items-center rounded-md py-1.5 text-muted hover:bg-surface-2 hover:text-text"><User className="size-4" /></Link>
        <Link href="/settings" aria-label="Settings" className="grid place-items-center rounded-md py-1.5 text-muted hover:bg-surface-2 hover:text-text"><Settings className="size-4" /></Link>
        <button onClick={logout} aria-label="Log out" className="grid place-items-center rounded-md py-1.5 text-muted hover:bg-surface-2 hover:text-text"><LogOut className="size-4" /></button>
      </div>
    </div>
  );
}

export function AppShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <PendingResumeHandoff />
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface/60 px-3 py-4 lg:flex">
        <Logo href="/dashboard" className="mb-6 px-2" />
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <UserMenu />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur lg:hidden">
          <Logo href="/dashboard" />
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-2 text-muted hover:bg-surface-2">
            <Menu className="size-5" />
          </button>
        </header>
        {open && (
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)}>
            <div className="flex h-full w-72 flex-col bg-surface px-3 py-4" onClick={(e) => e.stopPropagation()}>
              <div className="mb-6 flex items-center justify-between px-2">
                <Logo href="/dashboard" />
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-md p-1 text-muted"><X className="size-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto"><NavLinks onNavigate={() => setOpen(false)} /></div>
              <UserMenu />
            </div>
          </div>
        )}
        <main id="main" className={cn("mx-auto w-full flex-1 px-4 py-6 sm:px-6 lg:py-8", wide ? "max-w-[1600px]" : "max-w-6xl")}>
          {children}
        </main>
      </div>
    </div>
  );
}


