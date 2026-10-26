"use client";

import type { Position } from "@/lib/types";
import { EditToggle, PositionForm } from "./position-form";

export function PositionsList({
  items,
  deleteAction,
}: {
  items: { position: Position; dates: string; segment: string | null; records: number }[];
  deleteAction: (fd: FormData) => Promise<void>;
}) {
  if (!items.length) return <p className="text-sm text-muted">No positions yet — add your current role below.</p>;
  return (
    <ul className="space-y-3">
      {items.map(({ position: p, dates, segment, records }) => (
        <li key={p.id} className="card p-5">
          <EditToggle
            form={(close) => (
              <div className="space-y-4">
                <PositionForm position={p} onDone={close} />
                <form
                  action={deleteAction}
                  onSubmit={(e) => {
                    if (!confirm(`Delete ${p.title} at ${p.company}? Its performance records will be deleted too.`)) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={p.id} />
                  <button className="text-sm text-danger hover:underline">Delete position</button>
                </form>
              </div>
            )}
          >
            <div className="font-medium">
              {p.title} <span className="text-muted">· {p.company}</span>
            </div>
            <div className="mt-0.5 text-sm text-muted">
              {dates}
              {segment && ` · ${segment}`} · {records} performance record{records === 1 ? "" : "s"}
            </div>
          </EditToggle>
        </li>
      ))}
    </ul>
  );
}
