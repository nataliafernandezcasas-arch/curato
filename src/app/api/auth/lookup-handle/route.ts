import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { handle } = await request.json();
  if (!handle) return NextResponse.json({ error: "Handle requis" }, { status: 400 });

  const supabase = createAdminClient();
  const clean = handle.replace("@", "").trim().toLowerCase();

  const { data, error } = await supabase
    .from("creators")
    .select("email")
    .ilike("handle", clean)
    .maybeSingle();

  if (error || !data?.email) {
    return NextResponse.json({ error: "Identifiant introuvable" }, { status: 404 });
  }

  return NextResponse.json({ email: data.email });
}
