"use client";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, readTheme, resolvedTheme, subscribeTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Paper ↔ night toggle. Renders a neutral placeholder on the server to avoid a hydration mismatch. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, () => resolvedTheme(readTheme()), () => undefined);
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => applyTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to paper (light) theme" : "Switch to night (dark) theme"}
      className={cn("grid size-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-text", className)}
    >
      {theme === undefined ? <span className="size-4" aria-hidden /> : dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
  );
}
