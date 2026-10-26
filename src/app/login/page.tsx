import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/dashboard";
  const error = typeof sp.error === "string" ? sp.error : null;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
          <span className="inline-block h-5 w-5 rounded-md bg-accent" aria-hidden />
          {APP_NAME}
        </Link>
        <div className="card p-6">
          <h1 className="text-xl font-semibold">Sign in or create an account</h1>
          <p className="mt-1 mb-6 text-sm text-muted">Your records stay private until you choose to share them.</p>
          {error && <p className="mb-4 text-sm text-danger">Sign-in failed. Please try again.</p>}
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
