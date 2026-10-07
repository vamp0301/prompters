# Architecture

Prompters is two deployable apps: `frontend/` (Next.js) and `backend/` (Express). The backend is a modular monolith: one API process with feature modules, plus a separate worker process that runs student code.

```
Browser ──HTTPS──▶ Next.js (Vercel)      /api/* rewrite (first-party cookie)
                        │
                        ▼
                 Express API (Render/AWS) ──▶ PostgreSQL (Neon)
                        │                 ──▶ Redis (Upstash): rate limits, cache, queue
                        ▼
                 BullMQ "code-execution" queue
                        │
                        ▼
                 Worker ──▶ Sandbox (Docker: no network, read-only, CPU/mem/pid limits)
```

## Backend modules (`backend/src/modules`)

| Module | Responsibility |
|---|---|
| `auth`, `profile` | Sessions (JWT in an httpOnly cookie), Google sign-in, onboarding, DPDP export and delete |
| `learning` | Learner path (stage and prerequisite gating), topic snapshots, public curriculum |
| `quiz` | Attempts for every kind (mastery, review, practice, placement, stage exam, mock test), grading, mastery, spaced repetition, integrity |
| `build` | Build-without-AI tasks: visible/hidden tests, hints, explain-your-code, independence score |
| `projects` | The 10-rung project ladder |
| `prompts` | Prompt cards unlocked by mastery |
| `interview`, `applications` | Question bank with practice scoring; job tracker |
| `readiness`, `dashboard`, `journey` | The Readiness Score, computed only from real data, plus the dashboard and lifetime journey |
| `ai` | Provider abstraction (Gemini, OpenRouter, Ollama, Hugging Face). Optional; blocked during timed tests |
| `admin` | CMS, content health, versioning, users, flags, scoring and audit |
| `platform` | Scoring config, feature flags, learning events, audit log, keyword rubric |

Routes validate input with zod, call services, and the services use Prisma (the repository layer). Errors are thrown as `AppError` and formatted centrally by `middleware/error-handler.ts`.

## Content model and versioning

- Authors edit **working tables**: `Topic`, `TopicSection`, and `Visualization`.
- **Publish** validates completeness and runs every code sample. It then writes an immutable `TopicVersion` snapshot.
- Students only ever read the latest snapshot, so drafts never leak.
- `QuizAttempt` stores `topicVersion` and a snapshot of every question it asked. A learner's history therefore keeps matching what they studied, even after content changes.
- Localisation lives in data: each section's `content` is `{ hinglish, en, hi?, …any locale }`. The UI falls back to English, and adding a language needs no code change.
- Visualizations are data (`kind` plus `steps[]`) rendered by one generic stepper, so admins create animations without touching React.

## Learning rules (all configurable in Admin → Scoring)

| Rule | Default |
|---|---|
| Mastery | 80% or more on a fresh mastery quiz. Questions are drawn from a pool, preferring ones not seen last time. |
| Spaced review | 1, 3, 7, 14, 30, 60 and 90 days after mastery. A failed review sets `NEEDS_REVIEW` and the topic returns to Practice 10. |
| Stage gating | A stage unlocks when the previous stage's exam is passed (70%). Stages with no content are skipped. A placement test showing 80% or more of a stage's topics also passes that stage. |
| Topic gating | A topic is locked until its prerequisites (topics with content) are mastered. |
| Independence | 100 minus the hint penalties: 8, 10 and 12 points for hint levels 1, 2 and 3. |
| Project score | 60% tests, 25% explanation, 15% independence. |
| Readiness | Weighted: mastery 30, projects 20, DSA 15, recall 10, interview 15, resume 10. Snapshots are stored whenever the score changes. |

## Performance

The curriculum shape is cached per process for 30 seconds and invalidated on every admin write. Per-learner data (mastery, stage progress) is fetched in one parallel round. Deploy the API in the same region as the database: Neon `ap-southeast-1` pairs with Render Singapore. Most request time is database round trips.
