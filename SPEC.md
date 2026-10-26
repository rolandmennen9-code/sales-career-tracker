# SPEC — Sales Career Tracker (working name)

> A personal career-performance tracker for SaaS Account Executives that turns
> confirmed achievements into a sales-specific CV and a shareable portfolio.
> "Strava for your SaaS sales career."

The product name is a placeholder. It lives in one constant (`APP_NAME` in
`src/lib/config.ts`) so renaming is a one-line change.

---

## 1. Product principles

1. **The tracker is the source of truth.** The CV and the portfolio are two
   *views* of the same records. Nothing is typed twice.
2. **Minutes per quarter, not daily logging.** The core update is one
   performance record per quarter or year, plus the occasional achievement.
3. **Private by default.** Every record starts private. Users choose what the
   portfolio shows, and can show attainment % without revealing revenue,
   quota or compensation.
4. **Never invent numbers.** AI may extract, structure and rephrase, but every
   metric in a CV or portfolio must come from a record the user has confirmed.
5. **Sales-specific, not generic.** Fields and copy speak AE: quota,
   attainment, ARR/ACV, deal size, sales cycle, methodology, President's Club.

## 2. MVP scope (milestone 1)

**In:** AE role only · sign-up · CV import with AI extraction · career
history · performance tracker · achievement library · CV generator with PDF
export · public portfolio with visibility controls.

**Out (later):** SDR / AM / CSM / manager role templates · quarterly reminder
emails · STAR interview prep · verification and manager endorsements ·
recruiter search / marketplace · CRM integrations · social feed.

**Success metric:** % of sign-ups who complete a profile *and* generate a CV
or publish a portfolio; % who return to add a later performance record.

## 3. User flow

```
Sign up (magic link / Google)
  → Onboarding
      1. Specialization  (AE only, others shown as "coming soon")
      2. Segment & basics (SMB / Mid-Market / Enterprise, location, headline)
      3. Import CV (PDF) → AI extracts positions + achievements → review & confirm
         ↳ or "Add manually"
      4. First performance record (latest full year or quarter)
  → Dashboard (career tracker)
      · headline stats: avg attainment, total closed revenue, years in SaaS sales
      · attainment history chart
      · positions, performance records, achievements (CRUD)
  → CV builder
      · target role (Enterprise AE / Mid-Market AE / SMB AE)
      · emphasis (new business / complex deals / expansion)
      · include toggles (attainment, deal sizes & cycles, methodologies)
      · editable preview → Download PDF
  → Portfolio
      · choose slug, toggle sections, preview, publish / unpublish
      · public page at /p/{slug}
```

Target: a first usable CV in **under five minutes** for someone with an
existing CV.

## 4. Data model (Supabase Postgres)

All tables have `user_id uuid references auth.users` and RLS
`user_id = auth.uid()` for every operation.

### `profiles` (1:1 with `auth.users`)
| column | type | notes |
|---|---|---|
| id | uuid pk | = auth.users.id |
| full_name | text | |
| headline | text | e.g. "Enterprise Account Executive · B2B SaaS" |
| location | text | |
| specialization | text | `ae` (only value in MVP) |
| segment | text | `smb` \| `mid_market` \| `enterprise` |
| summary | text | about / professional summary |
| methodologies | text[] | MEDDPICC, Challenger, SPIN… |
| tools | text[] | Salesforce, HubSpot, Gong… |
| onboarding_completed | bool | |
| slug | text unique | portfolio URL, lowercase `[a-z0-9-]` |
| portfolio_published | bool | default false |
| show_attainment | bool | default true |
| show_revenue_figures | bool | default **false** (absolute € amounts) |
| show_deal_metrics | bool | default true (deal size / cycle, anonymised) |
| show_achievements | bool | default true |
| show_experience | bool | default true |

### `positions`
company, title, segment, start_date, end_date (null = current), description,
currency (default EUR).

### `performance_records`
position_id, period_type (`year` \| `quarter`), year, quarter (1–4 or null),
quota, closed_revenue, attainment_pct (entered, or computed from
revenue / quota), deals_closed, avg_deal_size, avg_sales_cycle_days,
ranking (free text, e.g. "#2 of 18 in EMEA"), notes.
Unique on (user_id, position_id, period_type, year, quarter).

### `achievements`
position_id (nullable), kind (`award` \| `deal` \| `promotion` \|
`milestone`), title, description, achieved_on, deal_value,
sales_cycle_days, is_public (default false).

### `cvs`
target_role, emphasis, options (jsonb include toggles), content (jsonb —
the editable CV document), updated_at.

### Public access
A `security definer` function `get_public_portfolio(slug)` returns one JSON
object containing **only** fields allowed by that user's visibility flags,
and only when `portfolio_published = true`. The anon role can execute it;
it cannot read any table directly.

## 5. Pages & routes

| route | purpose |
|---|---|
| `/` | landing page |
| `/login` | magic link + Google |
| `/auth/callback` | Supabase code exchange |
| `/onboarding` | 4-step onboarding |
| `/dashboard` | tracker overview |
| `/dashboard/positions` | career history CRUD |
| `/dashboard/performance` | performance records CRUD |
| `/dashboard/achievements` | achievement library CRUD |
| `/cv` | CV builder + preview |
| `/cv/pdf` | route handler → PDF download |
| `/portfolio` | visibility settings, slug, publish |
| `/p/[slug]` | public portfolio |
| `/api/import-cv` | PDF upload → Claude extraction → JSON for review |

## 6. AI usage

- **CV import:** the uploaded PDF is sent to the Claude API as a document
  block with a JSON-schema structured output (positions, achievements,
  methodologies, tools, any stated metrics). Results are shown for review;
  nothing is saved until the user confirms.
- **CV polish (optional):** rephrase summary and bullets for the chosen
  target role/emphasis. The prompt passes only confirmed records and must not
  add numbers. Deterministic generation works without an API key.
- Model set by `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`).
  Without `ANTHROPIC_API_KEY` the import step falls back to manual entry.

## 7. Stack

Next.js 16 (App Router, server actions, `proxy.ts`) · TypeScript · Tailwind
v4 · Supabase (auth, Postgres, RLS) · `@react-pdf/renderer` for PDF ·
`@anthropic-ai/sdk` · zod for validation · deploy to Vercel.

## 8. Milestone 2+ backlog

1. Quarterly reminder email ("Q3 closed — log your number").
2. STAR story generator from achievements.
3. SDR, AM, CSM and Sales Manager templates.
4. Portfolio link expiry / revocable private links.
5. Manager endorsements and evidence uploads (verification).
6. Recruiter discovery (long term).
