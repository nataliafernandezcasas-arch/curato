import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";

const NOTA_MAX = 2000;

/**
 * El storyteller valora una visita que ya hizo: de 1 a 5 estrellas y, si
 * quiere, unas líneas. Se puede cambiar después; vale la última.
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
    const { data: creator } = await admin
      .from("creators")
      .select("id")
      .or(filtroDeUsuario(user))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!creator) return NextResponse.json({ error: "creator" }, { status: 403 });

    // Solo su reserva, y solo una visita que ya pasó y se hizo.
    const { data: r } = await admin
      .from("reservations")
      .select("id, slot_start, status")
      .eq("id", id)
      .eq("creator_id", creator.id)
      .maybeSingle();
    if (!r) return NextResponse.json({ error: "reserva" }, { status: 404 });
    if (new Date(r.slot_start as string).getTime() > Date.now() || !["confirmed", "completed"].includes(r.status as string)) {
      return NextResponse.json({ error: "pronto" }, { status: 409 });
    }

    const { error } = await admin
      .from("reservations")
      .update({ rating: estrellas, rating_note: nota || null, rated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: "migracion" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
