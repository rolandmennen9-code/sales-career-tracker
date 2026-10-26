"use client";

import { useRouter } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Field, SubmitButton } from "@/components/ui";
import type { Profile } from "@/lib/types";
import { savePortfolio } from "./actions";

const TOGGLES: { name: keyof Profile; label: string; hint?: string }[] = [
  { name: "show_experience", label: "Career history", hint: "Companies, titles and dates" },
  { name: "show_attainment", label: "Quota attainment history", hint: "Percentages and rankings" },
  { name: "show_deal_metrics", label: "Deal metrics", hint: "Deal counts and sales cycles" },
  { name: "show_achievements", label: "Public achievements", hint: "Only the ones you mark public" },
  { name: "show_revenue_figures", label: "Absolute € figures", hint: "Revenue, quota and deal values. Off keeps numbers as percentages only." },
];

export function PortfolioSettings({ profile, site }: { profile: Profile; site: string }) {
  const router = useRouter();
  return (
    <ActionForm action={savePortfolio} resetOnSuccess={false} onDone={() => router.refresh()} className="card space-y-5 p-5">
      <Field label="Your link">
        <div className="flex items-center rounded-lg border border-line bg-bg text-sm">
          <span className="pl-3 text-muted">{site.replace(/^https?:\/\//, "")}/p/</span>
          <input name="slug" defaultValue={profile.slug ?? ""} className="w-full bg-transparent px-1 py-2 outline-none" required />
        </div>
      </Field>
      <Field label="About me" hint="Shown at the top of your portfolio and used as your CV summary.">
        <textarea name="summary" rows={4} defaultValue={profile.summary ?? ""} className="input" />
      </Field>
      <fieldset className="space-y-3">
        <legend className="label">Show on portfolio</legend>
        {TOGGLES.map((t) => (
          <label key={t.name} className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" name={t.name} value="true" defaultChecked={Boolean(profile[t.name])} className="mt-0.5" />
            <span>
              {t.label}
              {t.hint && <span className="block text-xs text-muted">{t.hint}</span>}
            </span>
          </label>
        ))}
      </fieldset>
      <SubmitButton>Save settings</SubmitButton>
    </ActionForm>
  );
}
