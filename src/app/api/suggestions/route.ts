import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// A storyteller suggests an address they'd love to see in the catalogue.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const venueName = (body.venueName || "").trim();
    const note = (body.note || "").trim();
    if (!venueName) {
      return NextResponse.json({ error: "Indiquez une adresse." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: creator } = await admin
      .from("creators")
      .select("id")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();

    const { error } = await admin.from("venue_suggestions").insert({
      creator_id: creator?.id ?? null,
      venue_name: venueName.slice(0, 200),
      note: note ? note.slice(0, 500) : null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Suggestion error:", err);
    return NextResponse.json({ error: "Erreur. Réessayez." }, { status: 500 });
  }
}
