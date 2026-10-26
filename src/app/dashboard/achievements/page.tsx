import { requireUser } from "@/lib/supabase/server";
import { loadCareer } from "@/lib/data";
import { AchievementForm } from "./achievement-form";
import { AchievementsList } from "./achievements-list";

export const metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const { supabase, user } = await requireUser();
  const { positions, achievements } = await loadCareer(supabase, user.id);

  return (
    <div className="space-y-8">
      <header>
        <div className="eyebrow">Achievement library</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Wins, awards and milestones</h1>
        <p className="text-muted">Everything here is private unless you mark it public.</p>
      </header>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Add an achievement</h2>
        <AchievementForm positions={positions} />
      </section>

      <AchievementsList achievements={achievements} positions={positions} />
    </div>
  );
}
