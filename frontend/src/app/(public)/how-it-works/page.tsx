import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardList, Code2, Eye, Hammer, Lock, MessageSquareQuote, MonitorSmartphone, RefreshCw, Sparkles, Target } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export const metadata = {
  title: "How it works",
  description: "Learn, practise, build without AI, explain, master and interview — the loop behind every Prompters topic, and how scores are earned.",
};

const LOOP = [
  { icon: BookOpen, step: "Learn", text: "A Hinglish-first explanation with a real example and a visual. English and Hindi are available too." },
  { icon: Code2, step: "Practise", text: "Run code right in the browser. Small exercises to check you actually got it." },
  { icon: Hammer, step: "Build (no AI)", text: "AI chat and autocomplete are off. You write the code; hidden tests grade it." },
  { icon: MessageSquareQuote, step: "Explain", text: "Answer questions about your own code. If you can't explain it, it doesn't count yet." },
  { icon: Target, step: "Master", text: "Score 80% or more on a fresh quiz to master the topic." },
  { icon: ClipboardList, step: "Interview", text: "30-second answers, deeper answers, follow-ups and common mistakes for the topic." },
];

const REVIEW_DAYS = [1, 3, 7, 14, 30];

const HINTS = [
  { level: "1", name: "Concept", cost: 8, text: "Points you to the idea you need." },
  { level: "2", name: "Step", cost: 10, text: "Tells you the next step to take." },
  { level: "3", name: "Partial code", cost: 12, text: "Shows part of the code — you finish it." },
];

const READINESS = [
  { label: "Topic mastery", weight: 30 },
  { label: "Projects", weight: 20 },
  { label: "DSA", weight: 15 },
  { label: "Interview", weight: 15 },
  { label: "Recall (spaced review)", weight: 10 },
  { label: "Resume & profile", weight: 10 },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow text-accent">{children}</div>;
}

export default function HowItWorksPage() {
  return (
    <>
      <section className="bg-grid border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <Eyebrow>How it works</Eyebrow>
          <h1 className="font-display mt-3 text-[2.8rem] leading-[1.02] sm:text-[4rem]">
            One loop for every topic.
            <br />
            <span className="text-accent">Scores you actually earn.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Prompters isn&apos;t a video library. Every topic follows the same loop, and every number you see comes from things you actually did.
          </p>
        </div>
      </section>

      <section aria-labelledby="loop-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Eyebrow>The loop</Eyebrow>
        <h2 id="loop-heading" className="font-display mt-3 text-[2.2rem] leading-tight sm:text-[2.75rem]">Learn → Practise → Build → Explain → Master → Interview</h2>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {LOOP.map(({ icon: Icon, step, text }, i) => (
            <li key={step} className="bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-subtle">0{i + 1}</span>
                <Icon className="size-4 text-accent" aria-hidden />
              </div>
              <h3 className="mt-1 font-semibold">{step}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="mastery-heading" className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <Eyebrow>Mastery</Eyebrow>
            <h2 id="mastery-heading" className="font-display mt-3 text-[2.2rem] leading-tight sm:text-[2.75rem]">The 80% rule</h2>
            <p className="mt-3 text-muted">
              A topic is mastered only when you score <span className="font-mono text-text">80%</span> or more on a fresh quiz — new questions,
              not the ones you&apos;ve already seen. Watching the lesson or finishing the practice isn&apos;t enough on its own.
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Lock className="size-4 shrink-0" aria-hidden /> Stages work the same way: pass the stage exam to unlock the next stage.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Spaced review</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Mastered topics come back for a short review so they stick until interview day:
            </p>
            <ol className="mt-5 flex flex-wrap items-center gap-2" aria-label="Review schedule in days after mastery">
              {REVIEW_DAYS.map((d, i) => (
                <li key={d} className="flex items-center gap-2">
                  <span className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm tabular-nums">
                    Day {d}
                  </span>
                  {i < REVIEW_DAYS.length - 1 && <ArrowRight className="size-3.5 text-subtle" aria-hidden />}
                </li>
              ))}
            </ol>
            <div className="mt-5 flex gap-3 rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm">
              <RefreshCw className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
              <p>
                <span className="font-medium text-warn">Fail a review?</span> <span className="text-muted">The topic is marked “needs review” and comes back in
                Practice 10 until it&apos;s solid again.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="independence-heading" className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <Eyebrow>Build without AI</Eyebrow>
          <h2 id="independence-heading" className="font-display mt-3 text-[2.2rem] leading-tight sm:text-[2.75rem]">Independence score</h2>
          <p className="mt-3 text-muted">
            Every build starts at <span className="font-mono text-text">100</span>. Stuck? Take a hint — it&apos;s there to help, and it costs a few
            points so your score reflects how much you did yourself.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {["Visible tests plus hidden tests you can't see", "Explain-your-code check before a build counts", "AI chat and autocomplete switched off in the workspace"].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface">
          <h3 className="border-b border-border px-5 py-3 text-sm font-semibold">Hint levels</h3>
          <ol className="divide-y divide-border">
            {HINTS.map((h) => (
              <li key={h.level} className="flex items-start gap-3 px-5 py-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-2 font-mono text-xs">{h.level}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{h.name}</div>
                  <p className="text-sm text-muted">{h.text}</p>
                </div>
                <span className="shrink-0 font-mono text-sm tabular-nums text-warn">
                  −{h.cost}
                  <span className="sr-only"> points</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="prompts-heading" className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-3xl">
            <Eyebrow>Prompt library</Eyebrow>
            <h2 id="prompts-heading" className="font-display mt-3 text-[2.2rem] leading-tight sm:text-[2.75rem]">Learn first, then prompt.</h2>
            <p className="mt-3 text-muted">
              AI is a professional tool, and you should use it like one. A topic&apos;s tested prompts unlock only after you master that topic — so
              you can judge what the AI gives you, and defend it when someone asks “why?”.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
              <Lock className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
              <div>
                <div className="font-medium">Before mastery</div>
                <p className="text-sm text-muted">Prompts for the topic are locked. You learn and build it yourself.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <div>
                <div className="font-medium">After mastery</div>
                <p className="text-sm text-muted">Tested prompts unlock, to speed up work you already understand.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="readiness-heading" className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <Eyebrow>Readiness Score</Eyebrow>
          <h2 id="readiness-heading" className="font-display mt-3 text-[2.2rem] leading-tight sm:text-[2.75rem]">One honest number</h2>
          <p className="mt-3 text-muted">
            Your Readiness Score is out of <span className="font-mono text-text">100</span> and is computed only from real activity — quizzes you
            passed, projects you built, reviews you kept up with, interviews you practised. Nothing is estimated or padded. If you haven&apos;t done
            something yet, it counts as zero.
          </p>
          <p className="mt-4 text-sm text-subtle">These are the default weights.</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold">What goes into it</h3>
          <ul className="mt-4 space-y-3">
            {READINESS.map((r) => (
              <li key={r.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{r.label}</span>
                  <span className="font-mono tabular-nums text-muted">
                    {r.weight}
                    <span className="sr-only"> percent weight</span>
                    <span aria-hidden>%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(r.weight / 30) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="integrity-heading" className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Eyebrow>Mock tests</Eyebrow>
          <h2 id="integrity-heading" className="font-display mt-3 text-[2.2rem] leading-tight sm:text-[2.75rem]">Integrity, honestly</h2>
          <p className="mt-3 max-w-3xl text-muted">
            Mock tests are timed, company-style assessments. To keep scores meaningful, some events are logged during a test.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <Eye className="size-5 text-accent" aria-hidden />
              <h3 className="mt-3 font-semibold">What we log</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Switching away from the test tab, and copy/paste in the test. These are recorded with the attempt so the score has context.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <MonitorSmartphone className="size-5 text-info" aria-hidden />
              <h3 className="mt-3 font-semibold">What we can&apos;t see</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                A browser can&apos;t see your phone, a second laptop or someone sitting next to you. We won&apos;t pretend otherwise — the test is
                for you, so it&apos;s only as useful as you are honest with it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="cta-heading">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 id="cta-heading" className="font-display text-[2.4rem] leading-tight sm:text-[3.2rem]">Start the loop.</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">Pick Python or JavaScript, take a short placement test, and get your personal roadmap.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={buttonClass("primary", "lg")}>
              Create your free account <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/roadmap" className={buttonClass("secondary", "lg")}>See the roadmap</Link>
          </div>
        </div>
      </section>
    </>
  );
}
