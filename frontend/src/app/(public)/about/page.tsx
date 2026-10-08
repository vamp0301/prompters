import Link from "next/link";
import { ArrowRight, Bot, Brain, Languages, Map, Scale, Sparkles, Shuffle } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export const metadata = {
  title: "About",
  description: "Why Prompters exists: one guided path from zero to job-ready for Indian engineering students, with an honest Readiness Score.",
};

const PROBLEMS = [
  { icon: Brain, title: "Syntax isn't building", text: "Students know the syntax but freeze when asked to build something real — or explain the code they wrote." },
  { icon: Shuffle, title: "Learning is scattered", text: "YouTube, blogs, docs, random courses. No order, no feedback, no way to know what you actually know." },
  { icon: Bot, title: "AI code you can't defend", text: "AI writes it, it works, and then an interviewer asks “why?”. There's no answer, because you didn't write it." },
];

const PATH = ["Learn", "Build without AI", "Explain", "Master", "Interview"];

const VALUES = [
  { icon: Scale, title: "Honesty over hype", text: "No fake stats, no padded scores. The Readiness Score only counts what you actually did." },
  { icon: Brain, title: "Understanding over memorising", text: "You master a topic when you can build it and explain it — not when you've watched the video." },
  { icon: Sparkles, title: "AI after mastery", text: "AI is a professional tool. You unlock prompts once you understand the topic well enough to judge the output." },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-grid border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="eyebrow text-accent">About</div>
          <h1 className="font-display mt-3 max-w-3xl text-[2.8rem] leading-[1.02] sm:text-[4rem]">
            Helping students become developers — <span className="text-accent">not just learn to code.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Prompters is one guided path from zero to job-ready, built for Indian engineering students.
          </p>
        </div>
      </section>

      <section aria-labelledby="problem-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="eyebrow text-accent">The problem</div>
        <h2 id="problem-heading" className="font-display mt-3 text-[2.2rem] leading-tight sm:text-[2.75rem]">Why we&apos;re building this</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PROBLEMS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border bg-surface p-5">
              <Icon className="size-5 text-accent" aria-hidden />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="fix-heading" className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="eyebrow text-accent">The fix</div>
            <h2 id="fix-heading" className="font-display mt-3 text-[2.2rem] leading-tight sm:text-[2.75rem]">One path, from zero to job-ready</h2>
            <p className="mt-3 text-muted">
              Every topic follows the same loop, and at the end you get an honest Readiness Score that tells you how interview-ready you really are
              — computed only from real activity.
            </p>
            <ol className="mt-6 flex flex-wrap items-center gap-2" aria-label="The Prompters path">
              {PATH.map((p, i) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">
                    <span className="mr-1.5 font-mono text-xs text-subtle">0{i + 1}</span>
                    {p}
                  </span>
                  {i < PATH.length - 1 && <ArrowRight className="size-3.5 text-subtle" aria-hidden />}
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-border bg-surface p-5">
              <Languages className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              <div>
                <h3 className="font-semibold">Hinglish-first</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Explanations are written the way you&apos;d explain it to a friend — in Hinglish first, with English and Hindi available too.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-border bg-surface p-5">
              <Map className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              <div>
                <h3 className="font-semibold">Built for Indian engineering students</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Start with Python or JavaScript, skip what you already know, and work toward the roles and interviews you&apos;re actually
                  preparing for.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="values-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="eyebrow text-accent">Values</div>
        <h2 id="values-heading" className="font-display mt-3 text-[2.2rem] leading-tight sm:text-[2.75rem]">What we won&apos;t compromise on</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-surface p-5">
              <Icon className="size-5 text-accent" aria-hidden />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="cta-heading" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 id="cta-heading" className="font-display text-[2.4rem] leading-tight sm:text-[3.2rem]">Learn. Build. Prove. Get hired.</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">Free during beta. Pick Python or JavaScript and get your personal roadmap.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={buttonClass("primary", "lg")}>
              Start learning <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/roadmap" className={buttonClass("secondary", "lg")}>Explore roadmap</Link>
          </div>
        </div>
      </section>
    </>
  );
}
