"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { Field, SubmitButton } from "@/components/ui";
import { ACHIEVEMENT_KINDS } from "@/lib/config";
import type { Achievement, Position } from "@/lib/types";
import { saveAchievement } from "../actions";

export function AchievementForm({
  positions,
  achievement,
  onDone,
}: {
  positions: Pick<Position, "id" | "title" | "company">[];
  achievement?: Achievement;
  onDone?: () => void;
}) {
  const [kind, setKind] = useState(achievement?.kind ?? "deal");
  return (
    <ActionForm action={saveAchievement} onDone={onDone} resetOnSuccess={!achievement} className="grid gap-4 sm:grid-cols-2">
      {achievement && <input type="hidden" name="id" value={achievement.id} />}
      <Field label="Type">
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="input">
          {ACHIEVEMENT_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Role">
        <select name="position_id" defaultValue={achievement?.position_id ?? positions[0]?.id ?? ""} className="input">
          <option value="">Not tied to a role</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} · {p.company}
            </option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Title" hint="Write it as a CV line, e.g. “Closed largest new-logo deal in company history”">
          <input name="title" required defaultValue={achievement?.title} className="input" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Context (optional)">
          <textarea
            name="description"
            rows={2}
            defaultValue={achievement?.description ?? ""}
            className="input"
            placeholder="Multi-threaded across IT, Finance and Ops; displaced incumbent"
          />
        </Field>
      </div>
      <Field label="When">
        <input name="achieved_on" type="month" defaultValue={achievement?.achieved_on?.slice(0, 7)} className="input" />
      </Field>
      {kind === "deal" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Deal value (ARR)">
            <input name="deal_value" inputMode="decimal" defaultValue={achievement?.deal_value ?? ""} className="input num" />
          </Field>
          <Field label="Cycle (days)">
            <input name="sales_cycle_days" inputMode="numeric" defaultValue={achievement?.sales_cycle_days ?? ""} className="input num" />
          </Field>
        </div>
      ) : (
        <div />
      )}
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="is_public" value="true" defaultChecked={achievement?.is_public ?? false} />
        Show on my public portfolio
      </label>
      <div className="sm:col-span-2">
        <SubmitButton>{achievement ? "Save changes" : "Add achievement"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
