"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { loadCareer } from "@/lib/data";
import { generateCv, type Emphasis, type TargetRole } from "@/lib/cv";
import { aiEnabled, polishCv } from "@/lib/ai";
import { EMPHASES, TARGET_ROLES } from "@/lib/config";
import type { CvContent, CvOptions } from "@/lib/types";

const SettingsSchema = z.object({
  targetRole: z.enum(TARGET_ROLES.map((r) => r.value) as [TargetRole, ...TargetRole[]]),
  emphasis: z.enum(EMPHASES.map((e) => e.value) as [Emphasis, ...Emphasis[]]),
  options: z.object({
    includeAttainment: z.boolean(),
    includeDealMetrics: z.boolean(),
    includeMethodologies: z.boolean(),
  }),
});

const ContentSchema = z.object({
  name: z.string(),
  headline: z.string(),
  location: z.string(),
  summary: z.string(),
  experience: z.array(z.object({ title: z.string(), company: z.string(), dates: z.string(), bullets: z.array(z.string()) })),
  highlights: z.array(z.string()),
  skills: z.array(z.string()),
});

async function upsert(content: CvContent, s: z.infer<typeof SettingsSchema>) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("cvs").upsert(
    {
      user_id: user.id,
      target_role: s.targetRole,
      emphasis: s.emphasis,
      options: s.options,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  revalidatePath("/cv");
  return error?.message ?? null;
}

/** Rebuild the CV from tracker records. Discards manual edits. */
export async function regenerateCv(settings: { targetRole: string; emphasis: string; options: CvOptions }) {
  const s = SettingsSchema.parse(settings);
  const { supabase, user } = await requireUser();
  const career = await loadCareer(supabase, user.id);
  const content = generateCv({ ...career, ...s });
  const error = await upsert(content, s);
  return { content, error };
}

export async function saveCvContent(content: CvContent, settings: { targetRole: string; emphasis: string; options: CvOptions }) {
  const s = SettingsSchema.parse(settings);
  const error = await upsert(ContentSchema.parse(content), s);
  return { error };
}

export async function polishCvAction(content: CvContent, settings: { targetRole: string; emphasis: string; options: CvOptions }) {
  if (!aiEnabled()) return { content, error: "AI polish isn't configured on this server." };
  const s = SettingsSchema.parse(settings);
  try {
    const polished = await polishCv(
      ContentSchema.parse(content),
      TARGET_ROLES.find((r) => r.value === s.targetRole)!.label,
      EMPHASES.find((e) => e.value === s.emphasis)!.label,
    );
    const unchanged = polished === content || JSON.stringify(polished) === JSON.stringify(content);
    const error = await upsert(polished, s);
    return {
      content: polished,
      error: error ?? (unchanged ? "The rewrite tried to change your numbers, so we kept your original wording." : null),
    };
  } catch (e) {
    console.error("polish failed", e);
    return { content, error: "AI polish failed. Your CV is unchanged." };
  }
}
