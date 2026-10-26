"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Field, SubmitButton } from "@/components/ui";
import { SEGMENTS } from "@/lib/config";
import type { Position, Segment } from "@/lib/types";
import { PositionForm } from "../dashboard/positions/position-form";
import { PerformanceForm } from "../dashboard/performance/performance-form";
import { completeOnboarding, saveBasics } from "./actions";
import { ImportStep } from "./import-step";

const STEPS = ["Specialization", "Basics", "Career history", "First record"];

const ROLES = [
  { value: "ae", label: "Account Executive", available: true },
  { value: "sdr", label: "SDR / BDR", available: false },
  { value: "am", label: "Account Manager", available: false },
  { value: "csm", label: "Customer Success Manager", available: false },
  { value: "lead", label: "Sales Manager / Leader", available: false },
];

export function Wizard({
  profile,
  positions,
  hasPerformance,
  aiEnabled,
}: {
  profile: { full_name: string; headline: string; location: string; segment: Segment | null };
  positions: Position[];
  hasPerformance: boolean;
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(positions.length ? 3 : 0);
  const [manual, setManual] = useState(!aiEnabled);
  const [finishing, startFinish] = useTransition();
  const finish = () => startFinish(() => completeOnboarding());

  return (
    <div>
      <ol className="mb-6 flex gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? "bg-accent" : "bg-line"}`} />
            <div className={`mt-2 text-xs ${i === step ? "font-medium text-ink" : "text-muted"}`}>{s}</div>
          </li>
        ))}
      </ol>

      <div className="card p-6 sm:p-8">
        {step === 0 && (
          <div>
            <h1 className="text-xl font-semibold">What&apos;s your sales specialization?</h1>
            <p className="mt-1 mb-6 text-sm text-muted">We tailor the metrics and CV structure to your role.</p>
            <div className="space-y-2">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                    r.available ? "border-ink bg-bg" : "border-line text-muted"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" name="role" defaultChecked={r.available} disabled={!r.available} />
                    {r.label}
                  </span>
                  {!r.available && <span className="text-xs">Coming soon</span>}
                </label>
              ))}
            </div>
            <button className="btn-primary mt-6" onClick={() => setStep(1)}>
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-xl font-semibold">The basics</h1>
            <p className="mt-1 mb-6 text-sm text-muted">This appears at the top of your CV and portfolio.</p>
            <ActionForm action={saveBasics} resetOnSuccess={false} onDone={() => setStep(2)} className="space-y-4">
              <Field label="Full name">
                <input name="full_name" required defaultValue={profile.full_name} className="input" />
              </Field>
              <Field label="Headline">
                <input
                  name="headline"
                  defaultValue={profile.headline}
                  className="input"
                  placeholder="Enterprise Account Executive · B2B SaaS"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Location">
                  <input name="location" defaultValue={profile.location} className="input" placeholder="Amsterdam, Netherlands" />
                </Field>
                <Field label="Main segment">
                  <select name="segment" defaultValue={profile.segment ?? ""} className="input">
                    <option value="">—</option>
                    {SEGMENTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost" onClick={() => setStep(0)}>
                  Back
                </button>
                <SubmitButton>Continue</SubmitButton>
              </div>
            </ActionForm>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-xl font-semibold">Your career history</h1>
            {!manual ? (
              <>
                <p className="mt-1 mb-6 text-sm text-muted">
                  Upload your current CV and we&apos;ll pull out your roles and achievements. You review everything before it&apos;s saved.
                </p>
                <ImportStep
                  onSaved={() => {
                    router.refresh();
                    setStep(3);
                  }}
                />
                <button className="mt-4 text-sm text-muted underline" onClick={() => setManual(true)}>
                  Skip import and add roles manually
                </button>
              </>
            ) : (
              <>
                <p className="mt-1 mb-6 text-sm text-muted">
                  Start with your current or most recent sales role. You can add the rest later.
                </p>
                <PositionForm
                  onDone={() => {
                    router.refresh();
                    setStep(3);
                  }}
                />
                {aiEnabled && (
                  <button className="mt-4 text-sm text-muted underline" onClick={() => setManual(false)}>
                    Import from a CV instead
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-xl font-semibold">Add your latest number</h1>
            <p className="mt-1 mb-6 text-sm text-muted">
              {hasPerformance
                ? "We found performance figures in your CV. Add another period, or finish now."
                : "Your most recent full year or quarter. Attainment alone is enough to start."}
            </p>
            {positions.length ? (
              <PerformanceForm positions={positions} compact onDone={finish} />
            ) : (
              <p className="text-sm text-muted">Loading your roles…</p>
            )}
            <button className="mt-6 text-sm text-muted underline" onClick={finish} disabled={finishing}>
              {finishing ? "Setting up your tracker…" : "Skip for now and go to my tracker"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
