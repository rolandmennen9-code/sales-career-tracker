import { GatedShell } from "@/components/gated-shell";

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <GatedShell>{children}</GatedShell>;
}
