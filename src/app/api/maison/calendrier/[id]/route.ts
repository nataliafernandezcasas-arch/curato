import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";
import { buildDossiers } from "@/lib/storyteller-dossier";
import { visitaDeHoy } from "@/lib/check-in";
import { puedeMarcarNoShow } from "@/lib/asistencia";
import { eventoDeVisita, googleCalendarUrl } from "@/lib/calendar";
import { enlaceIcs } from "@/lib/calendar-enlaces";

/**
 * Una visita del calendario de la casa: los datos de la visita, el perfil
 * entero de quien viene y si hoy toca escanear su código.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
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

    // Solo una visita de esta casa, y confirmada o hecha: una demanda pendiente
    // vive en Demandes.
    const { data: r } = await admin
      .from("reservations")
      .select("id, creator_id, slot_start, slot_end, nights, party_size, status, visited_at, special_requests")
      .eq("id", id)
      .eq("venue_id", maison.id)
      .in("status", ["confirmed", "completed", "no_show"])
      .maybeSingle();
    if (!r) return NextResponse.json({ error: "visita" }, { status: 404 });

    const dossier = (await buildDossiers(admin, [r.creator_id])).get(r.creator_id) ?? null;
    const nombre = dossier?.name || (dossier?.handle ? `@${dossier.handle}` : "Storyteller");
    const partySize = (r.party_size as number | null) ?? 1;

    return NextResponse.json({
      visita: {
        id: r.id,
        storyteller: nombre,
        slotStart: r.slot_start,
        nights: r.nights ?? null,
        partySize,
        note: r.special_requests ?? null,
        arrived: Boolean(r.visited_at),
        // La casa dijo que no vino, o puede decirlo ya (src/lib/asistencia.ts).
        noShow: r.status === "no_show",
        canNoShow: puedeMarcarNoShow(r),
        // Hoy es el día de la visita (o una de sus noches): se puede escanear.
        today: Boolean(visitaDeHoy([r])),
        calendar: {
          google: googleCalendarUrl(
            eventoDeVisita({
              lado: "maison",
              maison: maison.name as string,
              address: (maison.address as string | null) ?? null,
              storyteller: nombre,
              handle: dossier?.handle ?? null,
              slotStart: r.slot_start as string,
              nights: (r.nights as number | null) ?? null,
              partySize,
            })
          ),
          ics: enlaceIcs(r.id as string, "maison"),
        },
      },
      dossier,
    });
  } catch (err) {
    console.error("maison visita error:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
