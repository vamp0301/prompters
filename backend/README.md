# Prompters backend

Express 5, TypeScript, Prisma (PostgreSQL), and BullMQ (Redis), structured as a modular monolith. See [../docs/architecture.md](../docs/architecture.md) and [docs/api.md](docs/api.md).

```
src/
  config/       env (zod-validated), .env loader
  server/       app + entrypoint
  middleware/   auth (cookie JWT, roles), csrf, rate limits, errors, request id
  modules/      auth, profile, learning, quiz, build, projects, prompts, interview,
                readiness, dashboard, journey, applications, ai, admin, platform, code
  sandbox/      harness + drivers (docker for production, process for development)
  jobs/ workers/ BullMQ queue and code worker
  ai/           provider abstraction + Hinglish tutor
prisma/
  schema.prisma, migrations/, seed/ (curriculum, content files, projects, interview bank)
scripts/verify-content.ts   runs every seeded code sample
tests/                      vitest + supertest (unit, sandbox, auth, learning, build, admin)
```

| Script | |
|---|---|
| `npm run dev` / `npm run dev:worker` | API on :4000 / sandbox worker |
| `npm run db:migrate` | Create a migration (development) |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Idempotent. Never overwrites a topic that is already published. |
| `npm test` | Resets the local `prompters_test` database. Never touches `DATABASE_URL` from `.env`. |
| `npm run test:content` | Content integrity check |
| `npm run build && npm start` | Production build and start |

Environment variables are documented in `.env.example`.
