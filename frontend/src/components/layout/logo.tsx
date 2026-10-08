import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Prompters home">
      <span className="grid size-[31px] place-items-center rounded-[7px] bg-ink font-mono text-[12px] font-medium tracking-[-2px] text-ink-fg" aria-hidden>
        &gt;_
      </span>
      <span className="text-[17px] font-extrabold tracking-[-0.04em]">Prompters</span>
    </Link>
  );
}
