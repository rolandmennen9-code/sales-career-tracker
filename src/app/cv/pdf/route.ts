import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { CvPdf } from "@/lib/cv-pdf";
import { slugify } from "@/lib/format";
import type { CvContent } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));

  const { data } = await supabase.from("cvs").select("content").eq("user_id", user.id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Save your CV first." }, { status: 404 });

  const cv = data.content as CvContent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(CvPdf, { cv }) as any);
  const filename = `${slugify(cv.name || "cv")}-cv.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
