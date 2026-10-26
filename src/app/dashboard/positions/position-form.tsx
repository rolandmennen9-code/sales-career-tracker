"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { Field, SubmitButton } from "@/components/ui";
import { SEGMENTS } from "@/lib/config";
import type { Position } from "@/lib/types";
import { savePosition } from "../actions";

export function PositionForm({ position, onDone }: { position?: Position; onDone?: () => void }) {
  const [current, setCurrent] = useState(position ? !position.end_date : false);
  return (
    <ActionForm action={savePosition} onDone={onDone} resetOnSuccess={!position} className="grid gap-4 sm:grid-cols-2">
      {position && <input type="hidden" name="id" value={position.id} />}
      <Field label="Company">
        <input name="company" required defaultValue={position?.company} className="input" />
      </Field>
      <Field label="Job title">
        <input name="title" required defaultValue={position?.title} className="input" placeholder="Senior Account Executive" />
      </Field>
      <Field label="Start">
        <input name="start_date" type="month" required defaultValue={position?.start_date.slice(0, 7)} className="input" />
      </Field>
      <Field label="End">
        <div className="flex items-center gap-3">
          <input
            name="end_date"
            type="month"
            disabled={current}
            defaultValue={position?.end_date?.slice(0, 7)}
            className="input disabled:opacity-40"
          />
          <label className="flex shrink-0 items-center gap-1.5 text-sm">
            <input type="checkbox" checked={current} onChange={(e) => setCurrent(e.target.checked)} /> Current
          </label>
        </div>
      </Field>
      <Field label="Segment">
        <select name="segment" defaultValue={position?.segment ?? ""} className="input">
          <option value="">—</option>
          {SEGMENTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Currency">
        <select name="currency" defaultValue={position?.currency ?? "EUR"} className="input">
          {["EUR", "USD", "GBP", "AED", "CHF", "SEK", "DKK"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="What you sold, to whom" hint="Used as a fallback CV line when there are no metrics for this role.">
          <textarea name="description" rows={2} defaultValue={position?.description ?? ""} className="input" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>{position ? "Save changes" : "Add position"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function EditToggle({ children, form }: { children: React.ReactNode; form: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex-1">{children}</div>
        <button onClick={() => setOpen((o) => !o)} className="text-sm text-muted hover:text-ink">
          {open ? "Close" : "Edit"}
        </button>
      </div>
      {open && <div className="mt-4 border-t border-line pt-4">{form(() => setOpen(false))}</div>}
    </div>
  );
}
