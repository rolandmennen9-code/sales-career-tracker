import { redirect } from "next/navigation";
import { AppShell } from "./app-shell";
import { requireUser } from "@/lib/supabase/server";

/** App chrome for signed-in pages; sends users who haven't finished onboarding back to it. */
export async function GatedShell({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("profiles").select("onboarding_completed").eq("id", user.id).single();
  if (!data?.onboarding_completed) redirect("/onboarding");
  return <AppShell>{children}</AppShell>;
}
