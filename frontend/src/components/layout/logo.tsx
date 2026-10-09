import Link from "next/link";
import { BrandMark, Wordmark } from "@/components/brand/brand-mark";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/", animate = false }: { className?: string; href?: string; animate?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2", className)} aria-label="Prompters home">
      <BrandMark size={28} animate={animate ? "once" : false} />
      <Wordmark className="text-[19px]" />
    </Link>
  );
}
