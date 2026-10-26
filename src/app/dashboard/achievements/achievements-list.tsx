"use client";

import type { Achievement, Position } from "@/lib/types";
import { ACHIEVEMENT_KINDS } from "@/lib/config";
import { formatMoney, formatMonthYear } from "@/lib/format";
import { EditToggle } from "../positions/position-form";
import { deleteAchievement, toggleAchievementPublic } from "../actions";
import { AchievementForm } from "./achievement-form";

export function AchievementsList({ achievements, positions }: { achievements: Achievement[]; positions: Position[] }) {
  if (!achievements.length) return <p className="text-sm text-muted">No achievements yet.</p>;
  return (
    <ul className="space-y-3">
      {achievements.map((a) => {
        const pos = positions.find((p) => p.id === a.position_id);
        return (
          <li key={a.id} className="card p-5">
            <EditToggle
              form={(close) => (
                <div className="space-y-4">
                  <AchievementForm positions={positions} achievement={a} onDone={close} />
                  <form action={deleteAchievement} onSubmit={(e) => !confirm("Delete this achievement?") && e.preventDefault()}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-sm text-danger hover:underline">Delete</button>
                  </form>
                </div>
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-bg px-1.5 py-0.5 text-xs text-muted">
                  {ACHIEVEMENT_KINDS.find((k) => k.value === a.kind)?.label}
                </span>
                <span className="font-medium">{a.title}</span>
              </div>
              <div className="mt-1 text-sm text-muted">
                {[
                  pos?.company,
                  a.achieved_on && formatMonthYear(a.achieved_on),
                  a.deal_value != null && formatMoney(a.deal_value, pos?.currency),
                  a.sales_cycle_days != null && `${a.sales_cycle_days}-day cycle`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              <form action={toggleAchievementPublic} className="mt-3">
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="is_public" value={String(!a.is_public)} />
                <button className={`text-xs font-medium ${a.is_public ? "text-accent" : "text-muted"}`}>
                  {a.is_public ? "● Public on portfolio" : "○ Private — make public"}
                </button>
              </form>
            </EditToggle>
          </li>
        );
      })}
    </ul>
  );
}
