import { cn } from "@/lib/utils";

/**
 * Seamless CSS marquee: the track holds two copies and slides by 50%. Pauses on hover (it has no
 * focusable content). Under reduced motion the duplicate is hidden and items wrap as a static list.
 */
export function Marquee({ items, reverse, seconds = 40, className }: { items: string[]; reverse?: boolean; seconds?: number; className?: string }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className={cn("flex shrink-0 items-center gap-3 pr-3 motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:gap-2", hidden && "motion-reduce:hidden")}>
      {items.map((t) => (
        <li key={t} className="whitespace-nowrap rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-xs text-muted">
          {t}
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cn("group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]", className)}>
      <div
        className="anim flex w-max group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:flex-wrap"
        style={{ animation: `${reverse ? "marquee-right" : "marquee-left"} ${seconds}s linear infinite` }}
      >
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
