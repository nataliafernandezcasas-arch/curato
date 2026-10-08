import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nuevoCodigoDeVisita, visitaDeHoy } from "@/lib/check-in";
import { filtroDeUsuario } from "@/lib/identidad";

/**
 * El código de la visita de hoy, para que el storyteller lo enseñe en sala.
 *
 * Solo existe el día de la visita: antes no hace falta y después no tiene que
 * valer. Se genera la primera vez que se pide y luego es siempre el mismo, así
 * que la pantalla puede preguntar cada pocos segundos si la casa ya lo escaneó.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

    const reservaId = request.nextUrl.searchParams.get("reserva");
    if (!reservaId) return NextResponse.json({ error: "reserva" }, { status: 400 });

    const admin = createAdminClient();
    const { data: creator } = await admin
      .from("creators")
      .select("id")
      .or(filtroDeUsuario(user))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!creator) return NextResponse.json({ error: "creator" }, { status: 403 });

    // Solo una reserva propia: el id llega del navegador.
    const { data: reserva } = await admin
      .from("reservations")
      .select("id, venue_id, slot_start, slot_end, status, visited_at, visit_code")
      .eq("id", reservaId)
      .eq("creator_id", creator.id)
      .maybeSingle();
    if (!reserva) return NextResponse.json({ error: "reserva" }, { status: 404 });

    const { data: maison } = await admin.from("comercios").select("name").eq("id", reserva.venue_id).maybeSingle();
    const base = {
      maison: (maison?.name as string | undefined) ?? "",
      slotStart: reserva.slot_start as string,
      visitedAt: (reserva.visited_at as string | null) ?? null,
    };

    if (!visitaDeHoy([reserva])) return NextResponse.json({ ...base, error: "dia" }, { status: 409 });

    let codigo = reserva.visit_code as string | null;
    // Dos pestañas abiertas a la vez pueden pedirlo juntas: solo se escribe si
    // sigue vacío, y si otra ganó se relee el suyo. Un choque con el código de
    // otra visita es casi imposible, pero se reintenta igual.
    for (let intento = 0; !codigo && intento < 6; intento++) {
      const { data: escrito, error } = await admin
        .from("reservations")
        .update({ visit_code: nuevoCodigoDeVisita() })
        .eq("id", reserva.id)
        .is("visit_code", null)
        .select("visit_code")
        .maybeSingle();
      if (escrito?.visit_code) codigo = escrito.visit_code as string;
      else if (!error) {
        const { data: releida } = await admin.from("reservations").select("visit_code").eq("id", reserva.id).maybeSingle();
        codigo = (releida?.visit_code as string | null) ?? null;
      }
    }
    if (!codigo) return NextResponse.json({ error: "save" }, { status: 500 });

    return NextResponse.json({ ...base, code: codigo });
  } catch (err) {
    console.error("visit code error:", err);
    return NextResponse.json({ error: "save" }, { status: 500 });
  }
}
