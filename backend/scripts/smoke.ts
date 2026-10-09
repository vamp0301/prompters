/**
 * Repeatable smoke test for a running deployment (or the local stack). Three career journeys —
 * technical (Backend), analytics (Data Analyst), non-technical (Product Manager) — through the
 * public API, the way the browser uses it (via the frontend's /api proxy when SMOKE_BASE_URL is the
 * Vercel URL). Creates its own throwaway accounts and deletes them at the end.
 *
 *   SMOKE_BASE_URL=https://prompters.vercel.app npm run smoke
 *
 * Env:
 *   SMOKE_BASE_URL   where /api lives (frontend URL, or the API URL directly). Required.
 *   SMOKE_ORIGIN     Origin header (defaults to SMOKE_BASE_URL); must be in the API's CORS_ORIGIN.
 *   SMOKE_AI=0       skip steps that call the AI provider (resume parsing, interviews).
 *   SMOKE_R2_PUBLIC_BASE  optional public bucket URL (e.g. https://pub-xxx.r2.dev): checks it does NOT serve files.
 *   SMOKE_KEEP=1     keep the test accounts (default: delete them).
 * Never prints cookies, tokens or secrets. Exit code 1 if any check fails.
 */
const BASE = (process.env.SMOKE_BASE_URL ?? "").replace(/\/$/, "");
if (!BASE) {
  console.error("Set SMOKE_BASE_URL (e.g. https://your-app.vercel.app or http://localhost:3100).");
  process.exit(2);
}
const ORIGIN = process.env.SMOKE_ORIGIN ?? BASE;
const AI = process.env.SMOKE_AI !== "0";

type Result = { journey: string; check: string; ok: boolean; detail?: string; ms?: number };
const results: Result[] = [];

class Client {
  private cookie = "";
  constructor(readonly name: string) {}
  async call<T = unknown>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T; ms: number; error?: string }> {
    const t = performance.now();
    const res = await fetch(`${BASE}/api${path}`, { method, headers: { "content-type": "application/json", origin: ORIGIN, ...(this.cookie ? { cookie: this.cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const set = res.headers.getSetCookie?.() ?? [];
    if (set.length) this.cookie = set.map((c) => c.split(";")[0]).join("; ");
    const text = await res.text();
    let json: { data?: T; error?: { message?: string } } = {};
    try {
      json = JSON.parse(text);
    } catch {
      /* non-JSON */
    }
    return { status: res.status, data: json.data as T, ms: Math.round(performance.now() - t), error: json.error?.message };
  }
}

async function check(journey: string, name: string, fn: () => Promise<string | void>) {
  const t = performance.now();
  try {
    const detail = await fn();
    results.push({ journey, check: name, ok: true, detail: detail ?? undefined, ms: Math.round(performance.now() - t) });
  } catch (e) {
    results.push({ journey, check: name, ok: false, detail: (e as Error).message.slice(0, 300), ms: Math.round(performance.now() - t) });
  }
}
function expect(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const RESUMES: Record<string, string> = {
  backend: "Riya Sharma — Backend developer. Built a Notes REST API with Node.js, Express, MongoDB and JWT authentication. Backend intern at Acme for 6 months building REST APIs. B.Tech CSE 2026. Skills: JavaScript, Node.js, Express, MongoDB, Docker.",
  data_analyst: "Rahul Verma — B.Com 2025. Sales dashboard: Power BI dashboard of monthly sales from a 50,000-row Excel dataset; cleaned the data and built KPIs with SQL. Intern at Shopco for 3 months preparing weekly MIS reports in Excel. Skills: SQL, Excel, Power BI, statistics.",
  product_manager: "Aditi Rao — MBA (Marketing & Strategy), IIM 2026. EV adoption study: market research survey of 400 respondents; segmentation and pricing recommendation. Summer intern at Acme Retail for 2 months: competitor analysis and a go-to-market plan. Skills: Excel, market research, stakeholder management.",
};
const INTERVIEWER: Record<string, string> = { backend: "Senior Technical Interviewer", data_analyst: "Senior Analytics Interviewer", product_manager: "Senior Product Interviewer" };
const CONSENT = { recording: true, integrity: true, preparationOnly: true, storeAudio: false };

async function journey(roleKey: string) {
  const c = new Client(roleKey);
  const email = `smoke-${roleKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  let sessionId = "";
  let profileId = "";
  await check(roleKey, "register", async () => {
    const r = await c.call("POST", "/auth/register", { name: `Smoke ${roleKey}`, email, password: "Smoke-Passw0rd!" });
    expect(r.status === 201, `status ${r.status}`);
  });
  await check(roleKey, "onboard into the career", async () => {
    const r = await c.call("POST", "/profile/onboarding", { targetRoleKey: roleKey, experienceLevel: "STUDENT", explanationLocale: "en", weeklyHours: 8, ...(roleKey === "backend" ? { startLanguage: "JAVASCRIPT", codingLevel: "BEGINNER" } : {}) });
    expect(r.status === 200, `status ${r.status}`);
    const p = await c.call<{ id: string; roleKey: string; primary: boolean }[]>("GET", "/me/target-roles");
    expect(p.data?.length === 1 && p.data[0].roleKey === roleKey && p.data[0].primary, "primary career not created");
    profileId = p.data[0].id;
  });
  await check(roleKey, "recommendations fit the career", async () => {
    const r = await c.call<{ itemType: string; title: string }[]>("GET", "/personalization/recommendations");
    expect(r.status === 200, `status ${r.status}`);
    if (roleKey !== "backend") expect(!(r.data ?? []).some((x) => x.itemType === "TOPIC" || x.itemType === "BUILD_TASK"), "programming topics/builds recommended to a non-coding career");
    return `${r.data?.length ?? 0} items, ${r.ms} ms`;
  });
  if (!AI) return { c, email, sessionId, profileId };

  let resumeId = "";
  await check(roleKey, "upload resume (AI parse)", async () => {
    const r = await c.call<{ id: string }>("POST", "/career/resumes", { text: RESUMES[roleKey], label: "Smoke CV" });
    expect(r.status === 201 || r.status === 200, `status ${r.status}`);
    resumeId = r.data.id;
    return `${r.ms} ms`;
  });
  await check(roleKey, "start a career interview", async () => {
    expect(resumeId, "no resume");
    const r = await c.call<{ id: string; interviewer: { role: string }; current: { id: string; kind: string } }>("POST", "/career/sessions", { resumeId, targetRoleProfileId: profileId, durationMinutes: 15, consent: CONSENT });
    expect(r.status === 201, `status ${r.status}: ${r.error ?? ""}`);
    expect(r.data.interviewer.role === INTERVIEWER[roleKey], `interviewer "${r.data.interviewer.role}"`);
    if (roleKey !== "backend") expect(r.data.current.kind !== "CODING" && r.data.current.kind !== "PROBLEM", "coding turn for a non-coding career");
    sessionId = r.data.id;
    const a = await c.call<{ done: boolean }>("POST", `/career/sessions/${sessionId}/answer`, { turnId: r.data.current.id, answerText: "I would start from the goal, explain my reasoning with an example from my own project, and say how I'd measure whether it worked." });
    expect(a.status === 200, `answer status ${a.status}`);
    return `${r.ms} ms start, ${a.ms} ms answer`;
  });
  await check(roleKey, "session is linked to the career", async () => {
    const s = await c.call<{ targetRoleProfileId: string | null }>("GET", `/career/sessions/${sessionId}`);
    expect(s.status === 200 && s.data.targetRoleProfileId === profileId, "session not linked to the profile");
  });
  await check(roleKey, "end interview → report", async () => {
    const e = await c.call("POST", `/career/sessions/${sessionId}/end`);
    expect(e.status === 200, `status ${e.status}`);
    const s = await c.call<{ status: string; report: unknown }>("GET", `/career/sessions/${sessionId}`);
    expect(s.data.status !== "IN_PROGRESS", "still in progress");
  });
  return { c, email, sessionId, profileId };
}

async function main() {
  const anon = new Client("platform");
  await check("platform", "liveness /live", async () => {
    const r = await fetch(`${BASE.replace(/\/$/, "")}/live`).catch(() => null);
    // Through Vercel only /api is proxied; liveness is then checked via the API host instead.
    if (!r || r.status === 404) return "not exposed here (check the API host directly)";
    expect(r.ok, `status ${r.status}`);
  });
  await check("platform", "public career catalogue", async () => {
    const r = await anon.call<{ roles: unknown[]; families: unknown[] }>("GET", "/roles");
    expect(r.status === 200 && r.data.roles.length >= 20 && r.data.families.length === 8, "catalogue incomplete");
    return `${r.data.roles.length} roles, ${r.ms} ms`;
  });
  await check("platform", "unauthenticated access is refused", async () => {
    const r = await anon.call("GET", "/me/target-roles");
    expect(r.status === 401, `status ${r.status}`);
  });

  const journeys = [];
  for (const role of ["backend", "data_analyst", "product_manager"]) journeys.push(await journey(role));

  await check("isolation", "another user can't read an interview", async () => {
    const [a, b] = journeys;
    if (!a.sessionId) return "skipped (no AI session)";
    const r = await b.c.call("GET", `/career/sessions/${a.sessionId}`);
    expect(r.status === 404, `status ${r.status}`);
  });
  await check("isolation", "another user can't use someone else's career profile", async () => {
    const [a, b] = journeys;
    const r = await b.c.call("PATCH", `/me/target-roles/${a.profileId}`, { level: "SENIOR" });
    expect(r.status === 404, `status ${r.status}`);
  });
  if (process.env.SMOKE_R2_PUBLIC_BASE) {
    await check("storage", "bucket does not serve files publicly", async () => {
      const r = await fetch(`${process.env.SMOKE_R2_PUBLIC_BASE!.replace(/\/$/, "")}/resumes/`).catch(() => null);
      expect(!r || r.status >= 400, `public URL answered ${r?.status}`);
    });
  }

  if (process.env.SMOKE_KEEP !== "1")
    for (const j of journeys)
      await check("cleanup", `delete ${j.c.name} account (and its files)`, async () => {
        const r = await j.c.call("DELETE", "/auth/account", { confirm: j.email });
        expect(r.status === 200, `status ${r.status}`);
      });

  const width = Math.max(...results.map((r) => `${r.journey} · ${r.check}`.length));
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${`${r.journey} · ${r.check}`.padEnd(width)}  ${r.ms ?? ""} ms${r.detail ? `  — ${r.detail}` : ""}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed against ${BASE}${AI ? "" : " (AI steps skipped)"}`);
  process.exit(failed ? 1 : 0);
}
await main();
