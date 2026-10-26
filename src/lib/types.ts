export type Segment = "smb" | "mid_market" | "enterprise";
export type PeriodType = "year" | "quarter";
export type AchievementKind = "award" | "deal" | "promotion" | "milestone";

export interface Profile {
  id: string;
  full_name: string | null;
  headline: string | null;
  location: string | null;
  specialization: "ae";
  segment: Segment | null;
  summary: string | null;
  methodologies: string[];
  tools: string[];
  onboarding_completed: boolean;
  slug: string | null;
  portfolio_published: boolean;
  show_attainment: boolean;
  show_revenue_figures: boolean;
  show_deal_metrics: boolean;
  show_achievements: boolean;
  show_experience: boolean;
}

export interface Position {
  id: string;
  user_id: string;
  company: string;
  title: string;
  segment: Segment | null;
  start_date: string;
  end_date: string | null;
  description: string | null;
  currency: string;
}

export interface PerformanceRecord {
  id: string;
  user_id: string;
  position_id: string;
  period_type: PeriodType;
  year: number;
  quarter: number | null;
  quota: number | null;
  closed_revenue: number | null;
  attainment_pct: number | null;
  deals_closed: number | null;
  avg_deal_size: number | null;
  avg_sales_cycle_days: number | null;
  ranking: string | null;
  notes: string | null;
}

export interface Achievement {
  id: string;
  user_id: string;
  position_id: string | null;
  kind: AchievementKind;
  title: string;
  description: string | null;
  achieved_on: string | null;
  deal_value: number | null;
  sales_cycle_days: number | null;
  is_public: boolean;
}

export interface CvOptions {
  includeAttainment: boolean;
  includeDealMetrics: boolean;
  includeMethodologies: boolean;
}

export interface CvContent {
  name: string;
  headline: string;
  location: string;
  summary: string;
  experience: {
    title: string;
    company: string;
    dates: string;
    bullets: string[];
  }[];
  highlights: string[];
  skills: string[];
}

export interface PublicPortfolio {
  full_name: string | null;
  headline: string | null;
  location: string | null;
  segment: Segment | null;
  summary: string | null;
  methodologies: string[];
  tools: string[];
  show_revenue_figures: boolean;
  positions?: {
    company: string;
    title: string;
    segment: Segment | null;
    start_date: string;
    end_date: string | null;
  }[];
  performance?: {
    period_type: PeriodType;
    year: number;
    quarter: number | null;
    company: string;
    attainment_pct: number | null;
    ranking: string | null;
    closed_revenue: number | null;
    quota: number | null;
    deals_closed: number | null;
    avg_deal_size: number | null;
    avg_sales_cycle_days: number | null;
  }[];
  achievements?: {
    kind: AchievementKind;
    title: string;
    description: string | null;
    achieved_on: string | null;
    deal_value: number | null;
    sales_cycle_days: number | null;
  }[];
}
