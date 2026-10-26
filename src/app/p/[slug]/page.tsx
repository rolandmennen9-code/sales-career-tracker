import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PortfolioView } from "@/components/portfolio-view";
import { APP_NAME } from "@/lib/config";
import type { PublicPortfolio } from "@/lib/types";

async function load(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_portfolio", { p_slug: slug });
  return (data as PublicPortfolio | null) ?? null;
}

export async function generateMetadata(props: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const data = await load(slug);
  if (!data) return { title: "Portfolio not found", robots: { index: false } };
  return {
    title: data.full_name ?? "Sales portfolio",
    description: data.headline ?? undefined,
    robots: { index: false },
  };
}

export default async function PublicPortfolioPage(props: PageProps<"/p/[slug]">) {
  const { slug } = await props.params;
  const data = await load(slug);
  if (!data) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <PortfolioView data={data} />
      <footer className="mt-10 text-center text-xs text-muted">
        Made with{" "}
        <Link href="/" className="underline">
          {APP_NAME}
        </Link>
      </footer>
    </div>
  );
}
