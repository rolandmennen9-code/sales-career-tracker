"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Tracker" },
  { href: "/dashboard/positions", label: "Career" },
  { href: "/dashboard/performance", label: "Performance" },
  { href: "/dashboard/achievements", label: "Achievements" },
  { href: "/cv", label: "CV" },
  { href: "/portfolio", label: "Portfolio" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="hidden gap-1 overflow-x-auto md:flex">
      {LINKS.map((l) => {
        const active = l.href === "/dashboard" ? path === l.href : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-3 py-1.5 text-sm ${active ? "bg-bg font-medium text-ink" : "text-muted hover:text-ink"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto md:hidden">
      {LINKS.map((l) => {
        const active = l.href === "/dashboard" ? path === l.href : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${active ? "bg-surface font-medium shadow-sm" : "text-muted"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
