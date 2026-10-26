import { requireUser } from "@/lib/supabase/server";
import { loadCareer } from "@/lib/data";
import { DEFAULT_CV_OPTIONS, generateCv, type Emphasis, type TargetRole } from "@/lib/cv";
import { aiEnabled } from "@/lib/ai";
import type { CvContent, CvOptions } from "@/lib/types";
import { CvBuilder } from "./cv-builder";

export const metadata = { title: "CV builder" };

const roleForSegment = (s: string | null): TargetRole =>
  s === "enterprise" ? "enterprise_ae" : s === "smb" ? "smb_ae" : "mid_market_ae";

export default async function CvPage() {
  const { supabase, user } = await requireUser();
  const [career, saved] = await Promise.all([
    loadCareer(supabase, user.id),
    supabase.from("cvs").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const settings = saved.data
    ? {
        targetRole: saved.data.target_role as TargetRole,
        emphasis: saved.data.emphasis as Emphasis,
        options: { ...DEFAULT_CV_OPTIONS, ...(saved.data.options as Partial<CvOptions>) },
      }
    : { targetRole: roleForSegment(career.profile.segment), emphasis: "new_business" as Emphasis, options: DEFAULT_CV_OPTIONS };

  const content: CvContent = (saved.data?.content as CvContent) ?? generateCv({ ...career, ...settings });

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">CV builder</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your SaaS sales CV</h1>
        <p className="text-muted">Built from your tracker. Every number comes from a record you entered.</p>
      </header>
      <CvBuilder initialContent={content} initialSettings={settings} saved={Boolean(saved.data)} aiEnabled={aiEnabled()} />
    </div>
  );
}
