// Runs the migration against PGlite with a minimal Supabase auth stub,
// then checks RLS and the public portfolio function.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../supabase/migrations/0001_init.sql", import.meta.url), "utf8");
const db = new PGlite();
const ok = (c, m) => { if (!c) { console.error("FAIL:", m); process.exitCode = 1; } else console.log("ok  ", m); };

await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);
await db.exec(migration);
await db.exec(`
  grant usage on schema public to anon, authenticated;
  grant select, insert, update, delete on all tables in schema public to authenticated;
`);

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values
  ('${A}', 'a@x.com', '{"full_name":"Alex Morgan"}'), ('${B}', 'b@x.com', '{}');`);
const prof = await db.query(`select full_name from public.profiles where id = $1`, [A]);
ok(prof.rows[0]?.full_name === "Alex Morgan", "profile auto-created from sign-up metadata");

const as = async (uid, sql, params = []) => {
  await db.exec(`set role authenticated; select set_config('request.jwt.sub', '${uid}', false);`);
  try { return await db.query(sql, params); } finally { await db.exec(`reset role;`); }
};

const pos = await as(A, `insert into public.positions (user_id, company, title, start_date) values ($1, 'Acme', 'Senior AE', '2022-01-01') returning id`, [A]);
const posId = pos.rows[0].id;
await as(A, `insert into public.performance_records (user_id, position_id, period_type, year, quota, closed_revenue, attainment_pct, deals_closed, avg_deal_size, ranking)
  values ($1, $2, 'year', 2024, 1000000, 1270000, 127, 12, 105000, '#2 of 18')`, [A, posId]);
await as(A, `insert into public.achievements (user_id, position_id, kind, title, deal_value, is_public) values
  ($1, $2, 'award', 'President''s Club', null, true), ($1, $2, 'deal', 'Secret deal', 420000, false)`, [A, posId]);

const bSees = await as(B, `select count(*)::int n from public.positions`);
ok(bSees.rows[0].n === 0, "RLS: user B cannot see user A's positions");

let blocked = false;
try { await as(B, `insert into public.performance_records (user_id, position_id, period_type, year, attainment_pct) values ($1, $2, 'year', 2024, 100)`, [B, posId]); }
catch { blocked = true; }
ok(blocked, "trigger: user B cannot attach records to user A's position");

let dupBlocked = false;
try { await as(A, `insert into public.performance_records (user_id, position_id, period_type, year, attainment_pct) values ($1, $2, 'year', 2024, 90)`, [A, posId]); }
catch { dupBlocked = true; }
ok(dupBlocked, "unique: one record per period per position");

let qBlocked = false;
try { await as(A, `insert into public.performance_records (user_id, position_id, period_type, year, attainment_pct) values ($1, $2, 'quarter', 2025, 90)`, [A, posId]); }
catch { qBlocked = true; }
ok(qBlocked, "check: quarter records require a quarter");

await as(A, `update public.profiles set slug = 'alex-morgan' where id = $1`, [A]);

const rpc = async () => {
  await db.exec(`set role anon; select set_config('request.jwt.sub', '', false);`);
  try { return (await db.query(`select public.get_public_portfolio('alex-morgan') as p`)).rows[0].p; }
  finally { await db.exec(`reset role;`); }
};

ok((await rpc()) === null, "portfolio hidden until published");

let anonBlocked = false;
try { await db.exec(`set role anon;`); await db.query(`select * from public.profiles`); } catch { anonBlocked = true; } finally { await db.exec(`reset role;`); }
ok(anonBlocked, "anon cannot read tables directly");

await as(A, `update public.profiles set portfolio_published = true where id = $1`, [A]);
let p = await rpc();
ok(p && p.full_name === "Alex Morgan", "published portfolio is readable by anon");
ok(Number(p.performance[0].attainment_pct) === 127, "attainment shown by default");
ok(p.performance[0].closed_revenue === null && p.performance[0].quota === null, "revenue/quota hidden by default");
ok(p.performance[0].avg_deal_size === null, "deal size € hidden without revenue figures");
ok(p.performance[0].deals_closed === 12, "deal count shown (anonymised metric)");
ok(p.achievements.length === 1 && p.achievements[0].title === "President's Club", "only public achievements exposed");

await as(A, `update public.profiles set show_revenue_figures = true, show_attainment = false where id = $1`, [A]);
p = await rpc();
ok(Number(p.performance[0].closed_revenue) === 1270000, "revenue shown when enabled");
ok(p.performance[0].attainment_pct === null && p.performance[0].ranking === null, "attainment hidden when disabled");

await as(A, `update public.profiles set show_attainment = false, show_deal_metrics = false, show_experience = false, show_achievements = false where id = $1`, [A]);
p = await rpc();
ok(!("performance" in p) && !("positions" in p) && !("achievements" in p), "all sections can be hidden");

let badSlug = false;
try { await as(A, `update public.profiles set slug = 'Bad Slug!' where id = $1`, [A]); } catch { badSlug = true; }
ok(badSlug, "slug format enforced");
