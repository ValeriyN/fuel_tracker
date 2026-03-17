# Fuel Tracker — Project Context

Personal fuel tracking web app. Users manage vehicles and log fueling records. Each user sees only their own data. European units throughout (liters, km, euros).

## Tech Stack

- **Next.js 16.1.7** (App Router) — full-stack, API routes + React UI
- **SQLite** via `better-sqlite3` — file-based, auto-created on first run as `fuel_tracker.db`
- **Tailwind CSS v4**
- **bcryptjs** — password hashing (cost factor 10)
- **jose** — JWT auth stored in HTTP-only cookie named `session`
- **TypeScript**
- **vitest** + **@testing-library/react** — 74 tests across lib, API, and component suites

## Project Structure

```
app/
  (auth)/           ← public routes (login, register) + ALL API routes
    login/
    register/
    api/
      auth/register|login|logout/route.ts
      vehicles/route.ts
      vehicles/[id]/route.ts
      vehicles/[id]/fuelings/route.ts
      vehicles/[id]/fuelings/[fuelingId]/route.ts
      me/route.ts
  (app)/            ← protected UI pages
    layout.tsx      ← protected layout with Nav
    vehicles/
      page.tsx
      new/page.tsx
      [id]/page.tsx
      [id]/fuelings/new/page.tsx
      [id]/fuelings/[fuelingId]/edit/page.tsx
components/
  Nav.tsx           ← language switcher + sign out
  FuelingForm.tsx   ← add/edit fueling (client)
  FuelingTable.tsx  ← fueling log table (client)
  LanguageProvider.tsx ← i18n React context
lib/
  db.ts             ← SQLite singleton, creates schema on init
  auth.ts           ← signToken, verifyToken, getSession
  i18n.ts           ← translations (en/uk), getT(), FUEL_TYPE_KEYS
  language.ts       ← server-side lang cookie reader
  types.ts          ← TypeScript interfaces
proxy.ts            ← route protection (Next.js 16 uses proxy.ts, not middleware.ts)
tests/
  helpers/testDb.ts ← in-memory SQLite + seed helpers
  lib/              ← unit tests for auth, db, i18n
  api/              ← API route tests (auth, vehicles, fuelings)
  components/       ← React component tests
vitest.config.ts
```

## Key Decisions & Gotchas

- **`proxy.ts` not `middleware.ts`** — Next.js 16 renamed the middleware convention. Export must be named `proxy`, not `middleware`.
- **Route group `(auth)`** contains ALL API routes (not just auth). The group name is misleading but that's where they ended up.
- **`DbFueling` vs `Fueling`** — SQLite stores `full_tank` as integer (0/1). `DbFueling` has `full_tank: number`; `Fueling` has `full_tank: boolean`. API routes cast when returning data.
- **`lib/db.ts`** respects `DB_PATH` env var — used by tests to get `:memory:` databases.
- **i18n** — cookie-based (`lang` cookie, `en` or `uk`). Server components call `getLanguage()` + `getT(lang)`. Client components use `useTranslation()` hook. Language change calls `router.refresh()` to re-render server components.
- **Fuel type values** — always stored in English in the DB regardless of UI language (uses `FUEL_TYPE_KEYS` canonical values).

## Auth Flow

Register/login → sets HTTP-only `session` cookie with JWT containing `{ userId, username }` → `proxy.ts` protects `/(app)/` routes → API routes call `getSession()` and scope all queries to `userId`.

## Running Locally

```bash
npm install
npm run dev       # http://localhost:3000
npm test          # run all 74 tests
```

## API Tests — Important Note

API test files (`tests/api/*.test.ts`) use dynamic imports inside `beforeAll` to load route handlers **after** `vi.mock` hoisting. Static imports don't work due to Vite module resolution. Always use this pattern:

```typescript
beforeAll(async () => {
  const route = await import('../../app/(auth)/api/vehicles/route');
  getVehicles = route.GET;
});
```

## Deployment

SQLite requires a persistent filesystem. **Not compatible with Vercel or Netlify** (serverless/ephemeral). Recommended hosting: Railway or Render (support persistent volumes, deploy directly from GitHub).
