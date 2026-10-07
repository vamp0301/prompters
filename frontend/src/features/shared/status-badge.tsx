import { CheckCircle2, CircleDashed, CircleDot, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WorkStatus } from "@/lib/api/types";

const STATUS: Record<WorkStatus, { label: string; tone: "neutral" | "info" | "warn" | "accent"; icon: typeof CheckCircle2 }> = {
  NOT_STARTED: { label: "Not started", tone: "neutral", icon: CircleDashed },
  IN_PROGRESS: { label: "In progress", tone: "info", icon: CircleDot },
  TESTS_PASSED: { label: "Tests passed", tone: "warn", icon: FlaskConical },
  COMPLETED: { label: "Completed", tone: "accent", icon: CheckCircle2 },
};

/** Status of a build task or project submission — icon + label, never colour alone. */
export function WorkStatusBadge({ status }: { status: WorkStatus }) {
  const s = STATUS[status] ?? STATUS.NOT_STARTED;
  const Icon = s.icon;
  return (
    <Badge tone={s.tone}>
      <Icon className="size-3" aria-hidden /> {s.label}
    </Badge>
  );
}
