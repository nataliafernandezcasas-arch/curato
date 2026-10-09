import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";
import { retratoDeCada } from "@/lib/creator-portrait";
import { eventoDeVisita, googleCalendarUrl } from "@/lib/calendar";
import { enlaceIcs } from "@/lib/calendar-enlaces";
import { NO_SHOW_HASTA_H, puedeMarcarNoShow } from "@/lib/asistencia";

// Lo que enseña el calendario: desde hoy hasta dentro de noventa días.
const DIAS_ADELANTE = 90;

/**
 * El calendario de la casa: las visitas confirmadas que vienen, con quién,
 * a qué hora y cuántos, y si ya se registró la llegada. Las demandes pendientes
 * no salen aquí: viven en Demandes hasta que la casa decide.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

    const admin = createAdminClient();
    const { data: maison } = await admin
      .from("comercios")
      .select("id, name, address")
      .or(filtroDeUsuario(user))
      .eq("stage", "activo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "maison" }, { status: 403 });

    // Desde el principio de hoy, para que la visita de esta mañana siga a la vista.
    // Tres días atrás: una visita pasada sin llegada registrada sigue a la
    // vista mientras la casa puede decir que no vino (src/lib/asistencia.ts).
    const desde = new Date(Date.now() - NO_SHOW_HASTA_H * 3600000);
    const hasta = new Date(Date.now() + DIAS_ADELANTE * 24 * 3600000);
    const { data: reservas } = await admin
      .from("reservations")
      .select("id, creator_id, slot_start, slot_end, nights, party_size, status, visited_at, special_requests")
      .eq("venue_id", maison.id)
      .in("status", ["confirmed", "completed"])
      .gte("slot_start", desde.toISOString())
      .lte("slot_start", hasta.toISOString())
      .order("slot_start", { ascending: true });

    // Lo de hace más de un día, solo si aún se puede marcar como no show.
    const ayer = Date.now() - 24 * 3600000;
    const filas = (reservas ?? []).filter(
      (r) => new Date(r.slot_start as string).getTime() >= ayer || puedeMarcarNoShow(r)
    );
    const ids = [...new Set(filas.map((r) => r.creator_id))];
    const { data: creadores } = ids.length
      ? await admin.from("creators").select("id, full_name, handle, portrait_urls").in("id", ids)
      : { data: [] as { id: string; full_name: string | null; handle: string | null; portrait_urls: string[] | null }[] };
    const porId = new Map((creadores ?? []).map((c) => [c.id, c]));
    const retratos = await retratoDeCada(admin, creadores ?? []);

    const visitas = filas.map((r) => {
      const c = porId.get(r.creator_id);
      const nombre = (c?.full_name as string | null) || (c?.handle ? `@${c.handle}` : "Storyteller");
      const partySize = (r.party_size as number | null) ?? 1;
      return {
        id: r.id as string,
        storyteller: nombre,
        handle: (c?.handle as string | null) ?? null,
        portrait: retratos.get(r.creator_id) ?? null,
        slotStart: r.slot_start as string,
        nights: (r.nights as number | null) ?? null,
        partySize,
        note: (r.special_requests as string | null) ?? null,
        arrived: Boolean(r.visited_at),
        calendar: {
          google: googleCalendarUrl(
            eventoDeVisita({
              lado: "maison",
              maison: maison.name as string,
              address: (maison.address as string | null) ?? null,
              storyteller: nombre,
              handle: (c?.handle as string | null) ?? null,
              slotStart: r.slot_start as string,
              nights: (r.nights as number | null) ?? null,
              partySize,
            })
          ),
          ics: enlaceIcs(r.id as string, "maison"),
        },
      };
    });

    return NextResponse.json({ visitas });
  } catch (err) {
    console.error("maison calendrier error:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
