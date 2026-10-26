import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { AttainmentChart } from "@/components/stats";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4">
        <span className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-5 w-5 rounded-md bg-accent" aria-hidden />
          {APP_NAME}
        </span>
        <Link href={user ? "/dashboard" : "/login"} className="btn-ghost ml-auto">
          {user ? "Open tracker" : "Sign in"}
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-12 lg:grid-cols-2">
        <section>
          <div className="eyebrow">For SaaS Account Executives</div>
          <h1 className="mt-3 text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl">
            Your sales record,
            <br />
            kept and ready to prove.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted">
            Log your number when each quarter closes. Keep your wins in one place. Turn it into a sales CV and a shareable
            portfolio in minutes — showing only what you choose.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={user ? "/dashboard" : "/login"} className="btn-primary px-5 py-2.5">
              Start your tracker — free
            </Link>
          </div>
          <ul className="mt-10 grid gap-4 text-sm sm:grid-cols-3">
            {[
              ["Track", "Quota, attainment, deal size and cycle — two minutes a quarter."],
              ["Generate", "A role-specific SaaS sales CV, built only from your confirmed records."],
              ["Share", "A private-by-default portfolio link. Show %, hide € if you like."],
            ].map(([t, d]) => (
              <li key={t}>
                <div className="font-semibold">{t}</div>
                <div className="mt-1 text-muted">{d}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6" aria-label="Example portfolio">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Alex Morgan</div>
              <div className="text-sm text-muted">Enterprise Account Executive · B2B SaaS</div>
            </div>
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">Example</span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ["127%", "Avg. attainment"],
              ["6 yrs", "SaaS sales"],
              ["94 days", "Avg. cycle"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg bg-bg p-3">
                <div className="num text-xl font-semibold">{v}</div>
                <div className="text-xs text-muted">{l}</div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <AttainmentChart
              data={[
                { label: "2022", value: 112 },
                { label: "2023", value: 134 },
                { label: "2024", value: 98 },
                { label: "2025", value: 151 },
              ]}
            />
          </div>
          <p className="mt-2 text-xs text-muted">Illustrative data.</p>
        </section>
      </main>
    </div>
  );
}
