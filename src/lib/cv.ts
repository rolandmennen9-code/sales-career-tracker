import type { Achievement, CvContent, CvOptions, PerformanceRecord, Position, Profile } from "./types";
import { attainmentOf, dateRange, formatMoney, periodLabel, yearsBetween } from "./format";
import { EMPHASES, SEGMENTS, TARGET_ROLES } from "./config";

export type TargetRole = (typeof TARGET_ROLES)[number]["value"];
export type Emphasis = (typeof EMPHASES)[number]["value"];

export const DEFAULT_CV_OPTIONS: CvOptions = {
  includeAttainment: true,
  includeDealMetrics: true,
  includeMethodologies: true,
};

interface Input {
  profile: Profile;
  positions: Position[];
  performance: PerformanceRecord[];
  achievements: Achievement[];
  targetRole: TargetRole;
  emphasis: Emphasis;
  options: CvOptions;
}

const roleLabel = (v: string) => TARGET_ROLES.find((r) => r.value === v)?.label ?? "Account Executive";
const segmentLabel = (v: string | null) => SEGMENTS.find((s) => s.value === v)?.label;

/** Average attainment over full-year records (falls back to quarters). */
export function averageAttainment(records: PerformanceRecord[]) {
  const years = records.filter((r) => r.period_type === "year");
  const pool = years.length ? years : records;
  const vals = pool.map(attainmentOf).filter((v): v is number => v != null);
  if (!vals.length) return null;
  return { value: vals.reduce((a, b) => a + b, 0) / vals.length, periods: vals.length, unit: years.length ? "year" : "quarter" };
}

export function totalSalesYears(positions: Position[]) {
  return positions.reduce((sum, p) => sum + yearsBetween(p.start_date, p.end_date), 0);
}

function positionBullets(
  pos: Position,
  records: PerformanceRecord[],
  achievements: Achievement[],
  options: CvOptions,
  emphasis: Emphasis,
): string[] {
  const bullets: string[] = [];
  const recs = records.filter((r) => r.position_id === pos.id).sort((a, b) => b.year - a.year || (b.quarter ?? 0) - (a.quarter ?? 0));

  if (options.includeAttainment) {
    const yearRecs = recs.filter((r) => r.period_type === "year");
    const withAtt = (yearRecs.length ? yearRecs : recs)
      .map((r) => ({ r, att: attainmentOf(r) }))
      .filter((x) => x.att != null);
    if (withAtt.length === 1) {
      const { r, att } = withAtt[0];
      let line = `Achieved ${Math.round(att!)}% of quota in ${periodLabel(r)}`;
      if (r.closed_revenue != null) line += `, closing ${formatMoney(r.closed_revenue, pos.currency)}`;
      if (r.ranking) line += ` (${r.ranking})`;
      bullets.push(line + ".");
    } else if (withAtt.length > 1) {
      const avg = withAtt.reduce((s, x) => s + x.att!, 0) / withAtt.length;
      const best = withAtt.reduce((a, b) => (b.att! > a.att! ? b : a));
      bullets.push(
        `Averaged ${Math.round(avg)}% quota attainment across ${withAtt.length} ${yearRecs.length ? "years" : "quarters"}, peaking at ${Math.round(best.att!)}% in ${periodLabel(best.r)}.`,
      );
    }
    const ranked = recs.find((r) => r.ranking && withAtt.length !== 1);
    if (ranked) bullets.push(`Ranked ${ranked.ranking} in ${periodLabel(ranked)}.`);
  }

  if (options.includeDealMetrics) {
    const r = recs.find((x) => x.avg_deal_size != null || x.avg_sales_cycle_days != null || x.deals_closed != null);
    if (r) {
      const parts: string[] = [];
      if (r.deals_closed != null) parts.push(`closed ${r.deals_closed} deals`);
      if (r.avg_deal_size != null) parts.push(`${formatMoney(r.avg_deal_size, pos.currency)} average deal size`);
      if (r.avg_sales_cycle_days != null) parts.push(`${r.avg_sales_cycle_days}-day average sales cycle`);
      if (parts.length) {
        const text = parts.join(", ");
        bullets.push(`${text.charAt(0).toUpperCase()}${text.slice(1)} (${periodLabel(r)}).`);
      }
    }
  }

  // Awards live in the Recognition section, so bullets cover deals, milestones and promotions.
  const ach = achievements.filter((a) => a.position_id === pos.id && a.kind !== "award");
  const order: Record<Emphasis, string[]> = {
    new_business: ["deal", "promotion", "milestone"],
    complex_deals: ["deal", "milestone", "promotion"],
    expansion: ["milestone", "deal", "promotion"],
  };
  ach
    .sort((a, b) => order[emphasis].indexOf(a.kind) - order[emphasis].indexOf(b.kind))
    .slice(0, 4)
    .forEach((a) => bullets.push(achievementLine(a, pos.currency, options)));

  if (!bullets.length && pos.description) bullets.push(pos.description);
  return bullets;
}

function achievementLine(a: Achievement, currency: string, options: CvOptions) {
  let line = a.title.replace(/\.$/, "");
  const extras: string[] = [];
  if (options.includeDealMetrics && a.deal_value != null) extras.push(formatMoney(a.deal_value, currency));
  if (options.includeDealMetrics && a.sales_cycle_days != null) extras.push(`${a.sales_cycle_days}-day cycle`);
  if (extras.length && !line.includes(extras[0])) line += ` (${extras.join(", ")})`;
  if (a.description) {
    const d = a.description.replace(/\.$/, "");
    line += ` — ${d.charAt(0).toLowerCase()}${d.slice(1)}`;
  }
  return line + ".";
}

function buildSummary({ profile, positions, performance, targetRole, emphasis, options }: Input) {
  if (profile.summary?.trim()) return profile.summary.trim();
  const years = Math.round(totalSalesYears(positions));
  const seg = segmentLabel(profile.segment);
  const focus = EMPHASES.find((e) => e.value === emphasis)!.label.toLowerCase();
  let s = `${roleLabel(targetRole)} with ${years > 0 ? `${years}+ years` : "experience"} in B2B SaaS sales${seg ? `, focused on ${seg} customers` : ""}. Strengths in ${focus}.`;
  const avg = averageAttainment(performance);
  if (options.includeAttainment && avg) {
    s += ` Averaged ${Math.round(avg.value)}% quota attainment across ${avg.periods} ${avg.unit}${avg.periods > 1 ? "s" : ""}.`;
  }
  return s;
}

/** Deterministic CV from confirmed tracker records only. */
export function generateCv(input: Input): CvContent {
  const { profile, positions, performance, achievements, options, emphasis, targetRole } = input;
  const sorted = [...positions].sort((a, b) => b.start_date.localeCompare(a.start_date));

  const highlights = achievements
    .filter((a) => a.kind === "award")
    .slice(0, 6)
    .map((a) => (a.achieved_on ? `${a.title} (${a.achieved_on.slice(0, 4)})` : a.title));

  const skills = options.includeMethodologies ? [...profile.methodologies, ...profile.tools] : [...profile.tools];

  return {
    name: profile.full_name ?? "",
    headline: profile.headline ?? roleLabel(targetRole),
    location: profile.location ?? "",
    summary: buildSummary(input),
    experience: sorted.map((p) => ({
      title: p.title,
      company: p.company,
      dates: dateRange(p.start_date, p.end_date),
      bullets: positionBullets(p, performance, achievements, options, emphasis),
    })),
    highlights,
    skills,
  };
}
