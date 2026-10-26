"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";

const optText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const BasicsSchema = z.object({
  full_name: z.string().trim().min(1, "Your name is required"),
  headline: optText,
  location: optText,
  segment: z.enum(["smb", "mid_market", "enterprise"]).nullable().catch(null),
});

export async function saveBasics(_: unknown, fd: FormData) {
  const parsed = BasicsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, specialization: "ae", updated_at: new Date().toISOString() })
    .eq("id", user.id);
  return error ? { error: error.message } : { error: null, ok: true };
}

// The review screen sends back only the items the user ticked, possibly edited.
const ImportSchema = z.object({
  summary: z.string().nullable(),
  methodologies: z.array(z.string()),
  tools: z.array(z.string()),
  positions: z.array(
    z.object({
      key: z.string(),
      company: z.string().min(1),
      title: z.string().min(1),
      start_date: z.iso.date(),
      end_date: z.iso.date().nullable(),
      segment: z.enum(["smb", "mid_market", "enterprise"]).nullable(),
      description: z.string().nullable(),
      metrics: z.array(
        z.object({
          year: z.number().int(),
          attainment_pct: z.number().nullable(),
          closed_revenue: z.number().nullable(),
          quota: z.number().nullable(),
          ranking: z.string().nullable(),
        }),
      ),
    }),
  ),
  achievements: z.array(
    z.object({
      position_key: z.string().nullable(),
      kind: z.enum(["award", "deal", "promotion", "milestone"]),
      title: z.string().min(1),
      year: z.number().int().nullable(),
      deal_value: z.number().nullable(),
    }),
  ),
});

export type ImportPayload = z.infer<typeof ImportSchema>;

export async function saveImported(payload: ImportPayload) {
  const parsed = ImportSchema.safeParse(payload);
  if (!parsed.success) return { error: "Some imported items are incomplete. Check dates, companies and titles." };
  const { supabase, user } = await requireUser();
  const data = parsed.data;

  await supabase
    .from("profiles")
    .update({
      ...(data.summary ? { summary: data.summary } : {}),
      methodologies: data.methodologies,
      tools: data.tools,
    })
    .eq("id", user.id);

  const keyToId = new Map<string, string>();
  for (const p of data.positions) {
    const { data: row, error } = await supabase
      .from("positions")
      .insert({
        user_id: user.id,
        company: p.company,
        title: p.title,
        start_date: p.start_date,
        end_date: p.end_date,
        segment: p.segment,
        description: p.description,
      })
      .select("id")
      .single();
    if (error || !row) return { error: error?.message ?? "Could not save a position." };
    keyToId.set(p.key, row.id);

    const metrics = p.metrics.filter((m) => m.attainment_pct != null || m.closed_revenue != null);
    if (metrics.length) {
      await supabase.from("performance_records").insert(
        metrics.map((m) => ({
          user_id: user.id,
          position_id: row.id,
          period_type: "year",
          year: m.year,
          attainment_pct:
            m.attainment_pct ?? (m.closed_revenue != null && m.quota ? Math.round((m.closed_revenue / m.quota) * 1000) / 10 : null),
          closed_revenue: m.closed_revenue,
          quota: m.quota,
          ranking: m.ranking,
        })),
      );
    }
  }

  if (data.achievements.length) {
    await supabase.from("achievements").insert(
      data.achievements.map((a) => ({
        user_id: user.id,
        position_id: a.position_key ? (keyToId.get(a.position_key) ?? null) : null,
        kind: a.kind,
        title: a.title,
        achieved_on: a.year ? `${a.year}-01-01` : null,
        deal_value: a.deal_value,
      })),
    );
  }

  revalidatePath("/onboarding");
  return { error: null, ok: true };
}

export async function completeOnboarding() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("full_name, slug").eq("id", user.id).single();

  // RLS hides other users' rows, so rely on the unique constraint and fall back to a suffixed slug.
  const slug =
    profile?.slug ?? (slugify(profile?.full_name || user.email?.split("@")[0] || "sales-pro") || "sales-pro");

  const { error } = await supabase.from("profiles").update({ onboarding_completed: true, slug }).eq("id", user.id);
  if (error?.code === "23505") {
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true, slug: `${slug}-${user.id.slice(0, 6)}` })
      .eq("id", user.id);
  }
  redirect("/dashboard");
}
