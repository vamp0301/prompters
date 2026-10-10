import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";

/** axe-core (WCAG 2 A/AA) on the current page, once it has settled. Returns one line per violation. */
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

export async function axe(page: Page) {
  // Check colours once the page's data is in and entrance animations (page fade, chips, cards) have
  // finished; infinite spinners are ignored. Without the network wait, cards still loading would mount
  // and fade in mid-check.
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity));
  // Card fade-ins are JavaScript-driven (inline opacity), not in getAnimations(): give those time to
  // settle too (bounded — pages that are still generating keep pulsing on purpose).
  await page
    .waitForFunction(() => [...document.querySelectorAll<HTMLElement>("[style*='opacity']")].every((el) => !el.style.opacity || Number(el.style.opacity) === 0 || Number(el.style.opacity) === 1), undefined, { timeout: 5000 })
    .catch(() => undefined);
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    const r = await (window as unknown as { axe: { run: (o: unknown) => Promise<{ violations: { id: string; nodes: { target: string[]; failureSummary?: string }[] }[] }> } }).axe.run({ runOnly: ["wcag2a", "wcag2aa"] });
    // Rule id plus the first offending elements, so a failure says where.
    return r.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => `${n.target.join(" ")} — ${(n.failureSummary ?? "").split("\n").slice(1, 2).join("").trim()}`).join(" | ")}`);
  });
}
