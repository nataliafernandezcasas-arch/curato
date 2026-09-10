import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDossiers } from "@/lib/storyteller-dossier";

// La ficha de un storyteller que la casa abre desde el roster. Es el mismo
// dossier que acompaña a una demanda de visita, sin la demanda.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();

    // Only a maison may see a storyteller's dossier.
    const { data: maison } = await admin
      .from("comercios")
      .select("id")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    const { data: creator } = await admin
      .from("creators")
      .select("id")
      .eq("id", id)
      .eq("stage", "active")
      .maybeSingle();
    if (!creator) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

    const dossier = (await buildDossiers(admin, [id])).get(id) ?? null;
    if (!dossier) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

    return NextResponse.json({ dossier });
  } catch (err) {
    console.error("Storyteller dossier error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}
