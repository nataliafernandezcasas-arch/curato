import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";
import { filtroDeCasa } from "@/lib/casa";

const NOTA_MAX = 2000;

/**
 * La casa valora una visita que ya se hizo: de 1 a 5 estrellas y, si quiere,
 * unas líneas sobre el storyteller. Lo lee Curato. Se puede cambiar después.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

    const body = (await request.json().catch(() => null)) as { id?: unknown; estrellas?: unknown; nota?: unknown } | null;
    const id = typeof body?.id === "string" ? body.id : "";
    const estrellas = Number(body?.estrellas);
    if (!id || !Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
      return NextResponse.json({ error: "datos" }, { status: 400 });
    }
    const nota = typeof body?.nota === "string" ? body.nota.trim().slice(0, NOTA_MAX) : "";

    const admin = createAdminClient();
    const { data: maison } = await admin
      .from("comercios")
      .select("id")
      .or(await filtroDeCasa(admin, user))
      .eq("stage", "activo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "maison" }, { status: 403 });

    // Solo una visita suya que ya se hizo: registrada al llegar, o pasada.
    const { data: r } = await admin
      .from("reservations")
      .select("id, slot_start, status, visited_at")
      .eq("id", id)
      .eq("venue_id", maison.id)
      .maybeSingle();
    if (!r) return NextResponse.json({ error: "reserva" }, { status: 404 });
    const hecha = Boolean(r.visited_at) || new Date(r.slot_start as string).getTime() < Date.now();
    if (!hecha || !["confirmed", "completed"].includes(r.status as string)) {
      return NextResponse.json({ error: "pronto" }, { status: 409 });
    }

    const { error } = await admin
      .from("reservations")
      .update({ maison_rating: estrellas, maison_rating_note: nota || null, maison_rated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: "migracion" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
