import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { loadCareer } from "@/lib/data";
import { toPublicPortfolio } from "@/lib/portfolio";
import { PortfolioView } from "@/components/portfolio-view";
import { PortfolioSettings } from "./portfolio-settings";
import { setPublished } from "./actions";

export const metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const { supabase, user } = await requireUser();
  const career = await loadCareer(supabase, user.id);
  const { profile, achievements } = career;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const publicUrl = `${site}/p/${profile.slug}`;
  const publicAchievements = achievements.filter((a) => a.is_public).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Shareable portfolio</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your public sales profile</h1>
          <p className="text-muted">Private by default. Choose exactly what recruiters and hiring managers see.</p>
        </div>
        <form action={setPublished}>
          <input type="hidden" name="published" value={String(!profile.portfolio_published)} />
          <button className={profile.portfolio_published ? "btn-ghost" : "btn-accent"}>
            {profile.portfolio_published ? "Unpublish" : "Publish portfolio"}
          </button>
        </form>
      </header>

      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-3 text-sm ${
          profile.portfolio_published ? "border-accent/30 bg-accent-soft" : "border-line bg-surface"
        }`}
      >
        <span>
          {profile.portfolio_published ? (
            <>
              <strong className="text-accent">Live</strong> at{" "}
              <Link href={`/p/${profile.slug}`} className="num underline" target="_blank">
                {publicUrl.replace(/^https?:\/\//, "")}
              </Link>
            </>
          ) : (
            <>
              <strong>Not published.</strong> Nobody can see your portfolio yet.
            </>
          )}
        </span>
        <span className="text-muted">
          {publicAchievements} of {achievements.length} achievements marked public ·{" "}
          <Link href="/dashboard/achievements" className="underline">
            manage
          </Link>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <PortfolioSettings profile={profile} site={site} />
        </aside>
        <div>
          <div className="eyebrow mb-3">Preview</div>
          <PortfolioView data={toPublicPortfolio(career)} />
        </div>
      </div>
    </div>
  );
}
