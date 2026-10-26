import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiEnabled, extractCvFromPdf } from "@/lib/ai";

export const maxDuration = 60;
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!aiEnabled()) return NextResponse.json({ error: "CV import is not configured. Add your roles manually." }, { status: 503 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "Upload your CV as a PDF." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "PDF is larger than 8 MB." }, { status: 400 });

  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const extracted = await extractCvFromPdf(base64);
    return NextResponse.json({ extracted });
  } catch (e) {
    console.error("import-cv failed", e);
    return NextResponse.json({ error: "We couldn't read that CV. Try another file or add your roles manually." }, { status: 500 });
  }
}
