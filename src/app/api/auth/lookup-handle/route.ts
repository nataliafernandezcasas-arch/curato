import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { handle } = await request.json();
  if (!handle) return NextResponse.json({ error: "Identifiant requis" }, { status: 400 });

  const supabase = createAdminClient();
  // Strip only a LEADING @ (so "@apercu" → "apercu") without touching the @ in
  // an email address — otherwise email sign-in for creators/maisons breaks.
  const clean = handle.trim().toLowerCase().replace(/^@/, "");

  // 1. Try creators by handle
  const { data: creator } = await supabase
    .from("creators")
    .select("email")
    .ilike("handle", clean)
    .maybeSingle();

  if (creator?.email) {
    return NextResponse.json({ email: creator.email });
  }

  // 2. If input looks like an email, try comercios by email
  if (clean.includes("@")) {
    const { data: comercio } = await supabase
      .from("comercios")
      .select("email")
      .ilike("email", clean)
      .maybeSingle();

    if (comercio?.email) {
      return NextResponse.json({ email: comercio.email });
    }

    // 3. Also allow direct email sign-in for any Supabase auth user
    return NextResponse.json({ email: clean });
  }

  return NextResponse.json({ error: "Identifiant introuvable" }, { status: 404 });
}
