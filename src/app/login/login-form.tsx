"use client";

import { useActionState } from "react";
import { signInWithEmail, signInWithGoogle } from "./actions";
import { SubmitButton } from "@/components/ui";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signInWithEmail, { error: null as string | null, sent: false });

  if (state.sent) {
    return (
      <div className="rounded-lg bg-accent-soft p-4 text-sm">
        Check your inbox — we sent you a sign-in link.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button className="btn-ghost w-full">Continue with Google</button>
      </form>
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <form action={action} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <input name="email" type="email" required placeholder="you@company.com" className="input" autoComplete="email" />
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <SubmitButton className="btn-primary w-full" pendingText="Sending link…">
          Email me a sign-in link
        </SubmitButton>
      </form>
    </div>
  );
}
