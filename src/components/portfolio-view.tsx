import type { PublicPortfolio } from "@/lib/types";
import { ACHIEVEMENT_KINDS, SEGMENTS } from "@/lib/config";
import { attainmentOf, dateRange, formatMoney, formatPct, periodLabel, yearsBetween } from "@/lib/format";
import { AttainmentChart, StatCard } from "./stats";

export function PortfolioView({ data }: { data: PublicPortfolio }) {
  const years = (data.performance ?? []).filter((r) => r.period_type === "year");
  const source = years.length ? years : (data.performance ?? []);
  const attainment = source
    .map((r) => ({ label: periodLabel(r), value: attainmentOf(r) }))
    .filter((d): d is { label: string; value: number } => d.value != null);
  const avg = attainment.length ? attainment.reduce((s, d) => s + d.value, 0) / attainment.length : null;
  const totalYears = (data.positions ?? []).reduce((s, p) => s + yearsBetween(p.start_date, p.end_date), 0);
  const cycle = source.map((r) => r.avg_sales_cycle_days).filter((v): v is number => v != null);
  const dealSize = source.map((r) => r.avg_deal_size).filter((v): v is number => v != null);
  const segment = SEGMENTS.find((s) => s.value === data.segment)?.label;

  const stats = [
    avg != null && { label: "Avg. quota attainment", value: formatPct(avg), sub: `Across ${attainment.length} ${years.length ? "years" : "quarters"} · self-reported` },
    totalYears > 0 && { label: "SaaS sales experience", value: `${Math.floor(totalYears)}+ yrs`, sub: segment ? `${segment} focus` : undefined },
    dealSize.length > 0 && { label: "Avg. deal size", value: formatMoney(dealSize.at(-1)!), sub: "Most recent period" },
    cycle.length > 0 && { label: "Avg. sales cycle", value: `${cycle.at(-1)} days`, sub: "Most recent period" },
  ].filter(Boolean) as { label: string; value: string; sub?: string }[];

  return (
    <div className="space-y-6">
      <header className="card overflow-hidden">
        <div className="h-2 bg-accent" />
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight">{data.full_name}</h1>
          <p className="mt-1 text-muted">{[data.headline, data.location].filter(Boolean).join(" · ")}</p>
          {data.summary && <p className="mt-4 max-w-2xl leading-relaxed">{data.summary}</p>}
        </div>
      </header>

      {stats.length > 0 && (
        <div className={`grid gap-4 sm:grid-cols-2 ${stats.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      {attainment.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Quota attainment history</h2>
          <AttainmentChart data={attainment.slice(-8)} />
          {data.show_revenue_figures && source.some((r) => r.closed_revenue != null) && (
            <div className="num mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
              {source
                .filter((r) => r.closed_revenue != null)
                .map((r) => (
                  <span key={periodLabel(r) + r.company}>
                    {periodLabel(r)}: {formatMoney(r.closed_revenue)} closed{r.quota ? ` of ${formatMoney(r.quota)}` : ""}
                  </span>
                ))}
            </div>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {data.achievements && data.achievements.length > 0 && (
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Selected achievements</h2>
            <ul className="space-y-3">
              {data.achievements.map((a, i) => (
                <li key={i}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent">
                      {ACHIEVEMENT_KINDS.find((k) => k.value === a.kind)?.label}
                    </span>
                    <span className="font-medium">{a.title}</span>
                  </div>
                  <div className="mt-0.5 text-sm text-muted">
                    {[
                      a.achieved_on?.slice(0, 4),
                      a.deal_value != null && formatMoney(a.deal_value),
                      a.sales_cycle_days != null && `${a.sales_cycle_days}-day cycle`,
                      a.description,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.positions && data.positions.length > 0 && (
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Experience</h2>
            <ol className="space-y-4 border-l border-line pl-4">
              {data.positions.map((p, i) => (
                <li key={i} className="relative">
                  <span className="absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent" />
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-muted">
                    {p.company} · {dateRange(p.start_date, p.end_date)}
                  </div>
                  {(data.performance ?? [])
                    .filter((r) => r.company === p.company && r.ranking)
                    .slice(-1)
                    .map((r) => (
                      <div key={r.year} className="mt-1 text-sm">
                        {r.ranking} · {periodLabel(r)}
                      </div>
                    ))}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      {(data.methodologies.length > 0 || data.tools.length > 0) && (
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">How I sell</h2>
          <div className="flex flex-wrap gap-2">
            {[...data.methodologies, ...data.tools].map((m) => (
              <span key={m} className="rounded-full border border-line px-3 py-1 text-sm">
                {m}
              </span>
            ))}
          </div>
        </section>
      )}

      <p className="text-center text-xs text-muted">Performance figures are self-reported.</p>
    </div>
  );
}
