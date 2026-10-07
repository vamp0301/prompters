/** Theme lives on <html data-theme>. The root layout's inline script applies the saved value before paint. */
export type Theme = "dark" | "light" | "system";
export const THEME_KEY = "prompters-theme";

export function readTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "dark" || t === "system" ? t : "light";
}

/** For useSyncExternalStore: observe data-theme so there's no hydration mismatch. */
export function subscribeTheme(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

export function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    /* storage blocked — theme still applies for this visit */
  }
}

/** What is actually showing ("system" resolved against the OS preference). */
export function resolvedTheme(t: Theme): "dark" | "light" {
  if (t !== "system") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
