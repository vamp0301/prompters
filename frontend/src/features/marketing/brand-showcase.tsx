"use client";
import { useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { BrandMark, Wordmark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DOWNLOADS = [
  { file: "prompters-mark-black.svg", label: "Mark · black" },
  { file: "prompters-mark-white.svg", label: "Mark · white" },
  { file: "prompters-mark-accent.svg", label: "Mark · accent" },
  { file: "prompters-mark-accent-dark.svg", label: "Mark · accent on dark" },
  { file: "prompters-app-icon.svg", label: "App icon · dark" },
  { file: "prompters-app-icon-white.svg", label: "App icon · light" },
];

/** Fixed brand colours (not theme tokens): a logo sheet shows both backgrounds side by side. */
const LIGHT = "bg-[#fbf9f5] text-[#292521]";
const DARK = "bg-[#191817] text-[#fbf9f5]";

function Tile({ label, dark, children, className }: { label: string; dark?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <figure className={cn("flex min-h-48 flex-col items-center justify-center gap-4 rounded-xl border border-border p-6", dark ? DARK : LIGHT, className)}>
      {children}
      <figcaption className={cn("font-mono text-[11px] uppercase tracking-wider", dark ? "text-[#c9c2b6]" : "text-[#6b645b]")}>{label}</figcaption>
    </figure>
  );
}

export function BrandShowcase() {
  const [run, setRun] = useState(0);
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:px-6">
      <header className="max-w-3xl">
        <p className="eyebrow text-accent">Brand</p>
        <h1 className="font-display mt-3 text-[2.6rem] leading-[1.05] sm:text-[3.4rem]">One letter. A prompt, waiting.</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          The Prompters mark is a geometric <strong className="text-text">P</strong> split in two: the bowl is a speech bubble — the prompt — and the detached leg is a text cursor. Read quickly, it is a bold P. Read slowly, it is a question waiting for your answer.
        </p>
      </header>

      <section aria-labelledby="motion-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="motion-heading" className="font-display text-2xl">Motion</h2>
            <p className="mt-1 text-sm text-muted">1.8 s: the bubble settles, a point enters through the opening, becomes the cursor, and the cursor blinks once. Input → intelligence → learning → progress. Static and complete at rest; no motion for reduced-motion users.</p>
          </div>
          <Button variant="secondary" onClick={() => setRun((r) => r + 1)}>
            <RotateCcw className="size-4" aria-hidden /> Replay
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Tile label="Light">
            <BrandMark key={`l${run}`} size={160} animate="once" title="Prompters mark, animated" />
          </Tile>
          <Tile label="Dark" dark>
            <BrandMark key={`d${run}`} size={160} animate="once" accent />
          </Tile>
        </div>
      </section>

      <section aria-labelledby="mark-heading" className="space-y-4">
        <h2 id="mark-heading" className="font-display text-2xl">Symbol</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Black"><BrandMark size={96} /></Tile>
          <Tile label="White" dark><BrandMark size={96} /></Tile>
          <Tile label="Accent"><span className="[--accent:#4e7352]"><BrandMark size={96} accent /></span></Tile>
          <Tile label="Accent · dark" dark><span className="[--accent:#9bc29a]"><BrandMark size={96} accent /></span></Tile>
        </div>
      </section>

      <section aria-labelledby="lockup-heading" className="space-y-4">
        <h2 id="lockup-heading" className="font-display text-2xl">Wordmark and lockups</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          <Tile label="Horizontal">
            <span className="inline-flex items-center gap-3"><BrandMark size={56} /><Wordmark className="text-[44px]" /></span>
          </Tile>
          <Tile label="Horizontal · dark" dark>
            <span className="inline-flex items-center gap-3"><BrandMark size={56} /><Wordmark className="text-[44px]" /></span>
          </Tile>
          <Tile label="Stacked">
            <span className="flex flex-col items-center gap-3"><BrandMark size={72} /><Wordmark className="text-[32px]" /></span>
          </Tile>
          <Tile label="Wordmark only">
            <Wordmark className="text-[48px]" />
          </Tile>
        </div>
      </section>

      <section aria-labelledby="icon-heading" className="space-y-4">
        <h2 id="icon-heading" className="font-display text-2xl">App icon and favicon</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Tile label="App icon">
            <span className="flex items-end gap-4">
              {[120, 64, 40].map((s) => (
                <span key={s} className={cn("grid place-items-center rounded-[22%]", DARK)} style={{ width: s, height: s }}>
                  <BrandMark size={s * 0.6} />
                </span>
              ))}
            </span>
          </Tile>
          <Tile label="Favicon · 32 / 16 px">
            <span className="flex items-end gap-4">
              {[32, 16].map((s) => (
                // eslint-disable-next-line @next/next/no-img-element -- the real favicon file, at real size
                <img key={s} src="/icon.svg" width={s} height={s} alt={`Favicon at ${s} px`} />
              ))}
            </span>
          </Tile>
        </div>
      </section>

      <section aria-labelledby="download-heading" className="space-y-4">
        <h2 id="download-heading" className="font-display text-2xl">Download</h2>
        <ul className="flex flex-wrap gap-2">
          {DOWNLOADS.map((d) => (
            <li key={d.file}>
              <a href={`/brand/${d.file}`} download className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:border-accent">
                <Download className="size-3.5" aria-hidden /> {d.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">Use the mark on plain backgrounds; keep clear space of at least the cursor&apos;s width around it. Don&apos;t rotate it, outline it, add effects, or close the gap.</p>
      </section>
    </div>
  );
}
