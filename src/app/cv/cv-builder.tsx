"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { EMPHASES, TARGET_ROLES } from "@/lib/config";
import type { CvContent, CvOptions } from "@/lib/types";
import { polishCvAction, regenerateCv, saveCvContent } from "./actions";

type Settings = { targetRole: string; emphasis: string; options: CvOptions };

const OPTION_LABELS: Record<keyof CvOptions, string> = {
  includeAttainment: "Quota attainment",
  includeDealMetrics: "Deal sizes and sales cycles",
  includeMethodologies: "Sales methodologies",
};

export function CvBuilder({
  initialContent,
  initialSettings,
  saved,
  aiEnabled,
}: {
  initialContent: CvContent;
  initialSettings: Settings;
  saved: boolean;
  aiEnabled: boolean;
}) {
  const [content, setContent] = useState(initialContent);
  const [settings, setSettings] = useState(initialSettings);
  const [dirty, setDirty] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const first = useRef(true);

  // Settings changes rebuild the CV from records.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    start(async () => {
      const res = await regenerateCv(settings);
      setContent(res.content);
      setDirty(false);
      setIsSaved(!res.error);
      setMessage(res.error);
    });
  }, [settings]);

  const edit = (fn: (c: CvContent) => CvContent) => {
    setContent((c) => fn(structuredClone(c)));
    setDirty(true);
  };

  const save = () =>
    start(async () => {
      const res = await saveCvContent(content, settings);
      setMessage(res.error);
      if (!res.error) {
        setDirty(false);
        setIsSaved(true);
      }
    });

  const polish = () =>
    start(async () => {
      const res = await polishCvAction(content, settings);
      setContent(res.content);
      setMessage(res.error);
      setDirty(false);
      setIsSaved(true);
    });

  const rebuild = () => {
    if (dirty && !confirm("Rebuild from your tracker? Manual edits will be replaced.")) return;
    start(async () => {
      const res = await regenerateCv(settings);
      setContent(res.content);
      setDirty(false);
      setIsSaved(!res.error);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <div className="card space-y-5 p-5">
          <fieldset>
            <legend className="label">Target role</legend>
            <div className="space-y-1.5">
              {TARGET_ROLES.map((r) => (
                <label key={r.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="role"
                    checked={settings.targetRole === r.value}
                    onChange={() => setSettings((s) => ({ ...s, targetRole: r.value }))}
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Emphasis</legend>
            <div className="space-y-1.5">
              {EMPHASES.map((e) => (
                <label key={e.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="emphasis"
                    checked={settings.emphasis === e.value}
                    onChange={() => setSettings((s) => ({ ...s, emphasis: e.value }))}
                  />
                  {e.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Include</legend>
            <div className="space-y-1.5">
              {(Object.keys(OPTION_LABELS) as (keyof CvOptions)[]).map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.options[k]}
                    onChange={(e) => setSettings((s) => ({ ...s, options: { ...s.options, [k]: e.target.checked } }))}
                  />
                  {OPTION_LABELS[k]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="flex flex-col gap-2">
          {dirty ? (
            <button className="btn-primary" onClick={save} disabled={pending}>
              Save edits
            </button>
          ) : (
            <a
              href="/cv/pdf"
              className={`btn-accent ${!isSaved ? "pointer-events-none opacity-50" : ""}`}
              aria-disabled={!isSaved}
            >
              Download PDF
            </a>
          )}
          {!isSaved && !dirty && (
            <button className="btn-ghost" onClick={save} disabled={pending}>
              Save to enable PDF
            </button>
          )}
          {aiEnabled && (
            <button className="btn-ghost" onClick={polish} disabled={pending}>
              {pending ? "Working…" : "Polish wording with AI"}
            </button>
          )}
          <button className="text-sm text-muted hover:text-ink" onClick={rebuild} disabled={pending}>
            Rebuild from tracker
          </button>
          {message && <p className="text-sm text-warn">{message}</p>}
        </div>
      </aside>

      <article className={`card p-8 sm:p-10 ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
        <Editable
          className="text-2xl font-semibold tracking-tight"
          value={content.name}
          onChange={(v) => edit((c) => ({ ...c, name: v }))}
        />
        <Editable
          className="text-muted"
          value={[content.headline, content.location].filter(Boolean).join(" · ")}
          onChange={(v) => {
            const [headline, ...rest] = v.split(" · ");
            edit((c) => ({ ...c, headline, location: rest.join(" · ") }));
          }}
        />

        <Section title="Professional summary">
          <Editable multiline value={content.summary} onChange={(v) => edit((c) => ({ ...c, summary: v }))} />
        </Section>

        <Section title="Experience">
          <div className="space-y-6">
            {content.experience.map((e, i) => (
              <div key={i}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-medium">
                    {e.title} <span className="text-muted">· {e.company}</span>
                  </div>
                  <div className="num text-sm text-muted">{e.dates}</div>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {e.bullets.map((b, j) => (
                    <li key={j} className="group flex gap-2 text-sm">
                      <span className="text-muted">•</span>
                      <Editable
                        className="flex-1"
                        value={b}
                        onChange={(v) =>
                          edit((c) => {
                            c.experience[i].bullets[j] = v;
                            return c;
                          })
                        }
                      />
                      <button
                        className="text-xs text-muted opacity-0 group-hover:opacity-100 hover:text-danger"
                        onClick={() =>
                          edit((c) => {
                            c.experience[i].bullets.splice(j, 1);
                            return c;
                          })
                        }
                        aria-label="Remove bullet"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  className="mt-1 text-xs text-muted hover:text-ink"
                  onClick={() =>
                    edit((c) => {
                      c.experience[i].bullets.push("New bullet — click to edit");
                      return c;
                    })
                  }
                >
                  + Add bullet
                </button>
              </div>
            ))}
            {!content.experience.length && <p className="text-sm text-muted">Add positions in your tracker to fill this section.</p>}
          </div>
        </Section>

        {content.highlights.length > 0 && (
          <Section title="Recognition">
            <p className="text-sm">{content.highlights.join(" · ")}</p>
          </Section>
        )}
        {content.skills.length > 0 && (
          <Section title="Methodologies & tools">
            <p className="text-sm">{content.skills.join(" · ")}</p>
          </Section>
        )}
        <p className="mt-8 text-xs text-muted">Click any text to edit it. Changing role, emphasis or toggles rebuilds the CV.</p>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="eyebrow mb-2 border-b border-line pb-1">{title}</h2>
      {children}
    </section>
  );
}

function Editable({
  value,
  onChange,
  className = "",
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={multiline}
      className={`rounded px-1 -mx-1 outline-none hover:bg-bg focus:bg-accent-soft ${multiline ? "text-sm leading-relaxed" : ""} ${className}`}
      onBlur={(e) => {
        const v = e.currentTarget.innerText.trim();
        if (v !== value) onChange(v);
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    >
      {value}
    </div>
  );
}
