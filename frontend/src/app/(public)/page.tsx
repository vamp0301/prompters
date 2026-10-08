import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, ChevronRight, Code2, NotebookPen, ShieldCheck } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { VellumUpload } from "@/features/marketing/vellum-upload";
import { loadLanding } from "@/features/marketing/load-landing";

const LOOP_ICONS = [BookOpen, Code2, NotebookPen, ShieldCheck];

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await loadLanding();
  return {
    ...(seo.title ? { title: { absolute: seo.title } } : {}),
    ...(seo.description ? { description: seo.description } : {}),
  };
}

export default async function LandingPage() {
  const c = await loadLanding();
  return (
    <>
      {c.announcement.enabled && c.announcement.text && (
        <div className="border-b border-border bg-accent-soft px-5 py-2.5 text-center text-[13px] text-text">
          {c.announcement.text}
          {c.announcement.linkHref && c.announcement.linkLabel && (
            <Link href={c.announcement.linkHref} className="ml-2 font-bold text-accent underline underline-offset-2">
              {c.announcement.linkLabel}
            </Link>
          )}
        </div>
      )}

      {/* ───────── Hero ───────── */}
      <section aria-labelledby="hero-title" className="px-0 sm:px-[clamp(20px,5vw,70px)]">
        <div className="bg-grid relative mx-auto max-w-[1300px] overflow-hidden border-border sm:border-x">
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 70% at 62% 45%, var(--bg) 0%, color-mix(in srgb, var(--bg) 70%, transparent) 45%, transparent 75%)" }} />
          <div className="relative grid items-center gap-14 px-5 py-14 sm:px-[clamp(20px,7vw,100px)] md:py-[92px] lg:grid-cols-[1.08fr_0.76fr] lg:gap-[70px]">
            <div className="fade-up">
              <p className="eyebrow text-accent">{c.hero.eyebrow}</p>
              <h1 id="hero-title" className="font-display mt-5 text-[3.4rem] leading-[0.95] sm:text-[4.6rem] lg:text-[5.75rem]">
                {c.hero.titleLead}
                <br />
                <span className="font-script -ml-1 text-accent">{c.hero.titleAccent}</span>
                <br />
                <span className="ink-gradient">{c.hero.titleTail}</span>
              </h1>
              <p className="mt-6 max-w-[460px] text-lg leading-relaxed text-muted">{c.hero.lede}</p>
              <div className="mb-9 mt-8 flex flex-wrap items-center gap-6">
                <a href="#upload" className={buttonClass("primary", "lg")}>
                  {c.hero.primaryCta} <ArrowUpRight className="size-4" aria-hidden />
                </a>
                <Link href="/how-it-works" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-accent hover:underline">
                  {c.hero.secondaryCta} <ChevronRight className="size-4" aria-hidden />
                </Link>
              </div>
              <ol className="flex flex-wrap gap-x-5 gap-y-3">
                {c.hero.steps.map((s, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-muted">
                    <span className="grid size-6 place-items-center rounded-full bg-accent-soft font-mono text-[10px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <div className="fade-up w-full max-w-[440px] justify-self-center lg:justify-self-end" style={{ animationDelay: "120ms" }}>
              <VellumUpload content={c.upload} />
            </div>
          </div>
        </div>
      </section>

      {/* ───────── The loop ───────── */}
      <section aria-labelledby="loop-title" className="border-t border-border px-5 py-20 sm:px-[clamp(20px,9vw,140px)] md:py-[100px]" style={{ background: "color-mix(in srgb, var(--accent-soft) 38%, var(--bg))" }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 max-w-[630px]">
            <p className="eyebrow text-accent">{c.loop.eyebrow}</p>
            <h2 id="loop-title" className="font-display mt-4 text-[2.6rem] leading-[1.02] sm:text-[4rem]">
              {c.loop.title}
              <br />
              <span className="font-script text-accent">{c.loop.titleAccent}</span>
            </h2>
          </div>
          <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {c.loop.cards.map((card, i) => {
              const Icon = LOOP_ICONS[i % LOOP_ICONS.length];
              return (
                <li key={i} className="paper-lift rounded-xl sm:min-h-[210px] border border-border bg-surface/80 p-6 shadow-[var(--shadow)]">
                  <span className="font-mono text-[11px] text-accent-2">{String(i + 1).padStart(2, "0")}</span>
                  <Icon className="mt-4 size-[18px] text-accent sm:mt-6" aria-hidden />
                  <h3 className="mt-4 text-[17px] font-medium">{card.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">{card.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ───────── Your Top 100 ───────── */}
      <section aria-labelledby="top100-title" className="border-t border-border px-5 py-20 sm:px-[clamp(20px,9vw,140px)] md:py-[100px]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-16 lg:grid-cols-2 lg:gap-[70px]">
          <div>
            <p className="eyebrow text-accent">{c.top100.eyebrow}</p>
            <h2 id="top100-title" className="font-display mt-4 text-[2.6rem] leading-[1.02] sm:text-[4rem]">
              {c.top100.title}
              <br />
              <span className="font-script text-accent">{c.top100.titleAccent}</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed">{c.top100.body}</p>
            <Link href="/career" className={buttonClass("primary", "md", "mt-6")}>
              {c.top100.cta} <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <figure className="note-blue mx-auto w-full max-w-[450px] rotate-2 p-7 shadow-[0_18px_40px_rgba(41,72,91,0.18)] transition-transform duration-300 hover:rotate-0">
            <figcaption className="eyebrow flex flex-wrap justify-between gap-2 opacity-80">
              <span>{c.top100.sample.meta}</span>
              <span>Sample</span>
            </figcaption>
            <p className="font-display mt-6 text-[1.6rem] leading-tight">{c.top100.sample.question}</p>
            <div className="mt-6 border-t border-current/25 pt-3">
              <p className="eyebrow text-[9px]">Why this is asked</p>
              <p className="mt-1 text-[15px]">{c.top100.sample.why}</p>
              <p className="eyebrow mt-3 text-[9px]">From your resume</p>
              <p className="mt-1 text-[15px] italic">&ldquo;{c.top100.sample.resume}&rdquo;</p>
            </div>
          </figure>
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section aria-labelledby="cta-title" className="border-t border-border px-5 py-24 text-center md:py-[120px]">
        <p className="eyebrow text-accent">{c.finalCta.eyebrow}</p>
        <h2 id="cta-title" className="font-display mx-auto mt-5 max-w-4xl text-[2.4rem] leading-[1.04] text-balance sm:text-[4rem]">
          {c.finalCta.line1}
          <br />
          <span className="font-script text-accent">{c.finalCta.accent}</span>
        </h2>
        <a href="#upload" className={buttonClass("ink", "lg", "mt-9")}>
          {c.finalCta.button} <ArrowUpRight className="size-4" aria-hidden />
        </a>
      </section>
    </>
  );
}
