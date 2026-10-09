"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Rocket, Sprout } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import type { Attempt, CareerRoleSummary, ExperienceLevel } from "@/lib/api/types";
import { LEVELS, RolePicker } from "@/features/roles/role-picker";
import { cn } from "@/lib/utils";

const CODING_LEVELS = [
  { value: "ZERO", label: "Never coded", hint: "Start from how computers work" },
  { value: "BEGINNER", label: "Beginner", hint: "Know a little syntax" },
  { value: "INTERMEDIATE", label: "Intermediate", hint: "Built small things" },
  { value: "ADVANCED", label: "Advanced", hint: "Preparing for placements" },
];

function Choice({ selected, onClick, title, hint }: { selected: boolean; onClick: () => void; title: string; hint?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cn("rounded-xl border p-4 text-left transition-colors", selected ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-border-strong")}>
      <div className="font-medium">{title}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<CareerRoleSummary | null>(null);
  const [form, setForm] = useState({
    education: "",
    year: "",
    experienceLevel: "STUDENT" as ExperienceLevel,
    codingLevel: "BEGINNER",
    startLanguage: "" as "" | "PYTHON" | "JAVASCRIPT",
    explanationLocale: "hinglish",
    targetCompanies: "",
    targetDate: "",
    weeklyHours: "10",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const code = !!role?.code;

  const finish = async (placement: boolean) => {
    if (!role) return;
    setSaving(true);
    try {
      await api.post("/profile/onboarding", {
        targetRoleKey: role.key,
        experienceLevel: form.experienceLevel,
        education: form.education || null,
        year: form.year ? Number(form.year) : null,
        // Coding level and language only matter for careers that involve coding.
        ...(code ? { codingLevel: form.codingLevel, startLanguage: form.startLanguage } : {}),
        explanationLocale: form.explanationLocale,
        targetCompanies: form.targetCompanies.split(",").map((s) => s.trim()).filter(Boolean),
        targetDate: form.targetDate || null,
        weeklyHours: Number(form.weeklyHours) || 10,
      });
      await qc.invalidateQueries({ queryKey: ["me"] });
      if (placement) {
        const a = await api.post<Attempt>("/placement");
        router.replace(`/quiz/${a.id}?title=${encodeURIComponent("Placement test")}`);
      } else router.replace("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    {
      title: "What role are you preparing for?",
      valid: !!role,
      body: (
        <div className="space-y-3">
          <p className="text-sm text-muted">Your learning path, practice questions and interviews are built for this career. You can add more careers later.</p>
          <RolePicker value={role?.key ?? null} onChange={setRole} />
        </div>
      ),
    },
    {
      title: "Where are you starting from?",
      valid: !code || !!form.startLanguage,
      body: (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">{LEVELS.map((l) => <Choice key={l.value} selected={form.experienceLevel === l.value} onClick={() => set("experienceLevel", l.value)} title={l.label} hint={l.hint} />)}</div>
          {code && (
            <>
              <p className="text-sm font-medium">Coding so far</p>
              <div className="grid gap-3 sm:grid-cols-2">{CODING_LEVELS.map((l) => <Choice key={l.value} selected={form.codingLevel === l.value} onClick={() => set("codingLevel", l.value)} title={l.label} hint={l.hint} />)}</div>
              <p className="text-sm font-medium">Your first programming language</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Choice selected={form.startLanguage === "PYTHON"} onClick={() => set("startLanguage", "PYTHON")} title="Python" hint="Clean syntax. Great for beginners, DSA and AI." />
                <Choice selected={form.startLanguage === "JAVASCRIPT"} onClick={() => set("startLanguage", "JAVASCRIPT")} title="JavaScript" hint="Runs the web. Frontend + Node.js backend." />
              </div>
            </>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Education (optional)" htmlFor="edu" className="sm:col-span-2"><Input id="edu" placeholder="e.g. B.Tech CSE, MBA, BBA, B.Com, BCA…" value={form.education} onChange={(e) => set("education", e.target.value)} /></Field>
            <Field label="Year (optional)" htmlFor="year"><Select id="year" value={form.year} onChange={(e) => set("year", e.target.value)}><option value="">—</option>{[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}</Select></Field>
          </div>
          <Field label="Explain things to me in" htmlFor="loc">
            <Select id="loc" value={form.explanationLocale} onChange={(e) => set("explanationLocale", e.target.value)}>
              <option value="hinglish">Hinglish (recommended)</option>
              <option value="en">Simple English</option>
              <option value="hi">हिन्दी</option>
            </Select>
          </Field>
        </div>
      ),
    },
    {
      title: "What's your timeline?",
      valid: true,
      body: (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Interview / placement date" htmlFor="date"><Input id="date" type="date" value={form.targetDate} onChange={(e) => set("targetDate", e.target.value)} /></Field>
            <Field label="Hours per week" htmlFor="hrs"><Input id="hrs" type="number" min={1} max={80} value={form.weeklyHours} onChange={(e) => set("weeklyHours", e.target.value)} /></Field>
            <Field label="Target companies (optional)" htmlFor="co"><Input id="co" placeholder="e.g. Razorpay, Deloitte, HUL" value={form.targetCompanies} onChange={(e) => set("targetCompanies", e.target.value)} /></Field>
          </div>
          <p className="text-sm text-muted">Have a job description? Add it in Career AI after this — your preparation then follows that exact job.</p>
          {!code && (
            <Button onClick={() => finish(false)} loading={saving}>
              Start preparing <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
    // The placement test covers programming topics, so it is offered only for coding careers.
    ...(code
      ? [
          {
            title: "Skip what you already know?",
            valid: true,
            body: (
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" disabled={saving} onClick={() => finish(true)} className="rounded-xl border border-accent bg-accent-soft p-5 text-left">
                  <Rocket className="size-5 text-accent" />
                  <div className="mt-2 font-semibold">Take the placement test</div>
                  <p className="mt-1 text-sm text-muted">~15 minutes. Topics you already know get marked mastered so you start at the right place.</p>
                </button>
                <button type="button" disabled={saving} onClick={() => finish(false)} className="rounded-xl border border-border bg-surface p-5 text-left hover:border-border-strong">
                  <Sprout className="size-5 text-muted" />
                  <div className="mt-2 font-semibold">Start from the beginning</div>
                  <p className="mt-1 text-sm text-muted">Perfect if you&apos;re new. You can take a stage exam any time to skip ahead.</p>
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];
  const s = steps[step];

  return (
    <div className="bg-grid min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Logo />
        <p className="sr-only" aria-live="polite">{`Step ${step + 1} of ${steps.length}`}</p>
        <div className="mt-10 flex gap-1.5" aria-hidden>
          {steps.map((_, i) => <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-surface-2")} />)}
        </div>
        <h1 className="mt-6 font-display text-3xl leading-tight">{s.title}</h1>
        <div className="mt-6">{s.body}</div>
        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={() => setStep((x) => x - 1)} disabled={step === 0 || saving}><ArrowLeft className="size-4" /> Back</Button>
          {step < steps.length - 1 && <Button onClick={() => setStep((x) => x + 1)} disabled={!s.valid}>Continue <ArrowRight className="size-4" /></Button>}
        </div>
      </div>
    </div>
  );
}
