# Prompters

**Prepare for YOUR interview.**

Prompters is a job-readiness platform for Indian engineering students and early-career developers. It combines a structured learning path (lessons, mastery quizzes, spaced review, build-without-AI tasks) with a career-intelligence layer: it reads your resume, works out which questions an interviewer is likely to ask you, lets you practise them, and puts you through a voice-based technical interview with an AI interviewer named Manisha, followed by a readiness report.

> **Don't just learn to code. Prove you can build and explain it without AI.**

The platform's position is that knowing about a technology isn't the same as being ready for an interview on it. Prompters asks you to build without AI help, explain your own code, answer questions grounded in your own resume, and then measures readiness from what you actually did.

---

## Contents

1. [Status legend](#status-legend)
2. [Feature highlights](#feature-highlights)
3. [Core learning loop](#core-learning-loop)
4. [Career intelligence flow](#career-intelligence-flow)
5. [Architecture](#architecture)
6. [Tech stack](#tech-stack)
7. [Project structure](#project-structure)
8. [Installation](#installation)
9. [Environment configuration](#environment-configuration)
10. [Development](#development)
11. [API](#api)
12. [Frontend routes](#frontend-routes)
13. [Admin](#admin)
14. [Learning system](#learning-system)
15. [Readiness score](#readiness-score)
16. [Interview report](#interview-report)
17. [Testing](#testing)
18. [Security](#security)
19. [Assessment integrity](#assessment-integrity)
20. [Storage](#storage)
21. [Database](#database)
22. [Redis](#redis)
23. [AI architecture](#ai-architecture)
24. [Voice and audio](#voice-and-audio)
25. [Coding interview and sandbox](#coding-interview-and-sandbox)
26. [Deployment](#deployment)
27. [Production checklist](#production-checklist)
28. [Troubleshooting](#troubleshooting)
29. [Development principles](#development-principles)
30. [Roadmap](#roadmap)
31. [Contributing](#contributing)
32. [License](#license)

---

## Status legend

Every feature in this document carries one of these labels:

| Label | Meaning |
|---|---|
| **Implemented** | In the codebase and covered by the local test suite or manual verification. |
| **Implemented (new)** | Built in the latest development session. Backend tests pass and it was verified end-to-end against a real Gemini model on a local database. Its migration `20261007090000_prep_top100` is applied on Neon. |
| **In development** | Partly built; parts of the described behaviour are missing. |
| **Planned** | Not started. Listed so the gap is visible. |

Nothing in this repository has been deployed to production yet. See [Deployment](#deployment).

---

## Feature highlights

| Area | Feature | Status |
|---|---|---|
| Accounts | Email/password sign-up and login, Google sign-in (ID token), onboarding, placement test | Implemented |
| Accounts | Data export (`GET /api/auth/export`), self-service account deletion | Implemented |
| Accounts | Email-based password reset | Planned |
| Learning | 9-stage roadmap (10 stage entries: Stage 1 has 1A Python and 1B JavaScript tracks) with stage-exam and prerequisite gating | Implemented |
| Learning | Topic pages in a fixed 10-section format, English/Hinglish explanations, runnable code, step-through visualisations | Implemented |
| Learning | Quiz engine with 8 question types, mastery threshold, spaced review, daily "Practice 10", timed mock tests | Implemented |
| Learning | Build-without-AI workspace: hidden tests, 3-level hints with penalties, explain-your-code, independence score | Implemented |
| Learning | Prompt library unlocked by mastery, 10-rung project ladder, interview question bank with practice scoring | Implemented |
| Learning | AI tutor on topic pages (blocked during timed tests) | Implemented (requires AI provider) |
| Progress | Readiness score, dashboard, journey timeline, application tracker | Implemented |
| Career | Resume and job-description upload and parsing | Implemented |
| Career | Job match analysis with code-weighted match score, risks, claims and an 18–25 question bank | Implemented |
| Career | Manisha live technical interview (voice, follow-ups, coding turns, integrity signals, report) | Implemented |
| Career | Resume intelligence: semantic chunks and evidence-checked claims | Implemented (new) |
| Career | Personalised Top-100 interview questions from resume + JD, or resume + target role (no JD needed) | Implemented (new) |
| Career | Practice mode for Top-100 questions | Implemented (new) |
| Career | Downloadable PDF interview pack (3 variants, English / Hinglish / Hindi) | Implemented (new) |
| Career | Adaptive interview depth, revision mode, rich reports, skill-based learning recommendations | Planned (Phase 2) |
| Career | Fluency practice, admin controls for the interviewer, provider-independent STT/TTS | Planned (Phase 3) |
| Admin | Content CMS, users, feature flags, scoring rules, audit logs, integrity review | Implemented |
| Platform | Mobile app, cloud labs, peer interviews, institution dashboards | Planned |

---

## Core learning loop

```
LEARN → UNDERSTAND → QUIZ → BUILD WITHOUT AI → EXPLAIN CODE → INTERVIEW → ANALYZE → IMPROVE → RE-INTERVIEW
```

| Step | What happens in Prompters | Why |
|---|---|---|
| Learn | Topic pages in a fixed 10-section format (definition, analogy, why, usage, internals, code, mistakes, debugging, trade-offs, real project) | Same structure everywhere, so gaps in a topic are visible. |
| Understand | Runnable code samples, step-through visualisations, optional AI tutor | Reading isn't understanding; running and stepping through code is closer. |
| Quiz | Mastery quiz with an 80% threshold (configurable), then spaced review | Mastery has to hold up over time, not just right after reading. |
| Build without AI | Build tasks with hidden tests; hints cost points | The goal is to show you can build it yourself. |
| Explain code | Keyword-scored explanation questions after the tests pass | If you can't explain the code, the build doesn't fully count. |
| Interview | Manisha's technical interview, grounded in your resume and JD | Practice under realistic conditions. |
| Analyze | Per-answer evaluation, per-skill scores, readiness score | Specific feedback instead of a single pass/fail. |
| Improve | Report links weak areas to Prompters topics and question-bank practice | Closes the loop back to learning. |
| Re-interview | Retake the interview from the same analysis | Shows whether the gap actually closed. |

---

## Career intelligence flow

```mermaid
flowchart LR
  A[Upload resume] --> B[Parse]
  B --> C[Resume intelligence<br/>chunks + claims]
  B --> D[JD analysis<br/>or target role]
  C --> E[Personalised question generation]
  D --> E
  E --> F[Top 100 ranked]
  F --> G[Practice / PDF pack]
  D --> H[Job match + 18–25 question bank]
  H --> I[Manisha interview]
  I --> J[Follow-ups + coding turns]
  J --> K[Answer evaluation]
  K --> L[Per-skill scores + readiness]
  L --> M[Report + next steps]
  M --> I
```

| # | Stage | What the code does | Status |
|---|---|---|---|
| 1 | Upload resume | PDF (text extracted with `unpdf`), `.txt`, or pasted text. Max 5 MB. Scanned/image-only PDFs are rejected with a request to paste text (there is no OCR). The original file is stored through the storage driver. | Implemented |
| 2 | Parsing | One LLM call (`parse_resume`) extracts skills, experience, projects, education, certifications, achievements and links into a zod-validated structure. | Implemented |
| 3 | Analysis | With a JD: one LLM call returns a 7-part breakdown; the overall match score is weighted **by code** (`MATCH_WEIGHTS`: required skills 25, stack 20, experience 15, projects 15, keywords 10, responsibilities 10, education 5). It also returns strong/missing skills, risks and claims. | Implemented |
| 4 | Semantic chunks and claims | `prep/intelligence.service.ts` splits the resume into sections (`text.ts`), then one LLM call produces chunks (SUMMARY, EXPERIENCE, PROJECT, ACHIEVEMENT, EDUCATION, CERTIFICATION, OTHER). SKILL chunks are derived by code, together with the projects/jobs that evidence them. Claims are kept only if their evidence text is found in the resume. Computed once per resume (`CareerResume.analyzedAt`). | Implemented (new) |
| 5 | Job / target-role analysis | A JD is parsed into required/preferred skills, responsibilities, technologies and flags. Without a JD, one of 7 built-in target roles (`prep/roles.ts`: Backend, Frontend, Full Stack, Software Engineer, Data Analyst, DevOps, ML Engineer) supplies the skill and concept universe. Target roles exist only for Top-100 preparation, not for the live interview. | JD: Implemented. Target role: Implemented (new) |
| 6 | Personalised question generation | V1: the job match call returns an 18–25 question technical bank (categories IMPORTANT / GOOD / BETTER / MAY_BE_ASKED / CONCEPTUAL), HR-style questions filtered by regex. Top-100: background generation, described below. | V1: Implemented. Top-100: Implemented (new) |
| 7 | Top questions | Validated questions are ranked 1..100 by priority band, then probability, then resume-anchored before generic. | Implemented (new) |
| 8 | Revision | Practice mode per question and the downloadable PDF pack (the GUIDE variant includes a 7-day plan). A dedicated revision mode is not built. | Practice and PDF: Implemented (new). Revision mode: Planned |
| 9 | Manisha interview | Voice-based technical interview, strictly in English, from a **JD job match** (the V1 18–25 question bank). The interview does not yet draw from Top-100 plans. | Implemented |
| 10 | Follow-ups | Up to 2 follow-ups per root question, generated by the evaluator; they must not reveal the answer. | Implemented. Adaptive depth: Planned |
| 11 | Coding questions | Up to 2 coding turns (at about 35% and 70% of the question target), taken from published Build Tasks, run in the sandbox with hidden tests, then reviewed by AI. | Implemented |
| 12 | Answer analysis | Each answer is scored 0–10 on correctness, completeness, understanding, practical and communication, with a verdict and missing/unsupported concepts. | Implemented |
| 13 | Skill analysis | Per-skill averages in the report, plus "answered well" and "struggled" lists. | Implemented (basic) |
| 14 | Readiness score | Weighted average of turn scores; result band. See [Interview report](#interview-report). | Implemented |
| 15 | Report | Stored as JSON on `InterviewSession.report`. | Implemented. Rich reports: Planned |
| 16 | Study plan | Report "next steps" match struggled skills to published topic titles by keyword. The GUIDE PDF has a deterministic 7-day plan. There is no persistent study plan. | Partial (In development) |
| 17 | Re-interview | The report links back to the analysis to start a new session. | Implemented |

### Top-100 personalised preparation (Implemented, new)

Code lives in `backend/src/modules/prep`.

1. **Plan creation.** `POST /api/career/prep` with a resume and either a `jobId` or a `targetRole` (exactly one). If the user already has a queued, running or ready plan for the same resume + target, that plan is returned instead of generating again. Regenerating is an explicit action (`regenerate: true`, a confirmed **Regenerate** button in the UI). New generations are limited to `PREP_DAILY_PLAN_LIMIT` (default 3) per user per rolling 24 hours. The count comes from the event log, so deleting a plan does not give a generation back, and a user can have at most 2 plans queued or running. The job is queued on the BullMQ queue `career-prep`.
2. **Worker.** `backend/src/workers/prep-worker.ts` (started by `npm run dev:worker` / `npm run start:worker`) runs `runPlan`:
   - ensures resume intelligence (chunks + claims) exists;
   - **allocates** 100 questions across GENERAL / SKILL / PROJECT / CLAIM / ACHIEVEMENT / CONCEPTUAL / SCENARIO **by code** (`allocation.ts`). The default split is 15/25/25/15/5/10/5. Resume-anchored categories scale with the material the resume actually contains (no projects means no project questions), and the remainder is split across the flexible categories;
   - generates **category by category in batches of at most 10 questions**, with at most **5 concurrent model calls** per plan, and persists progress for the UI. It over-generates about 30% candidates per category, and SKILL / PROJECT / CLAIM / CONCEPTUAL batches each get a different slice of topics so parallel batches don't ask the same thing;
   - runs one **semantic de-duplication pass** (`prep_dedupe`): the model groups questions that are the same ask in different words. The most likely question of each group is kept, and at most a third of the bank is removed in one pass. If this step fails it is skipped, not fatal;
   - **selects** the most likely questions per category up to its allocation, then fills any free slots from the best leftovers;
   - tops up any shortfall with SKILL / CONCEPTUAL / GENERAL / SCENARIO questions;
   - **fails honestly** if fewer than 60 questions pass validation. Questions already accepted are kept, and `POST /:id/retry` resumes the plan.
3. **Validator** (`validator.ts`). Every question passes, in order:
   1. schema (zod);
   2. technical quality (no HR/behavioural questions, no yes/no trivia, sensible length and question form);
   3. duplicate detection across the whole plan (exact match, or Jaccard similarity ≥ 0.6 on lightly stemmed content tokens). Paraphrases that share few words are caught later by the semantic pass;
   4. category/source anchoring (PROJECT, CLAIM and ACHIEVEMENT questions must reference a real resume item and mention it);
   5. verbatim resume evidence (only text actually in the resume is stored as evidence);
   6. skill mapping to the resume / JD / target-role skill universe;
   7. difficulty normalisation (definition questions are capped at difficulty 2; follow-up depth is at least the difficulty).
4. **Priority** is derived from probability by code: ≥ 0.8 INTENSE, ≥ 0.6 IMPORTANT, ≥ 0.4 GOOD, otherwise MAY_BE_ASKED.
5. **Visibility.** `GET /:id/questions` returns an empty list until the plan is `READY`.
6. **Each question** stores why, evidence, hint, key points, follow-ups, difficulty (1–5), probability (0–1), follow-up depth (1–7), skill, source type/label and practice status.
7. **Practice mode.** An answer of at least 10 characters is evaluated with the same evaluator as the interview. The status becomes CONFIDENT once the best score reaches 70, otherwise PRACTICED. The status can also be set manually (NEW / PRACTICED / CONFIDENT).
8. **PDF pack** (`pack.service.ts`, `pdf.ts`, pdfkit with bundled Noto fonts in `backend/assets/fonts`, including Devanagari). Variants: `QUESTIONS`, `HINTS`, `GUIDE`. The GUIDE variant adds why, resume evidence, key points, follow-ups, skills to revise and a 7-day plan. Languages: `en`, `hinglish`, `hi`. Non-English packs are AI-translated, with translations cached per question. Packs are rendered by the worker and stored through the storage driver. A pack is reused until the next practice attempt.

Existing V1 job-match analyses keep their original 18–25 question banks. They are not converted to 100 questions.

The whole career area is gated by the `AI_INTERVIEW` feature flag (seeded as enabled) and requires a configured AI provider. Downloading an English pack doesn't check the flag; Hinglish/Hindi packs do.

---

## Architecture

```mermaid
flowchart TB
  subgraph Browser
    UI[Next.js 16 app<br/>React 19]
    Voice[speechSynthesis<br/>Web Speech API<br/>MediaRecorder]
  end
  UI -- "/api/* (rewrite, first-party cookie)" --> API
  subgraph Backend["backend/ (Express 5, TypeScript)"]
    API[API process<br/>src/server]
    Worker[Worker process<br/>src/workers]
  end
  API -- Prisma --> PG[(PostgreSQL<br/>Neon)]
  Worker -- Prisma --> PG
  API -- "BullMQ / rate limits / cache" --> R[(Redis<br/>Upstash over TCP)]
  Worker -- BullMQ --> R
  API -- HTTPS --> AI[AI provider<br/>Gemini / OpenRouter / Ollama / HF]
  Worker -- HTTPS --> AI
  API --> S[Storage driver<br/>local filesystem]
  Worker --> S
  Worker --> SB["Sandbox driver<br/>process (dev) / docker (prod)"]
```

- **Modular monolith.** One API process with feature modules (`backend/src/modules/*`), plus one worker process.
- **The worker runs three BullMQ workers:** `code-execution` (sandbox), `career-prep` (Top-100 plans and PDF packs) and `maintenance` (daily recording purge at 03:30 Asia/Kolkata, and a 5-minute sweep that re-queues stuck Top-100 work). It writes a Redis heartbeat and shuts down gracefully on SIGTERM (stops taking jobs, lets active ones finish, then disconnects).
- **Student code never runs in the API process.** The API enqueues a job and waits up to 20 s for the result.
- **The frontend proxies `/api/*`** to the backend (`next.config.ts` rewrites), so the session cookie stays first-party.
- **AI is optional for the core platform.** With `AI_PROVIDER=none`, learning, quizzes, builds and admin all work. Career features return `503 AI_UNAVAILABLE`, and `GET /api/career/status` reports `NO_PROVIDER`.

More detail: [docs/architecture.md](docs/architecture.md), [docs/code-sandbox.md](docs/code-sandbox.md), [docs/security.md](docs/security.md).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.3 (App Router), React 19.2, TypeScript, Tailwind CSS v4, TanStack Query, React Hook Form + zod, Monaco editor, motion, sonner |
| Backend | Node.js (engines `>=20`; Dockerfiles use Node 22), Express 5, TypeScript, zod |
| Database | PostgreSQL via Prisma 6 (Neon in the current environment) |
| Queue / cache | Redis via ioredis + BullMQ 6, `express-rate-limit` with `rate-limit-redis` |
| Auth | Cookie-based JWT (HS256), bcryptjs, `google-auth-library` for Google ID tokens |
| AI | Provider abstraction over HTTP (Gemini, OpenRouter, Ollama, Hugging Face router) |
| Documents | `unpdf` (PDF text extraction), `pdfkit` (PDF generation) with bundled Noto fonts |
| Storage | Local filesystem driver; S3-compatible driver behind the same interface (not configured) |
| Logging | pino / pino-http with request IDs |
| Security middleware | helmet, cors, custom CSRF guard |
| Testing | Vitest, Supertest, Testing Library, jsdom, Playwright |

---

## Project structure

Only directories and files that exist are shown. Generated folders (`node_modules`, `dist`, `.next`, `test-results`) are omitted.

```
PREPRATION/
├── README.md
├── docker-compose.yml          # local full stack (not verified in this environment)
├── package.json                # Neon tooling dependencies only; no scripts
├── neon.ts, .neon              # Neon CLI project link
├── .github/workflows/ci.yml    # lint, typecheck, content check, tests, build
├── docs/
│   ├── architecture.md
│   ├── code-sandbox.md
│   └── security.md
├── backend/
│   ├── Dockerfile
│   ├── .env.example
│   ├── README.md
│   ├── docs/api.md             # API reference (learning/admin; career/prep are documented in this README)
│   ├── assets/fonts/           # Noto Sans, Noto Sans Devanagari, Noto Sans Symbols 2 (+ OFL.txt)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/         # 20261006071534_init, 20261006071822_project_hints,
│   │   │                       # 20261006093043_career_intelligence, 20261007090000_prep_top100
│   │   └── seed/               # index.ts, extras.ts, content/ (curriculum + stage*.ts topic content)
│   ├── scripts/
│   │   ├── verify-content.ts   # runs every seeded code sample (npm run test:content)
│   │   ├── enable-flag.ts      # enable a feature flag by key
│   │   └── qa-fake-api.ts      # QA-only API on :4100 with the deterministic fake AI
│   ├── src/
│   │   ├── ai/                 # provider.ts, json.ts (aiJson + fence), tutor.ts
│   │   ├── config/             # env.ts (zod-validated), load-env.ts
│   │   ├── jobs/               # queues.ts (code-execution), prep-queue.ts (career-prep)
│   │   ├── lib/                # prisma, redis, storage, logger
│   │   ├── middleware/         # auth, csrf, rate-limit, error-handler, request-id
│   │   ├── modules/
│   │   │   ├── admin/          # admin, content, curriculum, insights, platform routes
│   │   │   ├── ai/  applications/  auth/  build/  code/  dashboard/
│   │   │   ├── career/         # analysis.service, interview.service, prompts, schemas, routes
│   │   │   ├── prep/           # allocation, generation, intelligence, validator, pack, pdf,
│   │   │   │                   # practice, profile, prompts, roles, schemas, text, routes
│   │   │   ├── interview/  journey/  learning/  platform/  profile/
│   │   │   ├── projects/  prompts/  quiz/  readiness/
│   │   ├── sandbox/            # harness, process-driver, docker-driver, spawn, types
│   │   ├── server/             # app.ts, index.ts
│   │   ├── utils/  types/
│   │   └── workers/            # index, code-worker, prep-worker, maintenance-worker
│   └── tests/                  # vitest + supertest suites, fake-ai.ts, global-setup.ts, setup-env.ts
└── frontend/
    ├── Dockerfile
    ├── .env.example
    ├── next.config.ts          # /api rewrite + security headers
    ├── playwright.config.ts
    ├── vitest.config.mts
    ├── src/
    │   ├── proxy.ts            # Next.js 16 "middleware": optimistic auth redirect
    │   ├── app/                # (public), (app), admin route groups
    │   ├── features/           # one folder per feature (career/, career/live, career/prep, admin/, …)
    │   ├── components/  config/  constants/  hooks/  lib/  stores/  styles/  types/
    └── tests/
        ├── unit/               # vitest + Testing Library
        └── e2e/                # Playwright
```

---

## Installation

### Requirements

| Tool | Notes |
|---|---|
| Node.js | `>=20` per `backend/package.json`; Node 22 recommended (Dockerfiles and CI use 22). The process sandbox uses Node's `--permission` flag. |
| npm | Each app has its own `package-lock.json`. |
| Python 3 | Required by the process sandbox and `npm run test:content` to run Python code. |
| PostgreSQL | Neon (current environment) or a local server. Tests need a **local** Postgres. |
| Redis | Any Redis reachable over TCP (Upstash `rediss://` in the current environment). Tests need a **local** Redis. Eviction policy must be `noeviction` for BullMQ. |
| Docker | Only for `SANDBOX_DRIVER=docker` or `docker compose`. |

### Steps

```bash
# 1. Backend
cd backend
cp .env.example .env            # then fill in values (see Environment configuration)
npm install
npm run db:deploy               # apply migrations (prisma migrate deploy)
npm run db:seed                 # curriculum, content, feature flags, super admin
npm run dev                     # API on http://localhost:4000

# 2. Worker (separate terminal) — required for code runs, Top-100 plans, PDF packs, recording purge
cd backend
npm run dev:worker

# 3. Frontend (separate terminal)
cd frontend
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                     # http://localhost:3000
```

Sign in with the super admin from `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD`, or register a student account.

### Docker Compose (not verified in this environment)

`docker-compose.yml` defines `postgres` (17-alpine), `redis` (7-alpine, `noeviction`), `api`, `worker` and `web`. The worker mounts `/var/run/docker.sock` to start sandbox containers, which gives it host-level Docker access. Neither the compose file nor the Dockerfiles have been run here.

```bash
docker compose up --build
```

---

## Environment configuration

Only variables that the code actually reads are listed. Use placeholders. Never commit real values.

### `backend/.env`

| Variable | Required | Default | Read by | Purpose |
|---|---|---|---|---|
| `NODE_ENV` | no | `development` | `config/env.ts` | `development`, `test` or `production`. In production `.env` is not auto-loaded. |
| `PORT` | no | `4000` | `config/env.ts` | API port. |
| `DATABASE_URL` | **yes** | — | `config/env.ts`, Prisma | Pooled Postgres URL used by the app. |
| `DIRECT_URL` | **yes** (Prisma) | — | `prisma/schema.prisma` | Direct (unpooled) URL used by migrations. |
| `REDIS_URL` | no | `redis://localhost:6379` | `config/env.ts` | TCP Redis URL (`rediss://` enables TLS). |
| `JWT_SECRET` | **yes** | — | `config/env.ts` | At least 32 characters. Startup in production is refused if it begins with `dev-only`. |
| `CORS_ORIGIN` | no | `http://localhost:3000` | `config/env.ts` | Comma-separated allowed browser origins. |
| `APP_URL` | no | `http://localhost:3000` | `config/env.ts` | Frontend URL; also an allowed origin for the CSRF check. |
| `GOOGLE_CLIENT_ID` | no | — | `config/env.ts` | Enables Google sign-in (ID-token verification). |
| `GOOGLE_CLIENT_SECRET` | no | — | `config/env.ts` | Validated but unused; reserved for a server-side OAuth flow. |
| `SANDBOX_DRIVER` | no | `process` | `config/env.ts` | `process` (development only) or `docker` (production). |
| `SANDBOX_TIMEOUT_MS` | no | `4000` | `config/env.ts` | Per-run time limit. |
| `SANDBOX_MEMORY_MB` | no | `128` | `config/env.ts` | Per-run memory limit. |
| `SANDBOX_JS_IMAGE` | no | `node:22-alpine` | `config/env.ts` | Docker image for JavaScript. |
| `SANDBOX_PY_IMAGE` | no | `python:3.12-alpine` | `config/env.ts` | Docker image for Python. |
| `SANDBOX_CONCURRENCY` | no | `4` | `config/env.ts` | Parallel sandbox jobs per worker. |
| `AI_PROVIDER` | no | `none` | `config/env.ts` | `none`, `gemini`, `openrouter`, `ollama`, `huggingface`. |
| `AI_MODEL` | no | provider default | `config/env.ts` | Gemini default `gemini-flash-latest`. |
| `AI_API_KEY` | depends | — | `config/env.ts` | Required for every provider except Ollama. |
| `AI_BASE_URL` | no | provider default | `config/env.ts` | Override the provider endpoint. |
| `AI_FALLBACK_MODELS` | no | `gemini-flash-lite-latest,gemini-3.5-flash-lite` | `config/env.ts` / `ai/provider.ts` | Comma-separated Gemini fallback models, tried in order. |
| `STORAGE_DRIVER` | no | `local` | `config/env.ts` | `local` (current) or `s3`. |
| `STORAGE_DIR` | no | `./storage` | `config/env.ts` | Root folder for the local driver (gitignored). |
| `S3_ENDPOINT`, `S3_REGION` (default `auto`), `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | only with `s3` | — | `config/env.ts` | S3-compatible driver settings. Not configured today. |
| `PREP_DAILY_PLAN_LIMIT` | no | `3` | `config/env.ts` | Top-100 plan generations allowed per user per rolling 24 h (each plan costs about 20–25 model calls). |
| `RECORDING_RETENTION_DAYS` | no | `30` | `config/env.ts` | Interview audio older than this is deleted daily (1–365). |
| `COOKIE_SECURE` | no | `true` in production | `config/env.ts` | Force the `Secure` cookie flag on or off. |
| `RATE_LIMIT_DISABLED` | no | `false` | `config/env.ts` | Disables rate limiting (used by tests). |
| `SEED_SUPER_ADMIN_EMAIL` | for seeding | — | `prisma/seed/index.ts` | Super admin created by `npm run db:seed`. |
| `SEED_SUPER_ADMIN_PASSWORD` | for seeding | — | `prisma/seed/index.ts` | Its initial password. Change it after first login. |
| `TEST_DATABASE_URL` | no | local `prompters_test` | `tests/setup-env.ts`, `tests/global-setup.ts` | Override the test database. |
| `TEST_REDIS_URL` | no | `redis://localhost:6379/15` | `tests/setup-env.ts` | Override the test Redis. |

Example (placeholders only):

```dotenv
NODE_ENV=development
PORT=4000
DATABASE_URL=YOUR_NEON_POOLED_DATABASE_URL
DIRECT_URL=YOUR_NEON_DIRECT_DATABASE_URL
REDIS_URL=rediss://default:YOUR_UPSTASH_PASSWORD@YOUR_UPSTASH_HOST:6379
JWT_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARS
CORS_ORIGIN=http://localhost:3000
APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
SANDBOX_DRIVER=process
AI_PROVIDER=gemini
AI_MODEL=gemini-flash-latest
AI_API_KEY=YOUR_GEMINI_API_KEY
AI_FALLBACK_MODELS=gemini-flash-lite-latest,gemini-3.5-flash-lite
PREP_DAILY_PLAN_LIMIT=3
STORAGE_DRIVER=local
RECORDING_RETENTION_DAYS=30
SEED_SUPER_ADMIN_EMAIL=admin@example.com
SEED_SUPER_ADMIN_PASSWORD=YOUR_INITIAL_ADMIN_PASSWORD
```

### `frontend/.env.local`

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL used by the `/api/*` rewrite (default `http://localhost:4000`). |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Identity Services client ID (same value as the backend `GOOGLE_CLIENT_ID`). Optional. |
| `E2E_BASE_URL` | Playwright only. If set, tests run against that URL instead of starting `npm run dev`. |

> Variables such as `SESSION_SECRET`, `ENCRYPTION_KEY`, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are **not read anywhere in the code**. Redis is accessed only over TCP through `REDIS_URL`; the Upstash REST API is not used. If a local `.env` contains these variables, they have no effect.

---

## Development

### Scripts

**Backend (`backend/package.json`)**

| Script | Command |
|---|---|
| `npm run dev` | `tsx watch src/server/index.ts` (API) |
| `npm run dev:worker` | `tsx watch src/workers/index.ts` (code, prep and maintenance workers) |
| `npm run build` | `prisma generate && tsc -p tsconfig.build.json` |
| `npm start` | `node dist/src/server/index.js` |
| `npm run start:worker` | `node dist/src/workers/index.js` |
| `npm run lint` | `eslint .` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | `vitest run` |
| `npm run test:content` | Runs every seeded code sample and validates content structure |
| `npm run db:migrate` | `prisma migrate dev` (local databases only) |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:seed` | `tsx prisma/seed/index.ts` |
| `npm run db:reset` | `prisma migrate reset --force` (destroys data) |

**Frontend (`frontend/package.json`)**

| Script | Command |
|---|---|
| `npm run dev` | `next dev` |
| `npm run build` | `next build` |
| `npm start` | `next start` |
| `npm run lint` | `eslint src` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | `vitest run` (unit) |
| `npm run test:e2e` | `playwright test` |

The root `package.json` has no scripts.

### Useful utilities

```bash
cd backend
npx tsx scripts/enable-flag.ts AI_INTERVIEW   # enable a feature flag
npx tsx scripts/qa-fake-api.ts                # QA API on :4100 with deterministic fake AI
```

### Enabling the career features locally

1. Set `AI_PROVIDER=gemini` and `AI_API_KEY=YOUR_GEMINI_API_KEY` in `backend/.env`.
2. Make sure the `AI_INTERVIEW` flag is enabled (it is by default after seeding).
3. Run the worker (`npm run dev:worker`); Top-100 plans and PDF packs are generated only by the worker.
4. Apply all migrations (`npm run db:deploy`), including `20261007090000_prep_top100`.

---

## API

Base path `/api`. Requests with a body must be JSON. Responses use one envelope:

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": { }, "requestId": "…" } }
```

Common error codes: `400 VALIDATION_ERROR | BAD_REQUEST | INVALID_JSON`, `401 UNAUTHORIZED`, `403 FORBIDDEN | CSRF_REJECTED | FEATURE_DISABLED`, `404 NOT_FOUND` (also returned for resources owned by someone else), `409 CONFLICT`, `413 PAYLOAD_TOO_LARGE`, `415 UNSUPPORTED_MEDIA_TYPE`, `423 LOCKED`, `429 RATE_LIMITED | PREP_DAILY_LIMIT`, `502 AI_BAD_OUTPUT | AI_UPSTREAM_ERROR`, `503 AI_UNAVAILABLE | SANDBOX_UNAVAILABLE`.

Health endpoints (outside `/api`):

| Endpoint | Meaning |
|---|---|
| `GET /live` | Process is up (no dependency checks). Use for liveness probes. |
| `GET /ready` | Database and Redis answer; 200 or 503. Use for readiness / load-balancer checks. |
| `GET /health` | Readiness plus `worker: true/false` from the worker's Redis heartbeat (refreshed every 20 s). The worker doesn't affect the status code. |

A fuller reference for the learning and admin endpoints is in [backend/docs/api.md](backend/docs/api.md). It does not cover the career and prep endpoints below.

### Rate limits (Redis-backed, per user when logged in, otherwise per IP)

| Limiter | Window | Limit | Applied to |
|---|---|---|---|
| global | 1 min | 300 | every `/api` route |
| auth | 15 min | 20 | register, login, Google, change password |
| code | 1 min | 30 | `/code/run`, build run/submit |
| ai | 1 min | 10 | AI tutor, resume/JD upload, analyses, session start, prep plan create/retry, pack request |
| career | 1 min | 40 | interview answer and run-code, prep practice attempts |

### Career — `/api/career` (auth required)

The JSON body limit for `/api/career` is 8 MB (other routes: 1 MB). Uploads are base64 in JSON. Write endpoints marked "flag" return `403 FEATURE_DISABLED` unless `AI_INTERVIEW` is enabled for the user, and AI-backed calls return `503 AI_UNAVAILABLE` when no provider is configured.

| Method | Path | Purpose | Request body | Response `data` | Errors |
|---|---|---|---|---|---|
| GET | `/status` | Whether career features are available | — | `{ available, reason: null \| "NO_PROVIDER" \| "FEATURE_DISABLED", interviewer, matchWeights }` | — |
| GET | `/resumes` | List own resumes | — | `[{ id, label, fileName, parsed, createdAt }]` | — |
| POST | `/resumes` | Upload and parse a resume (ai limiter, flag) | `{ label?, text? (≤60 000), fileBase64? (≤7.5 M chars), mimeType?, fileName? }` | `{ id, label, parsed, createdAt }` (201) | 400 no input / file >5 MB / unreadable PDF / unsupported type / text too short; 502/503 AI |
| DELETE | `/resumes/:id` | Delete a resume, its analyses, plans, stored file, interview audio and pack PDFs | — | `{ deleted: true }` | 404 |
| GET | `/jobs` | List own job descriptions | — | `[{ id, title, company, parsed, createdAt }]` | — |
| POST | `/jobs` | Upload and parse a JD (ai, flag) | `{ title?, company?, text?, fileBase64?, mimeType?, fileName? }` | `{ id, title, company, parsed, createdAt }` (201) | 400 as above (min 80 chars); 502/503 AI |
| DELETE | `/jobs/:id` | Delete a JD and dependent analyses/plans/files | — | `{ deleted: true }` | 404 |
| POST | `/analyses` | Resume × JD match analysis (ai, flag) | `{ resumeId, jobId }` | `JobMatch` row: `{ id, score, breakdown, strong, missing, risks, claims, questions, model, … }` (201) | 404 resume/JD; 502/503 AI |
| GET | `/analyses` | List analyses | — | `[{ id, score, createdAt, job, resume, _count.sessions }]` | — |
| GET | `/analyses/:id` | Analysis detail with sessions and weights | — | `JobMatch` + `job`, `resume`, `sessions[]`, `weights` | 404 |
| DELETE | `/analyses/:id` | Delete an analysis and its interview audio | — | `{ deleted: true }` | 404 |
| GET | `/sessions` | List interviews | — | `[{ id, status, readinessScore, result, startedAt, endedAt, matchId, match.job }]` | — |
| POST | `/sessions` | Start a Manisha interview (ai, flag) | `{ matchId, durationMinutes? (10–90, default 30), questionTarget? (5–25, default 15), consent: { recording, integrity, preparationOnly, storeAudio? = true }, language? }`. `language` is accepted for backward compatibility but ignored; interviews are always English. | `{ id, interviewer, intro, current: Turn, progress, endsAt }` (201) | 400 consent not all true; 404 analysis; 409 `INTERVIEW_IN_PROGRESS` (with `sessionId`) or empty question bank; 503 AI |
| GET | `/sessions/:id` | Session state. Turns, transcript and evaluations are returned only after the interview ends. Auto-finalises if more than 5 min past the end time. | — | `{ id, status, language: "en", progress, current, readinessScore, result, report, turns[] , … }` | 404 |
| POST | `/sessions/:id/answer` | Submit an answer (career limiter) | `{ turnId, answerText? (≤10 000), skipped?, durationSec?, audioBase64? (≤5.6 M chars), audioMime?, code? (≤64 KB), codeLanguage? }` | `{ done: false, lead, current, progress }` or `{ done: true, lead, closing, sessionId }` | 400 audio >4 MB or unsupported type; 404 turn; 409 ended / already answered; 502 AI |
| POST | `/sessions/:id/run-code` | Run visible tests for a coding turn (career limiter) | `{ turnId, language: "javascript" \| "python", code }` | `{ output, stderr, timedOut, tests[] }` | 404; 409 ended |
| POST | `/sessions/:id/integrity` | Log integrity signals | `{ events: [{ type, meta? }] }` (1–50). Types: TAB_HIDDEN, WINDOW_BLUR, FULLSCREEN_EXIT, SCREEN_SHARE_STOPPED, SCREEN_SHARE_RESUMED, MIC_DISCONNECTED, CAMERA_DISCONNECTED, COPY, PASTE, LARGE_PASTE, CUT | `{ warning, ended, limit? }` | 404 |
| POST | `/sessions/:id/end` | End early and build the report | — | Same shape as `GET /sessions/:id` | 404 |
| GET | `/sessions/:id/turns/:turnId/audio` | Stream a stored answer recording (`cache-control: private, no-store`) | — | audio bytes | 404 |
| DELETE | `/sessions/:id/recordings` | Delete all recordings (transcript and scores stay) | — | `{ deleted: n }` | 404 |
| DELETE | `/sessions/:id` | Delete the interview and its recordings | — | `{ deleted: true }` | 404 |

### Top-100 preparation — `/api/career/prep` (auth required) — Implemented (new)

| Method | Path | Purpose | Request body | Response `data` | Errors |
|---|---|---|---|---|---|
| GET | `/meta` | Target roles, total, default allocation, category labels, pack variants/languages | — | `{ roles[{key,label}], total: 100, defaultAllocation, categories, variants, languages }` | — |
| GET | `/` | List own plans | — | `[{ id, title, status, targetRole, createdAt, completedAt, resume.label, job, _count.questions }]` | — |
| GET | `/usage` | Plan generations used in the last 24 h | — | `{ limit, used, remaining, resetAt }` | — |
| POST | `/` | Create a plan and queue generation, or reuse the saved plan for the same resume + target (ai, flag) | `{ resumeId, jobId? , targetRole?, regenerate? }`. Exactly one of `jobId` / `targetRole`. Roles: `backend`, `frontend`, `fullstack`, `sde`, `data_analyst`, `devops`, `ml_engineer`. `regenerate: true` forces a new plan. | `PrepPlan` + `reused`. 200 when an existing QUEUED/RUNNING/READY plan was reused; 201 when a new generation started. | 400 neither/both; 404 resume/JD; 409 two plans already generating; 429 `PREP_DAILY_LIMIT` (details = usage) |
| GET | `/:id` | Plan with progress, allocation, validation stats, recent packs, practice counts | — | `PrepPlan` + `resume`, `job`, `packs[]`, `practice: { NEW?, PRACTICED?, CONFIDENT? }` | 404 |
| POST | `/:id/retry` | Resume a FAILED plan; accepted questions are kept (ai, flag) | — | `{ queued: true }` | 404; 409 not failed |
| DELETE | `/:id` | Delete plan, questions, attempts and pack files | — | `{ deleted: true }` | 404 |
| GET | `/:id/questions` | Ranked questions; `[]` until the plan is `READY` | — | `[{ id, rank, category, priority, question, skill, probability, difficulty, followUpDepth, why, evidence, sourceType, sourceLabel, hint, keyPoints, followUps, status }]` | 404 |
| GET | `/:id/questions/:qid` | One question with its source chunk/claim and the last 10 attempts | — | question + `source: { chunk, claim }`, `attempts[]` | 404 |
| POST | `/:id/questions/:qid/attempts` | Practice answer, AI-evaluated (career limiter, flag) | `{ answer }` (≤6000, min 10 chars) | `{ attempt, status, keyPoints, followUps }` (201) | 400 too short; 404; 502/503 AI |
| PATCH | `/:id/questions/:qid` | Set practice status manually | `{ status: "NEW" \| "PRACTICED" \| "CONFIDENT" }` | `{ id, status }` | 404 |
| POST | `/:id/packs` | Request a PDF pack (ai limiter; flag only for non-English) | `{ variant: "QUESTIONS" \| "HINTS" \| "GUIDE", language?: "en" \| "hinglish" \| "hi" }` | `PrepPack` row (reused if still current) (201) | 404; 409 plan not ready |
| GET | `/:id/packs/:packId` | Pack status | — | `{ id, variant, language, status, error, createdAt, completedAt }` | 404 |
| GET | `/:id/packs/:packId/download` | Download the PDF (`content-disposition: attachment`) | — | PDF bytes | 404; 409 not ready |

### Other modules (summary)

| Mount | Method & path | Purpose | Auth |
|---|---|---|---|
| `/auth` | `POST /register`, `POST /login`, `POST /google` | Create account / sign in (sets `prompters_session` cookie) | public, auth limiter |
| | `POST /logout`, `POST /logout-all`, `GET /me`, `POST /change-password` | Session management | logout public; others user |
| | `GET /export`, `DELETE /account` (`{ confirm: <email> }`, students only) | Data export, account deletion | user |
| `/public` | `GET /curriculum` | Public curriculum outline (Redis-cached 5 min) | public |
| `/profile` | `GET /`, `PATCH /`, `POST /onboarding` | Profile and onboarding | user |
| `/dashboard` | `GET /` | Dashboard summary | user |
| `/readiness` | `GET /` | Readiness score, factors, weights, actions | user |
| `/journey` | `GET /`, `GET /events` | Journey timeline, activity feed | user |
| `/` (learning) | `GET /roadmap`, `GET /stages/:slug`, `GET /topics/:slug`, `POST /topics/:slug/read` | Roadmap and topic content | user |
| `/` (quiz) | `POST /topics/:slug/quiz`, `POST /topics/:slug/review`, `POST /practice`, `POST /placement`, `POST /assessments/:slug/start`, `GET /attempts/:id`, `PUT /attempts/:id/draft`, `POST /attempts/:id/integrity`, `POST /attempts/:id/submit`, `GET /attempts`, `GET /reviews/due`, `GET /assessments` | Quizzes, reviews, placement, mock tests | user |
| `/build-tasks` | `GET /`, `GET /:slug`, `POST /:slug/start`, `PUT /:slug/code`, `POST /:slug/run`, `POST /:slug/hint`, `POST /:slug/submit`, `POST /:slug/explain` | Build-without-AI workspace | user |
| `/projects` | `GET /`, `GET /:slug`, `POST /:slug/hint`, `POST /:slug/submit` | Project ladder | user |
| `/prompts` | `GET /`, `GET /:id`, `POST /:id/favorite`, `POST /:id/rate`, `POST /:id/used` | Prompt library | user |
| `/interview` | `GET /questions`, `POST /questions/:id/practice` | Interview question bank (keyword-scored practice) | user |
| `/applications` | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` | Application tracker | user |
| `/code` | `POST /run` | Run code in the sandbox | user, code limiter |
| `/ai` | `GET /status`, `POST /explain` | AI tutor (flag `AI_TUTOR`) | user, ai limiter |
| `/admin` | see [Admin](#admin) | CMS and platform management | AUTHOR+ |

---

## Frontend routes

Next.js 16 App Router. In Next.js 16, middleware lives in `src/proxy.ts` (exported function `proxy`). It is an optimistic gate only: it redirects visitors without a session cookie away from protected paths, and redirects signed-in users away from `/login` and `/register`. Real authorisation happens in the backend on every API call. Route params are Promises (`use(params)`).

| Group | Routes |
|---|---|
| `(public)` | `/`, `/about`, `/how-it-works`, `/pricing`, `/roadmap`, `/login`, `/register` |
| `(app)` learning | `/dashboard`, `/onboarding`, `/learn`, `/learn/[stage]`, `/learn/topic/[slug]`, `/quiz/[id]`, `/practice`, `/reviews`, `/mock-tests`, `/mock-tests/[slug]`, `/build`, `/workspace/[slug]`, `/projects`, `/projects/[slug]`, `/prompts`, `/prompts/[id]`, `/interviews` |
| `(app)` progress | `/readiness`, `/journey`, `/applications`, `/profile`, `/settings` |
| `(app)` career | `/career` (hub: Top-100 start card, plans, resumes, JDs, analyses, interviews), `/career/analysis/[id]`, `/career/live/[id]` (Manisha live room), `/career/interview/[id]` (report), `/career/prep/[id]` (Top-100: generation progress, then filters by priority, category, skill, practice status and search, question dialog with practice, pack download dialog) |
| `admin` | see below |

---

## Admin

Roles: `STUDENT < AUTHOR < ADMIN < SUPER_ADMIN`. Every `/api/admin` route requires at least AUTHOR, and individual routes require more. Admin writes are recorded in `AdminAuditLog`.

### Implemented admin pages (`frontend/src/app/admin`)

| Page | Purpose | Min role |
|---|---|---|
| `/admin` | Dashboard | ADMIN |
| `/admin/content-health` | What's missing before topics can be published | AUTHOR |
| `/admin/roadmap` | Stages and modules | AUTHOR |
| `/admin/topics`, `/admin/topics/[id]` | Topic editor (sections, visualisation, quiz, versions, preview) | AUTHOR |
| `/admin/questions` | Quiz question bank, CSV import/export | AUTHOR |
| `/admin/build-tasks` | Build tasks (with reference-solution validation) | AUTHOR |
| `/admin/projects` | Project ladder | AUTHOR (writes ADMIN) |
| `/admin/visualizations` | Step-through visualisations | AUTHOR |
| `/admin/translations` | Translation drafts | AUTHOR |
| `/admin/prompts` | Prompt cards (versioned) | AUTHOR |
| `/admin/interviews` | Interview question bank (learning module, not Manisha) | AUTHOR |
| `/admin/assessments` | Mock tests / stage exams and their integrity settings | AUTHOR (writes ADMIN) |
| `/admin/integrity` | Quiz/assessment integrity events | ADMIN |
| `/admin/users`, `/admin/users/[id]` | Users, status, sessions, roles | ADMIN (roles: SUPER_ADMIN) |
| `/admin/feature-flags` | Flags incl. `AI_INTERVIEW`, `AI_TUTOR` (rollout %, per-user) | ADMIN (edit: SUPER_ADMIN) |
| `/admin/scoring` | Versioned scoring config (mastery threshold, review intervals, readiness weights…) | ADMIN (edit: SUPER_ADMIN) |
| `/admin/audit-logs` | Audit trail | SUPER_ADMIN |

### Backend admin routes (grouped)

| Area | Endpoints |
|---|---|
| Insights | `GET /dashboard`, `GET /content-health`, `GET /search` |
| Curriculum | `/stages`, `/modules` (+ duplicate, publish), `/topics` (+ sections, visualization, completeness, preview, status, publish, unpublish, archive, duplicate, versions, restore, verify-code, delete) |
| Content CRUD | `/questions`, `/build-tasks`, `/projects`, `/prompts`, `/interviews`, `/assessments` (list, get, create, patch, archive); `POST /build-tasks/:id/validate`, `POST /prompts/:id/new-version`, `GET /questions-export.csv`, `POST /questions-import` |
| Platform | `/users` (+ export.csv, role, status, revoke-sessions, reset-topic), `/feature-flags`, `/scoring` (+ activate), `/audit-logs`, `/integrity`, `/translations` (+ draft) |

### Planned admin features

| Feature | Status |
|---|---|
| Interviewer (Manisha) configuration: timing, follow-up limit, coding checkpoints | Planned (these are constants in `interview.service.ts` today) |
| AI provider and model settings in the UI | Planned (env-only today) |
| Question category weights / Top-100 allocation controls | Planned (constants in `allocation.ts` / `analysis.service.ts`) |
| Prompt versioning and review | Planned |
| Career analytics (plans, interviews, validator rejection rates) | Planned |

---

## Learning system

| Capability | Behaviour in code | Status |
|---|---|---|
| Curriculum | 10 stage entries (0 Foundations, 1A Python, 1B JavaScript, 2 Programming core, 3 Frontend, 4 Backend, 5 DevOps, 6 System design, 7 Applied AI, 8 Job readiness), 201 topics | Implemented |
| Authored content | **42 topics** fully written in `backend/prisma/seed/content/stage*.ts` (Stage 0, 1A, 1B, 2 and 4). The other **159** are seeded as `COMING_SOON` and shown as such on the roadmap. | In development (content) |
| Mastery | A topic is mastered at **≥ 80%** on its mastery quiz (`DEFAULT_SCORING.masteryThreshold = 80`, adjustable in Admin → Scoring) | Implemented |
| Spaced review | After mastery, reviews are scheduled at 1, 3, 7, 14, 30, 60, 90 days. A failed review resets the step. Mastered topics can be in a `NEEDS_REVIEW` state on the roadmap. | Implemented |
| Prerequisites | Topic prerequisite graph and stage-exam gating (stage exam pass score 70). Locked topics return `423 LOCKED` with missing prerequisites. Both gates can be toggled in scoring config. | Implemented |
| Quiz types | MCQ, MULTI, PREDICT_OUTPUT, SPOT_BUG, FILL_CODE, SCENARIO, ORDER_STEPS, EXPLAIN | Implemented |
| Build tasks | Starter code (JS/Python), visible and hidden tests run in the sandbox, 3 hint levels with penalties 8/10/12, explain-your-code (keyword-scored, minimum 50), independence score | Implemented |
| AI-free build mode | The build workspace offers no AI assistant. The AI tutor is server-blocked during any timed test and is otherwise available only on topic pages. Code is written in the browser editor, and there is no technical way to stop a learner using AI on another device. | Implemented (with the stated limitation) |
| Content verification | `npm run test:content` executes every seeded code sample and checks that every topic has all 10 sections in English and Hinglish | Implemented |

---

## Readiness score

Computed in `backend/src/modules/readiness/readiness.service.ts`. The weights come from the active scoring config (defaults shown) and can be changed by a super admin.

| Factor | Default weight | How it is computed |
|---|---|---|
| mastery | 30 | % of authored topics required for the learner's goal role that are mastered (or mastered and due for review) |
| projects | 20 | Sum of independence scores of completed build tasks (×1) and ladder projects (×2), against a target of 5 |
| dsa | 15 | % of authored DSA-module topics mastered |
| recall | 10 | Average recall score (or best score) across mastered topics |
| interview | 15 | Blend of question-bank practice (weight 0.4, scaled by coverage of 10 questions), the last 5 mock tests (0.3, if any) and the last 3 completed Manisha interview readiness scores (0.3, if any) |
| resume | 10 | Profile completeness: 8 checks (name, education, goal role, ≥3 skills, headline, summary, links, target companies) |

Status bands: ≥ 80 "*Role* interview ready", ≥ 60 "Almost *role* interview ready", ≥ 35 "Getting there", otherwise "Building foundations". Snapshots are stored when the score changes.

Planned dimensions (not computed today): resume-claim coverage from Top-100 practice, per-skill interview mastery, communication trend, coding-interview performance as a separate factor.

---

## Interview report

Built in `interview.service.ts` (`buildReport`) when a session finalises (all questions answered, time over, ended early, screen-share limit reached, or abandoned). It is stored as JSON in `InterviewSession.report`, with `readinessScore` and `result` copied to columns.

**Turn score (0–100)**
- Spoken/typed answers: `10 × (0.40·correctness + 0.20·completeness + 0.25·understanding + 0.15·practical)`. Communication is reported separately and is **not** part of the turn score.
- Coding turns: `0.6 × tests passed % + 0.4 × code-review quality` (average of understanding and practical × 10).
- Skipped answers score 0.

**Interview readiness score** is the weighted mean of turn scores. Weights: coding 1.5, follow-up 0.6, root question `1 + 0.15 × (level − 1)`.

| Score | Result |
|---|---|
| ≥ 75 | Interview Ready |
| ≥ 55 | Needs Improvement |
| < 55 | Not Yet Ready |

**Report contents:** readiness, result, `insufficientEvidence` (fewer than 5 answered), counts (correct / partial / incorrect / skipped), average communication score, per-skill areas, answered-well and struggled lists (including the most frequent missing concepts), next steps (matching published Prompters topics, question-bank practice, retake), an integrity summary ("No signals" / "Minor signals" / "Review recommended"), and a disclaimer that it is a preparation assessment, not a hiring decision.

The full transcript, per-turn evaluations and audio links are returned only after the interview ends.

---

## Testing

| Suite | Tool | Where | Notes |
|---|---|---|---|
| Backend API / unit | Vitest + Supertest | `backend/tests/*.test.ts` | Runs against a **local** Postgres database `prompters_test` and **local** Redis db 15. Never Neon/Upstash. `global-setup.ts` resets the test DB with `prisma migrate reset`. Files run serially. AI is replaced by a deterministic `FakeAI` (`tests/fake-ai.ts`). |
| Content integrity | `scripts/verify-content.ts` | `npm run test:content` | Executes seeded code samples with the process sandbox (needs Python 3). |
| Hardening | Vitest + Supertest | `backend/tests/hardening.test.ts` | 413/400 errors, logout-all and password-change session invalidation, tampered cookies, IDOR across every career/prep/application resource, account-deletion file cleanup, production config guard, health endpoints, stuck-job recovery, code-runner outage. |
| Docker sandbox (adversarial) | Vitest | `backend/tests/sandbox-docker.test.ts` | Infinite loop, memory bomb, huge stdout/stderr, network access, secret/env leakage, host file writes, docker socket, non-root user, fork bomb, container cleanup. **Skipped when no Docker daemon is available**; CI sets `REQUIRE_DOCKER_SANDBOX=1` so they must run there. Not yet run on this machine (no Docker). |
| Frontend unit | Vitest + Testing Library (jsdom) | `frontend/tests/unit` | |
| Frontend E2E | Playwright | `frontend/tests/e2e` | Needs the API **and** worker running; starts `npm run dev` unless `E2E_BASE_URL` is set. |

```bash
# one-time: local test database
createdb prompters_test

# backend
cd backend && npm run lint && npm run typecheck && npm test && npm run test:content

# frontend
cd frontend && npm run lint && npm run typecheck && npm test && npm run test:e2e
```

The default test database URL is `postgresql://<your OS user>@localhost:5432/prompters_test`. Override it with `TEST_DATABASE_URL` / `TEST_REDIS_URL`.

CI (`.github/workflows/ci.yml`) defines the same steps with Postgres and Redis service containers. It has not run yet because the project isn't a git repository yet.

---

## Security

See also [docs/security.md](docs/security.md).

| Area | Control (verified in code) |
|---|---|
| Passwords | bcrypt, 12 rounds; dummy-hash comparison for unknown emails |
| Sessions | HS256 JWT in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production), 7-day expiry, `tokenVersion` for revoke-all / password change |
| Google sign-in | ID token verified against `GOOGLE_CLIENT_ID` |
| CSRF | Mutating requests must be JSON; `Origin`, when present, must be in `CORS_ORIGIN` or `APP_URL` |
| CORS | Allow-list from `CORS_ORIGIN`, credentials enabled |
| Headers | `helmet` on the API; `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` and `Permissions-Policy` on the frontend |
| Input validation | zod on every request body; zod on all AI output |
| Authorisation | Role tiers; ownership checks return 404 so IDs can't be probed |
| Rate limiting | Redis-backed per user/IP (see [API](#api)) |
| Startup guard | Production refuses a `JWT_SECRET` starting with `dev-only` |
| Storage keys | Restricted to `[a-zA-Z0-9/_.-]`, no `..` |
| Private files | Audio and PDFs are served through authenticated, owner-checked endpoints with `cache-control: private, no-store` |
| Prompt injection | Resume, JD and answer text are fenced in tags (`fence()` in `ai/json.ts`); every career/prep system prompt says the fenced text is untrusted and its instructions must not be followed; output is schema-validated and code-validated |
| Logging | pino with request IDs; no stack traces in responses |
| Account deletion | `DELETE /api/auth/account` first deletes every stored file the user owns (`resumes/`, `interviews/`, `prep-packs/` under their ID) through the storage abstraction, then the database rows. Idempotent, and tested. |
| Body limits | Oversized bodies return `413 PAYLOAD_TOO_LARGE` (8 MB on `/api/career`, 1 MB elsewhere); malformed JSON returns `400 INVALID_JSON`. |
| Production guard | The API and worker refuse to start in production with `SANDBOX_DRIVER=process`, an example/development `JWT_SECRET`, `COOKIE_SECURE=false`, or `STORAGE_DRIVER=s3` without a bucket. A localhost `CORS_ORIGIN` and local storage are logged as warnings. |
| Log redaction | Cookies, `set-cookie`, authorization, API-key headers, passwords, tokens and credentials are redacted from logs. |

Cross-account access (IDOR) is covered by `tests/hardening.test.ts`: another user's resumes, JDs, analyses, interviews, audio, plans, questions, attempts, PDFs and applications all return 404, and write attempts change nothing.

### Communication scoring and sensitive characteristics

The evaluator prompt (`career/prompts.ts`, `evaluate`) scores only what the answer contains: technical correctness, completeness, understanding, practical application, and the clarity and structure of the English answer. It tells the model that speech-to-text errors and accents are normal and that **accent and minor grammar must never be penalised**. Answering mostly in Hindi or Hinglish lowers only the communication score; the technical substance is still judged.

The system does **not** assess personality, mental state, emotions, appearance, accent, eye contact, facial expressions, or any other sensitive or protected characteristic. No camera is used: the live room requests microphone and screen-share only.

---

## Assessment integrity

Integrity signals are **indicators, not proof**. Browser controls cannot prevent cheating with another device, another person, or a second screen. Reports say "review recommended", never "cheating detected".

| Context | Signals | Consequence |
|---|---|---|
| Timed quizzes / mock tests | Tab switches, clipboard and fullscreen (per assessment: `tabSwitchLimit`, `violationPolicy`, `blockClipboard`, `requireFullscreen`) | Logged; policy may auto-submit; score penalty per event (configurable) |
| Manisha interview | TAB_HIDDEN, WINDOW_BLUR, FULLSCREEN_EXIT, SCREEN_SHARE_STOPPED/RESUMED, MIC_DISCONNECTED, COPY, PASTE, LARGE_PASTE (>200 chars), CUT | Logged; summarised in the report. Stopping screen share 3 times ends the session (`ENDED_INTEGRITY`) |
| AI tutor | — | Disabled server-side while a timed test is in progress |

The interview requires three consents (recording + AI analysis, integrity signals, preparation-only use). Keeping audio afterwards is a separate, optional choice (`storeAudio`).

---

## Storage

| Item | Key pattern | Lifecycle |
|---|---|---|
| Resume originals | `resumes/<userId>/<uuid>.pdf\|txt` | Deleted with the resume |
| Interview answer audio | `interviews/<userId>/<sessionId>/<turnId>.<ext>` | Only stored with consent; max 4 MB per answer; deleted after `RECORDING_RETENTION_DAYS` (default 30) by the daily maintenance job, or on demand |
| Prep PDF packs | `prep-packs/<userId>/<packId>.pdf` | Deleted with the plan / resume / JD |

The **current configuration is `STORAGE_DRIVER=local`**: files are written under `STORAGE_DIR` (default `backend/storage`, gitignored), with a `.type` sidecar file for the content type. An S3-compatible driver exists behind the same storage abstraction (`backend/src/lib/storage.ts`) but is not configured. A multi-instance production deployment needs shared object storage, because local files are per-machine.

---

## Database

PostgreSQL through Prisma. Neon is the current environment, using a pooled `DATABASE_URL` for the app and a direct `DIRECT_URL` for migrations.

### Models (from `backend/prisma/schema.prisma`)

| Domain | Models |
|---|---|
| Users | `User`, `UserProfile` |
| Curriculum | `Stage`, `Module`, `Topic`, `TopicPrerequisite`, `TopicSection`, `Visualization`, `TopicVersion` |
| Assessment | `Question`, `Assessment`, `QuizAttempt`, `IntegrityEvent`, `Mastery`, `StageProgress` |
| Building | `BuildTask`, `Submission`, `Project`, `ProjectSubmission` |
| Prompts | `PromptCard`, `PromptFavorite`, `PromptRating` |
| Interview bank | `InterviewQuestion`, `InterviewPractice` |
| Progress | `ReadinessSnapshot`, `LearningEvent`, `Achievement`, `Application` |
| Platform | `FeatureFlag`, `ScoringConfig`, `AdminAuditLog` |
| Career (V1) | `CareerResume`, `JobTarget`, `JobMatch`, `InterviewSession`, `InterviewTurn`, `InterviewIntegrityEvent` |
| Prep (new) | `ResumeChunk`, `ResumeClaim`, `PrepPlan`, `PrepQuestion`, `PrepAttempt`, `PrepPack` |

Notes on the current design:
- Audio keys, transcripts (`answerText`, `answerCode`), code results and evaluations live on **`InterviewTurn`**.
- The interview report is JSON on **`InterviewSession.report`**.
- V1 job-match questions, claims and risks are JSON on **`JobMatch`**.
- `InterviewSession.language` has a schema default of `"hinglish"`, but the service always writes `"en"`.

### Migrations

| Migration | Contents |
|---|---|
| `20261006071534_init` | Core platform |
| `20261006071822_project_hints` | Project hints |
| `20261006093043_career_intelligence` | Career V1 |
| `20261007090000_prep_top100` | Resume chunks/claims, prep plans, questions, attempts, packs. Additive only (new tables plus a nullable `CareerResume.analyzedAt`). Applied to the Neon `production` branch on 2026-10-07; apply it to any other environment before using Top-100. |

### Planned tables (do not exist)

`ResumeVersion`, `JobRequirement`, separate `Transcript`, `AudioRecording`, `AnswerAnalysis`, `SkillAssessment` and `InterviewReport` tables, `LearningRecommendation`, prompt-version tables.

---

## Redis

Accessed only over TCP (`REDIS_URL`; Upstash with `rediss://` in the current environment). The Upstash REST API is not used. The eviction policy must be `noeviction`, because BullMQ requires it.

| Use | Where |
|---|---|
| BullMQ queue `code-execution` | `jobs/queues.ts`, `workers/code-worker.ts` |
| BullMQ queue `career-prep` (Top-100 plans, PDF packs) | `jobs/prep-queue.ts`, `workers/prep-worker.ts` |
| BullMQ queue `maintenance` (daily recording purge, 03:30 IST) | `workers/maintenance-worker.ts` |
| Rate limiting (`rl:<name>:` keys) | `middleware/rate-limit.ts` |
| Cache of the public curriculum (5 min) | `modules/learning/public.routes.ts` |
| Health check `PING` | `server/app.ts` |

---

## AI architecture

| Piece | Location | Behaviour |
|---|---|---|
| `AIProvider` interface | `backend/src/ai/provider.ts` | `complete(system, user, { maxTokens, json, timeoutMs })` |
| Gemini | `provider.ts` | `generateContent` with `responseMimeType: application/json` for JSON tasks. Default model `gemini-flash-latest`. Falls back through `AI_FALLBACK_MODELS` (default `gemini-flash-lite-latest,gemini-3.5-flash-lite`) when a model is overloaded (429/5xx/network) or retired (404). A free-tier **daily** quota 429 skips straight to the next model without retrying, and that model is skipped for an hour. |
| OpenRouter / Ollama / Hugging Face | `provider.ts` | OpenAI-compatible `chat/completions` (default models: `meta-llama/llama-3.3-70b-instruct:free`, `llama3.1`, `meta-llama/Llama-3.1-8B-Instruct`) |
| Retry | `postJson` | Retries 429/500/502/503/504 and network errors with backoff (honours `Retry-After`). Request handlers: 1 retry after 1.5 s. Background jobs (timeout > 30 s): up to 3 retries at 3/8/15 s. |
| Structured output | `backend/src/ai/json.ts` (`aiJson`) | Extracts JSON, validates with zod, retries **once** with the validation error fed back, then fails with `502 AI_BAD_OUTPUT`. A half-parsed result is never returned. |
| Untrusted input | `fence()` + per-module `SAFETY` text | Resume, JD, candidate profile and answer text are wrapped in tags; system prompts instruct the model never to follow instructions inside them. |
| Code over model | analysis, allocation, validator, scoring | Match score, question allocation, priority, ranking, validation and all readiness scores are computed by code, not by the model. |
| Testing | `tests/fake-ai.ts`, `setAIProvider()` | Deterministic fake provider. |

AI task names in use: `parse_resume`, `parse_job`, `match`, `evaluate_answer`, `review_code`, `resume_intelligence`, `prep_<category>`, `translate_<language>`, plus the topic tutor.

| AI capability | Status |
|---|---|
| Provider abstraction, Gemini fallback, retries, zod validation | Implemented |
| Model name recorded on `JobMatch.model` / `PrepPlan.model` | Implemented |
| Prompt versioning | Planned |
| Per-task model routing, cost/latency tracking | Planned |

---

## Voice and audio

Voice is **browser-only** today (`frontend/src/features/career/live/use-voice.ts`). There is no server-side speech-to-text or text-to-speech.

| Function | Implementation | Status |
|---|---|---|
| Manisha's voice | `window.speechSynthesis`; prefers a female Indian English (`en-IN`) voice and never chooses a known male voice. Markdown is stripped before speaking. A timeout ensures the interview never hangs if the browser doesn't fire `end`. | Implemented |
| Candidate dictation | Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) in `en-IN`, continuous with interim results (Chrome / Edge). The candidate can always edit or type instead. | Implemented |
| Answer recording | `MediaRecorder` (Opus/WebM preferred, 32 kbps). Uploaded as base64 with the answer; stored only with consent. | Implemented |
| Language | **Interviews are strictly English.** The server forces `language: "en"` (`INTERVIEW_LANGUAGE`), Manisha asks the candidate to answer in English, and dictation uses `en-IN`. Hindi/Hinglish are available only for the downloadable prep PDF. | Implemented |
| Provider-independent STT/TTS abstraction (server-side) | — | Planned (Phase 3) |
| Fluency practice | — | Planned (Phase 3) |

---

## Coding interview and sandbox

Coding turns in the Manisha interview use published `BuildTask`s from the `dsa`, `js-fundamentals`, `js-intermediate`, `python-fundamentals` and `server-development` modules, preferring tasks the candidate hasn't completed. While working, the candidate can run the **visible** tests. On submit, all tests (including **hidden** ones) run, then an AI review scores understanding, practical quality and communication, and reports time/space complexity, edge cases and code-quality notes. Hidden test names and inputs are never returned.

### How code runs

1. The API builds a harness (`sandbox/harness.ts`) that calls the user's function on each test. Results are printed behind a random nonce passed via env and deleted before user code runs, so user prints can't fake results.
2. The job goes to the BullMQ `code-execution` queue. The API waits up to 20 s.
3. The worker runs it with the configured driver. Output is capped at 64 KB, code at 64 KB.

| Driver | What it enforces | Use |
|---|---|---|
| `SANDBOX_DRIVER=process` | Child process with a clean env and empty temp dir, hard timeout (`SANDBOX_TIMEOUT_MS`), SIGKILL on timeout. For Node: `--permission` (file reads limited to the temp dir; no writes, child processes or workers) and `--max-old-space-size`. For Python: `-I` isolated mode only. | **Development only. Not a security boundary.** Python can reach the network and the file system. |
| `SANDBOX_DRIVER=docker` | Fresh throw-away container per run: `--network none`, `--memory`/`--memory-swap` = `SANDBOX_MEMORY_MB`, `--cpus 0.5`, `--pids-limit 64`, `--read-only` root fs, `/tmp` tmpfs 16 MB `noexec,nosuid`, user `65534:65534`, `--cap-drop ALL`, `no-new-privileges`, code on stdin (no host mounts), timeout + 2 s, forced `docker rm -f` on timeout | **Required for production.** |

The Docker driver has not been run in this environment; its adversarial test suite (`tests/sandbox-docker.test.ts`) runs in CI, where Docker is available. Production startup refuses `SANDBOX_DRIVER=process`. Because the worker needs access to the Docker daemon, run it on a dedicated, isolated host. See [docs/code-sandbox.md](docs/code-sandbox.md).

---

## Deployment

**No deployment exists yet.** The recommended architecture is:

| Component | Recommendation |
|---|---|
| Frontend | A Next.js host. Set `NEXT_PUBLIC_API_URL` at build time (it is baked into the rewrite) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. |
| API | A Node host running `npm run build` then `npm run db:deploy && npm start` (the backend Dockerfile's default command runs `prisma migrate deploy` and then the server). Health checks: `GET /live` (liveness) and `GET /ready` (readiness). |
| Worker | A **separate** process: `npm run start:worker`. It runs the code sandbox, maintenance and prep jobs. It is required for coding questions, Top-100 plans, PDF packs and recording purge. |
| Sandbox | Worker on an isolated host with Docker and `SANDBOX_DRIVER=docker`. |
| Database | Neon PostgreSQL in a region close to the API. Pooled `DATABASE_URL`, direct `DIRECT_URL`. |
| Redis | Upstash over TCP (`rediss://`), eviction policy `noeviction`. |
| Storage | Shared object storage via the S3-compatible driver if more than one instance (or a separate worker host) needs the files. The local driver only works when the API and worker share a filesystem. |

Note on storage and the worker: PDF packs are written by the worker and read by the API. With `STORAGE_DRIVER=local`, both processes must share the same `STORAGE_DIR`.

---

## Production checklist

- [ ] Rotate every credential that was used or exposed during development (database, Redis, Gemini key, Google client)
- [ ] Generate production secrets (`JWT_SECRET`: `openssl rand -base64 64`); change the seeded super-admin password
- [ ] Configure the production `DATABASE_URL` and `DIRECT_URL`
- [ ] Configure production Redis (`REDIS_URL`, `rediss://`, `noeviction`)
- [ ] Configure the Gemini key (`AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_FALLBACK_MODELS`)
- [ ] Add production origins and redirect URLs to the Google OAuth client
- [ ] Serve everything over HTTPS
- [ ] Set `CORS_ORIGIN` and `APP_URL` to the production frontend origin(s)
- [ ] Confirm secure cookies (`NODE_ENV=production` or `COOKIE_SECURE=true`)
- [ ] Switch the sandbox to Docker (`SANDBOX_DRIVER=docker`) on an isolated worker host
- [ ] Verify sandbox network is disabled (`--network none`)
- [ ] Verify CPU / memory / time limits (`--cpus`, `SANDBOX_MEMORY_MB`, `SANDBOX_TIMEOUT_MS`, pids limit)
- [ ] Configure production storage shared by API and worker
- [ ] Configure database backups (Neon point-in-time restore / snapshots) and storage backups
- [ ] Configure log shipping (pino JSON logs)
- [ ] Configure monitoring and alerting (`/health`, queue depth, failed jobs, AI error rate)
- [ ] Review rate limits for expected traffic
- [ ] Define retention policies (`RECORDING_RETENTION_DAYS`, resumes, packs, account deletion of stored files)
- [ ] Review requirements of India's Digital Personal Data Protection Act (DPDP): consent, purpose limitation, retention, erasure, data export
- [ ] Review against the OWASP Top 10 / ASVS
- [ ] Run production builds (`npm run build` in both apps)
- [ ] Run automated tests (backend, content, frontend unit, E2E)
- [ ] Verify migrations (`npm run db:deploy`), including `20261007090000_prep_top100`
- [ ] Verify admin access and roles
- [ ] Verify resume upload (PDF and pasted text)
- [ ] Verify question generation (job match and Top-100, including worker processing)
- [ ] Verify the interview flow (microphone, dictation, recording, screen share, coding turn)
- [ ] Verify report generation and PDF pack download

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| API exits with `Invalid environment configuration` | A required variable is missing or invalid (`DATABASE_URL`, `JWT_SECRET` ≥ 32 chars). The message lists the fields. |
| `Refusing to start in production with the development JWT_SECRET` | Generate a real secret. |
| `/health` returns 503 | Database or Redis unreachable. Check `DATABASE_URL` / `REDIS_URL` (TLS needs `rediss://`). |
| Code runs time out / "Run" never returns | The worker isn't running. Start `npm run dev:worker`. |
| Top-100 plan stuck in `QUEUED` | Worker not running (`GET /health` shows `worker: false`), or it is connected to a different Redis than the API. Once the worker runs, a maintenance sweep every 5 minutes re-queues plans and packs whose job was lost; after 3 interruptions in a day the plan is marked FAILED with a Retry message. |
| `503 SANDBOX_UNAVAILABLE` on Run | No code worker picked the job up within 20 s. Start `npm run dev:worker`. |
| `413 PAYLOAD_TOO_LARGE` | Upload over the body limit (files must be ≤ 5 MB). |
| `Refusing to start in production: …` | The listed setting is unsafe in production (process sandbox, example JWT secret, `COOKIE_SECURE=false`, S3 without bucket). |
| Plan `FAILED: Only N questions passed quality checks` | Model output was too thin or rejected. Use **Retry**; accepted questions are kept. |
| `503 AI_UNAVAILABLE` | `AI_PROVIDER=none`, or no `AI_API_KEY`. |
| `502 AI_UPSTREAM_ERROR` | Provider busy or rate-limited after retries and fallbacks. On the Gemini free tier, each model has a small **requests-per-day** quota. One Top-100 plan uses roughly 20–25 model calls, so a free key supports only a few plans per day per model. Wait for the daily reset, add fallback models, or use a paid key. |
| `502 AI_BAD_OUTPUT` | The model returned invalid JSON twice. Retry. |
| `403 FEATURE_DISABLED` on career routes | Enable `AI_INTERVIEW` in Admin → Feature flags or `npx tsx scripts/enable-flag.ts AI_INTERVIEW`. |
| "Couldn't read text from this PDF" | Scanned/image PDF; paste the text instead. |
| Prisma errors about missing `PrepPlan` / `ResumeChunk` tables | Migration `20261007090000_prep_top100` not applied: `npm run db:deploy`. |
| Tests try to reset a database | By design: they reset local `prompters_test` only. Create it (`createdb prompters_test`) and run local Redis. |
| BullMQ eviction warnings | Set the Redis eviction policy to `noeviction`. |
| Dictation button missing | Web Speech API unsupported (e.g. Firefox). Use Chrome/Edge or type. |
| Microphone blocked in the live room or practice dialog | The frontend sends `Permissions-Policy: camera=(), microphone=(self), geolocation=()`, which allows the microphone for the app's own origin only. If it's still blocked, check the browser's site permissions (dictation needs Chrome or Edge). |
| Manisha's voice sounds male or non-Indian | No Indian female voice is installed. The live room explains how to add one (e.g. Edge includes Neerja). |
| Next.js "middleware" not running | In Next.js 16 it is `src/proxy.ts`, not `middleware.ts`. |

---

## Development principles

1. **Code decides, the model suggests.** Scores, allocation, priority, ranking and validation are deterministic code. Model output is schema-checked and never trusted as-is.
2. **Resume text is untrusted.** Always fence it; never let it change instructions.
3. **Fail honestly.** A thin or invalid result is an error with a retry, never a padded list.
4. **Ground in evidence.** Stored evidence must be verbatim resume text; claims without evidence are dropped.
5. **AI is optional for the core.** The learning platform works with `AI_PROVIDER=none`.
6. **Student code never runs in the API process.**
7. **Ownership is enforced server-side,** with 404 for resources the user doesn't own.
8. **Tests never touch shared infrastructure.** They use a local DB and local Redis only.
9. **Assess observable answers only,** never personal or sensitive characteristics.
10. **Label features honestly:** Implemented, In development or Planned.

---

## Roadmap

### Currently implemented
- Learning platform: roadmap, gating, topics, quizzes, mastery, spaced review, builds without AI, explain-your-code, projects, prompts, interview bank, mock tests, readiness, journey, applications, admin CMS
- Career Intelligence V1: resume/JD parsing, job match, risks, claims, 18–25 question bank
- Manisha live interview: English-only voice interview, follow-ups, coding turns with hidden tests and AI review, integrity signals, audio retention, report and readiness score
- **Phase 1 — personalised question engine (Implemented, new):** semantic resume chunks, resume claims, target-role preparation without a mandatory JD, Top-100 personalised questions with code validation and ranking, practice mode, downloadable PDF pack (English / Hinglish / Hindi). Requires migration `20261007090000_prep_top100`.

### In development
- Curriculum content: 159 of 201 topics are `COMING_SOON`
- Study plan: report next steps and the PDF 7-day plan exist; no persistent plan

### Planned
- **Phase 2:** adaptive interview depth, revision mode, rich interview reports, skill-based learning recommendations, interviews driven by Top-100 plans and target roles
- **Phase 3:** fluency practice, admin controls for the interviewer and AI, provider-independent STT/TTS
- Prompt versioning; planned database tables listed under [Database](#database)
- Email password reset, mobile app, cloud labs, peer interviews, institution dashboards

---

## Contributing

The directory is **not yet a git repository**. Initialise git before contributing (`git init`, then add a remote). Keep `.env`, `.env.local` and `.neon` out of commits; they are already in `.gitignore`.

| Topic | Rule |
|---|---|
| Branches | `feat/<short-name>`, `fix/<short-name>`, `chore/…`, `docs/…`. Never commit directly to `main`. |
| Commits | Conventional Commits: `feat(prep): …`, `fix(career): …`, `docs: …`, `test: …`. |
| Pull requests | One change per PR; describe what changed, why, and how it was tested; link the issue. CI (lint, typecheck, content check, tests, build) must pass. |
| Tests | Add or update backend tests (`backend/tests`) for any API or scoring change; frontend unit/E2E for UI flows. Use `FakeAI`, never a real model, in tests. |
| Migrations | Change `schema.prisma`, then run `npm run db:migrate` (`prisma migrate dev`) **against a local database only**. Check `DATABASE_URL` before running it; never point `migrate dev` or `db:reset` at Neon. Apply to Neon with `npm run db:deploy`. Commit the generated migration folder. |
| Environment variables | Add new variables to `backend/src/config/env.ts` (zod), `backend/.env.example` / `frontend/.env.example`, and this README. Never commit real values. |
| Security | No secrets in code, logs or fixtures. Fence any user-provided text sent to a model. Validate all input with zod. Report vulnerabilities privately to the project owner, not in public issues. |
| Content | New topics go through the admin CMS or a `prisma/seed/content/stage*.ts` file, then `npm run test:content`. |
| Code review | At least one reviewer. Check correctness, ownership checks, error handling, tests, and that feature status labels in this README stay truthful. |

---

## License

License information will be added by the project owner.
