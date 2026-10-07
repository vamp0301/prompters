import Link from "next/link";
import { CheckCircle2, Circle, CircleDot, Hourglass, Lock, RefreshCw } from "lucide-react";
import type { PathTopic } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const ICON = {
  MASTERED: { icon: CheckCircle2, cls: "text-accent", label: "Mastered" },
  NEEDS_REVIEW: { icon: RefreshCw, cls: "text-warn", label: "Needs review" },
  IN_PROGRESS: { icon: CircleDot, cls: "text-info", label: "In progress" },
  AVAILABLE: { icon: Circle, cls: "text-muted", label: "Available" },
  LOCKED: { icon: Lock, cls: "text-subtle", label: "Locked" },
  COMING_SOON: { icon: Hourglass, cls: "text-subtle", label: "Coming soon" },
} as const;

export function TopicRow({ topic }: { topic: PathTopic }) {
  const { icon: Icon, cls, label } = ICON[topic.state];
  const disabled = topic.state === "COMING_SOON";
  const body = (
    <>
      <Icon className={cn("size-4 shrink-0", cls)} aria-label={label} />
      <span className={cn("flex-1 truncate", disabled && "text-subtle")}>{topic.title}</span>
      {topic.state === "LOCKED" && topic.missingPrerequisites.length > 0 && <span className="hidden truncate text-xs text-subtle sm:inline">needs {topic.missingPrerequisites[0].title}</span>}
      {topic.state === "COMING_SOON" && <span className="text-xs text-subtle">soon</span>}
      {topic.mastery?.bestScore ? <span className="font-mono text-xs tabular-nums text-muted">{Math.round(topic.mastery.bestScore)}%</span> : null}
      {topic.hasContent && <span className="hidden font-mono text-xs text-subtle sm:inline">{topic.estMinutes}m</span>}
    </>
  );
  return disabled ? (
    <li className="flex items-center gap-3 rounded-md px-3 py-2 text-sm">{body}</li>
  ) : (
    <li>
      <Link href={`/learn/topic/${topic.slug}`} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-2">{body}</Link>
    </li>
  );
}
