import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-surface-2 text-muted border-border",
  pink: "bg-pink-soft text-pink border-pink/30",
  accent: "bg-accent-soft text-accent border-accent/30",
  danger: "bg-danger-soft text-danger border-danger/30",
  warn: "bg-warn-soft text-warn border-warn/30",
  info: "bg-info-soft text-info border-info/30",
};

export function Badge({ tone = "neutral", className, children }: { tone?: keyof typeof tones; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4", tones[tone], className)}>{children}</span>;
}
