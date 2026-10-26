"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";

const optText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();
const optNum = z.preprocess((v) => (v === "" || v == null ? null : Number(String(v).replace(/[,\s€$£]/g, ""))), z.number().nonnegative().nullable());
const optInt = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().nonnegative().nullable());
const optDate = z.preprocess((v) => (v === "" || v == null ? null : v), z.iso.date().nullable());
const monthToDate = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}$/.test(v) ? `${v}-01` : v);

type Result = { error: string | null; ok?: boolean };
const fail = (e: z.ZodError | { message: string }): Result => ({
  error: "issues" in e ? e.issues.map((i) => i.message).join(" · ") : e.message,
});

function done(): Result {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/cv");
  return { error: null, ok: true };
}

// ---------------------------------------------------------------- positions
const PositionSchema = z.object({
  company: z.string().trim().min(1, "Company is required"),
  title: z.string().trim().min(1, "Title is required"),
  segment: z.enum(["smb", "mid_market", "enterprise"]).nullable().catch(null),
  start_date: z.preprocess(monthToDate, z.iso.date({ message: "Start month is required" })),
  end_date: z.preprocess((v) => monthToDate(v === "" ? null : v), z.iso.date().nullable()),
  description: optText,
  currency: z.string().trim().length(3).default("EUR"),
});

export async function savePosition(_: unknown, fd: FormData): Promise<Result> {
  const parsed = PositionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error);
  const { supabase, user } = await requireUser();
  const id = fd.get("id")?.toString();
  const row = { ...parsed.data, user_id: user.id };
  const { error } = id
    ? await supabase.from("positions").update(row).eq("id", id)
    : await supabase.from("positions").insert(row);
  return error ? fail(error) : done();
}

export async function deletePosition(fd: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("positions").delete().eq("id", String(fd.get("id")));
  done();
}

// -------------------------------------------------------------- performance
const PerformanceSchema = z
  .object({
    position_id: z.uuid({ message: "Choose a position" }),
    period_type: z.enum(["year", "quarter"]),
    year: z.coerce.number().int().min(1990).max(2100),
    quarter: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(1).max(4).nullable()),
    quota: optNum,
    closed_revenue: optNum,
    attainment_pct: optNum,
    deals_closed: optInt,
    avg_deal_size: optNum,
    avg_sales_cycle_days: optInt,
    ranking: optText,
    notes: optText,
  })
  .transform((r) => ({
    ...r,
    quarter: r.period_type === "year" ? null : r.quarter,
    attainment_pct:
      r.attainment_pct ?? (r.closed_revenue != null && r.quota ? Math.round((r.closed_revenue / r.quota) * 1000) / 10 : null),
  }))
  .refine((r) => r.period_type === "year" || r.quarter != null, { message: "Choose a quarter" })
  .refine((r) => r.attainment_pct != null || r.closed_revenue != null, {
    message: "Enter attainment %, or closed revenue and quota",
  });

export async function savePerformance(_: unknown, fd: FormData): Promise<Result> {
  const parsed = PerformanceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error);
  const { supabase, user } = await requireUser();
  const id = fd.get("id")?.toString();
  const row = { ...parsed.data, user_id: user.id };
  const { error } = id
    ? await supabase.from("performance_records").update(row).eq("id", id)
    : await supabase.from("performance_records").insert(row);
  if (error?.code === "23505") return { error: "You already have a record for that period and position." };
  return error ? fail(error) : done();
}

export async function deletePerformance(fd: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("performance_records").delete().eq("id", String(fd.get("id")));
  done();
}

// ------------------------------------------------------------- achievements
const AchievementSchema = z.object({
  position_id: z.preprocess((v) => (v === "" ? null : v), z.uuid().nullable()),
  kind: z.enum(["award", "deal", "promotion", "milestone"]),
  title: z.string().trim().min(1, "Title is required"),
  description: optText,
  achieved_on: z.preprocess((v) => monthToDate(v === "" ? null : v), optDate),
  deal_value: optNum,
  sales_cycle_days: optInt,
  is_public: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

export async function saveAchievement(_: unknown, fd: FormData): Promise<Result> {
  const parsed = AchievementSchema.safeParse({ ...Object.fromEntries(fd), is_public: fd.get("is_public") ?? "false" });
  if (!parsed.success) return fail(parsed.error);
  const { supabase, user } = await requireUser();
  const id = fd.get("id")?.toString();
  const row = { ...parsed.data, user_id: user.id };
  const { error } = id
    ? await supabase.from("achievements").update(row).eq("id", id)
    : await supabase.from("achievements").insert(row);
  return error ? fail(error) : done();
}

export async function deleteAchievement(fd: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("achievements").delete().eq("id", String(fd.get("id")));
  done();
}

export async function toggleAchievementPublic(fd: FormData) {
  const { supabase } = await requireUser();
  await supabase
    .from("achievements")
    .update({ is_public: fd.get("is_public") === "true" })
    .eq("id", String(fd.get("id")));
  done();
  revalidatePath("/portfolio");
}
