import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esCodigoValido, normalizarCodigo, visitaDeHoy } from "@/lib/check-in";

/**
 * El storyteller escanea el QR de la casa, o teclea su código, y su visita de
 * hoy queda registrada (visited_at). No cambia el estado de la reserva: eso
 * sigue llegando con las stories.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

    const { code } = (await request.json().catch(() => ({}))) as { code?: string };
    const codigo = normalizarCodigo(code ?? "");
    if (!esCodigoValido(codigo)) return NextResponse.json({ error: "code" }, { status: 400 });

    const admin = createAdminClient();
    const { data: maison } = await admin.from("comercios").select("id, name").eq("check_in_code", codigo).maybeSingle();
    if (!maison) return NextResponse.json({ error: "code" }, { status: 404 });

    const { data: creator } = await admin
      .from("creators")
      .select("id")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!creator) return NextResponse.json({ error: "creator", maison: maison.name }, { status: 403 });

    // Las reservas de esta persona en esta casa, de los últimos días: un hotel
    // puede haber empezado antes de hoy.
    const desde = new Date(Date.now() - 40 * 86400000).toISOString();
    const { data: reservas } = await admin
      .from("reservations")
      .select("id, slot_start, slot_end, status, visited_at")
      .eq("creator_id", creator.id)
      .eq("venue_id", maison.id)
      .gte("slot_start", desde);

    const visita = visitaDeHoy(reservas ?? []);
    if (!visita) return NextResponse.json({ error: "aucune", maison: maison.name }, { status: 404 });
    if (visita.visited_at) return NextResponse.json({ ok: true, ya: true, maison: maison.name });

    const { error } = await admin
      .from("reservations")
      .update({ visited_at: new Date().toISOString() })
      .eq("id", visita.id)
      .is("visited_at", null);
    if (error) return NextResponse.json({ error: "save" }, { status: 500 });

    return NextResponse.json({ ok: true, ya: false, maison: maison.name });
  } catch (err) {
    console.error("check-in error:", err);
    return NextResponse.json({ error: "save" }, { status: 500 });
  }
}
