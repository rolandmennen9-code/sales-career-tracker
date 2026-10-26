import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Achievement, PerformanceRecord, Position, Profile } from "./types";

const num = (v: unknown) => (v == null ? null : Number(v));

export async function loadCareer(supabase: SupabaseClient, userId: string) {
  const [profile, positions, performance, achievements] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("positions").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
    supabase.from("performance_records").select("*").eq("user_id", userId).order("year").order("quarter", { nullsFirst: true }),
    supabase.from("achievements").select("*").eq("user_id", userId).order("achieved_on", { ascending: false, nullsFirst: false }),
  ]);

  return {
    profile: profile.data as Profile,
    positions: (positions.data ?? []) as Position[],
    // Postgres numeric comes back as string — normalise to numbers.
    performance: (performance.data ?? []).map((r) => ({
      ...r,
      quota: num(r.quota),
      closed_revenue: num(r.closed_revenue),
      attainment_pct: num(r.attainment_pct),
      avg_deal_size: num(r.avg_deal_size),
    })) as PerformanceRecord[],
    achievements: (achievements.data ?? []).map((a) => ({ ...a, deal_value: num(a.deal_value) })) as Achievement[],
  };
}
