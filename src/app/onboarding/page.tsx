import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { loadCareer } from "@/lib/data";
import { aiEnabled } from "@/lib/ai";
import { APP_NAME } from "@/lib/config";
import { Wizard } from "./wizard";

export const metadata = { title: "Get started" };

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  const { profile, positions, performance } = await loadCareer(supabase, user.id);
  if (profile.onboarding_completed) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center gap-2 font-semibold">
        <span className="inline-block h-5 w-5 rounded-md bg-accent" aria-hidden />
        {APP_NAME}
      </div>
      <Wizard
        profile={{
          full_name: profile.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "",
          headline: profile.headline ?? "",
          location: profile.location ?? "",
          segment: profile.segment,
        }}
        positions={positions}
        hasPerformance={performance.length > 0}
        aiEnabled={aiEnabled()}
      />
    </div>
  );
}
