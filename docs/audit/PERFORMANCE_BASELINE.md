# Prompters — performance baseline (2026-10-13)

Only numbers that were actually measured are listed as measurements. Everything else is a gap, with the smallest
instrumentation that would close it. No targets are set yet: set them after a week of real measurements.

## Measured

Taken from one developer machine in India with `curl` on 2026-10-13. Few samples on one network, so treat them as
order-of-magnitude, not p50/p95.

| Request | Samples | Result |
|---|---|---|
| `GET prompters.onrender.com/live` after idle (cold start) | 1 | **73.1 s** to first byte |
| `GET /live` warm | 5 | 0.49 – 1.50 s |
| `GET /health` warm (DB + Redis + heartbeat) | 3 | 1.28 – 1.70 s |
| `GET /api/me` via Vercel rewrite, unauthenticated (401) | 3 | 0.86 – 1.83 s; served by edge `bom1`, no iad1 hop |
| `GET prompters-steel.vercel.app/` (landing, 48 KB) | 3 | 0.32 – 2.04 s TTFB (cache HIT after first) |
| `GET /login` (22 KB) | 3 | 0.31 – 0.68 s TTFB |

Previously reported (earlier sessions, not re-measured here): Full Answer first request ready in 79 s, second served
from cache; Top-100 Basics ready ≈ 60 s, full ladder ≈ 170 s; Complete-answers PDF re-render on Render took 82 s
(fixed in `7a26251` by storing the bytes).

Local test suite timings: backend `npm test` and frontend builds all pass (see AUDIT.md §0).

## Biggest measured cost: cold start
73 s is longer than Vercel's proxy timeout for many requests and longer than most students will wait. Causes in
config: Render free plan sleeps after inactivity; the start command runs `prisma migrate deploy` on every boot;
taxonomy init and worker start run before `listen()` (AUDIT H2). Options and their trade-offs are in
OPTIMIZATION_PLAN.md (an uptime pinger keeps it awake but pushes Redis traffic past the free quota — AUDIT H8).

## Not measured yet (gaps) and the smallest fix

| Metric | Today | Smallest addition (no new service) |
|---|---|---|
| API p50/p95 per route | pino-http logs `responseTime` per request but with the raw URL (ids inside), no route template | add `route` (`req.baseUrl + req.route.path`) via pino-http `customProps`; in-memory per-route ring buffer exposed on an admin-only endpoint |
| DB query time | none (`new PrismaClient({ log: ["error"] })`) | Prisma `$extends` query hook logging operations > 300 ms |
| AI latency, tokens, failures | discarded (`usageMetadata` ignored) | one structured log line per `complete()` with task, model, ms, prompt/output tokens, outcome; Redis daily counter per model |
| Queue wait / run time | none | BullMQ `active` / `completed` listeners recording `processedOn - timestamp` and `finishedOn - processedOn` |
| Full Answer queue → ready | only via the `at` timestamps in `fullAnswers` JSON | derive from the same listeners |
| Cache hit rate | none | counters in the query-vector cache and full-answer reuse |
| Embedding index freshness | `indexCoverage()` exists, unused | expose on the admin endpoint |
| Redis commands/day | not measured | read the Upstash dashboard; compare with the ~40–45K/day estimate |
| Frontend route load / interaction | none | Next.js `useReportWebVitals` → log endpoint (sampled) |
| Resume upload / PDF success rate | events exist (`prep_pack_requested`) but no failure counts | count FAILED pack/plan rows per day in the admin insights |
