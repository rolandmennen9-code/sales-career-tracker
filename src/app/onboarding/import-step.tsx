"use client";

import { useState, useTransition } from "react";
import type { ExtractedCv } from "@/lib/ai";
import { ACHIEVEMENT_KINDS } from "@/lib/config";
import { saveImported, type ImportPayload } from "./actions";

type ReviewPosition = ExtractedCv["positions"][number] & { key: string; keep: boolean };
type ReviewAchievement = ExtractedCv["achievements"][number] & { keep: boolean; position_key: string | null };

const toMonth = (d: string | null) => (d ? d.slice(0, 7) : "");
const fromMonth = (m: string) => (m ? `${m}-01` : null);

export function ImportStep({ onSaved }: { onSaved: () => void }) {
  const [status, setStatus] = useState<"idle" | "reading" | "review">("idle");
  const [error, setError] = useState<string | null>(null);
  const [cv, setCv] = useState<ExtractedCv | null>(null);
  const [positions, setPositions] = useState<ReviewPosition[]>([]);
  const [achievements, setAchievements] = useState<ReviewAchievement[]>([]);
  const [saving, startSaving] = useTransition();

  async function upload(file: File) {
    setError(null);
    setStatus("reading");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/import-cv", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({ error: "Something went wrong." }));
    if (!res.ok) {
      setError(json.error);
      setStatus("idle");
      return;
    }
    const data = json.extracted as ExtractedCv;
    const ps = data.positions.map((p, i) => ({ ...p, key: `p${i}`, keep: true }));
    setCv(data);
    setPositions(ps);
    setAchievements(
      data.achievements.map((a) => ({
        ...a,
        keep: true,
        position_key: ps.find((p) => a.company && p.company.toLowerCase() === a.company.toLowerCase())?.key ?? null,
      })),
    );
    setStatus("review");
  }

  function save() {
    if (!cv) return;
    const kept = positions.filter((p) => p.keep);
    const missing = kept.find((p) => !p.start_date || !p.company || !p.title);
    if (missing) {
      setError(`Add a start month for ${missing.title || "each role"} before saving.`);
      return;
    }
    const payload: ImportPayload = {
      summary: cv.summary,
      methodologies: cv.methodologies,
      tools: cv.tools,
      positions: kept.map((p) => ({
        key: p.key,
        company: p.company,
        title: p.title,
        start_date: p.start_date,
        end_date: p.end_date,
        segment: p.segment,
        description: p.description,
        metrics: p.stated_metrics
          .filter((m): m is typeof m & { year: number } => m.year != null)
          .map(({ year, attainment_pct, closed_revenue, quota, ranking }) => ({ year, attainment_pct, closed_revenue, quota, ranking })),
      })),
      achievements: achievements
        .filter((a) => a.keep && (!a.position_key || kept.some((p) => p.key === a.position_key)))
        .map(({ position_key, kind, title, year, deal_value }) => ({ position_key, kind, title, year, deal_value })),
    };
    startSaving(async () => {
      const res = await saveImported(payload);
      if (res.error) setError(res.error);
      else onSaved();
    });
  }

  if (status !== "review") {
    return (
      <div>
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line px-6 py-10 text-center hover:border-ink ${
            status === "reading" ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <span className="font-medium">{status === "reading" ? "Reading your CV…" : "Upload your CV (PDF)"}</span>
          <span className="mt-1 text-sm text-muted">
            {status === "reading" ? "This takes about 20 seconds." : "We only keep what you confirm on the next screen."}
          </span>
        </label>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </div>
    );
  }

  const update = (key: string, patch: Partial<ReviewPosition>) =>
    setPositions((ps) => ps.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold">Roles we found</h2>
        <ul className="space-y-2">
          {positions.map((p) => (
            <li key={p.key} className={`rounded-lg border border-line p-3 ${p.keep ? "" : "opacity-50"}`}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={p.keep} onChange={(e) => update(p.key, { keep: e.target.checked })} className="mt-1" />
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <input className="input" value={p.title} onChange={(e) => update(p.key, { title: e.target.value })} aria-label="Title" />
                  <input className="input" value={p.company} onChange={(e) => update(p.key, { company: e.target.value })} aria-label="Company" />
                  <input
                    className="input"
                    type="month"
                    value={toMonth(p.start_date)}
                    onChange={(e) => update(p.key, { start_date: fromMonth(e.target.value) ?? "" })}
                    aria-label="Start"
                  />
                  <input
                    className="input"
                    type="month"
                    value={toMonth(p.end_date)}
                    onChange={(e) => update(p.key, { end_date: fromMonth(e.target.value) })}
                    aria-label="End (empty if current)"
                  />
                  {p.stated_metrics.some((m) => m.attainment_pct != null || m.closed_revenue != null) && (
                    <div className="text-xs text-accent sm:col-span-2">
                      Metrics found:{" "}
                      {p.stated_metrics
                        .filter((m) => m.attainment_pct != null)
                        .map((m) => `${m.year ?? "?"}: ${m.attainment_pct}%`)
                        .join(", ") || "revenue figures"}
                      {p.stated_metrics.some((m) => m.year == null) && " (entries without a year are skipped)"}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {achievements.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Achievements we found</h2>
          <ul className="space-y-1">
            {achievements.map((a, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={a.keep}
                  onChange={(e) => setAchievements((as) => as.map((x, j) => (j === i ? { ...x, keep: e.target.checked } : x)))}
                />
                <span className="rounded bg-bg px-1.5 py-0.5 text-xs text-muted">
                  {ACHIEVEMENT_KINDS.find((k) => k.value === a.kind)?.label}
                </span>
                {a.title}
                {a.year && <span className="text-muted">· {a.year}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(cv?.methodologies.length || cv?.tools.length) ? (
        <p className="text-sm text-muted">
          Skills: {[...(cv?.methodologies ?? []), ...(cv?.tools ?? [])].join(", ")}
        </p>
      ) : null}

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" onClick={save} disabled={saving || !positions.some((p) => p.keep)}>
          {saving ? "Saving…" : "Looks right — save"}
        </button>
        <button className="btn-ghost" onClick={() => setStatus("idle")}>
          Upload a different CV
        </button>
      </div>
    </div>
  );
}
