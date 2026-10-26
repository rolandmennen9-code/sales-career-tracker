"use client";

import { useActionState, useEffect, useRef } from "react";

type Result = { error: string | null; ok?: boolean };

/** Form bound to a server action returning {error, ok}. Resets and calls onDone after success. */
export function ActionForm({
  action,
  children,
  className,
  onDone,
  resetOnSuccess = true,
}: {
  action: (prev: Result, fd: FormData) => Promise<Result>;
  children: React.ReactNode;
  className?: string;
  onDone?: () => void;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, { error: null } as Result);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onDone?.();
    }
  }, [state, onDone, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}
    </form>
  );
}
