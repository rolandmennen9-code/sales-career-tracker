import { requireUser } from "@/lib/supabase/server";
import { loadCareer } from "@/lib/data";
import { dateRange } from "@/lib/format";
import { SEGMENTS } from "@/lib/config";
import { deletePosition } from "../actions";
import { PositionsList } from "./positions-list";
import { PositionForm } from "./position-form";

export const metadata = { title: "Career history" };

export default async function PositionsPage() {
  const { supabase, user } = await requireUser();
  const { positions, performance } = await loadCareer(supabase, user.id);

  return (
    <div className="space-y-8">
      <header>
        <div className="eyebrow">Career history</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your sales roles</h1>
        <p className="text-muted">Each role holds its own performance records and achievements.</p>
      </header>

      <PositionsList
        items={positions.map((p) => ({
          position: p,
          dates: dateRange(p.start_date, p.end_date),
          segment: SEGMENTS.find((s) => s.value === p.segment)?.label ?? null,
          records: performance.filter((r) => r.position_id === p.id).length,
        }))}
        deleteAction={deletePosition}
      />

      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Add a position</h2>
        <PositionForm />
      </section>
    </div>
  );
}
