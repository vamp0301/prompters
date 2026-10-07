"use client";
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api/client";
import type { CodingLevel, GoalRole, ProfileResponse } from "@/lib/api/types";
import { GOAL_ROLES, LINK_KEYS, normaliseUrl, resumeChecks, splitList, type LinkKey } from "./use-profile";

const LEVELS: { value: CodingLevel; label: string }[] = [
  { value: "ZERO", label: "Never coded" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

interface FormState {
  name: string;
  education: string;
  year: string;
  codingLevel: CodingLevel | "";
  goalRole: GoalRole | "";
  goals: string;
  weeklyHours: string;
  startLanguage: "PYTHON" | "JAVASCRIPT" | "";
  targetCompanies: string;
  targetSalary: string;
  targetDate: string;
  skills: string;
  headline: string;
  summary: string;
  links: Record<LinkKey, string>;
}

type Errors = Partial<Record<keyof FormState | LinkKey, string>>;

function seed(data: ProfileResponse): FormState {
  const p = data.profile;
  const links = p?.links ?? {};
  return {
    name: data.name ?? "",
    education: p?.education ?? "",
    year: p?.year ? String(p.year) : "",
    codingLevel: p?.codingLevel ?? "",
    goalRole: p?.goalRole ?? "",
    goals: p?.goals ?? "",
    weeklyHours: p?.weeklyHours ? String(p.weeklyHours) : "",
    startLanguage: p?.startLanguage ?? "",
    targetCompanies: (p?.targetCompanies ?? []).join(", "),
    targetSalary: p?.targetSalary ?? "",
    targetDate: p?.targetDate ? p.targetDate.slice(0, 10) : "",
    skills: (p?.skills ?? []).join(", "),
    headline: p?.headline ?? "",
    summary: p?.summary ?? "",
    links: { github: links.github ?? "", linkedin: links.linkedin ?? "", portfolio: links.portfolio ?? "" },
  };
}

function build(f: FormState, existingLinks: Record<string, string> | null) {
  const errors: Errors = {};
  const name = f.name.trim();
  if (name.length < 2) errors.name = "Name needs at least 2 characters.";
  const year = f.year ? Number(f.year) : null;
  const weeklyHours = f.weeklyHours ? Number(f.weeklyHours) : null;
  if (weeklyHours !== null && (!Number.isInteger(weeklyHours) || weeklyHours < 1 || weeklyHours > 80)) errors.weeklyHours = "Enter a whole number from 1 to 80.";
  const skills = splitList(f.skills);
  if (skills.some((s) => s.length > 40)) errors.skills = "Keep each skill under 40 characters.";
  if (skills.length > 40) errors.skills = "Add at most 40 skills.";
  const targetCompanies = splitList(f.targetCompanies);
  if (targetCompanies.some((s) => s.length > 60)) errors.targetCompanies = "Keep each company name under 60 characters.";
  if (targetCompanies.length > 20) errors.targetCompanies = "Add at most 20 companies.";

  // Keep any link keys this form doesn't edit; only send non-empty, valid URLs.
  const links: Record<string, string> = {};
  for (const [k, v] of Object.entries(existingLinks ?? {})) if (!LINK_KEYS.some((l) => l.key === k)) links[k] = v;
  for (const { key } of LINK_KEYS) {
    const raw = f.links[key];
    if (!raw.trim()) continue;
    const url = normaliseUrl(raw);
    if (!url) errors[key] = "Enter a valid URL, e.g. https://github.com/you";
    else links[key] = url;
  }

  const body = {
    name,
    education: f.education.trim() || null,
    year,
    codingLevel: f.codingLevel || null,
    goalRole: f.goalRole || null,
    goals: f.goals.trim() || null,
    weeklyHours,
    ...(f.startLanguage ? { startLanguage: f.startLanguage } : {}),
    targetCompanies,
    targetSalary: f.targetSalary.trim() || null,
    targetDate: f.targetDate || null,
    skills,
    headline: f.headline.trim() || null,
    summary: f.summary.trim() || null,
    links,
  };
  return { body, errors };
}

export function ProfileForm({ data }: { data: ProfileResponse }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(() => seed(data));
  const [errors, setErrors] = useState<Errors>({});
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setLink = (k: LinkKey, v: string) => setForm((f) => ({ ...f, links: { ...f.links, [k]: v } }));

  const save = useMutation({
    mutationFn: (body: ReturnType<typeof build>["body"]) => api.patch("/profile", body),
    onSuccess: () => {
      toast.success("Profile saved.");
      for (const key of [["profile"], ["me"], ["readiness"], ["dashboard"]]) qc.invalidateQueries({ queryKey: key });
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const { body, errors: errs } = build(form, data.profile?.links ?? null);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    save.mutate(body);
  };

  const checks = resumeChecks({
    name: form.name,
    education: form.education,
    goalRole: form.goalRole,
    skills: splitList(form.skills),
    headline: form.headline,
    summary: form.summary,
    linkCount: LINK_KEYS.filter(({ key }) => normaliseUrl(form.links[key])).length + Object.keys(data.profile?.links ?? {}).filter((k) => !LINK_KEYS.some((l) => l.key === k)).length,
    targetCompanies: splitList(form.targetCompanies),
  });
  const done = checks.filter((c) => c.done).length;

  const id = (k: string) => `profile-${k}`;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-6">
        <Card>
          <CardHeader title="Personal & education" description="Shown at the top of your resume." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor={id("name")} error={errors.name} className="sm:col-span-2">
              <Input id={id("name")} value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80} autoComplete="name" required aria-invalid={!!errors.name} />
            </Field>
            <Field label="College / education" htmlFor={id("education")} hint="e.g. B.Tech CSE, ABC Institute of Technology" className="sm:col-span-2">
              <Input id={id("education")} value={form.education} onChange={(e) => set("education", e.target.value)} maxLength={120} />
            </Field>
            <Field label="Year of study" htmlFor={id("year")}>
              <Select id={id("year")} value={form.year} onChange={(e) => set("year", e.target.value)}>
                <option value="">Not specified</option>
                {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </Select>
            </Field>
            <Field label="Coding level" htmlFor={id("codingLevel")}>
              <Select id={id("codingLevel")} value={form.codingLevel} onChange={(e) => set("codingLevel", e.target.value as FormState["codingLevel"])}>
                <option value="">Not specified</option>
                {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </Select>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Goals" description="Drives your roadmap, daily plan and Readiness target." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Goal role" htmlFor={id("goalRole")}>
              <Select id={id("goalRole")} value={form.goalRole} onChange={(e) => set("goalRole", e.target.value as FormState["goalRole"])}>
                <option value="">Not specified</option>
                {GOAL_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </Field>
            <Field label="Start language" htmlFor={id("startLanguage")}>
              <Select id={id("startLanguage")} value={form.startLanguage} onChange={(e) => set("startLanguage", e.target.value as FormState["startLanguage"])}>
                {!form.startLanguage && <option value="">Not specified</option>}
                <option value="PYTHON">Python</option>
                <option value="JAVASCRIPT">JavaScript</option>
              </Select>
            </Field>
            <Field label="Hours per week" htmlFor={id("weeklyHours")} error={errors.weeklyHours}>
              <Input id={id("weeklyHours")} type="number" inputMode="numeric" min={1} max={80} value={form.weeklyHours} onChange={(e) => set("weeklyHours", e.target.value)} className="font-mono" aria-invalid={!!errors.weeklyHours} />
            </Field>
            <Field label="Target date" htmlFor={id("targetDate")} hint="When you want to be job-ready.">
              <Input id={id("targetDate")} type="date" value={form.targetDate} onChange={(e) => set("targetDate", e.target.value)} className="font-mono" />
            </Field>
            <Field label="Target companies" htmlFor={id("targetCompanies")} hint="Comma-separated, e.g. Razorpay, Zerodha, Flipkart" error={errors.targetCompanies} className="sm:col-span-2">
              <Input id={id("targetCompanies")} value={form.targetCompanies} onChange={(e) => set("targetCompanies", e.target.value)} aria-invalid={!!errors.targetCompanies} />
            </Field>
            <Field label="Target salary" htmlFor={id("targetSalary")} hint="e.g. 8 LPA">
              <Input id={id("targetSalary")} value={form.targetSalary} onChange={(e) => set("targetSalary", e.target.value)} maxLength={40} />
            </Field>
            <Field label="What do you want to achieve?" htmlFor={id("goals")} className="sm:col-span-2">
              <Textarea id={id("goals")} value={form.goals} onChange={(e) => set("goals", e.target.value)} maxLength={1000} rows={3} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Resume details" description="Used to build your ATS-friendly resume." />
          <CardBody className="grid gap-4">
            <Field label="Headline" htmlFor={id("headline")} hint="One line, e.g. Backend developer — Node.js, PostgreSQL, REST APIs">
              <Input id={id("headline")} value={form.headline} onChange={(e) => set("headline", e.target.value)} maxLength={160} />
            </Field>
            <Field label="Summary" htmlFor={id("summary")} hint={`${form.summary.length}/1500 — 2–4 sentences about what you build and how you work.`}>
              <Textarea id={id("summary")} value={form.summary} onChange={(e) => set("summary", e.target.value)} maxLength={1500} rows={4} />
            </Field>
            <Field label="Skills" htmlFor={id("skills")} hint="Comma-separated, e.g. JavaScript, Node.js, SQL, Git" error={errors.skills}>
              <Input id={id("skills")} value={form.skills} onChange={(e) => set("skills", e.target.value)} aria-invalid={!!errors.skills} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              {LINK_KEYS.map(({ key, label }) => (
                <Field key={key} label={label} htmlFor={id(key)} error={errors[key]}>
                  <Input id={id(key)} type="url" inputMode="url" placeholder="https://…" value={form.links[key]} onChange={(e) => setLink(key, e.target.value)} maxLength={300} aria-invalid={!!errors[key]} />
                </Field>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={save.isPending} className="w-full sm:w-auto">Save profile</Button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader title="Resume & profile factor" description="A complete profile counts toward your Readiness score." />
          <CardBody className="space-y-3">
            <div className="flex items-center gap-3">
              <Progress value={(done / checks.length) * 100} label="Profile completeness" />
              <span className="font-mono text-xs tabular-nums text-muted">{done}/{checks.length}</span>
            </div>
            <ul className="space-y-1.5" aria-label="Profile checklist">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-sm">
                  {c.done ? <CheckCircle2 className="size-4 shrink-0 text-accent" aria-hidden /> : <Circle className="size-4 shrink-0 text-subtle" aria-hidden />}
                  <span className={c.done ? "text-text" : "text-muted"}>{c.label}</span>
                  <span className="sr-only">{c.done ? "done" : "missing"}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-subtle">Counts once you save.</p>
          </CardBody>
        </Card>
      </aside>
    </form>
  );
}
