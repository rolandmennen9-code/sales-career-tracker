import { GatedShell } from "@/components/gated-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <GatedShell>{children}</GatedShell>;
}
