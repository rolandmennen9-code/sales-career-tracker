import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { loadCareer } from "@/lib/data";
import { PerformanceForm } from "./performance-form";
import { PerformanceTable } from "./performance-table";

export const metadata = { title: "Performance" };

export default async function PerformancePage() {
  const { supabase, user } = await requireUser();
  const { positions, performance } = await loadCareer(supabase, user.id);

  if (!positions.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-muted">Add a position first — performance records belong to a role.</p>
        <Link href="/dashboard/positions" className="btn-primary mt-4">
          Add position
        </Link>
      </div>
    );
  }

  const rows = [...performance]
    .sort((a, b) => b.year - a.year || (b.quarter ?? 5) - (a.quarter ?? 5))
    .map((r) => ({ record: r, position: positions.find((p) => p.id === r.position_id)! }));

  return (
    <div className="space-y-8">
      <header>
        <div className="eyebrow">Performance</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Quota & deal metrics</h1>
        <p className="text-muted">One record per year or quarter. Two minutes when a period closes.</p>
      </header>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Log a period</h2>
        <PerformanceForm positions={positions} />
      </section>

      <PerformanceTable rows={rows} positions={positions} />
    </div>
  );
}
