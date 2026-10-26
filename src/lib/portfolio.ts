import type { Achievement, PerformanceRecord, Position, Profile, PublicPortfolio } from "./types";

/**
 * Mirror of get_public_portfolio() in SQL, used for the owner's preview.
 * The SQL function is what actually enforces visibility for public visitors.
 */
export function toPublicPortfolio(c: {
  profile: Profile;
  positions: Position[];
  performance: PerformanceRecord[];
  achievements: Achievement[];
}): PublicPortfolio {
  const p = c.profile;
  const out: PublicPortfolio = {
    full_name: p.full_name,
    headline: p.headline,
    location: p.location,
    segment: p.segment,
    summary: p.summary,
    methodologies: p.methodologies,
    tools: p.tools,
    show_revenue_figures: p.show_revenue_figures,
  };
  if (p.show_experience) {
    out.positions = c.positions.map(({ company, title, segment, start_date, end_date }) => ({
      company,
      title,
      segment,
      start_date,
      end_date,
    }));
  }
  if (p.show_attainment || p.show_deal_metrics) {
    out.performance = c.performance.map((r) => ({
      period_type: r.period_type,
      year: r.year,
      quarter: r.quarter,
      company: c.positions.find((x) => x.id === r.position_id)?.company ?? "",
      attainment_pct: p.show_attainment ? r.attainment_pct : null,
      ranking: p.show_attainment ? r.ranking : null,
      closed_revenue: p.show_revenue_figures ? r.closed_revenue : null,
      quota: p.show_revenue_figures ? r.quota : null,
      deals_closed: p.show_deal_metrics ? r.deals_closed : null,
      avg_deal_size: p.show_deal_metrics && p.show_revenue_figures ? r.avg_deal_size : null,
      avg_sales_cycle_days: p.show_deal_metrics ? r.avg_sales_cycle_days : null,
    }));
  }
  if (p.show_achievements) {
    out.achievements = c.achievements
      .filter((a) => a.is_public)
      .map(({ kind, title, description, achieved_on, deal_value, sales_cycle_days }) => ({
        kind,
        title,
        description,
        achieved_on,
        deal_value: p.show_revenue_figures ? deal_value : null,
        sales_cycle_days: p.show_deal_metrics ? sales_cycle_days : null,
      }));
  }
  return out;
}
