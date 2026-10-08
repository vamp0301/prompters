import Link from "next/link";
import { ArrowRight, AudioLines, Check, FileDown, ShieldCheck } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/progress";
import { Marquee } from "@/features/marketing/marquee";
import { HandwrittenNote, PaperSection, SampleStamp, SectionHeading, paperCard } from "@/features/marketing/paper";
import { PriorityTag, QuestionPreview } from "@/features/marketing/question-preview";
import { VellumUpload } from "@/features/marketing/vellum-upload";
import { cn } from "@/lib/utils";
import { InkBackground } from "@/features/marketing/ink-background";

const STEPS = [
  { n: "01", title: "Upload your resume", text: "PDF or text. Prompters reads your projects, skills, claims and achievements.", note: "Start here" },
  { n: "02", title: "Get your Top 100", text: "The technical questions you're most likely to face, ranked, each with why it's asked.", note: null },
  { n: "03", title: "Practise explaining", text: "Answer out loud or in writing. Get feedback on what you covered and what you missed.", note: "Out loud!" },
  { n: "04", title: "Know your readiness", text: "Interview with Manisha, then see where you stand and what to study next.", note: "Know your gaps" },
];

const PRIORITIES = [
  { p: "INTENSE", text: "The ones you'll almost certainly face" },
  { p: "IMPORTANT", text: "Likely to come up" },
  { p: "GOOD", text: "Worth preparing" },
  { p: "MAY BE ASKED", text: "Depends on the interviewer" },
] as const;

const SKILLS = ["JavaScript", "React", "Node.js", "Express", "MongoDB", "SQL", "Docker", "REST APIs", "System Design"];
const AREAS = ["Project Deep Dive", "Authentication", "Databases", "APIs", "Debugging", "Architecture", "DSA", "Security", "Behavioural Technical"];

const LEARN = [
  { title: "Roadmap", text: "Nine stages from foundations to job readiness, Python or JavaScript first." },
  { title: "Topics", text: "Every topic in the same format: definition, internals, code, mistakes, trade-offs." },
  { title: "Mastery", text: "80% on a fresh quiz to master a topic, then spaced reviews so it sticks." },
  { title: "Build without AI", text: "AI chat and autocomplete off. Hidden tests grade your code." },
  { title: "Explain code", text: "Answer questions about your own solution before it counts." },
  { title: "Interview practice", text: "Question banks, mock tests and live interviews with Manisha." },
];

/** Real readiness factors and their default weights; the values are an illustrative sample. */
const READINESS = [
  { label: "Technical mastery", weight: 30, sample: 82 },
  { label: "Project confidence", weight: 20, sample: 74 },
  { label: "Interview practice", weight: 15, sample: 61 },
  { label: "DSA", weight: 15, sample: 58 },
  { label: "Recall", weight: 10, sample: 77 },
  { label: "Resume readiness", weight: 10, sample: 88 },
];

const PACKS = [
  { title: "Questions only", text: "All questions, ranked, with priority and skill." },
  { title: "Questions + hints", text: "Each question with a short nudge towards a strong answer." },
  { title: "Full preparation guide", text: "Why it's asked, resume evidence, key points, follow-ups and a 7-day plan." },
];

export default function LandingPage() {
  return (
    <>
      {/* ───────── Hero ───────── */}
      <section id="start" aria-labelledby="hero-title" className="relative scroll-mt-16 overflow-hidden border-b border-border/70">
        <InkBackground />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-28">
          <div className="fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-muted backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              Interview prep built from your own resume
            </p>
            <h1 id="hero-title" className="font-display mt-6 text-[2.9rem] font-semibold leading-[1.02] sm:text-6xl lg:text-[4.3rem]">
              Prepare for <span className="font-script px-1 text-[1.25em] font-normal leading-none text-accent">your</span>
              <br />
              <span className="bg-gradient-to-r from-accent via-info to-accent bg-clip-text text-transparent">interview.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Upload your resume once. Get the 100 technical questions you&apos;re most likely to face — ranked, explained, ready to practise.
            </p>
            <ol className="mt-9 grid max-w-xl gap-3 sm:grid-cols-3">
              {["Upload your resume", "Get your Top 100", "Practise & interview"].map((step, i) => (
                <li key={step} className="fade-up flex items-center gap-3 rounded-xl border border-border bg-surface/70 px-3 py-2.5 text-sm backdrop-blur" style={{ animationDelay: `${150 + i * 90}ms` }}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-8 text-sm text-muted">
              Don&apos;t just learn to code. <span className="text-text">Prove you can build and explain it without AI.</span>
            </p>
          </div>

          <div className="fade-up relative mx-auto w-full max-w-104 lg:mr-0" style={{ animationDelay: "120ms" }}>
            <VellumUpload />
          </div>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <PaperSection id="how">
        <SectionHeading id="how-title" eyebrow="How it works" title={<>From resume<br />to interview confidence.</>} />
        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className={cn(paperCard, "paper-lift relative p-6 pt-7")}>
              <div className="font-display text-4xl font-semibold text-accent/80">{s.n}</div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              {s.note && <HandwrittenNote className="absolute right-4 top-3 rotate-3 text-xl">{s.note}</HandwrittenNote>}
            </li>
          ))}
        </ol>
      </PaperSection>

      {/* ───────── Top 100 ───────── */}
      <PaperSection id="top-100" tinted>
        <div className="grid items-start gap-14 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <SectionHeading id="top-100-title" eyebrow="Personalised question plan" title="YOUR TOP 100" note="The questions that matter.">
              Prompters reads your resume and your target role — or a real job description — and writes the technical questions an interviewer who read{" "}
              <em>your</em> resume would ask. Every question is checked against your resume, de-duplicated and ranked.
            </SectionHeading>
            <ul className="mt-8 space-y-3">
              {PRIORITIES.map(({ p, text }) => (
                <li key={p} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0">
                    <PriorityTag priority={p} />
                  </span>
                  <span className="text-muted">{text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">
              Seven kinds of questions: general, skill, project deep-dive, resume claim, achievement, conceptual and scenario/debugging.
            </p>
            <Link href="/career" className={buttonClass("primary", "lg", "mt-8")}>
              Explore your Top 100 <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="pt-2 lg:pt-10">
            <QuestionPreview />
          </div>
        </div>
      </PaperSection>

      {/* ───────── Marquee ───────── */}
      <section aria-label="Skills and question areas covered" className="space-y-3 border-b border-border/70 py-10">
        <Marquee items={SKILLS} seconds={45} />
        <Marquee items={AREAS} reverse seconds={52} />
      </section>

      {/* ───────── Practice ───────── */}
      <PaperSection id="practice">
        <SectionHeading id="practice-title" eyebrow="Practice mode" title={<>Don&apos;t just read the answer.<br />Explain it.</>}>
          Answer each question the way you would in the room — type it, or say it out loud in English. You get feedback on what you covered and what you
          missed, and only then see the key points.
        </SectionHeading>
        <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className={cn(paperCard, "p-6")}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">Question</span>
              <SampleStamp />
            </div>
            <p className="font-display mt-3 text-xl font-semibold">How does JWT authentication work?</p>
            <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">Your answer</div>
            <p className="mt-2 rounded-lg border border-border bg-bg/50 p-4 text-sm leading-7 text-muted">
              &ldquo;I think first we… after login the server signs a token with a secret and sends it back. The client sends it in the header and the
              server checks the signature before allowing the request.&rdquo;
            </p>
          </div>
          <div className={cn(paperCard, "p-6")}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">Feedback</span>
              <SampleStamp />
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> Good structure: issue, send, verify.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 text-accent-2" aria-hidden>
                  ✎
                </span>
                Explain token validation more clearly — what exactly is checked?
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 text-accent-2" aria-hidden>
                  ✎
                </span>
                Mention where the token is stored and what happens when it expires.
              </li>
            </ul>
            <div className="mt-6 border-t border-border pt-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">Likely follow-up</div>
              <p className="mt-1 text-sm text-muted">&ldquo;Where do you store the refresh token, and why there?&rdquo;</p>
            </div>
            <Link href="/career" className={buttonClass("secondary", "md", "mt-6")}>
              Start practising <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </PaperSection>

      {/* ───────── Learning ───────── */}
      <PaperSection id="learning" tinted>
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading id="learning-title" eyebrow="The learning system" title={<>Learn it.<br />Build it.<br />Explain it.</>} />
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              AI isn&apos;t a shortcut here to hide weak understanding. You build without it, explain your own code, and prove what you know — the same
              things an interviewer will ask you to do.
            </p>
            <HandwrittenNote className="mt-6 inline-block -rotate-2">Build without AI</HandwrittenNote>
          </div>
          <ol className={cn(paperCard, "divide-y divide-border")}>
            {LEARN.map((l, i) => (
              <li key={l.title} className="flex gap-5 px-5 py-4">
                <span className="w-5 shrink-0 font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="font-semibold">{l.title}</div>
                  <p className="mt-0.5 text-sm text-muted">{l.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <Link href="/roadmap" className={buttonClass("secondary", "md", "mt-10")}>
          See the roadmap <ArrowRight className="size-4" aria-hidden />
        </Link>
      </PaperSection>

      {/* ───────── Manisha ───────── */}
      <PaperSection id="interview">
        <div className="grid items-start gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHeading id="interview-title" eyebrow="AI technical interview" title="Meet your interviewer.">
              Manisha reads your resume and the job you&apos;re targeting, asks technical questions, follows up when an answer is thin, and gives you
              coding problems with hidden tests.
            </SectionHeading>
            <p className="mt-5 inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-2.5 py-1 font-mono text-xs">
              <AudioLines className="size-3.5 text-accent" aria-hidden /> Conducted in English
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted">
              <li className="flex gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                Scores what you say — never your accent, appearance, emotions or personality.
              </li>
              <li className="flex gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                Integrity signals like tab switches are noted as indicators, not as proof of anything.
              </li>
            </ul>
            <Link href="/career" className={buttonClass("primary", "lg", "mt-8")}>
              Start interview <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <figure className={cn(paperCard, "overflow-hidden")}>
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-full bg-accent font-display text-sm font-semibold text-accent-fg" aria-hidden>
                  M
                </span>
                <div>
                  <div className="text-sm font-semibold">Manisha</div>
                  <div className="text-[11px] text-subtle">Senior Technical Interviewer</div>
                </div>
              </div>
              <SampleStamp />
            </div>
            <div className="space-y-4 px-5 py-5 text-sm">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">Manisha</div>
                <p className="mt-1">&ldquo;Walk me through the backend architecture of your project.&rdquo;</p>
              </div>
              <div className="border-l-2 border-border-strong pl-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">You · spoken, transcribed</div>
                <p className="mt-1 text-muted">&ldquo;So the API is an Express server, it talks to MongoDB, and… actually, auth sits in a middleware before the routes.&rdquo;</p>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">Manisha</div>
                <p className="mt-1">&ldquo;Okay. Where does that middleware verify the token, and what happens when it&apos;s expired?&rdquo;</p>
              </div>
            </div>
            <figcaption className="grid grid-cols-2 gap-px border-t border-border bg-border text-xs sm:grid-cols-4">
              {["Technical clarity", "Structure", "Depth", "Self-correction"].map((f) => (
                <div key={f} className="bg-surface px-3 py-2.5 text-muted">
                  {f}
                </div>
              ))}
            </figcaption>
          </figure>
        </div>
      </PaperSection>

      {/* ───────── Readiness ───────── */}
      <PaperSection id="readiness" tinted>
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading id="readiness-title" eyebrow="Readiness score" title="Know where you stand." note="One honest number.">
              Your readiness comes from what you&apos;ve actually done — topics mastered, projects built without AI, practice and interviews — not from how
              many videos you watched.
            </SectionHeading>
            <Link href="/readiness" className={buttonClass("secondary", "lg", "mt-8")}>
              View readiness <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className={cn(paperCard, "p-6")}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">Readiness · Backend</div>
                <p className="mt-1 text-xs text-subtle">Weights are the real defaults. Values are illustrative.</p>
              </div>
              <SampleStamp />
            </div>
            <div className="mt-5 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
              <ScoreRing value={74} size={132} label="Sample readiness score" sub="sample" />
              <ul className="space-y-2.5">
                {READINESS.map((r) => (
                  <li key={r.label} className="text-xs">
                    <div className="flex justify-between">
                      <span>{r.label}</span>
                      <span className="font-mono text-subtle">{r.weight}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-surface-2" aria-hidden>
                      <div className="h-full rounded-full bg-accent/80" style={{ width: `${r.sample}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </PaperSection>

      {/* ───────── PDF pack ───────── */}
      <PaperSection id="interview-pack">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative mx-auto h-88 w-full max-w-md" aria-hidden>
            {PACKS.map((p, i) => (
              <div
                key={p.title}
                // Right inset leaves room for the 22px-per-sheet offset so the stack never overflows the page.
                className={cn(paperCard, "absolute left-0 right-12 top-0 h-76 p-6")}
                style={{ transform: `translate(${i * 22}px, ${i * 18}px) rotate(${(i - 1) * 2.5}deg)`, zIndex: i }}
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="font-display text-sm font-semibold">Prompters</span>
                  <span className="font-mono text-[10px] text-subtle">{p.title}</span>
                </div>
                {i === PACKS.length - 1 && (
                  <div className="mt-4 space-y-3 text-[13px]">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-2">INTENSE · Project · JWT</p>
                    <p className="font-semibold">1. How does JWT authentication work in your project?</p>
                    <p className="font-deva text-muted">1. आपके प्रोजेक्ट में JWT authentication कैसे काम करता है?</p>
                    <div className="space-y-1.5 pt-2">
                      <div className="h-1.5 w-11/12 rounded-full bg-surface-2" />
                      <div className="h-1.5 w-4/5 rounded-full bg-surface-2" />
                      <div className="h-1.5 w-2/3 rounded-full bg-surface-2" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div>
            <SectionHeading id="interview-pack-title" eyebrow="Downloadable interview pack" title="Take your Top 100 offline.">
              A clean PDF of your own questions to revise anywhere — in English, Hinglish or Hindi. Technical terms stay in English.
            </SectionHeading>
            <ul className="mt-8 space-y-4">
              {PACKS.map((p) => (
                <li key={p.title} className="flex gap-3">
                  <FileDown className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <div>
                    <div className="text-sm font-semibold">{p.title}</div>
                    <p className="text-sm text-muted">{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex flex-wrap gap-2">
              {["English", "Hinglish", "हिन्दी"].map((l) => (
                <span key={l} className={cn("rounded-sm border border-border bg-surface px-2.5 py-1 text-xs", l === "हिन्दी" && "font-deva")}>
                  {l}
                </span>
              ))}
            </p>
          </div>
        </div>
      </PaperSection>

      {/* ───────── Final CTA ───────── */}
      <section aria-labelledby="final-title" className="relative overflow-hidden">
        <InkBackground />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <h2 id="final-title" className="font-display text-[2.2rem] font-semibold leading-[1.12] sm:text-5xl">
            Your interview won&apos;t ask what you studied.
            <br />
            <span className="text-muted">It will ask what you can </span>
            <span className="font-script text-[1.3em] font-normal text-accent-2">explain.</span>
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/#start" className={buttonClass("primary", "lg")}>
              Prepare for my interview <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/roadmap" className={buttonClass("secondary", "lg")}>
              Explore the roadmap
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
