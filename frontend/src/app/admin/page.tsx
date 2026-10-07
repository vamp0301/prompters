"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HeartPulse, BookText, FileQuestion } from "lucide-react";
import { ErrorState, PageHeader, PageSkeleton, Stat } from "@/components/ui/misc";
import { HBars, TimeChart } from "@/features/admin/charts";
import { EmptyRow, fmt, Panel, TableWrap, Td, Th, useRole } from "@/features/admin/ui";
import { api } from "@/lib/api/client";
import type { AdminDashboard } from "@/lib/api/types";

function AuthorHome() {
  const links = [
    { href: "/admin/content-health", label: "Content health", desc: "What's missing before topics can publish", icon: HeartPulse },
    { href: "/admin/topics", label: "Topics", desc: "Write sections, visuals, quizzes", icon: BookText },
    { href: "/admin/questions", label: "Question bank", desc: "Edit, bulk import and export", icon: FileQuestion },
  ];
  return (
    <>
      <PageHeader eyebrow="Author workspace" title="Welcome back" description="Platform analytics are visible to Admins. Here's where authoring happens." />
      <div className="grid gap-3 sm:grid-cols-3">
        {links.map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href} className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong">
            <Icon className="size-5 text-accent" aria-hidden />
            <div className="mt-3 font-medium">{label}</div>
            <p className="mt-1 text-xs text-muted">{desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

function Dashboard() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => api.get<AdminDashboard>("/admin/dashboard") });
  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} retry={() => refetch()} />;
  const t = data.totals;
  const tiles: [string, string, string?][] = [
    ["Users", fmt(t.users)],
    ["New · 7d", fmt(t.newUsers7d)],
    ["Active · 7d", fmt(t.activeUsers7d)],
    ["Learning hours", fmt(t.learningHours), "from topic reads × est. minutes"],
    ["Topics mastered", fmt(t.topicsMastered)],
    ["Quiz attempts", fmt(t.quizAttempts)],
    ["Mastery pass rate", fmt(t.masteryRate, "%")],
    ["Project submissions", fmt(t.projectSubmissions), "builds + ladder projects"],
    ["Avg readiness", fmt(t.avgReadiness)],
    ["Integrity events", fmt(t.integrityEvents)],
    ["Flagged attempts", fmt(t.flaggedAttempts)],
    ["AI tutor uses", fmt(t.aiUsage)],
    ["7-day retention", fmt(t.retention7d, "%"), "signed up 7–14 days ago, active this week"],
  ];
  return (
    <>
      <PageHeader eyebrow="Overview" title="Platform dashboard" description="Live numbers from the database. Nothing here is sampled or estimated." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">
        {tiles.map(([label, value, hint]) => <Stat key={label} label={label} value={value} hint={hint} />)}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Daily active learners" description="Distinct users with a learning event, last 30 days" bodyClassName="p-4">
          <TimeChart title="Active users" data={data.daily.map((d) => ({ x: d.day, y: d.active }))} />
        </Panel>
        <Panel title="Signups" description="New accounts per day" bodyClassName="p-4">
          <TimeChart title="Signups" kind="bar" data={data.daily.map((d) => ({ x: d.day, y: d.signups }))} />
        </Panel>
        <Panel title="Quiz average score" description="Mean score of attempts finished each day (gaps = no attempts)" bodyClassName="p-4">
          <TimeChart title="Avg score" unit="%" max={100} data={data.daily.map((d) => ({ x: d.day, y: d.avgScore }))} />
        </Panel>
        <Panel title="Readiness distribution" description="Learners by latest readiness score" bodyClassName="p-4">
          <HBars data={data.readinessDistribution.map((r) => ({ label: r.range, value: r.users }))} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Hardest topics" description="Lowest average mastery-quiz score">
          <TableWrap className="[&_table]:min-w-[420px]">
            <thead><tr><Th>Topic</Th><Th right>Avg</Th><Th right>Attempts</Th></tr></thead>
            <tbody>
              {data.hardestTopics.length === 0 && <EmptyRow cols={3}>No mastery attempts yet.</EmptyRow>}
              {data.hardestTopics.map((h) => <tr key={h.slug}><Td>{h.title}<div className="font-mono text-[11px] text-subtle">{h.slug}</div></Td><Td right mono>{h.avg}%</Td><Td right mono>{h.attempts}</Td></tr>)}
            </tbody>
          </TableWrap>
        </Panel>
        <Panel title="Most failed questions" description="Wrong answers, last 90 days">
          <TableWrap className="[&_table]:min-w-[420px]">
            <thead><tr><Th>Question</Th><Th right>Wrong</Th><Th right>Asked</Th></tr></thead>
            <tbody>
              {data.mostFailedQuestions.length === 0 && <EmptyRow cols={3}>No graded answers yet.</EmptyRow>}
              {data.mostFailedQuestions.map((q) => (
                <tr key={q.questionId}>
                  <Td><Link href={`/admin/questions?edit=${q.questionId}`} className="line-clamp-2 hover:text-accent">{q.prompt ?? q.questionId}</Link></Td>
                  <Td right mono>{q.wrong}</Td><Td right mono>{q.total}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
        <Panel title="Most abandoned topics" description="Started, not mastered, untouched for 7+ days">
          <TableWrap className="[&_table]:min-w-[420px]">
            <thead><tr><Th>Topic</Th><Th right>Learners</Th></tr></thead>
            <tbody>
              {data.mostAbandonedTopics.length === 0 && <EmptyRow cols={2}>Nothing abandoned.</EmptyRow>}
              {data.mostAbandonedTopics.map((a) => <tr key={a.slug}><Td>{a.title}<div className="font-mono text-[11px] text-subtle">{a.slug}</div></Td><Td right mono>{a.learners}</Td></tr>)}
            </tbody>
          </TableWrap>
        </Panel>
        <Panel title="Popular builds" description="Build tasks by submissions">
          <TableWrap className="[&_table]:min-w-[420px]">
            <thead><tr><Th>Build task</Th><Th right>Submissions</Th></tr></thead>
            <tbody>
              {data.popularBuilds.length === 0 && <EmptyRow cols={2}>No build tasks yet.</EmptyRow>}
              {data.popularBuilds.map((b) => <tr key={b.slug}><Td>{b.title}<div className="font-mono text-[11px] text-subtle">{b.slug}</div></Td><Td right mono>{b.submissions}</Td></tr>)}
            </tbody>
          </TableWrap>
        </Panel>
      </div>
    </>
  );
}

export default function AdminHome() {
  const { can } = useRole();
  return can("ADMIN") ? <Dashboard /> : <AuthorHome />;
}
