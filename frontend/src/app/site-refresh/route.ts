import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

/**
 * Refreshes the cached public pages after a Super Admin saves website copy. The caller's own session
 * is checked against the API, so only a signed-in Super Admin from this site can trigger it.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return NextResponse.json({ success: false }, { status: 403 });
  const me = await fetch(`${API}/api/auth/me`, { headers: { cookie: req.headers.get("cookie") ?? "" }, cache: "no-store" }).catch(() => null);
  const body = me?.ok ? ((await me.json()) as { data?: { role?: string } }) : null;
  if (body?.data?.role !== "SUPER_ADMIN") return NextResponse.json({ success: false }, { status: 403 });
  revalidateTag("site-landing", "max");
  return NextResponse.json({ success: true });
}
