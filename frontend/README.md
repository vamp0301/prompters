# Prompters frontend

Built on Next.js 16 (App Router), React 19, Tailwind CSS v4, TanStack Query, Monaco and Motion.

- `src/app/(public)`: landing, roadmap, how-it-works, pricing, about, login, register.
- `src/app/(app)`: the learner app, rendered inside `AppShell`. Workspace, quiz and onboarding pages are full-bleed.
- `src/app/admin`: the Super Admin CMS.
- `src/features/*`: feature components and hooks.
- `src/components/ui`: the design system.
- `src/lib/api`: the single API client and shared types. Components never call `fetch` directly.
- `src/proxy.ts`: an optimistic route gate (Next 16's replacement for middleware). Real authorisation happens on the API.

`/api/*` is rewritten to `NEXT_PUBLIC_API_URL`, so the session cookie is first-party on Vercel.

| Script | |
|---|---|
| `npm run dev` | Development server |
| `npm run lint` / `npm run typecheck` / `npm test` | Lint, types, unit tests (Vitest + Testing Library) |
| `npm run test:e2e` | Playwright on desktop and mobile. Needs the API and worker running. |
| `npm run build && npm start` | Production build and start |
