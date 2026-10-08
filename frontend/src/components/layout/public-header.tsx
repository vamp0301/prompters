"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { buttonClass } from "@/components/ui/button";

const NAV = [
  { href: "/roadmap", label: "Learn" },
  { href: "/syllabus", label: "Syllabus" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
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
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-lg">
      <div className="flex h-[72px] items-center justify-between gap-4 px-5 sm:px-[clamp(20px,5vw,76px)]">
        <Logo />
        <div className="hidden items-center md:flex">
          <nav aria-label="Site" className="flex items-center gap-6 text-[13px] text-muted">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={pathname === n.href ? "page" : undefined} className="transition-colors hover:text-text aria-[current=page]:text-text">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-9 flex items-center gap-2">
            <Link href="/login" className={buttonClass("outline", "md")}>
              Sign in
            </Link>
            <Link href="/register" className={buttonClass("primary", "md")}>
              Get started <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="grid size-9 place-items-center rounded-[9px] border border-border bg-surface md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Site" className="border-t border-border bg-bg px-5 pb-5 pt-2 md:hidden">
          <ul className="divide-y divide-border">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="block py-3 font-display text-xl">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/login" onClick={() => setOpen(false)} className={buttonClass("outline", "md")}>
              Sign in
            </Link>
            <Link href="/register" onClick={() => setOpen(false)} className={buttonClass("primary", "md")}>
              Get started <ArrowUpRight className="size-3.5" aria-hidden />
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
      { href: "/roadmap", label: "Roadmap" },
      { href: "/syllabus", label: "Language syllabus" },
      { href: "/how-it-works", label: "How it works" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
];

export function PublicFooter({ tagline = "Prepare for your interview — learn it, build it, explain it." }: { tagline?: string }) {
  return (
    <footer className="border-t border-border">
      <div className="grid gap-8 px-5 py-14 sm:px-[clamp(20px,7vw,100px)] md:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-[16rem] text-[13px] leading-relaxed text-muted">{tagline}</p>
        </div>
        {FOOTER.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="eyebrow text-accent">{col.title}</h2>
            <ul className="mt-4 space-y-3 text-[13px]">
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
      <div className="mx-5 border-t border-border sm:mx-[clamp(20px,7vw,100px)]">
        <p className="py-6 text-[11px] text-subtle">© {new Date().getFullYear()} Prompters. Preparation assessments only — not hiring decisions.</p>
      </div>
    </footer>
  );
}
