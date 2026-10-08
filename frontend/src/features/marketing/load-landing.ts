import { DEFAULT_LANDING, mergeLanding, type LandingContent } from "./landing-content";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

/**
 * Landing copy as saved by a Super Admin, merged over the defaults. Cached for a minute; if the
 * API is slow or down the page still renders with the defaults.
 */
export async function loadLanding(): Promise<LandingContent> {
  try {
    const res = await fetch(`${API}/api/site/landing`, { next: { revalidate: 60, tags: ["site-landing"] }, signal: AbortSignal.timeout(2500) });
    if (!res.ok) return DEFAULT_LANDING;
    const body = (await res.json()) as { data?: { content?: unknown } };
    return mergeLanding(body.data?.content ?? null);
  } catch {
    return DEFAULT_LANDING;
  }
}
