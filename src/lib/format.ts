export function formatMoney(value: number | null | undefined, currency = "EUR") {
  if (value == null) return "—";
  const abs = Math.abs(value);
  const fmt = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    notation: abs >= 100_000 ? "compact" : "standard",
    minimumFractionDigits: 0,
    maximumFractionDigits: abs >= 100_000 ? 1 : 0,
  });
  return fmt.format(value);
}

export function formatPct(value: number | null | undefined) {
  if (value == null) return "—";
  return `${Math.round(Number(value))}%`;
}

export function periodLabel(r: { period_type: string; year: number; quarter: number | null }) {
  return r.period_type === "quarter" ? `Q${r.quarter} ${r.year}` : String(r.year);
}

export function formatMonthYear(date: string | null | undefined) {
  if (!date) return "Present";
  const d = new Date(date + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function dateRange(start: string, end: string | null) {
  return `${formatMonthYear(start)} – ${formatMonthYear(end)}`;
}

/** Attainment as entered, or derived from revenue / quota. */
export function attainmentOf(r: {
  attainment_pct: number | null;
  closed_revenue: number | null;
  quota: number | null;
}): number | null {
  if (r.attainment_pct != null) return Number(r.attainment_pct);
  if (r.closed_revenue != null && r.quota) return (Number(r.closed_revenue) / Number(r.quota)) * 100;
  return null;
}

export function yearsBetween(start: string, end: string | null) {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  return Math.max(0, (e - s) / (365.25 * 24 * 3600 * 1000));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
