# Prompters — Phase 0 audit (2026-10-13)

Scope: the whole repository at `4072e15` (`main`, 2 commits ahead of `origin/main`, working tree clean before this audit).
Method: code reading of backend, frontend and config; the full local test/lint/typecheck/build suite; a handful of
read-only GET requests to the public production URLs. No production data was read or written, no AI provider was
called, nothing was pushed or deployed.

Every finding cites code. **Confirmed** = read in the code (and for the top items re-checked by hand).
**Suspected** = depends on runtime behaviour or provider billing that was not measured.

Companion documents: [FLOW_MAP.md](FLOW_MAP.md), [PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md),
[OPTIMIZATION_PLAN.md](OPTIMIZATION_PLAN.md).

## 0. Baseline state

| Check | Result |
|---|---|
| Backend lint / typecheck / build | pass |
| Backend content integrity (`test:content`) | pass |
| Backend tests (local Postgres + Redis, never Neon) | 31 files: 30 pass, 1 skipped (Docker sandbox, no Docker here); 315 tests pass, 11 skipped |
| Frontend lint / typecheck / build | pass |
| Frontend unit tests | 11 files, 75 tests pass |
| Playwright e2e | not run in this audit (needs the fake-AI stack) |
| Production migration state | `20261023090000_pack_pdf_bytes` pending on Neon; applied automatically by the Render start command on the next deploy |
| Production `/health` | `{"database":true,"redis":true,"worker":true}` |

Corrections to the team guide: the frontend is **Next.js 16.3 / React 19.2** (not 14 / 18). There is **no job feed**
(no external job sources); only a manual application tracker. Interviews are English-only.

## 1. Critical and high-severity issues

| # | Sev | Area | Finding | Evidence |
|---|---|---|---|---|
| H1 | High | Security | **Google account pre-hijack.** Email/password signup never verifies the email; Google sign-in links to any existing account with the same email and leaves its password in place. Someone who registers a victim's email first keeps password access after the victim starts using Google. There is no password reset flow. | `backend/src/modules/auth/auth.service.ts:21-31`, `:51-59` |
| H2 | High | Reliability | **API cannot start without Redis.** `startWorkers()` (which awaits BullMQ `upsertJobScheduler`) runs before `listen()`; BullMQ connections retry forever. A Redis outage or exhausted Upstash quota at boot keeps the API down and Render restarts it in a loop. | `backend/src/server/index.ts:22-25`, `src/workers/maintenance-worker.ts:17-19`, `src/lib/redis.ts:30` |
| H3 | High | AI cost | **Automatic Full Answers can exhaust the shared Gemini free quota.** `PREP_AUTO_FULL_ANSWERS` defaults to 100: every READY plan queues 100 `tutor_answer` calls (7000 max tokens, primary model), up to 2× with the JSON re-ask. The loop only stops when *every* fallback model fails, so it drains Lite models too, after which plan generation, tutor, scoring and translation fail for all users until reset. | `src/config/env.ts:62`, `src/modules/prep/practice.service.ts:170-192`, `src/ai/json.ts:44-54`, `src/ai/provider.ts:101-126` |
| H4 | High | Workers | **Auto-answers block the prep queue.** `planAnswers` runs on `career-prep` (concurrency 2) next to plan generation and user-clicked Full Answers; one job can hold a slot for an hour+. Two finished plans starve every student's Full Answer, new plan and answers PDF. | `src/workers/prep-worker.ts:31`, `src/jobs/prep-queue.ts:17-33` |
| H5 | High | Payload | **Re-requesting a ready PDF pack returns the PDF bytes as JSON.** The reuse `findFirst` has no `select`; with `STORAGE_DRIVER=none` the row carries `pdf` (~100 KB) which serialises as an index-keyed object (~1 MB+). | `src/modules/prep/pack.service.ts:49-53`, route `prep.routes.ts:222` |
| H6 | High | Integrity | **Timed exams accept answers after the deadline.** `saveDraft` checks status but not `expiresAt`, and `submit` grades from the draft. A late draft can also overwrite `draftAnswers` of a submitted attempt (unconditional update). | `src/modules/quiz/quiz.service.ts:224-229`, `:257-262` |
| H7 | High | Student data | **Work lost while typing / navigating.** Workspace autosave interval restarts on every keystroke, so it only saves after 5 s of idle and never on unload; project knowledge test state lives only in component state (lost on tab switch); Manisha coding answers are never drafted. | `frontend/src/app/(app)/workspace/[slug]/page.tsx:82-89`; `features/career/projects/project-test.tsx:28-35`, `project-view.tsx:94-102`; `features/career/live/live-room.tsx:134,272` |
| H8 | High (estimate) | Cost | **Idle Redis traffic ≈ 40–45K commands/day while Render is awake** (worker long-polls, maintenance worker capped at 10 s block, stalled checks ×3, heartbeat every 20 s, recover-prep `getJobs` every 5 min). Awake 24/7 ≈ 1.3M/month vs Upstash free 500K. Render sleeping is what keeps it in budget today. *Command counts estimated from code, not measured; check the Upstash dashboard.* | `src/lib/redis.ts:19`, `src/lib/heartbeat.ts:4`, `src/modules/prep/recovery.ts:29`, `src/jobs/prep-queue.ts:37-39` |

## 2. Medium-severity issues

**Reliability / workers**
- M1 Interrupted jobs never resume by themselves: claims only accept `QUEUED`, so a re-run of a stalled job is a no-op; the 5-min sweep requeues, but each restart counts towards the 3-recoveries limit, so 3 deploys/sleeps in 24 h fail a plan. `generation.service.ts:347`, `pack.service.ts:611`, `pipeline.service.ts:235`, `recovery.ts:11-15`.
- M2 Recovery gaps: recovered "Complete answers" packs go to the quick queue (`recovery.ts:53` drops `long`); `fullAnswer`/`planAnswers` jobs are never recovered.
- M3 A Full Answer stuck in `RUNNING` is reported as running forever by the GET (no stale check), and the UI polls every 3 s indefinitely with the button hidden. `practice.service.ts:84-96`, `frontend/.../question-dialog.tsx:59,72-80`.
- M4 Complete-answers PDF and auto-answers can write the same answers twice (no shared atomic claim). `practice.service.ts:175-184,201-211`.
- M5 `/health` `worker: true` is a timer on the shared Redis client, not proof a BullMQ worker is consuming; no `worker.on("error")` listeners. `src/lib/heartbeat.ts:9-19`.
- M6 With Redis slow/down, every `/api` request stalls on the rate limiter (offline queue, 3 retries) before failing open; locks fail closed (503 on plan/PDF creation). `src/middleware/rate-limit.ts:13,37`, `src/lib/lock.ts:22`.

**Database / API**
- M7 Duplicate attempts/sessions on double-click: `startAssessment`, `startPlacement`, interview `startSession` are check-then-create. `quiz.service.ts:143-198`, `interview.service.ts:342-409`.
- M8 Quiz grading not atomic: status flips to SUBMITTED before results are written; a failure in between leaves an ungradeable attempt. `quiz.service.ts:268-287`.
- M9 Project-test answers: no double-submit guard (two AI calls, duplicate `ProjectAnswer`s). `project-experience/test.service.ts:129-185`.
- M10 `GET /admin/search` returns student names/emails to the AUTHOR role (`/admin/users` needs ADMIN). `admin/insights.routes.ts:140-166`.
- M11 Dashboard per request: `streak()` loads every `LearningEvent` row for 400 days; `learnerPath` runs twice; the GET writes readiness snapshots/milestones without a guard (duplicates under concurrency). `journey/streak.ts:8-11`, `dashboard.routes.ts:16,26`, `readiness.service.ts:30,153-168`.
- M12 Personalization `refreshIfStale` recomputes on most GETs for active users (30 s window), loading unbounded histories in 14 queries and writing one upsert per concept and one transaction per recommendation. `personalization/engine.ts:21-84,162-198`, `data.ts:36-60`.
- M13 Over-fetching on hot paths: interview `sessionInclude` loads the full resume on every answer/ping; `ownedQuestion` loads every language's answers and translations on each open and poll; project list loads resume text; resume list returns `parsed`. `interview.service.ts:87-91`, `practice.service.ts:18`, `project.service.ts:47-50`, `career.routes.ts:78`.
- M14 Retrieval loads up to ~47 whole topic snapshots per tutor question / auto-answer (keyword `ILIKE` over `snapshot::text`, plus semantic hits' snapshots). Size per call not measured; likely the largest Neon egress source. `ai/answer.ts:72-82`, `semantic.ts:167-169`.

**AI**
- M15 No token/cost visibility: Gemini `usageMetadata` is discarded; the model that answered isn't recorded; no AI-call log. `ai/provider.ts:115-120`.
- M16 Retry/timeout ladder: request-path tutor calls pass `timeoutMs: 90_000`, which selects the long retry ladder; worst case ~270 s, beyond the ~120 s proxy. When every model is marked exhausted all are still tried. `MAX_TOKENS` truncation is re-asked with the same limit. `provider.ts:35,103,117`, `answer.ts:315`, `json.ts:46`.
- M17 Index freshness: after a republish the topic drops out of semantic search for up to 15 min (version pointer moves only in the scheduled indexer); embedding 429s have no cool-down (every query waits up to 8 s before keyword fallback). `semantic.ts:173`, `embeddings.ts:56,86`.

**Security**
- M18 `RATE_LIMIT_DISABLED=true` is not rejected in production. `rate-limit.ts:18`, `config/env.ts:166-195`.
- M19 Per-IP limits trust 2 proxy hops; a client calling `onrender.com` directly can forge `X-Forwarded-For` (suspected). No per-account login limiter. `app.ts:43`, `rate-limit.ts:20,37`.
- M20 DPDP data export omits resumes, interview transcripts, prep, projects, recommendations. `auth.service.ts:76-91`.
- M21 8 MB JSON parser for `/api/career` runs before auth. `app.ts:50,80-82`.

**Frontend / journey**
- M22 Dashboard waterfall: `/auth/me` → `/dashboard` → 3 child requests. `app/(app)/layout.tsx:9-27`, `dashboard/page.tsx:29-30,61-62,125`.
- M23 Six competing "next" CTAs on the dashboard; the header button ignores the recommendation engine; placement prompt below the fold. `dashboard/page.tsx:44-228`.
- M24 PDF pack dialog forgets a pack in progress when closed, even though the help text says "come back"; fixed 1.5 s polling for up to ~100 min. `features/career/prep/pack-dialog.tsx:29,37-48,76`.
- M25 Quiz mistakes have no per-question "revise" link (only "Back to topic", and only when `?topic=` is present). `features/quiz/quiz-result.tsx:54-85`.
- M26 Onboarding `finish()` has no error handling. `app/(app)/onboarding/page.tsx:50-75`.
- M27 Polling without backoff or cap: prep plan 1.5 s, Full Answer 3 s (no worker-alive check). `prep-view.tsx:52`, `question-dialog.tsx:59`.

## 3. Low-severity (selected)
Account linking has no nonce (GIS credential flow); interview drafts stay in localStorage after logout; no CSP header;
error logs may quote Prisma argument values (resume text); resume upload trusts client `mimeType` for text; `motion`
ships on every page via `template.tsx`; live interview re-renders its 978-line component every second; admin
dashboard runs 124 non-indexable correlated subqueries per load; `topic_started` logged on every topic GET until
mastery exists; unused secrets `SESSION_SECRET`/`ENCRYPTION_KEY` in `.env`.

## 4. What is already solid (keep)
- Ownership checks: every private `:id` route checked is scoped to `req.user` (prep, packs, resumes, jobs, interviews, voice, projects, applications, attempts, recommendations).
- Error responses never include stacks or provider messages; AI Markdown is rendered without raw HTML; only one fixed `dangerouslySetInnerHTML`.
- Session design: httpOnly SameSite=Lax cookie, `tokenVersion` revocation, bcrypt 12, CSRF origin + JSON-only mutations, helmet, CORS allowlist.
- Production guards: no `process` sandbox, no local storage without the persistent flag, no audio without storage.
- Retrieval: content hashing skips unchanged sections; keyword fallback works; 42-case retrieval eval script exists (`scripts/eval-retrieval.ts`, not in CI).
- React Query defaults are sensible (30 s stale, no focus refetch, no 4xx retries); Monaco is lazy-loaded.

## 5. Learning feedback loop — what exists

| Link | Status | Data available |
|---|---|---|
| Quiz mistakes → lesson revision | Partial | Wrong answers stored per question with `topicId` in `QuizAttempt.results`; tutor reads recent mistakes. No section link on `Question`; UI has no per-mistake link. |
| Weak topics → practice | Exists | Practice 10 mixes weak/due/stretch; REVISE_TOPIC recommendations; `/reviews/due`. |
| Mastery (80 %) → unlock | Exists | `ScoringConfig.masteryThreshold`; prerequisite + stage gating. |
| Spaced repetition | Exists | Steps 1/3/7/14/30/60/90 days. |
| Project → skills | Partial | Resume-project answers feed skill states; guided projects only feed readiness %. |
| Interview → learning | Exists (fuzzy) | Turn evaluations feed skill states; report links topics by keyword match on titles; revision-plan items are plain text. |
| Resume/JD gaps → topics | Partial | Gaps become skill recommendations pointing at prep questions / skill map, never curriculum topics; `JobMatch.missing[]` is display-only. |
| Applications ↔ targets/prep | Missing | Tracker is manual CRUD; not linked to JobTarget/JobMatch/PrepPlan; no reminders. |

## 6. PDF inventory (input for the separate shared-PDF phase)
- One server engine: `backend/src/modules/prep/pdf.ts` (pdfkit, Noto Sans + Devanagari + Symbols2, Courier code blocks with wrapping and page-splitting, native vector diagrams of 6 kinds). Only consumer: `prep/pack.service.ts` (5 variants × en/hinglish/hi, answers scopes 10/25/50/100).
- Frontend resume "Download PDF" is `window.print()` with print CSS (`features/profile/resume.tsx`).
- No lesson-note, interview-report or project-plan PDFs exist yet. Non-ASCII code lines fall out of monospace.
