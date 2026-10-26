"use client";

import { useState } from "react";
import type { PerformanceRecord, Position } from "@/lib/types";
import { attainmentOf, formatMoney, formatPct, periodLabel } from "@/lib/format";
import { deletePerformance } from "../actions";
import { PerformanceForm } from "./performance-form";

export function PerformanceTable({
  rows,
  positions,
}: {
  rows: { record: PerformanceRecord; position: Position }[];
  positions: Position[];
}) {
  const [editing, setEditing] = useState<string | null>(null);
  if (!rows.length) return <p className="text-sm text-muted">No records yet.</p>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-line text-left text-xs tracking-wide text-muted uppercase">
          <tr>
            {["Period", "Role", "Attainment", "Closed", "Quota", "Deals", "Avg deal", "Cycle", ""].map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ record: r, position: p }) => {
            const att = attainmentOf(r);
            return editing === r.id ? (
              <tr key={r.id} className="border-b border-line bg-bg/50">
                <td colSpan={9} className="p-4">
                  <PerformanceForm positions={positions} record={r} onDone={() => setEditing(null)} />
                  <button onClick={() => setEditing(null)} className="mt-2 text-sm text-muted">
                    Cancel
                  </button>
                </td>
              </tr>
            ) : (
              <tr key={r.id} className="num border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium">{periodLabel(r)}</td>
                <td className="px-4 py-3 text-muted">{p.company}</td>
                <td className={`px-4 py-3 font-semibold ${att != null && att >= 100 ? "text-accent" : ""}`}>{formatPct(att)}</td>
                <td className="px-4 py-3">{formatMoney(r.closed_revenue, p.currency)}</td>
                <td className="px-4 py-3 text-muted">{formatMoney(r.quota, p.currency)}</td>
                <td className="px-4 py-3">{r.deals_closed ?? "—"}</td>
                <td className="px-4 py-3">{formatMoney(r.avg_deal_size, p.currency)}</td>
                <td className="px-4 py-3">{r.avg_sales_cycle_days ? `${r.avg_sales_cycle_days}d` : "—"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditing(r.id)} className="mr-3 text-muted hover:text-ink">
                    Edit
                  </button>
                  <form action={deletePerformance} className="inline" onSubmit={(e) => !confirm("Delete this record?") && e.preventDefault()}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-muted hover:text-danger">Delete</button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
