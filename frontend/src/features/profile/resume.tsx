"use client";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Copy, Download, Info } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { BuildTaskSummary, Journey, ProfileResponse, ProjectDetail, ProjectSubmissionRecord, ProjectSummary } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import { buildStory, sentence, storyToText } from "./story";
import { LINK_KEYS, roleLabel } from "./use-profile";

/** Print: show only the portal copy of the resume, white paper, black text. */
const PRINT_CSS = `
#resume-print { display: none; }
@media print {
  @page { size: A4; margin: 14mm 14mm; }
  html, body { background: #fff !important; height: auto !important; overflow: visible !important; }
  body > *:not(#resume-print) { display: none !important; }
  #resume-print { display: block !important; position: static; width: 100%; color: #000; background: #fff; }
  #resume-print * { color: #000 !important; background: transparent !important; box-shadow: none !important; }
  #resume-print a { text-decoration: none; }
  #resume-print section { break-inside: avoid-page; }
}
`;

const subscribeNoop = () => () => {};
function useMounted() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

interface CompletedProject {
  summary: ProjectSummary;
  detail: ProjectDetail;
  submission: ProjectSubmissionRecord;
}

interface ResumeData {
  profile: ProfileResponse;
  builds: BuildTaskSummary[];
  projects: CompletedProject[];
  strong: Journey["strong"];
}

const displayUrl = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

function H2({ children }: { children: string }) {
  return <h2 className="mb-1.5 border-b border-neutral-300 pb-0.5 text-[12px] font-bold uppercase tracking-wider text-neutral-900">{children}</h2>;
}

function ResumeDocument({ data, id }: { data: ResumeData; id: string }) {
  const p = data.profile.profile;
  const links = LINK_KEYS.flatMap(({ key, label }) => (p?.links?.[key] ? [{ label: label as string, url: p.links[key] }] : []));
  const otherLinks = Object.entries(p?.links ?? {})
    .filter(([k]) => !LINK_KEYS.some((l) => l.key === k))
    .map(([k, url]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), url }));
  const allLinks = [...links, ...otherLinks];
  const skills = p?.skills ?? [];
  const role = roleLabel(p?.goalRole);
  const education = [p?.education, p?.year ? `Year ${p.year}` : null].filter(Boolean).join(", ");

  return (
    <article id={id} aria-label="Resume preview" className="bg-white px-6 py-7 font-sans text-[12.5px] leading-[1.5] text-neutral-900 sm:px-10">
      <header className="mb-4">
        <h1 className="text-[22px] font-bold leading-tight text-neutral-950">{data.profile.name}</h1>
        {(p?.headline || role) && <p className="mt-0.5 text-[13px] text-neutral-700">{p?.headline || role}</p>}
        <p className="mt-1 break-words text-neutral-700">
          {[data.profile.email, ...links.map((l) => displayUrl(l.url))].join("  |  ")}
        </p>
      </header>

      {p?.summary && (
        <section className="mb-4">
          <H2>Summary</H2>
          <p className="whitespace-pre-line">{p.summary}</p>
        </section>
      )}

      {(skills.length > 0 || data.strong.length > 0) && (
        <section className="mb-4">
          <H2>Skills</H2>
          {skills.length > 0 && <p><span className="font-semibold">Technical skills:</span> {skills.join(", ")}</p>}
          {data.strong.length > 0 && <p><span className="font-semibold">Mastered topics:</span> {data.strong.map((s) => s.title).join(", ")}</p>}
        </section>
      )}

      {data.projects.length > 0 && (
        <section className="mb-4">
          <H2>Projects</H2>
          <div className="space-y-3">
            {data.projects.map(({ detail, submission: s }) => (
              <div key={detail.slug}>
                <p className="font-semibold text-neutral-950">
                  {detail.title}
                  {detail.technologies.length > 0 && <span className="font-normal"> — {detail.technologies.join(", ")}</span>}
                  <span className="font-normal text-neutral-600"> ({formatDate(s.updatedAt, { month: "short", year: "numeric" })})</span>
                </p>
                <ul className="ml-4 list-disc">
                  <li>{sentence(detail.description)}</li>
                  <li>Approach: {sentence(s.howIBuiltIt.approach)}</li>
                  <li>Debugging: {sentence(s.howIBuiltIt.bugFixed)}</li>
                  <li>Trade-off: {sentence(s.howIBuiltIt.tradeoff)}</li>
                  <li>Explain-your-code score {s.explainScore}/100; independence score {s.independenceScore}/100.</li>
                </ul>
                <p className="break-words text-neutral-700">
                  Code: {displayUrl(s.repoUrl)}
                  {s.liveUrl && <>  |  Live: {displayUrl(s.liveUrl)}</>}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.builds.length > 0 && (
        <section className="mb-4">
          <H2>Practical builds</H2>
          <ul className="ml-4 list-disc">
            {data.builds.map((b) => (
              <li key={b.slug}>
                <span className="font-semibold">{b.title}</span>
                {b.topic && <> ({b.topic.title})</>}
                {b.independenceScore !== null && <> — independence score {b.independenceScore}/100</>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {education && (
        <section className="mb-4">
          <H2>Education</H2>
          <p>{education}</p>
        </section>
      )}

      {allLinks.length > 0 && (
        <section>
          <H2>Links</H2>
          <ul>
            {allLinks.map((l) => (
              <li key={l.label} className="break-words">{l.label}: {l.url}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function StoryCard({ project }: { project: CompletedProject }) {
  const story = buildStory(project.detail, project.submission);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(storyToText(project.detail.title, story));
      toast.success("Story copied to clipboard.");
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  };
  const rows: [string, string][] = [["Situation", story.situation], ["Task", story.task], ["Action", story.action], ["Result", story.result]];
  return (
    <Card>
      <CardHeader
        title={project.detail.title}
        description={`Rung ${project.detail.rung} · explain ${project.submission.explainScore}/100 · independence ${project.submission.independenceScore}/100`}
        action={<Button variant="secondary" size="sm" onClick={copy} aria-label={`Copy story for ${project.detail.title}`}><Copy className="size-3.5" aria-hidden /> Copy</Button>}
      />
      <CardBody className="space-y-4">
        <dl className="space-y-3">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 sm:grid-cols-[88px_1fr] sm:gap-3">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-accent sm:pt-0.5">{k}</dt>
              <dd className="text-sm text-text/90">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted">30-second pitch</div>
          <p className="text-sm leading-6">{story.pitch}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export function ResumeTab({ profile }: { profile: ProfileResponse }) {
  const mounted = useMounted();
  const tasksQ = useQuery({ queryKey: ["build-tasks"], queryFn: () => api.get<BuildTaskSummary[]>("/build-tasks") });
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => api.get<ProjectSummary[]>("/projects") });
  const journeyQ = useQuery({ queryKey: ["journey"], queryFn: () => api.get<Journey>("/journey") });
  const completedSummaries = (projectsQ.data ?? []).filter((p) => p.status === "COMPLETED");
  const detailQs = useQueries({
    queries: completedSummaries.map((p) => ({ queryKey: ["project", p.slug], queryFn: () => api.get<ProjectDetail>(`/projects/${p.slug}`) })),
  });

  const failed = [tasksQ, projectsQ, journeyQ, ...detailQs].find((q) => q.error);
  if (failed) return <ErrorState error={failed.error} retry={() => failed.refetch()} />;
  if (tasksQ.isLoading || projectsQ.isLoading || journeyQ.isLoading || detailQs.some((q) => q.isLoading)) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading resume">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-[480px]" />
      </div>
    );
  }

  const projects: CompletedProject[] = completedSummaries.flatMap((summary, i) => {
    const detail = detailQs[i]?.data;
    return detail?.submission ? [{ summary, detail, submission: detail.submission }] : [];
  });
  const data: ResumeData = {
    profile,
    builds: (tasksQ.data ?? []).filter((t) => t.status === "COMPLETED"),
    projects,
    strong: journeyQ.data?.strong ?? [],
  };

  const p = profile.profile;
  const hints: { text: string; href?: string; cta?: string }[] = [];
  if (!p?.headline || !p?.summary) hints.push({ text: "Add a headline and summary on the Profile tab to introduce yourself." });
  if (!p?.skills.length && !data.strong.length) hints.push({ text: "Add skills on the Profile tab or master topics to fill the Skills section." });
  if (!projects.length) hints.push({ text: "Complete a project to add it here.", href: "/projects", cta: "Projects" });
  if (!data.builds.length) hints.push({ text: "Complete a build task to list it under Practical builds.", href: "/build", cta: "Build tasks" });
  if (!p?.education) hints.push({ text: "Add your education on the Profile tab." });
  if (!p?.links || !Object.keys(p.links).length) hints.push({ text: "Add a GitHub, LinkedIn or portfolio link on the Profile tab." });

  return (
    <div className="space-y-6">
      <style>{PRINT_CSS}</style>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Single-column, ATS-friendly. Built only from your saved profile and verified work on Prompters.</p>
        <Button onClick={() => window.print()} className="w-full sm:w-auto">
          <Download className="size-4" aria-hidden /> Download PDF
        </Button>
      </div>

      {hints.length > 0 && (
        <div className="rounded-xl border border-info/30 bg-info-soft p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-info"><Info className="size-4" aria-hidden /> Make your resume stronger</div>
          <ul className="space-y-1.5 text-sm">
            {hints.map((h) => (
              <li key={h.text} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-text/90">{h.text}</span>
                {h.href && <Link href={h.href} className="text-xs text-muted underline underline-offset-4 hover:text-text">{h.cta}</Link>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border shadow-2xl shadow-black/20">
        <ResumeDocument data={data} id="resume" />
      </div>
      <p className="text-xs text-subtle">In the print dialog choose “Save as PDF”. Tip: turn off headers and footers for a clean page.</p>

      <section aria-labelledby="story-builder" className="space-y-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-accent">Interview prep</div>
          <h2 id="story-builder" className="text-lg font-semibold tracking-tight">Project story builder</h2>
          <p className="mt-1 text-sm text-muted">Your own “How I built it” answers, arranged as a STAR story and a 30-second pitch. Practise saying them out loud.</p>
        </div>
        {projects.length ? (
          <div className="grid gap-4">
            {projects.map((pr) => <StoryCard key={pr.detail.slug} project={pr} />)}
          </div>
        ) : (
          <EmptyState
            title="No completed projects yet"
            description="Complete a project to turn how you built it into interview-ready stories."
            action={<Link href="/projects" className={buttonClass("secondary", "sm")}>Go to projects</Link>}
          />
        )}
      </section>

      {mounted && createPortal(<div id="resume-print" aria-hidden><ResumeDocument data={data} id="resume-print-doc" /></div>, document.body)}
    </div>
  );
}
