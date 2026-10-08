import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export const metadata = {
  title: "Pricing",
  description: "Prompters is free during beta. The pricing model isn't decided yet — here's everything included today.",
};

const INCLUDED = [
  { title: "Full roadmap", text: "Every published stage, module and topic — Python or JavaScript start." },
  { title: "Build-without-AI workspace", text: "Hidden tests, hint levels, explain-your-code checks." },
  { title: "Project ladder", text: "Projects that grow from small builds to a capstone." },
  { title: "Prompt library", text: "Tested prompts that unlock after you master each topic." },
  { title: "Interview prep", text: "Short answers, deep answers, follow-ups and common mistakes." },
  { title: "Mock tests", text: "Timed, company-style assessments." },
  { title: "Readiness Score", text: "One number computed only from your real activity." },
  { title: "Journey", text: "A record of what you've learned, built and mastered." },
  { title: "Application tracker", text: "Keep track of companies, roles, rounds and results." },
];

const FAQ = [
  {
    q: "Will it stay free?",
    a: "We haven't decided the pricing model yet. We'll tell you well before anything changes, and your progress stays yours.",
  },
  {
    q: "Do I need a card to sign up?",
    a: "No. There's nothing to pay during the beta, so we don't ask for payment details.",
  },
  {
    q: "Can I export or delete my data?",
    a: "Yes. You can export your data or delete your account any time from Settings, in line with India's Digital Personal Data Protection (DPDP) Act, 2023.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="bg-grid border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="eyebrow text-accent">Pricing</div>
          <h1 className="font-display mt-3 text-[2.8rem] leading-[1.02] sm:text-[4rem]">Free during beta.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            We haven&apos;t decided on a pricing model yet, so we&apos;re not going to show you made-up plans. While Prompters is in beta, everything
            below is free.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className={buttonClass("primary", "lg")}>
              Create your free account <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/how-it-works" className={buttonClass("secondary", "lg")}>How it works</Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="included-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="eyebrow text-accent">Beta</div>
        <h2 id="included-heading" className="font-display mt-3 text-[2.2rem] leading-tight sm:text-[2.75rem]">What&apos;s included</h2>
        <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {INCLUDED.map((f) => (
            <li key={f.title} className="flex gap-3 bg-surface p-5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <div>
                <h3 className="font-medium">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-subtle">Some roadmap topics are still being written — the roadmap page shows which ones are live.</p>
      </section>

      <section aria-labelledby="faq-heading" className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <div className="eyebrow text-accent">FAQ</div>
          <h2 id="faq-heading" className="font-display mt-3 text-[2.2rem] leading-tight sm:text-[2.75rem]">Questions</h2>
          <dl className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface">
            {FAQ.map((f) => (
              <div key={f.q} className="p-5">
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="cta-heading">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 id="cta-heading" className="font-display text-[2.4rem] leading-tight sm:text-[3.2rem]">Start building.</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">Pick Python or JavaScript and get your personal roadmap in five minutes.</p>
          <Link href="/register" className={buttonClass("primary", "lg", "mt-8")}>
            Create your free account <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
