import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { signOut } from "@/app/login/actions";
import { MobileNav, NavLinks } from "./nav-links";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-block h-5 w-5 rounded-md bg-accent" aria-hidden />
            {APP_NAME}
          </Link>
          <NavLinks />
          <form action={signOut} className="ml-auto">
            <button className="text-sm text-muted hover:text-ink">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <MobileNav />
        {children}
      </main>
    </div>
  );
}
