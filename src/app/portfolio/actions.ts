"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";

const RESERVED = new Set(["admin", "api", "login", "dashboard", "cv", "portfolio", "onboarding", "p", "auth", "settings"]);
const flag = z.preprocess((v) => v === "on" || v === "true", z.boolean());

const PortfolioSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens")
    .min(3, "At least 3 characters")
    .max(48)
    .refine((s) => !RESERVED.has(s), "That name is reserved"),
  summary: z
    .string()
    .trim()
    .max(1200)
    .transform((v) => v || null),
  show_experience: flag,
  show_attainment: flag,
  show_deal_metrics: flag,
  show_revenue_figures: flag,
  show_achievements: flag,
});

export async function savePortfolio(_: unknown, fd: FormData) {
  const raw = Object.fromEntries(fd);
  const parsed = PortfolioSchema.safeParse({
    show_experience: "false",
    show_attainment: "false",
    show_deal_metrics: "false",
    show_revenue_figures: "false",
    show_achievements: "false",
    ...raw,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error?.code === "23505") return { error: "That link is taken — try another." };
  if (error) return { error: error.message };
  revalidatePath("/portfolio");
  revalidatePath(`/p/${parsed.data.slug}`);
  return { error: null, ok: true };
}

export async function setPublished(fd: FormData) {
  const { supabase, user } = await requireUser();
  const published = fd.get("published") === "true";
  const { data } = await supabase
    .from("profiles")
    .update({ portfolio_published: published })
    .eq("id", user.id)
    .select("slug")
    .single();
  revalidatePath("/portfolio");
  if (data?.slug) revalidatePath(`/p/${data.slug}`);
}
