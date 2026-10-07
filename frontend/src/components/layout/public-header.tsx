"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { buttonClass } from "@/components/ui/button";
import { InkAnnotation } from "@/components/ui/paper";

/** Section anchors live on the landing page; from other public pages they link back to it. */
const NAV = [
  { href: "/roadmap", label: "Learn" },
  { href: "/syllabus", label: "Syllabus" },
  { href: "/#top-100", label: "Career" },
  { href: "/#practice", label: "Practice" },
  { href: "/#interview", label: "Interview" },
  { href: "/#readiness", label: "Progress" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/75 backdrop-blur-md supports-[backdrop-filter]:bg-bg/65">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <span className="flex items-baseline gap-3">
          <Logo />
          <InkAnnotation className="hidden text-lg xl:inline">build. explain. prove.</InkAnnotation>
        </span>
        <nav aria-label="Site" className="hidden items-center gap-7 text-sm text-muted md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={pathname === n.href ? "page" : undefined} className="transition-colors hover:text-text aria-[current=page]:text-text">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/login" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
            Sign in
          </Link>
          <Link href="/register" className={buttonClass("primary", "sm", "hidden sm:inline-flex")}>
            Get started
          </Link>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-text md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Site" className="border-t border-border bg-bg px-4 pb-5 pt-2 md:hidden">
          <ul className="divide-y divide-border">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="block py-3 font-display text-lg">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/login" onClick={() => setOpen(false)} className={buttonClass("secondary", "md")}>
              Sign in
            </Link>
            <Link href="/register" onClick={() => setOpen(false)} className={buttonClass("primary", "md")}>
              Get started
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

const FOOTER: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/roadmap", label: "Learn" },
      { href: "/syllabus", label: "Language syllabus" },
      { href: "/#practice", label: "Practice" },
      { href: "/#interview", label: "Interview" },
      { href: "/#readiness", label: "Readiness" },
    ],
  },
  {
    title: "Prepare",
    links: [
      { href: "/#top-100", label: "Your Top 100" },
      { href: "/#interview-pack", label: "Interview pack" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  { title: "Company", links: [{ href: "/about", label: "About" }] },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted">
            Prepare for <span className="font-script text-2xl leading-none text-accent-2">your</span> interview — learn it, build it without AI, and explain it.
          </p>
        </div>
        {FOOTER.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-subtle">{col.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted transition-colors hover:text-text">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-subtle sm:px-6">© {new Date().getFullYear()} Prompters. Preparation assessments only — not hiring decisions.</p>
      </div>
    </footer>
  );
}
