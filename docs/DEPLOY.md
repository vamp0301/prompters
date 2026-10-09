# Deploying Prompters for free: Render (API) + Vercel (frontend)

```
Browser ──HTTPS──▶ Vercel (Next.js)  ── /api/* rewrite ──▶  Render web service (Express API + workers)
                    first-party cookie                         │
                                                               ├──▶ Neon Postgres (Singapore)
                                                               ├──▶ Redis (Upstash, TCP)
                                                               ├──▶ Cloudflare R2 (files)
                                                               └──▶ Gemini API
```

The browser only ever talks to the Vercel URL. Vercel forwards `/api/*` to Render, so the session
cookie is first-party and works in every browser. Vercel waits up to 120 s for Render to answer,
which covers slow AI calls and Render's cold start.

## What the free plans give you — and don't

| Service | Free plan limits that matter here |
|---|---|
| **Render** web service | Sleeps after **15 min without traffic**; the next visit waits **about 1 minute**. 750 instance hours/month (one service running all month fits). **No background-worker service** → the workers run inside the API (`RUN_WORKERS_IN_API=true`). **Disk is wiped** on every deploy, restart or sleep → files must go to object storage. |
| **Vercel** Hobby | Free for personal, **non-commercial** use. For a commercial launch, use Vercel Pro. |
| **Neon** | Your existing project (`ap-southeast-1`). Compute pauses when idle and wakes in about a second. |
| **Upstash Redis** | **500K commands/month.** Workers poll Redis while idle; the code keeps that low (30 s long-poll), and Render sleeping stops it completely. Watch the usage graph in the first week. |
| **Cloudflare R2** | 10 GB free. **Cloudflare asks for a card** when you first enable R2 (no charge within the free limits). |
| **Gemini** | Free-tier daily quota per model — the real bottleneck for AI features. |

Turned off on this setup, by design:
- **Running user code** (build tasks, coding turns in interviews): needs Docker, which the free plan doesn't have. `SANDBOX_DRIVER=disabled`; the app shows these features as unavailable.
- **The Python ML service** is not deployed. Recommendations use the transparent baseline ranker (the app says so). Leave `ML_SERVICE_URL` unset.

## Environment variables

### Render (backend)

**Required — the API refuses to start without these:**

| Variable | Value | Where to get it |
|---|---|---|
| `NODE_ENV` | `production` | (preset in `render.yaml`) |
| `DATABASE_URL` | Neon **pooled** connection string (`…-pooler…`) | Neon console → Connect → Pooled |
| `DIRECT_URL` | Neon **direct** connection string (no `-pooler`) | Neon console → Connect → turn pooling off. Used by migrations. |
| `REDIS_URL` | `rediss://default:<password>@<host>.upstash.io:6379` | Upstash console → your database → **TCP** connection (not the REST URL) |
| `JWT_SECRET` | 32+ random characters | Generated automatically by `render.yaml` |
| `CORS_ORIGIN` | your Vercel URL, e.g. `https://prompters.vercel.app` (no trailing slash) | Vercel, after the first deploy |
| `APP_URL` | the same Vercel URL | — |
| `SANDBOX_DRIVER` | `disabled` | (preset) |
| `RUN_WORKERS_IN_API` | `true` | (preset) |
| `TRUST_PROXY_HOPS` | `2` | (preset: Vercel + Render proxies) |

**AI features (Career AI, Manisha, Top-100, project modules) — without these they are switched off:**

| Variable | Value | Where to get it |
|---|---|---|
| `AI_PROVIDER` | `gemini` | (preset) |
| `AI_API_KEY` | your Gemini API key | [Google AI Studio](https://aistudio.google.com/apikey) |
| `AI_MODEL` | `gemini-flash-latest` | (preset) |
| `AI_FALLBACK_MODELS` | `gemini-flash-lite-latest,gemini-3.5-flash-lite` | (preset) |

**File storage (resumes, interview audio, PDF packs) — strongly recommended; without it files vanish on every restart:**

| Variable | Value | Where to get it |
|---|---|---|
| `STORAGE_DRIVER` | `s3` | (preset) |
| `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` | Cloudflare → R2 → bucket → Settings (S3 API) |
| `S3_REGION` | `auto` | (preset) |
| `S3_BUCKET` | your bucket name, e.g. `prompters-files` | the bucket you create (keep it **private**) |
| `S3_ACCESS_KEY_ID` | R2 API token access key | Cloudflare → R2 → Manage API tokens → *Object Read & Write*, this bucket only |
| `S3_SECRET_ACCESS_KEY` | R2 API token secret | shown once when you create the token |

**Optional:**

| Variable | Default | Purpose |
|---|---|---|
| `GOOGLE_CLIENT_ID` | — | "Sign in with Google". Must equal the frontend's `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. |
| `PREP_DAILY_PLAN_LIMIT` | `3` | Top-100 plans per user per 24 h (each is ~20–25 Gemini calls) |
| `RECORDING_RETENTION_DAYS` | `30` | Interview audio is deleted after this many days |

**Do not set:** `PORT` (Render sets it), `RATE_LIMIT_DISABLED`, `COOKIE_SECURE=false`, `SANDBOX_DRIVER=process`, `ML_*`.
**Not used by the code** (safe to leave out even though your local `.env` has them): `GOOGLE_CLIENT_SECRET`, `ENCRYPTION_KEY`, `SESSION_SECRET`, `UPSTASH_REDIS_REST_TOKEN`.

### Vercel (frontend)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | your Render URL, e.g. `https://prompters-api.onrender.com` (no trailing slash) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | optional; same value as the backend's `GOOGLE_CLIENT_ID` |

`NEXT_PUBLIC_*` values are baked in at build time: after changing one, **redeploy**.

## Steps (in this order)

### 1. Object storage (Cloudflare R2) — 5 min
1. Cloudflare dashboard → **R2** → enable it (adds a card; free within 10 GB).
2. **Create bucket** `prompters-files`. Leave public access **off**.
3. **Manage R2 API tokens → Create token**: permission *Object Read & Write*, scoped to `prompters-files`.
4. Keep these four values: account endpoint, bucket name, access key id, secret.

### 2. Redis
Use your existing Upstash database. In its settings set **Eviction → off** (`noeviction`): BullMQ jobs must never be evicted. Copy the **TCP** URL (`rediss://…:6379`).

### 3. Backend on Render — 10 min
1. [Render dashboard](https://dashboard.render.com) → **New → Blueprint** → connect GitHub → choose `vamp0301/prompters`. Render reads `render.yaml`.
2. Fill in every value it asks for (the `sync: false` ones). For `CORS_ORIGIN` and `APP_URL` use a placeholder like `https://prompters.vercel.app` for now; you'll correct it in step 5.
3. **Apply**. The first build takes a few minutes. The start command runs `prisma migrate deploy` first (your Neon database is already up to date, so this is a no-op).
4. Open `https://<your-service>.onrender.com/health`. Expected:
   `{"success":true,"data":{"database":true,"redis":true,"worker":true}}`

### 4. Frontend on Vercel — 5 min
1. [Vercel](https://vercel.com/new) → **Import** `vamp0301/prompters`.
2. **Root Directory: `frontend`** (important — the repo has two apps). Framework: Next.js (auto-detected).
3. Environment variables: `NEXT_PUBLIC_API_URL` = your Render URL; `NEXT_PUBLIC_GOOGLE_CLIENT_ID` if you use Google sign-in.
4. **Deploy**, then note the production URL (e.g. `https://prompters.vercel.app`).

### 5. Connect them
1. Render → your service → **Environment**: set `CORS_ORIGIN` and `APP_URL` to the exact Vercel URL. Save (Render redeploys).
2. Google sign-in only: [Google Cloud console](https://console.cloud.google.com/apis/credentials) → your OAuth client → **Authorized JavaScript origins** → add the Vercel URL.

### 6. Check it works
- [ ] Open the Vercel URL; register and log in (cookie sticks after refresh)
- [ ] Upload a resume (tests R2 + Gemini)
- [ ] Generate a Top-100 plan (tests the in-process worker)
- [ ] Open **My projects** and a project module
- [ ] Start a Manisha interview, answer one question
- [ ] Download a PDF pack
- [ ] Wait 20 minutes, open the site again: first request takes ~1 min (Render waking), then normal

## After every deploy: smoke test

From your machine (never commit credentials; the script prints no secrets):

```
cd backend
SMOKE_BASE_URL=https://<your-app>.vercel.app npm run smoke          # full journeys (uses Gemini a few times)
SMOKE_BASE_URL=https://<your-app>.vercel.app SMOKE_AI=0 npm run smoke   # no AI calls
```

It registers three throwaway students (Backend, Data Analyst, Product Manager), checks onboarding,
career profiles, recommendations, a career interview and its report, cross-user isolation, then
deletes the accounts and their files. Optional `SMOKE_R2_PUBLIC_BASE=https://pub-….r2.dev` checks the
bucket does not serve files publicly (leave the bucket private — the API streams files after an
ownership check).

## What runs automatically on start (safe to repeat)

- `prisma migrate deploy` — applies only pending migrations. Re-running reports "No pending migrations".
  Recent ones: `20261015090000_hardening_indexes`, `20261016090000_career_taxonomy`,
  `20261017090000_interview_profiles` (adds `InterviewSession.targetRoleProfileId` and links old
  interviews to a career only when unambiguous), `20261018090000_content_governance`.
- Career catalogue sync — under a Redis lock (several instances can start together); writes only
  roles whose framework changed and never touches practitioner reviews. A second start writes nothing.

## Content review (practitioner sign-off)

All 29 role frameworks start **unreviewed** and say so in the app. When a practitioner has reviewed
one, an ADMIN records it (audited):

```
POST /api/admin/roles/<roleKey>/review
{ "status": "REVIEWED", "reviewedBy": "Full name", "reviewerCredentials": "e.g. Senior PM, 9 years", "notes": "…" }
```

A review covers the framework version in force; if the framework later changes, the role becomes
unreviewed again. Nothing (including AI generation) marks a role reviewed automatically.

## Important notes

- **Same database as your laptop.** Your local `backend/.env` points at the same Neon `production` branch. Anything you do locally changes live data. Create a Neon branch for local development and point your local `.env` at it.
- **Rotate credentials** that were used during development (Gemini key, Upstash password, Neon password, Google client) before real users arrive.
- **Super admin:** if the production database was never seeded with an admin, run once from your machine with `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` set: `cd backend && npm run db:seed`. Then change that password in the app.
- **Preview deployments** on Vercel get different URLs; logins from them are rejected by the CSRF check unless you add those URLs to `CORS_ORIGIN` (comma-separated).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Render log: `Refusing to start in production: …` | A required variable is missing or unsafe — the message names it. |
| `Request origin not allowed` (403) on login or save | `CORS_ORIGIN` / `APP_URL` don't exactly match the Vercel URL (check `https://`, no trailing slash). |
| First page load hangs ~1 min, then works | Render free service was asleep. Expected on the free plan. |
| AI features say they're unavailable | `AI_API_KEY` missing, or the Gemini daily quota is used up (resets daily). |
| Uploaded resumes/recordings disappear after a while | `STORAGE_DRIVER` is still `local`; set up R2 (step 1). |
| Top-100 plan stays "generating" | `/health` shows `"worker": false` → check `RUN_WORKERS_IN_API=true` and `REDIS_URL`. |
| Upstash "max requests limit exceeded" | Free command quota used up; it resets monthly. Upgrade Upstash, or use a Render Key Value instance (free, in-memory, same region) and set `REDIS_URL` to its internal URL. |
