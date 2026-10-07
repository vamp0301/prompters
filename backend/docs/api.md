# Prompters API

Base path: `/api`. All bodies are JSON. The browser calls the API through the frontend's `/api/*` rewrite, so the session cookie is first-party.

## Conventions

**Success**

```json
{ "success": true, "data": {} }
```

**Error**

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Some fields are invalid.", "details": {}, "requestId": "…" } }
```

| Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR`, `BAD_REQUEST`, `INVALID_JSON` | Bad input. `details` is zod's `flatten()` output for validation errors. |
| 401 | `UNAUTHORIZED` | No valid session. |
| 403 | `FORBIDDEN`, `CSRF_REJECTED`, `FEATURE_DISABLED`, `ACCOUNT_SUSPENDED` | Role, origin or feature flag blocks the request. |
| 404 | `NOT_FOUND` | Missing, **or not yours**. Ownership failures return 404 so IDs can't be probed. |
| 409 | `CONFLICT`, `NO_ATTEMPTS_LEFT` | State conflict. |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Mutating request without a JSON body. |
| 422 | `NOT_PUBLISHABLE` | Topic fails completeness or code-sample checks. `details.missing` and `details.codeFailures` say why. |
| 423 | `LOCKED` | Stage or prerequisite lock. `details.missingPrerequisites` lists what to learn first. |
| 429 | `RATE_LIMITED` | Too many requests. |
| 5xx | `INTERNAL_ERROR`, `AI_UNAVAILABLE`, `AI_UPSTREAM_ERROR` | Server-side problem. No stack trace is ever returned. |

- **Auth:** an httpOnly, `SameSite=Lax` cookie named `prompters_session` (a 7-day HS256 JWT carrying `sub` and `tv` = token version). Bumping `tokenVersion` revokes every session at once.
- **CSRF:** mutating requests must be JSON. If an `Origin` header is sent, it must be in `CORS_ORIGIN` or `APP_URL`.
- **Pagination:** send `?page=1&pageSize=25`. Paged responses return `{ items, total, page, pageSize }`.
- **Rate limits** (Redis-backed, keyed per user or IP):

  | Scope | Limit |
  |---|---|
  | Global | 300/min |
  | Auth | 20 per 15 min |
  | Code runs | 30/min |
  | AI | 10/min |

**Roles.** Each tier includes all permissions of the tiers below it.

| Role | Can |
|---|---|
| `STUDENT` | Learn |
| `AUTHOR` | Write drafts |
| `ADMIN` | Publish; manage users and integrity |
| `SUPER_ADMIN` | Manage roles, flags, scoring and audit; override publish validation |

## Public

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` (no `/api` prefix) | – | `{ database, redis }`. Returns 503 if either is down. |
| GET | `/public/curriculum` | – | Stage, module and topic titles plus `available` flags. Cached for 5 minutes. |

## Auth & profile

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | Password: 8+ characters with a letter and a number. Sets the session cookie. Returns 201. |
| POST | `/auth/login` | `{ email, password }` | Constant-time check. A suspended account returns 403. |
| POST | `/auth/google` | `{ credential }` | Google ID token, verified against `GOOGLE_CLIENT_ID`. |
| POST | `/auth/logout` | – | Clears the cookie. |
| POST | `/auth/logout-all` | – | Bumps the token version. |
| GET | `/auth/me` | – | User, profile summary and resolved feature `flags`. |
| POST | `/auth/change-password` | `{ currentPassword, newPassword }` | Revokes other sessions. |
| GET | `/auth/export` | – | Full DPDP data export as JSON. |
| DELETE | `/auth/account` | `{ confirm: <email> }` | Students only. Cascades. |
| GET / PATCH | `/profile` | Profile fields | Includes the resume fields: `headline`, `summary`, `links`. |
| POST | `/profile/onboarding` | `startLanguage`, `explanationLocale`, `goalRole`, `codingLevel`, `weeklyHours`, … | Sets `onboardedAt`. |

## Learning

| Method | Path | Notes |
|---|---|---|
| GET | `/roadmap` | The learner's path. Stages for the chosen track, each with `unlocked`, `lockReason`, `passed`, `progress` and `examSlug`. Topic states: `COMING_SOON`, `LOCKED`, `AVAILABLE`, `IN_PROGRESS`, `MASTERED`, `NEEDS_REVIEW`. |
| GET | `/stages/:slug` | One stage from the path. |
| GET | `/topics/:slug` | The latest published snapshot, plus mastery, quiz info, build tasks, prompt cards (locked until mastery), interview questions and the next topic. Returns `{ comingSoon: true }` for topics without content, and 423 when locked. |
| POST | `/topics/:slug/read` | Mark as read. |

## Quizzes & assessments

Answer formats:

| Question type | Answer |
|---|---|
| Single-answer types | Displayed option index |
| `MULTI` | Array of displayed indices |
| `ORDER_STEPS` | Displayed indices in the chosen order |
| `EXPLAIN` | String |

Options are shuffled per attempt on the server, and correct answers are never sent before submit.

| Method | Path | Notes |
|---|---|---|
| POST | `/topics/:slug/quiz` | Mastery quiz (`quizSize` questions). Prefers questions not seen in the previous attempt. |
| POST | `/topics/:slug/review` | Spaced review. The topic must have been mastered. |
| POST | `/practice` | Practice 10: weak topics, due reviews and one stretch question. Returns 409 when there is no history yet. |
| POST | `/placement` | Onboarding placement test: two questions per Stage 0/1 topic, 30 minutes. |
| GET | `/assessments` | Published stage exams and mock tests, with the attempts used and best score. |
| POST | `/assessments/:slug/start` | Starts a timed attempt and returns `assessment` rules. Resumes an in-progress attempt. |
| GET | `/attempts/:id` | Resumes (questions + `draftAnswers`) or returns the result. Auto-grades after the deadline plus 60s grace. |
| PUT | `/attempts/:id/draft` | `{ answers }`. Autosave. |
| POST | `/attempts/:id/integrity` | `{ events: [{ type }] }`. Types: `TAB_HIDDEN`, `WINDOW_BLUR`, `COPY`, `PASTE`, `CUT`, `FULLSCREEN_EXIT`, `CONTEXT_MENU`, `BLOCKED_SHORTCUT`. May auto-submit or flag, depending on the assessment policy. |
| POST | `/attempts/:id/submit` | `{ answers }`. Idempotent. Returns per-question correctness, explanations, the score, and `effects` (`mastered`, `promptsUnlocked`, `backToPractice`, `stagePassed`, `skippedTopics`, …). |
| GET | `/attempts` | Finished attempts (last 50). |
| GET | `/reviews/due` | `{ due, upcoming }` |

## Build without AI

| Method | Path | Notes |
|---|---|---|
| GET | `/build-tasks` | Tasks in the learner's path, with status and scores. |
| GET | `/build-tasks/:slug` | Visible tests only, plus the hidden test count, revealed hints and the submission. |
| POST | `/build-tasks/:slug/start` | `{ language }` |
| PUT | `/build-tasks/:slug/code` | `{ language, code }`. Autosave. |
| POST | `/build-tasks/:slug/run` | Runs the visible tests in the sandbox. |
| POST | `/build-tasks/:slug/hint` | Reveals the next hint level. Independence score: 100 → 92 → 82 → 70. |
| POST | `/build-tasks/:slug/submit` | Runs every test. Hidden tests return only pass/fail. Returns the explain questions when all tests pass. |
| POST | `/build-tasks/:slug/explain` | `{ answers: string[] }`. Graded by a keyword rubric. A pass completes the task and returns the independence and project scores. |
| POST | `/code/run` | `{ language, code }`. Free-run for topic examples. |

## Projects, prompts, interviews, career

| Method | Path | Notes |
|---|---|---|
| GET | `/projects` | The 10-rung ladder. Each rung unlocks when the previous one is completed. |
| GET | `/projects/:slug` | Detail, revealed hints and the submission. |
| POST | `/projects/:slug/hint` | Next hint. |
| POST | `/projects/:slug/submit` | `{ repoUrl, liveUrl?, howIBuiltIt: { approach, bugFixed, tradeoff }, milestonesDone, explainAnswers[] }` |
| GET | `/prompts` | All cards. Locked cards omit the template. |
| GET | `/prompts/:id` | Full card. Returns 423 until the topic is mastered. |
| POST | `/prompts/:id/favorite` | Toggles the favourite. |
| POST | `/prompts/:id/rate` | `{ rating: 1–5 }` |
| POST | `/prompts/:id/used` | Logs that the prompt was used. |
| GET | `/interview/questions` | `?category&role&q&page`. Includes category counts and your best score. |
| POST | `/interview/questions/:id/practice` | `{ answer }`. Returns the keyword score, then reveals the model answers. |
| GET / POST / PATCH / DELETE | `/applications[/:id]` | Job tracker, scoped to the owner. |
| GET | `/readiness` | Score, factors, weights, areas, weakest areas, next actions, history and the 7- and 30-day deltas. Stores a snapshot when the score changes. |
| GET | `/dashboard` | Readiness, today's plan, continue learning, weak areas, due reviews, recent builds and streak. |
| GET | `/journey` | Milestones, per-stage progress, stats, forgotten and strong topics, and readiness history. |
| GET | `/journey/events` | Paginated activity feed. |
| GET | `/ai/status` | Whether the tutor is available to this user. |
| POST | `/ai/explain` | `{ topicSlug, question }`. Hinglish-first tutor. Returns 423 while a timed test is in progress, and 503 when no AI provider is configured. |

## Admin (`/admin`, AUTHOR+)

| Area | Endpoints | Min role |
|---|---|---|
| Insights | `GET /dashboard` | ADMIN |
| | `GET /content-health`, `GET /search?q=` | AUTHOR |
| Stages | `GET /stages` | AUTHOR |
| | `POST /stages`, `PATCH /stages/:id` | ADMIN |
| Modules | `GET /modules` | AUTHOR |
| | `POST /modules`, `PATCH /modules/:id`, `POST /modules/:id/duplicate`, `POST /modules/:id/publish` | ADMIN |
| Topics | `GET /topics`, `GET/POST/PATCH /topics/:id`, `PUT /topics/:id/sections`, `PUT /topics/:id/visualization`, `GET /topics/:id/completeness`, `GET /topics/:id/preview`, `POST /topics/:id/status`, `POST /topics/:id/duplicate`, `POST /topics/:id/verify-code`, `GET /topics/:id/versions/:v` | AUTHOR |
| | `POST /topics/:id/publish` (`override` needs SUPER_ADMIN), `POST /topics/:id/unpublish`, `POST /topics/:id/archive`, `POST /topics/:id/versions/:v/restore` | ADMIN |
| Content CRUD (`GET` list, `GET /:id`, `POST`, `PATCH /:id`, `POST /:id/archive`) | `/questions`, `/build-tasks`, `/prompts`, `/interviews` | AUTHOR |
| | `/projects`, `/assessments` | ADMIN |
| Content extras | `POST /build-tasks/:id/validate` (runs a reference solution against the tests), `POST /prompts/:id/new-version`, `GET /questions-export.csv`, `POST /questions-import` (`{ csv, commit }`, all-or-nothing) | AUTHOR |
| Users | `GET /users`, `GET /users/:id`, `POST /users/:id/status`, `POST /users/:id/revoke-sessions` | ADMIN |
| | `GET /users/export.csv`, `PATCH /users/:id/role`, `POST /users/:id/reset-topic` | SUPER_ADMIN |
| Feature flags | `GET /feature-flags` | ADMIN |
| | `PUT /feature-flags/:key` | SUPER_ADMIN |
| Scoring | `GET /scoring` | ADMIN |
| | `POST /scoring` (new version), `POST /scoring/:version/activate` | SUPER_ADMIN |
| Audit | `GET /audit-logs` | SUPER_ADMIN |
| Integrity | `GET /integrity` | ADMIN |
| Translations | `GET /translations`, `POST /translations/draft` | AUTHOR |

Every admin write is recorded in `AdminAuditLog` with before/after JSON. There is no endpoint to delete audit rows. Topics are never hard-deleted; they are archived.
