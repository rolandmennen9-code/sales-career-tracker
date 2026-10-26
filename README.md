# Sales Career Tracker (working name)

A career-performance tracker for SaaS Account Executives. Log quota and deal
metrics each quarter, keep an achievement library, and turn it into a
sales-specific CV (PDF) and a private-by-default shareable portfolio.

See [`SPEC.md`](SPEC.md) for the product spec and [`CLAUDE.md`](CLAUDE.md)
for working on the code with Claude Code.

## Stack

Next.js 16 · TypeScript · Tailwind v4 · Supabase (auth, Postgres, RLS) ·
`@react-pdf/renderer` · Claude API (CV import and optional wording polish).

## Setup

1. **Create a Supabase project** at supabase.com.
2. **Run the migration**: open the SQL editor and run
   `supabase/migrations/0001_init.sql` (or `supabase db push` with the CLI).
3. **Configure auth** (Authentication → URL Configuration):
   - Site URL: `http://localhost:3000` (your Vercel URL in production)
   - Redirect URLs: `http://localhost:3000/auth/callback`
   - Optional: enable the Google provider under Authentication → Providers.
4. **Environment**: `cp .env.example .env.local` and fill in the Supabase URL
   and anon key. Add `ANTHROPIC_API_KEY` to enable CV import; without it,
   onboarding falls back to manual entry.
5. **Run it**:
   ```sh
   npm install
   npm run dev
   ```

## Scripts

| command | what it does |
|---|---|
| `npm run dev` | dev server on :3000 |
| `npm run build` | production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run test:db` | runs the migration in an in-memory Postgres and checks RLS and portfolio privacy |

## Deploy

Push to GitHub, import the repo in Vercel, set the same env vars
(`NEXT_PUBLIC_SITE_URL` = your production URL), and add
`https://your-domain/auth/callback` to Supabase redirect URLs.

## What's in milestone 1

- Magic-link and Google sign-in
- Onboarding: specialization (AE), basics, CV import with review, first record
- Tracker: positions, yearly/quarterly performance, achievements
- CV builder: target role, emphasis, include toggles, inline editing, AI
  polish with a no-new-numbers guardrail, PDF export
- Portfolio: custom slug, section toggles, % vs € visibility, publish /
  unpublish, public page at `/p/{slug}`
