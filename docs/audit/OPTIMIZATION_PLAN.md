# Prompters — optimization plan (2026-10-13)

Ranked by impact ÷ (effort × risk). Every item links to its evidence in AUDIT.md. Nothing here changes the
architecture (Vercel → Express on Render → Neon + Upstash + Gemini) or adds a paid service.

## Top five

| # | Improvement | Evidence | Expected benefit | Risk | Test plan |
|---|---|---|---|---|---|
| 1 | **Protect the Gemini quota**: lower the auto-answer default for the free tier, stop the auto loop as soon as the primary model reports quota exhaustion, give `planAnswers` its own concurrency-1 queue so it never blocks student clicks | H3, H4, M4 | Tutor, plan generation and Full Answer clicks keep working for every user; a click no longer waits behind a 100-answer job | Low (fewer answers pre-written; students click "Full answer" for the rest) | existing `auto-answers.test.ts` + new cases: stops on primary quota error; user Full Answer runs while planAnswers is active |
| 2 | **Close the Google pre-hijack** | H1 | Removes an account-takeover path | Low–medium: users who registered with a password and later use Google lose password login (there is no reset flow yet) | auth tests: link clears password + bumps tokenVersion; old session rejected |
| 3 | **Boot and worker resilience**: `listen()` before workers, start workers in the background with retry; claims accept stale `RUNNING`; recovered packs keep `long`; Full Answer GET reports stale entries as interrupted | H2, M1, M2, M3 | API serves non-queue routes during Redis trouble; interrupted plans resume instead of failing after 3 deploys; no endless spinner | Low | hardening tests: app listens when worker start rejects; stale RUNNING claimed; GET of a stale entry |
| 4 | **Stop lost student work**: workspace autosave fix + flush on pagehide; exam draft rejects after deadline and never overwrites a submitted attempt; pack dialog resumes the in-progress pack; project test survives tab switch; interview code draft | H6, H7, M24 | No lost answers or code; exam deadline enforced | Low | quiz tests for late draft / submitted overwrite; frontend unit tests where hooks are testable; browser check pending |
| 5 | **Measure** (Phase 1): route-templated latency, AI tokens/latency/outcome per call, queue wait/run, slow-query log, admin-only metrics endpoint | PERFORMANCE_BASELINE gaps, M15 | Real p50/p95 and cost per task before any further tuning | None (logging only; no PII, no high-cardinality labels) | unit test of the ring buffer; endpoint requires ADMIN |

## Batch A — implemented in this session (uncommitted, for review)
Small, high-confidence fixes that do not change API shapes, schema or product behaviour:
1. H5 pack reuse no longer returns PDF bytes (`select` on reuse and create).
2. H6 exam draft: rejected after `expiresAt` (+ grace), conditional update so a late draft never overwrites a submitted attempt.
3. H2 API listens before workers start; worker start failure is logged and retried instead of blocking boot.
4. M10 `/admin/search` returns users only to ADMIN and above.
5. H7 (workspace part) autosave keeps a steady 5 s interval while typing, saves every edited language (not only the visible one), and flushes with `fetch keepalive` on `pagehide` / tab hidden / leaving the task.

Deferred from Batch A: **M3** (stale Full Answer shown as running). A time-based "interrupted" rule in the GET is not
safe yet: a QUEUED answer can legitimately wait longer than 5 min behind `planAnswers` (H4), and a RUNNING one can
exceed it through model fallbacks. The correct fix is in the recovery sweep (reset RUNNING entries whose job is not
live, using `liveTargets()` once per sweep), after H4 — moved to Batch B.

## Needs your decision before implementation
- **#1 auto-answer default** — the default 100 was a deliberate product choice in `835539e`. Proposal: default 10 and stop on primary-model quota; production can raise it via `PREP_AUTO_FULL_ANSWERS` once on a paid key.
- **#2 Google linking** — clear the password on link (proposed), or require email verification first (needs an email provider, which doesn't exist yet).
- **Cold start (73 s)** — options: (a) leave as is and show a "waking the server" state on the frontend after 3 s; (b) uptime pinger — keeps it warm but requires first cutting idle Redis traffic (H8: maintenance drainDelay, heartbeat 60 s, recovery only when DB finds stuck rows) and keeps Neon awake (compute hours); (c) Render paid instance. Recommendation: (a) now, H8 reductions next, then decide on (b).
- **`RATE_LIMIT_DISABLED` production guard** — making it fatal would stop the API booting if the Render dashboard has it set; check the dashboard first.

## Batch B — next, after Batch A is reviewed
- M1/M2/M3 stale-claim and recovery fixes (incl. stuck Full Answers); H4 separate queue (part of #1).
- H8 idle Redis reduction (maintenance worker `drainDelay`/`stalledInterval`, heartbeat 60 s / TTL 180 s, DB-first stuck check).
- M7/M8 atomic attempt start and grading (`withLock` / single conditional `updateMany`).
- M13 narrow selects (interview session include, `ownedQuestion`, project list, resume list).
- M11 dashboard: SQL streak, single `learnerPath`, guarded snapshot write; M22 parallel child queries.
- M16 tutor timeout 45–60 s, fail fast when all models exhausted.
- M17 index on publish + 60 s embedding circuit breaker.

## Batch C — student flow
M23 single primary CTA driven by NextBestMove; M25 per-mistake "Revise <topic>" link (backend adds `topicSlug`);
interview revision-plan items as links; M26 onboarding errors; M27 shared polling backoff helper.

## Batch D — separate phases
- Shared PDF system (AUDIT §6): extract `prep/pdf.ts` primitives into a shared module first, then add lesson notes / project plan / interview report documents. Own branch, own review, inspect every generated PDF.
- Security follow-ups: per-email login limiter, origin secret header for direct Render calls, complete DPDP export, CSP, error serializer truncation.
- Feedback-loop links (§5): skill → topic map for resume/JD gaps; applications ↔ JobTarget.

## Release and rollback checklist (each batch)
1. `npm run lint && npm run typecheck && npm test && npm run build` in `backend/` and `frontend/`; `npm run test:content`.
2. Playwright against the fake-AI stack (`E2E_FAKE_AI=1`, `E2E_BASE_URL`, `E2E_DB_URL`), never Neon.
3. `git diff` review for accidental changes and secrets.
4. Push only with approval. Render runs `prisma migrate deploy` on start — any migration must be additive.
5. After deploy: `/health`, one authenticated smoke of the touched flows, Render logs for errors.
6. Rollback: Render "Rollback to previous deploy" (code); additive migrations need no rollback; revert commit on `main` and push.
