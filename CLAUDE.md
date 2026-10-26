# CLAUDE.md

Read `SPEC.md` first — it is the product contract. Read `AGENTS.md` for
Next.js 16 rules (bundled docs live in `node_modules/next/dist/docs/`).

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build (must pass before committing)
- `npm run lint` — ESLint
- `npx tsc --noEmit` — typecheck

## Architecture
- `src/app` — App Router routes. Server components by default; `"use client"`
  only for interactive pieces.
- `src/lib/supabase/` — `server.ts` (server components / actions / route
  handlers), `client.ts` (browser), `proxy.ts` (session refresh).
- `src/lib/types.ts` — row types mirroring `supabase/migrations`.
- `src/lib/cv.ts` — deterministic CV generation from tracker records.
- `src/lib/ai.ts` — all Claude API calls. Nothing else imports the SDK.
- `src/app/**/actions.ts` — server actions; validate input with zod.
- `supabase/migrations/` — SQL is the source of truth for the schema.

## Rules
- Next.js 16: `params`, `searchParams`, `cookies()`, `headers()` are async.
  Middleware is `src/proxy.ts`.
- Every table has RLS. Never use the service-role key in app code. Public
  portfolio data goes only through `get_public_portfolio(slug)`.
- New fields default to private. Absolute revenue/quota figures are hidden on
  the portfolio unless `show_revenue_figures` is true.
- AI must never invent metrics. Pass only confirmed records into prompts and
  keep the "review before save" step for imports.
- AE is the only specialization in milestone 1; don't add other roles yet.
- Keep the app name in `src/lib/config.ts` only.
- Currency: store numbers, format at render with `Intl.NumberFormat`.
