# Deploying Prompters for free: Render (API) + Vercel (frontend)

```
Browser ──HTTPS──▶ Vercel (Next.js)  ── /api/* rewrite ──▶  Render web service (Express API + workers)
                    first-party cookie                         │
                                                               ├──▶ Neon Postgres (Singapore)
                                                               ├──▶ Redis (Upstash, TCP)
                                                               └──▶ Gemini API
```

The browser only ever talks to the Vercel URL. Vercel forwards `/api/*` to Render, so the session
cookie is first-party and works in every browser. Vercel waits up to 120 s for Render to answer,
which covers slow AI calls and Render's cold start.

## What the free plans give you — and don't

| Service | Free plan limits that matter here |
|---|---|
| **Render** web service | Sleeps after **15 min without traffic**; the next visit waits **about 1 minute**. 750 instance hours/month (one service running all month fits). **No background-worker service** → the workers run inside the API (`RUN_WORKERS_IN_API=true`). **Disk is wiped** on every deploy, restart or sleep → no user file is ever written to it (`STORAGE_DRIVER=none`). |
| **Vercel** Hobby | Free for personal, **non-commercial** use. For a commercial launch, use Vercel Pro. |
| **Neon** | Your existing project (`ap-southeast-1`). Compute pauses when idle and wakes in about a second. |
| **Upstash Redis** | **500K commands/month.** Workers poll Redis while idle; the code keeps that low (30 s long-poll), and Render sleeping stops it completely. Watch the usage graph in the first week. |
| **Gemini** | Free-tier daily quota per model — the real bottleneck for AI features. |

Turned off on this setup, by design:
- **Running user code** (build tasks, coding turns in interviews): needs Docker, which the free plan doesn't have. `SANDBOX_DRIVER=disabled`; the app shows these features as unavailable.
- **Keeping uploaded files and interview audio**: there is no object storage on this setup (`STORAGE_DRIVER=none`, `AUDIO_RECORDING=false`). See [Without object storage](#without-object-storage) for exactly what that changes.
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
| `CORS_ORIGIN` | your Vercel URL, e.g. `https://prompters-steel.vercel.app` (no trailing slash) | Vercel, after the first deploy |
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

**File storage — none on this setup (preset):**

| Variable | Value | Notes |
|---|---|---|
| `STORAGE_DRIVER` | `none` | (preset) No user files are kept. `local` is refused in production because Render's disk is wiped. |
| `AUDIO_RECORDING` | `false` | (preset) Interview answer audio is never kept. `true` is refused while `STORAGE_DRIVER=none`. |

**Manisha's cloud voice — optional, off by default.** Turn it on only after `npm run test:real-voice` passes locally and provider-side usage alerts or prepaid credit are in place. Without these, Manisha uses the browser's own voice and speech recognition (as before). Each provider is used only when its `*_PROVIDER` is set **and** its key is present; if it fails or runs out, the browser takes over automatically.

| Variable | Value | Where to get it |
|---|---|---|
| `STT_PROVIDER` | `deepgram` to enable (preset `browser` = off) | — |
| `DEEPGRAM_API_KEY` | Deepgram API key (Member role is enough) | [console.deepgram.com](https://console.deepgram.com) → API Keys |
| `DEEPGRAM_MODEL` / `DEEPGRAM_LANGUAGE` | defaults `nova-3` / `en` | — |
| `TTS_PROVIDER` | `elevenlabs` to enable (preset `browser` = off) | — |
| `ELEVENLABS_API_KEY` | ElevenLabs API key (Text to Speech permission only) | [elevenlabs.io](https://elevenlabs.io/app/settings/api-keys) |
| `ELEVENLABS_VOICE_ID` | the voice Manisha uses | ElevenLabs → Voices → ⋯ → Copy voice ID |
| `ELEVENLABS_MODEL` | default `eleven_flash_v2_5` (fastest) | — |
| `TTS_MONTHLY_CHAR_LIMIT` | default `9000` — keep it under your plan's monthly characters | — |
| `TTS_USER_DAILY_CHAR_LIMIT` | default `3000` per student per day | — |
| `STT_USER_DAILY_TOKEN_LIMIT` | default `150` streaming connections per student per day | — |

How it's wired: the browser streams microphone audio **directly to Deepgram** using a 30-second token the API issues for the candidate's own open interview (the API key never reaches the browser; `mip_opt_out` keeps audio out of Deepgram's model training). Speech is requested from the API, which checks the caps and streams ElevenLabs' audio back; usage counters live in Redis, and only character counts are logged — never text or audio. Limits are enforced in Redis atomically; if Redis is unreachable, both cloud engines step aside rather than run unmetered. **Remaining cost risk:** a Deepgram token only limits *opening* a stream, and an open stream is billed until it closes, so a student who keeps a voice answer open runs up minutes. The daily connection cap bounds how many streams can be opened, not how long each one lasts; use prepaid Deepgram credit (no card) or a project usage alert as the hard ceiling. Check the free allowances in each dashboard before relying on them (at the time of writing: ElevenLabs free ≈ 10,000 characters/month ≈ 3–5 interviews; Deepgram gives starter credit). After setting keys, verify with `cd backend && npm run test:real-voice` (speaks a sentence with ElevenLabs and transcribes it back with Deepgram).

**Optional:**

| Variable | Default | Purpose |
|---|---|---|
| `GOOGLE_CLIENT_ID` | — | "Sign in with Google". Must equal the frontend's `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. |
| `PREP_DAILY_PLAN_LIMIT` | `3` | Top-100 plans per user per 24 h (each is ~20–25 Gemini calls) |
| `RECORDING_RETENTION_DAYS` | `30` | Interview audio is deleted after this many days (only matters with `AUDIO_RECORDING=true`) |

**Do not set:** `PORT` (Render sets it), `RATE_LIMIT_DISABLED`, `COOKIE_SECURE=false`, `SANDBOX_DRIVER=process`, `ML_*`.
**Not used by the code** (safe to leave out even though your local `.env` has them): `GOOGLE_CLIENT_SECRET`, `ENCRYPTION_KEY`, `SESSION_SECRET`, `UPSTASH_REDIS_REST_TOKEN`.

### Vercel (frontend)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | your Render URL, e.g. `https://prompters-api.onrender.com` (no trailing slash) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | optional; same value as the backend's `GOOGLE_CLIENT_ID` |

`NEXT_PUBLIC_*` values are baked in at build time: after changing one, **redeploy**.

## Steps (in this order)

### If the Render service was created by hand (Docker runtime)

The Blueprint presets the variables below; a hand-made service does not, and the API's safe production
checks only run when `NODE_ENV=production`. Settings → **Dockerfile Path** `./backend/Dockerfile`,
**Docker Build Context** `./backend`, **Health Check Path** `/live`. Then in **Environment**:

| Variable | Value | Why |
|---|---|---|
| `NODE_ENV` | `production`, or delete it (the image sets it) | **Never paste the local `.env`** — its `NODE_ENV=development` turns off every production check (insecure cookies, user code running on the host). The API refuses to start on Render without it. |
| `RUN_WORKERS_IN_API` | `true` | Without it `/health` shows `"worker": false` and Top-100 plans, PDF packs and project modules stay queued forever. |
| `TRUST_PROXY_HOPS` | `2` | Vercel + Render proxies, so rate limits see the real client IP. |
| `SANDBOX_DRIVER` | `disabled` (the production default when unset) | No Docker on Render. |
| `STORAGE_DRIVER` / `AUDIO_RECORDING` | `none` / `false` (the production defaults when unset) | See [Without object storage](#without-object-storage). |
| `CORS_ORIGIN`, `APP_URL` | the exact Vercel URL | Otherwise login and sign-up fail with `CSRF_REJECTED`. |
| `JWT_SECRET` | a fresh 32+ character random value | Not the one from your local `.env`. |

Plus `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `AI_PROVIDER`/`AI_API_KEY`/`AI_MODEL`/`AI_FALLBACK_MODELS` as in the tables above.
Do not set `PORT` (Render injects it; the API listens on it).

### 1. Redis
Use your existing Upstash database. In its settings set **Eviction → off** (`noeviction`): BullMQ jobs must never be evicted. Copy the **TCP** URL (`rediss://…:6379`).

### 2. Backend on Render — 10 min
1. [Render dashboard](https://dashboard.render.com) → **New → Blueprint** → connect GitHub → choose `vamp0301/prompters`. Render reads `render.yaml`.
2. Fill in every value it asks for (the `sync: false` ones). For `CORS_ORIGIN` and `APP_URL` use a placeholder like `https://prompters-steel.vercel.app` for now; you'll correct it in step 4.
3. **Apply**. The first build takes a few minutes. The start command runs `prisma migrate deploy` first (your Neon database is already up to date, so this is a no-op).
4. Open `https://<your-service>.onrender.com/health`. Expected:
   `{"success":true,"data":{"database":true,"redis":true,"worker":true}}`

### 3. Frontend on Vercel — 5 min
1. [Vercel](https://vercel.com/new) → **Import** `vamp0301/prompters`.
2. **Root Directory: `frontend`** (important — the repo has two apps). Framework: Next.js (auto-detected).
3. Environment variables: `NEXT_PUBLIC_API_URL` = your Render URL; `NEXT_PUBLIC_GOOGLE_CLIENT_ID` if you use Google sign-in.
4. **Deploy**, then note the production URL (e.g. `https://prompters-steel.vercel.app`). Use the alias
   Vercel shows under *Domains* — `<project>.vercel.app` may belong to someone else's project. The
   `…-<team>.vercel.app` URLs are behind Vercel deployment protection and redirect to a login.
   A build without an `https://` `NEXT_PUBLIC_API_URL` fails on purpose.

### 4. Connect them
1. Render → your service → **Environment**: set `CORS_ORIGIN` and `APP_URL` to the exact Vercel URL. Save (Render redeploys).
2. Google sign-in only: [Google Cloud console](https://console.cloud.google.com/apis/credentials) → your OAuth client → **Authorized JavaScript origins** → add the Vercel URL.

### 5. Check it works
- [ ] Open the Vercel URL; register and log in (cookie sticks after refresh)
- [ ] Upload a resume PDF (tests text extraction + Gemini; the page notes the original file isn't kept)
- [ ] Generate a Top-100 plan (tests the in-process worker)
- [ ] Open **My projects** and a project module
- [ ] Start a Manisha interview, answer one question (no "Record your answer audio?" prompt should appear)
- [ ] Download a PDF pack (built on download — expect a second or two)
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
deletes the accounts and their files. Only if you add a bucket later: `SMOKE_R2_PUBLIC_BASE=https://pub-….r2.dev`
checks the bucket does not serve files publicly (keep it private — the API streams files after an
ownership check).

## Without object storage

What `STORAGE_DRIVER=none` (the preset) does, feature by feature. Verified by `backend/tests/no-storage.test.ts`
against a local database; not yet verified on a live Render deployment.

| Feature | Works without a bucket? | Limitation |
|---|---|---|
| Sign-up, login, Google sign-in, sessions | Yes | — |
| Account deletion and data export | Yes | — |
| Resume upload (PDF/TXT) and parsing | Yes | Text is extracted and saved in Postgres; the **original file is not kept** (nothing in the app reads it back). The upload form says so. |
| Job description upload | Yes | Was never stored as a file. |
| Job-match analysis, Top-100 plans, projects, skills, learning | Yes | Use database rows only. |
| Manisha interviews (voice and text), reports, readiness | Yes | Spoken answers are transcribed and count the same. |
| Interview audio recording and replay | **No — off** | The consent prompt is never shown; `POST …/recording {allow:true}` returns `503 RECORDING_DISABLED`; audio sent by an old client is dropped. |
| PDF interview packs (all editions, en/hi/hinglish) | Yes | Not stored: the worker translates and test-renders, then each download **rebuilds the PDF** from the database. Practice scores in the PDF are as of the download, not the request. |

To keep files later, add any S3-compatible bucket in the Render dashboard (`STORAGE_DRIVER=s3`, `S3_ENDPOINT`,
`S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`); only then can `AUDIO_RECORDING=true`
be set. Packs made before that keep working (they are rebuilt on download).

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
| `Refusing to start … STORAGE_DRIVER=local …` | Render's disk isn't persistent. Use `STORAGE_DRIVER=none` (preset) or `s3` with a bucket. |
| `Refusing to start … AUDIO_RECORDING=true needs file storage` | Set `AUDIO_RECORDING=false`, or configure a bucket first. |
| Top-100 plan stays "generating" | `/health` shows `"worker": false` → check `RUN_WORKERS_IN_API=true` and `REDIS_URL`. |
| Upstash "max requests limit exceeded" | Free command quota used up; it resets monthly. Upgrade Upstash, or use a Render Key Value instance (free, in-memory, same region) and set `REDIS_URL` to its internal URL. |
