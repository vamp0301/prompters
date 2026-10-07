import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2 tracking-tight", className)} aria-label="Prompters home">
      <span className="grid size-7 place-items-center rounded-[5px] bg-text font-mono text-[13px] font-bold text-bg" aria-hidden>
        &gt;_
      </span>
      <span className="font-display text-lg font-semibold">Prompters</span>
    </Link>
  );
}
