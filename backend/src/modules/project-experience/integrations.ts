import type { Diagram } from "../career/knowledge.schemas.js";
import type { Evidence, Facts } from "./extract.js";
import { categoryOf, techInfo, techKey } from "./tech.js";

/**
 * API & Integration map. Classifies what a project talks to into five kinds (they are NOT the same
 * thing — a database is infrastructure, not a REST API) and attaches hand-written, general guides:
 * how each kind works, the questions interviewers ask about it, and what can fail. Only integrations
 * the resume or the candidate's facts mention are listed; the guides are general knowledge and are
 * labelled as such. Nothing here claims how the candidate implemented anything.
 */

export const INTEGRATION_KINDS = ["OWN_REST", "INTERNAL_SERVICE", "THIRD_PARTY", "INFRASTRUCTURE", "BROWSER"] as const;
export type IntegrationKind = (typeof INTEGRATION_KINDS)[number];
export const KIND_LABEL: Record<IntegrationKind, string> = {
  OWN_REST: "Own REST API",
  INTERNAL_SERVICE: "Internal services",
  THIRD_PARTY: "Third-party web APIs",
  INFRASTRUCTURE: "Infrastructure services",
  BROWSER: "Browser APIs",
};

export interface Integration {
  kind: IntegrationKind;
  name: string;
  /** Where we know it from: the resume or the candidate's facts. Never inferred. */
  basis: "RESUME" | "USER_FACT";
  /** Which guide explains it. */
  guide: GuideKey;
}

type GuideKey = "rest" | "internal" | "ai" | "auth" | "storage" | "messaging" | "payments" | "database" | "cache" | "queue" | "sandbox" | "hosting" | "search" | "browser";

const NOT_A_SERVICE = new Set(["jwt", "server sessions", "pm2", "systemd", "github actions", "jenkins", "bare vm"]);
const BACKEND_FRAMEWORKS = new Set(["expressjs", "nestjs", "fastify", "nextjs", "django", "fastapi", "flask", "spring boot", "nodejs", "rest", "graphql", "trpc"]);

/** Browser APIs worth knowing as engineering dependencies (general facts; support notes are deliberately conservative). */
export const BROWSER_APIS: Record<string, { what: string; why: string; permission: string; security: string; support: string; fallback: string }> = {
  SpeechRecognition: { what: "Turns microphone speech into text in the browser.", why: "Voice answers without sending audio to your own server.", permission: "Microphone", security: "Audio may be processed by the browser vendor's service; tell users.", support: "Chromium browsers (prefixed); limited or absent elsewhere — check MDN before relying on it.", fallback: "Let the user type the answer." },
  speechSynthesis: { what: "Reads text aloud with the device's voices.", why: "Speak questions or feedback without a TTS server.", permission: "None", security: "Low risk; voices differ per device.", support: "Widely supported; available voices vary by OS.", fallback: "Show the text on screen." },
  getUserMedia: { what: "Gives access to the microphone and/or camera.", why: "Recording or live audio/video.", permission: "Microphone / camera prompt", security: "Only on HTTPS; never record without clear consent; stop tracks when done.", support: "Modern browsers on secure origins.", fallback: "Text input; explain how to allow access." },
  MediaRecorder: { what: "Records a media stream into audio/video chunks.", why: "Keep an answer's audio for replay or review.", permission: "Needs a stream (getUserMedia)", security: "Recorded data is personal — store privately, delete on schedule.", support: "Modern browsers; supported formats differ (webm vs mp4).", fallback: "Keep only the transcript." },
  getDisplayMedia: { what: "Lets the user share their screen or a window.", why: "Screen sharing in a session (e.g. integrity checks).", permission: "Explicit screen-share prompt each time", security: "May expose private content; only use what you need.", support: "Desktop browsers; not on most mobile browsers.", fallback: "Explain the requirement; run without it if allowed." },
  Fullscreen: { what: "Puts an element or the page into full screen.", why: "Focused test or interview mode.", permission: "Must start from a user gesture", security: "Users can always exit; treat exits as signals, not proof.", support: "Widely supported (iOS Safari limits it for non-video elements).", fallback: "Run windowed and note it." },
  "Page Visibility": { what: "Tells you when the tab is hidden or visible.", why: "Pause timers or record tab switches.", permission: "None", security: "A signal, never proof of cheating.", support: "Widely supported.", fallback: "Don't depend on it for scoring." },
  Permissions: { what: "Queries whether a permission (e.g. microphone) is granted.", why: "Show the right message before asking.", permission: "None", security: "Low risk.", support: "Partial — not every permission name is supported everywhere.", fallback: "Just request access and handle denial." },
  IndexedDB: { what: "A structured database inside the browser.", why: "Keep larger data (e.g. a file) offline or before sign-up.", permission: "None (storage quota)", security: "Readable by scripts on your origin; don't store secrets.", support: "Widely supported; private modes may limit it.", fallback: "Ask the user to re-upload." },
  localStorage: { what: "Small key-value storage in the browser.", why: "Remember preferences such as theme.", permission: "None", security: "Never store tokens or secrets — any script on the page can read it.", support: "Widely supported.", fallback: "Use defaults." },
  Clipboard: { what: "Reads or writes the clipboard.", why: "Copy buttons.", permission: "Writing usually needs a user gesture; reading needs permission", security: "Don't read the clipboard without a clear reason.", support: "Modern browsers on HTTPS.", fallback: "Select the text for the user to copy." },
  FileReader: { what: "Reads files the user picked.", why: "Preview or upload a document.", permission: "User must pick the file", security: "Validate type and size; never trust the file name.", support: "Widely supported.", fallback: "Plain form upload." },
  ResizeObserver: { what: "Notifies when an element changes size.", why: "Responsive components.", permission: "None", security: "None.", support: "Widely supported.", fallback: "Window resize events." },
  matchMedia: { what: "Checks media queries from JavaScript.", why: "Dark mode or reduced-motion preferences.", permission: "None", security: "None.", support: "Widely supported.", fallback: "CSS-only behaviour." },
  fetch: { what: "Makes HTTP requests from the page.", why: "Calls the project's own API.", permission: "None (CORS rules apply)", security: "Send cookies only to your own origin; handle CSRF.", support: "Universal in modern browsers.", fallback: "None needed." },
  WebSocket: { what: "A persistent two-way connection to a server.", why: "Real-time updates (chat, live data).", permission: "None", security: "Authenticate the connection; validate every message.", support: "Widely supported.", fallback: "Polling or Server-Sent Events." },
};

const BROWSER_ALIASES: [RegExp, string][] = [
  [/speech\s*recognition|speech[-\s]?to[-\s]?text in the browser|web speech/i, "SpeechRecognition"],
  [/speech\s*synthesis|text[-\s]?to[-\s]?speech in the browser/i, "speechSynthesis"],
  [/getusermedia|microphone access/i, "getUserMedia"],
  [/mediarecorder|record(ing)? audio in the browser/i, "MediaRecorder"],
  [/getdisplaymedia|screen[-\s]?shar/i, "getDisplayMedia"],
  [/fullscreen/i, "Fullscreen"],
  [/page visibility|visibilitychange|tab switch/i, "Page Visibility"],
  [/permissions api/i, "Permissions"],
  [/indexeddb/i, "IndexedDB"],
  [/localstorage|local storage/i, "localStorage"],
  [/clipboard/i, "Clipboard"],
  [/filereader/i, "FileReader"],
  [/resizeobserver/i, "ResizeObserver"],
  [/matchmedia/i, "matchMedia"],
  [/\bfetch\b/i, "fetch"],
  [/websocket|socket\.?io/i, "WebSocket"],
];

const guideFor = (key: string): GuideKey => {
  const cat = categoryOf(key);
  if (key === "oauth" || key === "nextauth" || key === "clerk") return "auth";
  if (cat === "ai") return "ai";
  if (cat === "storage") return "storage";
  if (cat === "messaging") return "messaging";
  if (cat === "payments") return "payments";
  if (cat === "database" || cat === "orm") return "database";
  if (cat === "cache") return "cache";
  if (cat === "queue") return "queue";
  if (key === "docker" || key === "kubernetes") return "sandbox";
  if (cat === "search") return "search";
  return "hosting";
};

/** Every integration the resume or the facts name, classified. */
export function integrationsOf(technologies: string[], facts: Facts, ev: Evidence): Integration[] {
  const out: Integration[] = [];
  const fromResume = new Set(ev.technologies.map((t) => techKey(t) ?? t.toLowerCase()));
  const basisOf = (name: string): Integration["basis"] => (fromResume.has(techKey(name) ?? name.toLowerCase()) ? "RESUME" : "USER_FACT");
  // Next.js can be front-end only, so it counts as an API server only when the resume text says so.
  const saysApi = /\b(api|apis|endpoint|endpoints|route handlers?|webhooks?)\b/i.test([...ev.chunks.map((c) => c.text), ...ev.claims.map((c) => c.claim)].join("\n"));
  const backend = technologies.find((t) => BACKEND_FRAMEWORKS.has(techKey(t) ?? "") && (techKey(t) !== "nextjs" || saysApi));
  if (backend || facts.importantApis?.value) out.push({ kind: "OWN_REST", name: backend ? `REST API (${backend})` : "REST API", basis: backend ? basisOf(backend) : "USER_FACT", guide: "rest" });
  for (const t of technologies) {
    const k = techKey(t);
    if (!k || BACKEND_FRAMEWORKS.has(k)) continue;
    const cat = categoryOf(t);
    // Libraries, formats and build/process tools run inside the app — they aren't services it talks to.
    if (!cat || ["language", "frontend", "styling", "testing", "backend", "orm"].includes(cat) || NOT_A_SERVICE.has(k)) continue;
    const third = cat === "ai" || cat === "messaging" || cat === "payments" || cat === "storage" || k === "oauth" || k === "nextauth" || k === "clerk";
    if (cat === "realtime") continue; // handled as a browser API below
    out.push({ kind: third ? "THIRD_PARTY" : "INFRASTRUCTURE", name: techInfo(k)?.name ?? t, basis: basisOf(t), guide: guideFor(k) });
  }
  for (const s of (facts.internalServices?.value ?? "").split(/[,;\n]/).map((x) => x.trim()).filter(Boolean)) out.push({ kind: "INTERNAL_SERVICE", name: s, basis: "USER_FACT", guide: "internal" });
  const browserText = [facts.browserApis?.value ?? "", ...ev.chunks.map((c) => c.text)].join("\n");
  const browser = new Set<string>();
  for (const [re, name] of BROWSER_ALIASES) if (re.test(browserText)) browser.add(name);
  if (technologies.some((t) => ["websockets", "socketio"].includes(techKey(t) ?? ""))) browser.add("WebSocket");
  for (const name of browser) out.push({ kind: "BROWSER", name, basis: (facts.browserApis?.value ?? "").match(new RegExp(name, "i")) ? "USER_FACT" : "RESUME", guide: "browser" });
  const seen = new Set<string>();
  return out.filter((i) => (seen.has(`${i.kind}:${i.name}`) ? false : (seen.add(`${i.kind}:${i.name}`), true)));
}

// ───────────────────────── general guides (hand-written) ─────────────────────────

const flow = (title: string, objective: string, labels: [string, string?][]): Diagram => ({
  kind: "flow",
  title,
  objective,
  alt: `${title}: ${labels.map(([l]) => l).join(" → ")}`,
  steps: labels.map(([label, note]) => ({ label, ...(note ? { note } : {}) })),
});

export const HTTP_METHODS = [
  { method: "GET", meaning: "Read data. Safe (changes nothing) and idempotent, so it can be cached and retried.", typicalUse: "List or fetch a resource" },
  { method: "POST", meaning: "Create something or trigger an action. Not idempotent: repeating it can create duplicates unless you add an idempotency key.", typicalUse: "Create a record, start a job, submit an answer" },
  { method: "PUT", meaning: "Replace a resource entirely. Idempotent: sending the same body twice leaves the same result.", typicalUse: "Replace a whole settings object" },
  { method: "PATCH", meaning: "Change part of a resource. Send only the fields that change.", typicalUse: "Update one field (status, a fact)" },
  { method: "DELETE", meaning: "Remove a resource. Idempotent: deleting twice ends in the same state.", typicalUse: "Delete a record" },
];

interface Guide {
  title: string;
  flow: Diagram;
  points: string[];
  questions: string[];
  failures: { failure: string; response: string }[];
}

export const GUIDES: Record<GuideKey, Guide> = {
  rest: {
    title: "Your REST API",
    flow: flow("Request lifecycle", "What happens between a request arriving and the response", [["Client request"], ["Authentication", "who is calling?"], ["Authorization", "may they touch this?"], ["Validation", "is the input well-formed?"], ["Business logic"], ["Database / services"], ["Response", "status code + JSON"]]),
    points: ["Group endpoints by business area (auth, profile, orders…).", "Validate every request body and query string.", "Check object ownership on every read and write, not just login.", "Use the right status codes (400 bad input, 401 not signed in, 403 not allowed, 404 not found, 409 conflict, 429 rate limited).", "Rate-limit expensive or abusable endpoints.", "Paginate lists; never return unbounded results."],
    questions: ["Why did you split the API into these groups?", "How does authentication work for these endpoints?", "How do you stop one user reading another user's data?", "How do you validate request bodies?", "Which endpoints must be idempotent, and how do you handle a repeated POST?", "Why PATCH and not PUT for that update?", "Where would you add caching?", "How would you rate-limit this endpoint?", "How would you monitor these APIs in production?", "What happens if the database fails mid-request?"],
    failures: [{ failure: "Invalid input", response: "400 with a clear message" }, { failure: "Database unavailable", response: "Graceful error (5xx), no partial writes" }, { failure: "Traffic spike", response: "Rate limiting and caching" }],
  },
  internal: {
    title: "Internal service",
    flow: flow("Calling an internal service", "How the main backend talks to a separate service", [["Backend"], ["Internal call", "token + timeout"], ["Service"], ["Result"], ["Backend uses it, or falls back"]]),
    points: ["Keep it off the public internet (private network / localhost) and authenticate every call.", "Set a short timeout and decide the fallback before you need it.", "Version what the service returns so the caller knows what produced it."],
    questions: ["Why is this a separate service instead of code inside the backend?", "How does the backend authenticate to it?", "What happens when it's down or slow — what is the fallback?", "How do you version and reload what it serves?", "How do you validate its input and reject malformed requests?", "How do you measure its latency?", "How would you scale and deploy it?", "How do you know it's actually better than the simpler alternative?"],
    failures: [{ failure: "Service down", response: "Fallback path" }, { failure: "Slow response", response: "Timeout, then fallback" }, { failure: "Bad output", response: "Validate and reject" }],
  },
  ai: {
    title: "AI provider",
    flow: flow("Each AI call", "Input to stored result, with validation in between", [["Input"], ["Prompt", "user data fenced"], ["AI provider"], ["Response"], ["Validation", "schema"], ["Application logic"], ["Database / user"]]),
    points: ["Business logic should depend on an AI-provider interface, not on one vendor.", "Validate structured output before using it.", "Treat user text as data in the prompt (prompt injection)."],
    questions: ["Why this provider? Why not OpenAI, Ollama, a local model, or training your own?", "What happens if the provider is unavailable?", "How do you control token/API cost?", "How do you handle rate limits and retries?", "How do you validate output and prevent made-up data?", "How do you prevent prompt injection?", "How do you version prompts and evaluate quality?"],
    failures: [{ failure: "Timeout", response: "Retry once, then a clear error or fallback" }, { failure: "Rate limit / quota", response: "Back off; tell the user" }, { failure: "Malformed output", response: "Validate, retry with the error, then fail cleanly" }],
  },
  auth: {
    title: "Sign-in provider (e.g. Google)",
    flow: flow("Third-party sign-in", "Why the backend, not the browser, decides who you are", [["Browser"], ["Identity provider", "user signs in"], ["Credential / ID token"], ["Backend verifies token", "signature, audience, expiry"], ["Find or create user"], ["Session"]]),
    points: ["Always verify the token on the server: the browser can be tampered with.", "Check the audience (your client id) and expiry.", "Decide how a provider login links to an existing email account."],
    questions: ["Why use this sign-in provider?", "Why verify the token on the backend?", "Why shouldn't the frontend trust the token?", "What happens with an invalid or expired token?", "How do you prevent account takeover?", "How do you link a provider login with an existing account?", "What if the provider is unavailable?"],
    failures: [{ failure: "Invalid token", response: "401, no session" }, { failure: "Provider down", response: "Offer email/password if available" }],
  },
  storage: {
    title: "Object storage",
    flow: flow("Private files", "Upload and authorised download", [["Frontend"], ["Backend", "checks owner"], ["Object storage"], ["Private file"], ["Authorised download", "backend or signed URL"]]),
    points: ["Store files in object storage, not as database blobs.", "Generate keys yourself; never use the user's file name as a path.", "Check ownership before every download; delete files when the record is deleted."],
    questions: ["Why object storage instead of storing files in the database?", "How are files protected from other users?", "How do you generate file keys and prevent path traversal?", "How do you handle deletion and large files?", "What happens if storage is unavailable?"],
    failures: [{ failure: "Upload fails", response: "Retry or clear error; no dangling record" }, { failure: "Storage unavailable", response: "Error on upload/download; data in DB unaffected" }],
  },
  messaging: {
    title: "Messaging API (e.g. WhatsApp)",
    flow: flow("Webhooks in", "How events from the provider reach your system", [["Provider event"], ["Webhook endpoint", "verify signature"], ["Deduplicate", "event id"], ["Queue / process"], ["Database"], ["Acknowledge quickly"]]),
    points: ["Verify webhook signatures.", "Providers retry: make processing idempotent (store event ids).", "Acknowledge fast, process in the background."],
    questions: ["How do webhooks work here?", "How do you verify a webhook really came from the provider?", "What happens if the same event arrives twice?", "How would you handle a million messages a day?", "How do you protect the provider credentials?"],
    failures: [{ failure: "Duplicate event", response: "Idempotent processing" }, { failure: "Provider retries", response: "Fast acknowledge + background work" }],
  },
  payments: {
    title: "Payments API",
    flow: flow("Payment", "Never trust the browser for payment state", [["Checkout"], ["Provider"], ["Webhook", "verify signature"], ["Mark paid", "idempotent"]]),
    points: ["Payment state comes from verified webhooks, not the browser.", "Every payment write must be idempotent."],
    questions: ["How do you confirm a payment really succeeded?", "What happens if the webhook arrives twice or late?", "How do you reconcile failed payments?"],
    failures: [{ failure: "Webhook missed", response: "Reconcile with the provider's API" }],
  },
  database: {
    title: "Database",
    flow: flow("Data access", "From code to stored data", [["Application"], ["ORM / driver"], ["Database"]]),
    points: ["A database is infrastructure, not a REST API.", "Migrations change the schema in versioned steps.", "Multi-step writes that must succeed together go in a transaction."],
    questions: ["Why this database? Why not the alternative?", "Why this ORM / driver — why not raw queries?", "How are migrations handled?", "How are transactions and connections managed?", "What happens if the database is unavailable?", "How would you scale reads? Writes?"],
    failures: [{ failure: "Unavailable", response: "Graceful error; retry later" }, { failure: "Slow queries", response: "Indexes, query fixes, read replicas" }],
  },
  cache: {
    title: "Cache",
    flow: flow("Cache-aside read", "Check the cache, fall back to the database", [["Request"], ["Cache lookup"], ["Hit → return"], ["Miss → database"], ["Store in cache", "with TTL"]]),
    points: ["Decide exactly what is cached, its key and its TTL.", "Invalidate on writes, or accept staleness explicitly.", "The app must still work (slower) if the cache is down."],
    questions: ["What exactly did you cache, and what is the key and TTL?", "How do you invalidate it when data changes?", "What happens if the cache is down?", "How do you avoid a cache stampede?"],
    failures: [{ failure: "Cache down", response: "Read from the database (slower)" }],
  },
  queue: {
    title: "Queue and workers",
    flow: flow("Background job", "Slow work moved out of the request", [["API"], ["Queue", "job added"], ["Broker (e.g. Redis)"], ["Worker"], ["Job runs"], ["Database / AI / sandbox"]]),
    points: ["Use a queue when work is slow or can be retried later.", "Jobs must be safe to retry (idempotent).", "Watch queue depth; scale workers horizontally."],
    questions: ["Why a queue instead of doing it in the request?", "What happens if a worker crashes mid-job?", "What happens if the broker crashes?", "How are jobs retried, and how do you prevent duplicates?", "How do you handle jobs that keep failing?", "What is backpressure, and how do you monitor queue depth?", "How would you scale workers?"],
    failures: [{ failure: "Worker crash", response: "Job retried" }, { failure: "Broker down", response: "Jobs can't be queued — error or delay" }],
  },
  sandbox: {
    title: "Containers",
    flow: flow("Container lifecycle", "From image to a running, checked service", [["Dockerfile"], ["Image build"], ["Registry"], ["Run container", "config + secrets injected"], ["Health check"], ["Replace on deploy"]]),
    points: ["An image packages the app with its runtime so it runs the same everywhere.", "Pass configuration and secrets at runtime, never bake them into the image.", "If containers run untrusted code: no network, CPU/memory/time/process limits, read-only filesystem, non-root user, and clean up after every run."],
    questions: ["Why containers instead of running directly on the server?", "What goes into the image, and how do you keep it small?", "How do you pass configuration and secrets to the container?", "How do you know a container is healthy, and what restarts it?", "If you ran untrusted code in a container, how would you limit CPU, memory, time and network?", "How would you reduce the risk of a container escape?", "What happens if the container runtime is unavailable?"],
    failures: [{ failure: "Container crashes", response: "Restart policy / orchestrator restarts it" }, { failure: "Runtime unavailable", response: "Disable the feature that needs it, with a clear message" }],
  },
  hosting: {
    title: "Hosting / cloud",
    flow: flow("Deployment", "How the app reaches users", [["Code"], ["Build"], ["Server / platform"], ["Users"]]),
    points: ["Know how a deploy happens and how you would roll back.", "Health checks tell the platform when an instance is broken."],
    questions: ["How was it deployed?", "How would you roll back a bad deploy?", "How do you know an instance is healthy?", "How would you scale it?"],
    failures: [{ failure: "Bad deploy", response: "Roll back" }, { failure: "Instance down", response: "Health checks + restart" }],
  },
  search: {
    title: "Search / vector store",
    flow: flow("Retrieval", "Find the most relevant items", [["Query"], ["Embed / search"], ["Store"], ["Ranked results"]]),
    points: ["Isolate data per tenant/user in every query.", "Re-index when data changes."],
    questions: ["Why this store instead of the main database?", "How do you keep one tenant's data out of another's results?", "What happens when it's unavailable?"],
    failures: [{ failure: "Unavailable", response: "Fall back to simpler search or a clear message" }],
  },
  browser: {
    title: "Browser APIs",
    flow: flow("Browser capability", "Ask, use, fall back", [["Feature check"], ["Permission prompt"], ["Use the API"], ["Denied / unsupported → fallback"]]),
    points: ["Check support before using an API; many differ across browsers.", "Ask for permissions only when needed, and handle denial.", "Recorded media is personal data: consent, private storage, deletion."],
    questions: ["Why do this in the browser instead of on the server?", "What happens if the browser doesn't support it?", "What happens if permission is denied?", "How do you protect recorded data, and how long is it kept?"],
    failures: [{ failure: "Unsupported", response: "Fallback (e.g. typing)" }, { failure: "Permission denied", response: "Explain and continue without it" }],
  },
};

/** What to measure and watch for any API (general; no project numbers are claimed). */
export const API_CHECKLISTS = {
  security: ["Authentication", "Authorization / object ownership", "Input validation", "Rate limiting", "CSRF and CORS", "Secrets handling", "Token handling", "Webhook verification", "Tenant isolation", "Sensitive fields in responses", "Logging without personal data", "No internal errors leaked to users"],
  performance: ["Latency (p50, p95, p99)", "Throughput", "Error rate", "Database time", "External API time", "Queue wait time"],
  observability: ["Structured logs", "Metrics", "Tracing", "Correlation / request IDs", "Error tracking", "Health, readiness and liveness checks", "Queue monitoring", "AI provider and database latency"],
  testing: ["Unit tests", "Integration tests", "Contract tests", "Authentication tests", "Authorization (cross-user) tests", "Failure tests (dependency down)", "Rate-limit tests", "Idempotency tests", "Security tests"],
};

// ───────────────────────── per-project map ─────────────────────────

export const MEASUREMENT_NOT_PROVIDED = "Measurement not provided.";
export const TESTS_NOT_CLAIMED = "Not specified — no tests are claimed unless you add them in Facts.";

export interface FailureRow {
  dependency: string;
  failure: string;
  /** IMPLEMENTED = the candidate's own fact says they built it; RECOMMENDED = general advice. */
  status: "IMPLEMENTED" | "RECOMMENDED";
  response: string;
}

export interface ApiQuestion {
  key: string;
  question: string;
  level: number;
  kind: IntegrationKind | "SYSTEM";
  dimension: "API" | "ARCHITECTURE" | "SECURITY" | "PERFORMANCE" | "SCALABILITY" | "DATABASE";
  skill: string;
}

const lines = (v: string | null | undefined) => (v ?? "").split(/\n|;/).map((x) => x.trim()).filter(Boolean);
const mentions = (text: string, name: string) => {
  const core = name.replace(/\s*\(.*\)$/, "").toLowerCase();
  return core.length > 1 && text.toLowerCase().includes(core);
};

/** Only a fallback the candidate says they built is IMPLEMENTED; everything else is "Recommended fallback". */
export function failureMatrix(integrations: Integration[], facts: Facts): FailureRow[] {
  const built = lines(facts.implementedFallbacks?.value);
  const rows: FailureRow[] = [];
  for (const i of integrations) {
    const own = built.filter((b) => mentions(b, i.name));
    if (own.length) for (const b of own) rows.push({ dependency: i.name, failure: "Described in your facts", status: "IMPLEMENTED", response: b });
    for (const f of GUIDES[i.guide].failures) rows.push({ dependency: i.name, failure: f.failure, status: "RECOMMENDED", response: f.response });
  }
  return rows;
}

const LEVEL_DIM: ApiQuestion["dimension"][] = ["API", "API", "API", "SECURITY", "SCALABILITY", "SCALABILITY"];

/** Section 46: one endpoint, drilled from "what" to "design it for other teams". */
export function drainChain(facts: Facts): ApiQuestion[] {
  const endpoint = lines(facts.importantApis?.value)[0];
  const it = endpoint ? `your ${endpoint} endpoint` : "your most important endpoint";
  return [
    `What does ${it} do, and which HTTP method does it use — why that one?`,
    `What does ${it} validate, and how do you check the caller is allowed to touch that data?`,
    `What happens if the same request to ${it} is sent twice, or the database fails halfway through?`,
    `How would ${it} behave at ten times the traffic — what would you cache, rate-limit or move to a queue?`,
    `If another team depended on ${it}, how would you version it and change it without breaking them?`,
  ].map((question, i) => ({ key: `api-chain-${i + 1}`, question, level: i + 1, kind: "OWN_REST" as const, dimension: (["API", "SECURITY", "API", "SCALABILITY", "ARCHITECTURE"] as const)[i], skill: "REST API design" }));
}

/** Section 58: the whole system, across every dependency. */
export function architectureTest(integrations: Integration[]): ApiQuestion[] {
  const names = integrations.map((i) => i.name.replace(/\s*\(.*\)$/, ""));
  const list = names.length ? names.slice(0, 6).join(", ") : "each part";
  return [
    { level: 3, q: `Walk through one request end to end, through ${list}. Where does each step happen?`, d: "ARCHITECTURE" as const },
    { level: 4, q: "Which single dependency failing would hurt users most? What happens today, and what should happen?", d: "ARCHITECTURE" as const },
    { level: 4, q: "Where are the security boundaries in this system — what is trusted, and what is checked at each one?", d: "SECURITY" as const },
    { level: 5, q: "If users grew ten times, what breaks first, and what would you change first?", d: "SCALABILITY" as const },
    { level: 5, q: "Which architecture decision would you defend in a design review, and which would you reverse?", d: "ARCHITECTURE" as const },
  ].map((x, i) => ({ key: `arch-${i + 1}`, question: x.q, level: x.level, kind: "SYSTEM" as const, dimension: x.d, skill: "System design" }));
}

/** Guide questions for one integration, levelled by their order (guides go from "why" to failure and scale). */
function guideQuestions(i: Integration, idx: number): ApiQuestion[] {
  const g = GUIDES[i.guide];
  const name = i.name.replace(/\s*\(.*\)$/, "");
  return g.questions.map((q, j) => {
    const level = 1 + Math.floor((j * 5) / g.questions.length);
    return {
      key: `int${idx + 1}-${j + 1}`,
      question: i.guide === "browser" ? q.replace("do this in the browser", `use ${name} in the browser`) : q.replace(/\bthis (provider|database|store|sign-in provider|service)\b/i, `${name}`),
      level,
      kind: i.kind,
      dimension: i.guide === "database" ? "DATABASE" : (LEVEL_DIM[level] ?? "API"),
      skill: i.kind === "BROWSER" ? "Browser APIs" : i.kind === "OWN_REST" ? "REST API design" : name,
    };
  });
}

export const API_FOCUS = ["ALL", ...INTEGRATION_KINDS] as const;
export type ApiFocus = (typeof API_FOCUS)[number];

/** API Interview Mode (section 57): questions for one kind, or a full-system round. */
export function apiInterview(integrations: Integration[], facts: Facts, focus: ApiFocus): ApiQuestion[] {
  const pool = integrations.filter((i) => focus === "ALL" || i.kind === focus);
  const byIntegration = pool.map((i, idx) => guideQuestions(i, integrations.indexOf(i) >= 0 ? integrations.indexOf(i) : idx));
  if (focus !== "ALL") {
    const qs = [...(focus === "OWN_REST" ? drainChain(facts) : []), ...byIntegration.flat()];
    return [...qs].sort((a, b) => a.level - b.level).slice(0, 15);
  }
  // Full system: the endpoint chain (only if the project has its own API), two questions per integration (one easy, one hard), then the architecture test.
  const picks = byIntegration.flatMap((qs) => [qs[0], qs[qs.length - 1]].filter((q, k, a) => q && a.indexOf(q) === k));
  const ownApi = integrations.some((i) => i.kind === "OWN_REST");
  return [...(ownApi ? drainChain(facts) : []), ...picks.slice(0, 8), ...architectureTest(integrations)].sort((a, b) => a.level - b.level);
}

/** Everything the "APIs" tab shows. Computed from the resume and facts on every view — no AI involved. */
export function integrationMap(technologies: string[], facts: Facts, ev: Evidence) {
  const integrations = integrationsOf(technologies, facts, ev);
  const kinds = INTEGRATION_KINDS.map((kind) => {
    const items = integrations.filter((i) => i.kind === kind);
    const guides = [...new Set(items.map((i) => i.guide))].map((g) => ({ key: g, ...GUIDES[g] }));
    return { kind, label: KIND_LABEL[kind], items: items.map((i) => ({ name: i.name, basis: i.basis, guide: i.guide })), guides };
  }).filter((k) => k.items.length);
  const browser = integrations.filter((i) => i.kind === "BROWSER").map((i) => ({ name: i.name, basis: i.basis, ...BROWSER_APIS[i.name] }));
  const endpoints = lines(facts.importantApis?.value);
  return {
    kinds,
    endpoints: endpoints.length ? endpoints : null,
    methods: integrations.some((i) => i.kind === "OWN_REST") ? HTTP_METHODS : [],
    browser,
    failures: failureMatrix(integrations, facts),
    chain: integrations.some((i) => i.kind === "OWN_REST") ? drainChain(facts) : [],
    architecture: architectureTest(integrations),
    checklists: API_CHECKLISTS,
    measurements: facts.apiMeasurements?.value ? { value: facts.apiMeasurements.value, basis: "USER_FACT" as const } : { value: MEASUREMENT_NOT_PROVIDED, basis: "NOT_SPECIFIED" as const },
    testing: facts.apiTesting?.value ? { value: facts.apiTesting.value, basis: "USER_FACT" as const } : { value: TESTS_NOT_CLAIMED, basis: "NOT_SPECIFIED" as const },
    focuses: API_FOCUS.filter((f) => f === "ALL" || integrations.some((i) => i.kind === f)),
  };
}
export type IntegrationMap = ReturnType<typeof integrationMap>;
