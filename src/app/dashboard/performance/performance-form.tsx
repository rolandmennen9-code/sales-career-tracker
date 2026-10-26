"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { Field, SubmitButton } from "@/components/ui";
import type { PerformanceRecord, Position } from "@/lib/types";
import { savePerformance } from "../actions";

export function PerformanceForm({
  positions,
  record,
  onDone,
  compact,
}: {
  positions: Pick<Position, "id" | "title" | "company" | "currency">[];
  record?: PerformanceRecord;
  onDone?: () => void;
  compact?: boolean;
}) {
  const [periodType, setPeriodType] = useState<"year" | "quarter">(record?.period_type ?? "year");
  const thisYear = new Date().getFullYear();
  const defaultYear = record?.year ?? (new Date().getMonth() < 3 ? thisYear - 1 : thisYear);

  return (
    <ActionForm action={savePerformance} onDone={onDone} resetOnSuccess={!record} className="space-y-4">
      {record && <input type="hidden" name="id" value={record.id} />}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Field label="Position">
            <select name="position_id" required defaultValue={record?.position_id ?? positions[0]?.id} className="input">
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} · {p.company}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Period">
          <select
            name="period_type"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as "year" | "quarter")}
            className="input"
          >
            <option value="year">Full year</option>
            <option value="quarter">Quarter</option>
          </select>
        </Field>
        <div className="flex gap-2">
          <Field label="Year">
            <input name="year" type="number" required min={1990} max={2100} defaultValue={defaultYear} className="input" />
          </Field>
          {periodType === "quarter" && (
            <Field label="Q">
              <select name="quarter" defaultValue={record?.quarter ?? 1} className="input">
                {[1, 2, 3, 4].map((q) => (
                  <option key={q} value={q}>
                    Q{q}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Quota">
          <input name="quota" inputMode="decimal" defaultValue={record?.quota ?? ""} className="input num" placeholder="1000000" />
        </Field>
        <Field label="Closed revenue">
          <input name="closed_revenue" inputMode="decimal" defaultValue={record?.closed_revenue ?? ""} className="input num" />
        </Field>
        <Field label="Attainment %" hint="Leave empty to calculate from revenue ÷ quota">
          <input name="attainment_pct" inputMode="decimal" defaultValue={record?.attainment_pct ?? ""} className="input num" placeholder="112" />
        </Field>
      </div>

      {!compact && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Deals closed">
            <input name="deals_closed" inputMode="numeric" defaultValue={record?.deals_closed ?? ""} className="input num" />
          </Field>
          <Field label="Avg. deal size">
            <input name="avg_deal_size" inputMode="decimal" defaultValue={record?.avg_deal_size ?? ""} className="input num" />
          </Field>
          <Field label="Avg. cycle (days)">
            <input name="avg_sales_cycle_days" inputMode="numeric" defaultValue={record?.avg_sales_cycle_days ?? ""} className="input num" />
          </Field>
          <Field label="Ranking">
            <input name="ranking" defaultValue={record?.ranking ?? ""} className="input" placeholder="#2 of 18 in EMEA" />
          </Field>
        </div>
      )}

      <SubmitButton>{record ? "Save changes" : "Save record"}</SubmitButton>
    </ActionForm>
  );
}
