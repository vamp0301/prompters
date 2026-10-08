"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BookOpen, Briefcase, BriefcaseBusiness, ChevronRight, Code2, Compass, FileText, History, Languages, LayoutDashboard, LogOut, Menu,
  MessagesSquare, MoreHorizontal, NotebookPen, Search, Settings, Shield, Sparkles, Target, Timer, Trophy, User, X, Zap,
} from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette, type PaletteItem } from "./command-palette";
import { PendingResumeHandoff } from "@/features/marketing/pending-resume-handoff";
import { atLeast, useLogout, useMe } from "@/features/auth/use-me";
import { cn } from "@/lib/utils";

const NAV: { group: string; items: { href: string; label: string; icon: typeof BookOpen }[] }[] = [
  {
    group: "Learn",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/learn", label: "Roadmap", icon: Compass },
      { href: "/learn/syllabus", label: "Language syllabus", icon: Languages },
      { href: "/practice", label: "Practice 10", icon: Zap },
      { href: "/reviews", label: "Reviews", icon: Timer },
    ],
  },
  {
    group: "Build",
    items: [
      { href: "/build", label: "Build tasks", icon: Code2 },
      { href: "/projects", label: "Project ladder", icon: Trophy },
      { href: "/prompts", label: "Prompt library", icon: Sparkles },
    ],
  },
  {
    group: "Get hired",
    items: [
      { href: "/career", label: "Career AI", icon: BriefcaseBusiness },
      { href: "/career/skills", label: "Learn my skills", icon: NotebookPen },
      { href: "/interviews", label: "Interview prep", icon: MessagesSquare },
      { href: "/mock-tests", label: "Mock tests", icon: Timer },
      { href: "/readiness", label: "Readiness", icon: Target },
      { href: "/journey", label: "My journey", icon: History },
      { href: "/applications", label: "Applications", icon: Briefcase },
    ],
  },
];

const EXTRA: PaletteItem[] = [
  { href: "/profile", label: "Profile & resume", group: "Account" },
  { href: "/settings", label: "Settings", group: "Account" },
];

const isActive = (pathname: string, href: string) =>
  (pathname === href || pathname.startsWith(`${href}/`)) &&
  !(href === "/career" && pathname.startsWith("/career/skills")) &&
  !(href === "/learn" && pathname.startsWith("/learn/syllabus"));

/** The page name shown in the breadcrumb: the most specific nav entry that matches the URL. */
function pageLabel(pathname: string) {
  const all = [...NAV.flatMap((g) => g.items), ...EXTRA.map((x) => ({ ...x, icon: FileText }))];
  const hit = all.filter((x) => pathname === x.href || pathname.startsWith(`${x.href}/`)).sort((a, b) => b.href.length - a.href.length)[0];
  return hit?.label ?? "Workspace";
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: me } = useMe();
  const link = (active: boolean) =>
    cn(
      "relative flex items-center gap-[11px] rounded-[7px] px-2.5 py-[9px] text-[13px] transition-[background-color,color,transform] duration-200",
      active ? "bg-accent-soft font-semibold text-accent before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-accent" : "text-muted hover:translate-x-0.5 hover:bg-accent-soft hover:text-text",
    );
  return (
    <nav aria-label="Main">
      {NAV.map((g) => (
        <div key={g.group} className="mb-6">
          <div className="eyebrow mx-2.5 mb-2.5 text-[9px] text-muted">{g.group}</div>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={link(active)}>
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {atLeast(me?.role, "AUTHOR") && (
        <div className="mb-6">
          <div className="eyebrow mx-2.5 mb-2.5 text-[9px] text-muted">Team</div>
          <Link href="/admin" onClick={onNavigate} className={link(false)}>
            <Shield className="size-4" aria-hidden /> Admin
          </Link>
        </div>
      )}
    </nav>
  );
}

function UserBlock() {
  const { data: me } = useMe();
  return (
    <div className="mt-auto flex items-center gap-2.5 border-t border-border px-2 pt-4">
      <div className="grid size-[31px] shrink-0 place-items-center rounded-full bg-accent-2 font-mono text-[10px] font-medium uppercase text-white">{me?.name?.slice(0, 2) ?? "··"}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-bold">{me?.name ?? " "}</div>
        <div className="truncate text-[10px] text-muted">{me?.email ?? " "}</div>
      </div>
      <Link href="/settings" aria-label="Settings" className="grid size-8 place-items-center rounded-lg border border-border bg-surface text-text transition-[transform,border-color] hover:-translate-y-0.5 hover:border-accent">
        <Settings className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}

function Sidebar({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between px-2 pb-7">
        <Logo href="/dashboard" />
        {onClose ? (
          <button onClick={onClose} aria-label="Close menu" className="grid size-9 place-items-center rounded-[9px] border border-border bg-surface">
            <X className="size-4" aria-hidden />
          </button>
        ) : (
          <ThemeToggle />
        )}
      </div>
      <div className="-mx-1 flex-1 overflow-y-auto px-1">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <UserBlock />
    </>
  );
}

function MoreMenu() {
  const { data: me } = useMe();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const item = "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] text-muted hover:bg-accent-soft hover:text-text";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="grid size-9 place-items-center rounded-[9px] border border-border bg-surface transition-[transform,border-color] hover:-translate-y-0.5 hover:border-accent"
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-border bg-surface p-1.5 shadow-[var(--shadow)]">
          <Link role="menuitem" href="/profile" onClick={() => setOpen(false)} className={item}>
            <User className="size-4" aria-hidden /> Profile & resume
          </Link>
          <Link role="menuitem" href="/settings" onClick={() => setOpen(false)} className={item}>
            <Settings className="size-4" aria-hidden /> Settings
          </Link>
          {atLeast(me?.role, "AUTHOR") && (
            <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className={item}>
              <Shield className="size-4" aria-hidden /> Admin
            </Link>
          )}
          <div className="my-1 h-px bg-border" />
          <button role="menuitem" type="button" onClick={logout} className={item}>
            <LogOut className="size-4" aria-hidden /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const items: PaletteItem[] = [...NAV.flatMap((g) => g.items.map((i) => ({ href: i.href, label: i.label, group: g.group }))), ...EXTRA];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen">
      <PendingResumeHandoff />
      <aside className="sticky top-0 z-30 hidden h-screen w-[246px] shrink-0 flex-col border-r border-border bg-bg/85 px-[15px] pb-[15px] pt-[23px] backdrop-blur-lg lg:flex">
        <Sidebar />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="flex h-full w-[280px] flex-col border-r border-border bg-bg px-[15px] pb-[15px] pt-[23px]" onClick={(e) => e.stopPropagation()}>
            <Sidebar onNavigate={() => setOpen(false)} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[65px] items-center justify-between gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur-lg sm:px-[clamp(18px,3vw,45px)]">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setOpen(true)} aria-label="Open menu" className="grid size-9 shrink-0 place-items-center rounded-[9px] border border-border bg-surface lg:hidden">
              <Menu className="size-4" aria-hidden />
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[11px] text-muted">
              <span className="eyebrow hidden text-[10px] text-accent sm:inline">My workspace</span>
              <ChevronRight className="hidden size-3.5 shrink-0 sm:inline" aria-hidden />
              <span className="truncate font-semibold text-text">{pageLabel(pathname)}</span>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setPalette(true)}
              aria-label="Search pages"
              className="flex h-9 items-center gap-2 rounded-[9px] border border-border bg-surface px-2.5 text-[11px] text-muted transition-colors hover:border-accent"
            >
              <Search className="size-4" aria-hidden />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded border border-border px-1 font-mono text-[9px] sm:inline">⌘K</kbd>
            </button>
            <span className="lg:hidden">
              <ThemeToggle />
            </span>
            <MoreMenu />
          </div>
        </header>
        <main id="main" className={cn("mx-auto w-full flex-1 px-4 pb-24 pt-10 sm:px-[clamp(18px,4vw,55px)] lg:pt-[55px]", wide ? "max-w-[1600px]" : "max-w-[1230px]")}>
          {children}
        </main>
      </div>
      <CommandPalette items={items} open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
