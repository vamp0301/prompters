# Prompters — flow map (as built, 2026-10-13)

Arrows are what the code does today. `[gap]` marks a link that is missing or partial (see AUDIT.md §5).

## Deployment and request path

```
Browser (India)
  │  HTTPS, cookie session (httpOnly, SameSite=Lax)
  ▼
Vercel edge bom1 ── static/ISR pages (landing cached, x-vercel-cache: HIT)
  │  /api/* rewrite (edge proxy, no function hop)            SSR/route handlers run in iad1
  ▼
Render free web service, Singapore  ── sleeps when idle; cold start measured at 73 s
  │  express: request-id → pino-http → helmet/CORS/CSRF → body parser → loadUser → rate limit (Redis) → route
  │  workers run IN this process (RUN_WORKERS_IN_API): career-prep(2), career-pack(1), maintenance(1)
  ├──► Neon Postgres, ap-southeast-1 (Prisma, pooled URL)
  ├──► Upstash Redis (BullMQ queues, locks, rate limits, heartbeat, public curriculum cache)
  └──► Gemini (generation: flash → flash-lite fallbacks; embeddings)
```

## Student journey and the services behind each step

```
Sign up / Google ─► /auth/register|google ─► User + Profile ─► Onboarding (/profile/onboarding)
        │                                                          │
        ▼                                                          ▼
  Placement (/quiz placement) ─► QuizAttempt ─► Mastery ─► Learner path (prerequisites + stage gating)
        │
        ▼
  Topic lesson (/learning/topics/:slug) ─► published snapshot ─► AI tutor (/ai/ask)
        │                                                 └► keyword ILIKE + semantic (ContentEmbedding, in-memory cosine)
        ▼                                                     ─► Gemini ─► answer + checked source ids
  Practice / mastery quiz / timed exam ─► draft autosave 10 s ─► submit ─► grade ─► Mastery, spaced review
        │                    └─[gap] per-mistake "revise this lesson" link
        ▼
  Workspace / build tasks (sandbox disabled in production) ─► Submission
        ▼
  Project ladder (guided) ─► ProjectSubmission ─► readiness %   [gap] → skill states
        ▼
  Career: resume upload ─► parse (1 AI call, fast model) ─► Resume (text + parsed; file not kept)
        ├─► JobTarget / JobMatch (JD parse, question bank, claims, missing skills)   [gap] missing → topics
        ├─► Top-100 plan ─► queue career-prep ─► ladder stages Basics/Core/Advanced ─► PrepQuestion
        │        ├─► Full Answer (POST → queue → worker → fullAnswers[lang]) ─► GET poll 3 s
        │        ├─► auto answers (planAnswers, up to PREP_AUTO_FULL_ANSWERS) ─► same store
        │        └─► PDF pack (career-pack / long on career-prep) ─► PrepPack.pdf bytes
        ├─► Project experience (7 projects from resume) ─► knowledge test ─► ProjectAnswer ─► skill evidence
        └─► Manisha interview (role blueprint, follow-ups, browser voice) ─► InterviewTurn ─► report
                 └─► report "next steps" → /learn/topic/<slug> (keyword match)   [gap] revision plan items not linked
        ▼
  Personalization (/personalization/next) ─► LearningEvent + attempts + turns ─► baseline ranker (ML cold start)
        ▼
  Application tracker (manual CRUD, 7 statuses)   [gap] no job feed, not linked to targets/prep, no reminders
```

## Feedback loop — target vs today

```
weak interview turn ──► skill state ──► REVISE_TOPIC / PRACTICE_SKILL recommendation ──► dashboard NextBestMove
       (exists)              (exists)                    (exists)                          (shown, but header CTA ignores it)

quiz mistake ──► QuizAttempt.results[topicId] ──► tutor "recent mistakes"        (exists)
            └──► quiz result page ──X──► specific lesson link                     (missing)

resume / JD gap ──► JobMatch.missing[] ──X──► curriculum topic                    (missing: no skill→topic map)
```

## Background work

```
maintenance (BullMQ scheduler): purge 03:30 IST · recover-prep every 5 min · index-embeddings every 15 min + at boot
career-prep (concurrency 2): plan · pipeline · fullAnswer · planAnswers (long) · answers PDF (long)
career-pack (concurrency 1): quick PDFs
code-execution: off in production (SANDBOX_DRIVER=disabled)
heartbeat: SET every 20 s → /health worker flag
```
