-- Sales Career Tracker — initial schema
-- Every table is owner-only via RLS. Public portfolio data is exposed only
-- through get_public_portfolio(slug), which respects visibility flags.

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  headline text,
  location text,
  specialization text not null default 'ae' check (specialization in ('ae')),
  segment text check (segment in ('smb', 'mid_market', 'enterprise')),
  summary text,
  methodologies text[] not null default '{}',
  tools text[] not null default '{}',
  onboarding_completed boolean not null default false,
  slug text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  portfolio_published boolean not null default false,
  show_attainment boolean not null default true,
  show_revenue_figures boolean not null default false,
  show_deal_metrics boolean not null default true,
  show_achievements boolean not null default true,
  show_experience boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------- positions
create table public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company text not null,
  title text not null,
  segment text check (segment in ('smb', 'mid_market', 'enterprise')),
  start_date date not null,
  end_date date,
  description text,
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);
create index positions_user_idx on public.positions (user_id, start_date desc);

-- ----------------------------------------------------- performance_records
create table public.performance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  position_id uuid not null references public.positions (id) on delete cascade,
  period_type text not null check (period_type in ('year', 'quarter')),
  year int not null check (year between 1990 and 2100),
  quarter int check (quarter between 1 and 4),
  quota numeric(14, 2) check (quota >= 0),
  closed_revenue numeric(14, 2) check (closed_revenue >= 0),
  attainment_pct numeric(6, 1) check (attainment_pct >= 0),
  deals_closed int check (deals_closed >= 0),
  avg_deal_size numeric(14, 2) check (avg_deal_size >= 0),
  avg_sales_cycle_days int check (avg_sales_cycle_days >= 0),
  ranking text,
  notes text,
  created_at timestamptz not null default now(),
  check ((period_type = 'year' and quarter is null) or (period_type = 'quarter' and quarter is not null))
);
create unique index performance_unique_period
  on public.performance_records (user_id, position_id, period_type, year, coalesce(quarter, 0));

-- ------------------------------------------------------------ achievements
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  position_id uuid references public.positions (id) on delete set null,
  kind text not null check (kind in ('award', 'deal', 'promotion', 'milestone')),
  title text not null,
  description text,
  achieved_on date,
  deal_value numeric(14, 2) check (deal_value >= 0),
  sales_cycle_days int check (sales_cycle_days >= 0),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
create index achievements_user_idx on public.achievements (user_id, achieved_on desc);

-- --------------------------------------------------------------------- cvs
create table public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_role text not null,
  emphasis text not null,
  options jsonb not null default '{}',
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index cvs_one_per_user on public.cvs (user_id);

-- --------------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.positions enable row level security;
alter table public.performance_records enable row level security;
alter table public.achievements enable row level security;
alter table public.cvs enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own positions" on public.positions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own performance" on public.performance_records
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own achievements" on public.achievements
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own cvs" on public.cvs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Performance and achievements must reference the caller's own positions.
create or replace function public.enforce_own_position()
returns trigger language plpgsql as $$
begin
  if new.position_id is not null and not exists (
    select 1 from public.positions p where p.id = new.position_id and p.user_id = new.user_id
  ) then
    raise exception 'position does not belong to user';
  end if;
  return new;
end $$;

create trigger performance_own_position before insert or update on public.performance_records
  for each row execute function public.enforce_own_position();
create trigger achievements_own_position before insert or update on public.achievements
  for each row execute function public.enforce_own_position();

-- Create a profile row on sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------- public portfolio access
create or replace function public.get_public_portfolio(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  prof public.profiles;
  result jsonb;
begin
  select * into prof from public.profiles
  where slug = lower(p_slug) and portfolio_published = true;
  if not found then
    return null;
  end if;

  result := jsonb_build_object(
    'full_name', prof.full_name,
    'headline', prof.headline,
    'location', prof.location,
    'segment', prof.segment,
    'summary', prof.summary,
    'methodologies', to_jsonb(prof.methodologies),
    'tools', to_jsonb(prof.tools),
    'show_revenue_figures', prof.show_revenue_figures
  );

  if prof.show_experience then
    result := result || jsonb_build_object('positions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'company', p.company, 'title', p.title, 'segment', p.segment,
        'start_date', p.start_date, 'end_date', p.end_date
      ) order by p.start_date desc)
      from public.positions p where p.user_id = prof.id
    ), '[]'::jsonb));
  end if;

  if prof.show_attainment or prof.show_deal_metrics then
    result := result || jsonb_build_object('performance', coalesce((
      select jsonb_agg(jsonb_build_object(
        'period_type', r.period_type, 'year', r.year, 'quarter', r.quarter,
        'company', p.company,
        'attainment_pct', case when prof.show_attainment then r.attainment_pct end,
        'ranking', case when prof.show_attainment then r.ranking end,
        'closed_revenue', case when prof.show_revenue_figures then r.closed_revenue end,
        'quota', case when prof.show_revenue_figures then r.quota end,
        'deals_closed', case when prof.show_deal_metrics then r.deals_closed end,
        'avg_deal_size', case when prof.show_deal_metrics and prof.show_revenue_figures then r.avg_deal_size end,
        'avg_sales_cycle_days', case when prof.show_deal_metrics then r.avg_sales_cycle_days end
      ) order by r.year, r.quarter nulls first)
      from public.performance_records r
      join public.positions p on p.id = r.position_id
      where r.user_id = prof.id
    ), '[]'::jsonb));
  end if;

  if prof.show_achievements then
    result := result || jsonb_build_object('achievements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'kind', a.kind, 'title', a.title, 'description', a.description,
        'achieved_on', a.achieved_on,
        'deal_value', case when prof.show_revenue_figures then a.deal_value end,
        'sales_cycle_days', case when prof.show_deal_metrics then a.sales_cycle_days end
      ) order by a.achieved_on desc nulls last)
      from public.achievements a
      where a.user_id = prof.id and a.is_public = true
    ), '[]'::jsonb));
  end if;

  return result;
end $$;

revoke all on function public.get_public_portfolio(text) from public;
grant execute on function public.get_public_portfolio(text) to anon, authenticated;
