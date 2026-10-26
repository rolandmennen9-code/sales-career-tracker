import { GatedShell } from "@/components/gated-shell";

export default function CvLayout({ children }: { children: React.ReactNode }) {
  return <GatedShell>{children}</GatedShell>;
}
