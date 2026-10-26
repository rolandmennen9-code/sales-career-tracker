import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { loadCareer } from "@/lib/data";
import { averageAttainment, totalSalesYears } from "@/lib/cv";
import { attainmentOf, formatMoney, formatPct, periodLabel } from "@/lib/format";
import { AttainmentChart, StatCard } from "@/components/stats";
import { ACHIEVEMENT_KINDS } from "@/lib/config";

export const metadata = { title: "Tracker" };

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const { profile, positions, performance, achievements } = await loadCareer(supabase, user.id);

  const avg = averageAttainment(performance);
  const years = totalSalesYears(positions);
  const currency = positions[0]?.currency ?? "EUR";
  const yearRecords = performance.filter((r) => r.period_type === "year");
  const totalRevenue = yearRecords.reduce((s, r) => s + (r.closed_revenue ?? 0), 0);
  const chartSource = yearRecords.length >= 2 ? yearRecords : performance;
  const chart = chartSource
    .map((r) => ({ label: periodLabel(r), value: attainmentOf(r) }))
    .filter((d): d is { label: string; value: number } => d.value != null)
    .slice(-8);

  const latest = [...performance].sort((a, b) => b.year - a.year || (b.quarter ?? 5) - (a.quarter ?? 5))[0];
  const nudge = nextPeriodNudge(latest);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Your sales career</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{profile.full_name ?? "Performance overview"}</h1>
          {profile.headline && <p className="text-muted">{profile.headline}</p>}
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/performance" className="btn-ghost">
            Log performance
          </Link>
          <Link href="/cv" className="btn-primary">
            Generate CV
          </Link>
        </div>
      </div>

      {nudge && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft px-5 py-3 text-sm">
          <span>{nudge}</span>
          <Link href="/dashboard/performance" className="font-medium text-accent">
            Add it now →
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Avg. quota attainment"
          value={formatPct(avg?.value)}
          sub={avg ? `Across ${avg.periods} ${avg.unit}${avg.periods > 1 ? "s" : ""}` : "No records yet"}
        />
        <StatCard
          label="Closed revenue"
          value={totalRevenue ? formatMoney(totalRevenue, currency) : "—"}
          sub="Full-year records"
        />
        <StatCard label="SaaS sales experience" value={years ? `${years.toFixed(1)} yrs` : "—"} sub={`${positions.length} roles`} />
        <StatCard label="Achievements" value={String(achievements.length)} sub={`${achievements.filter((a) => a.is_public).length} public`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-semibold">Quota attainment history</h2>
            <span className="text-xs text-muted">Line = 100% of quota</span>
          </div>
          <AttainmentChart data={chart} />
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-semibold">Recent achievements</h2>
            <Link href="/dashboard/achievements" className="text-sm text-muted hover:text-ink">
              All →
            </Link>
          </div>
          {achievements.length ? (
            <ul className="space-y-3">
              {achievements.slice(0, 5).map((a) => (
                <li key={a.id} className="text-sm">
                  <span className="mr-2 rounded bg-bg px-1.5 py-0.5 text-xs text-muted">
                    {ACHIEVEMENT_KINDS.find((k) => k.value === a.kind)?.label}
                  </span>
                  {a.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              Record President&apos;s Club, big wins and promotions as they happen — they become your CV bullets.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

/** Suggest logging the most recently completed quarter if it's missing. */
function nextPeriodNudge(latest?: { year: number; quarter: number | null; period_type: string }) {
  const now = new Date();
  const q = Math.floor(now.getUTCMonth() / 3); // completed quarters this year (0–3)
  const lastYear = q === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  const lastQ = q === 0 ? 4 : q;
  if (!latest) return null;
  const latestKey = latest.year * 10 + (latest.quarter ?? 4);
  if (latestKey >= lastYear * 10 + lastQ) return null;
  return `Q${lastQ} ${lastYear} is closed — log your number while it's fresh.`;
}
