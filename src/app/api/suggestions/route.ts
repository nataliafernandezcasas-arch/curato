import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";

// A storyteller suggests an address they'd love to see in the catalogue.
// Errors carry a stable `code` that the client translates; `error` stays
// for anyone still reading the text.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ code: "auth", error: "Non authentifié." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const venueName = (body.venueName || "").trim();
    const note = (body.note || "").trim();
    if (!venueName) {
      return NextResponse.json({ code: "missing", error: "Indiquez une adresse." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: creator } = await admin
      .from("creators")
      .select("id")
      .or(filtroDeUsuario(user))
      .maybeSingle();

    const { error } = await admin.from("venue_suggestions").insert({
      creator_id: creator?.id ?? null,
      venue_name: venueName.slice(0, 200),
      note: note ? note.slice(0, 500) : null,
    });
    if (error) {
      console.error("Suggestion insert error:", error);
      return NextResponse.json({ code: "server", error: "Erreur. Réessayez." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Suggestion error:", err);
    return NextResponse.json({ code: "server", error: "Erreur. Réessayez." }, { status: 500 });
  }
}
