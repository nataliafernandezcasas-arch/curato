import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildIcs, eventoDeVisita } from "@/lib/calendar";
import { firmaValida, type LadoCalendario } from "@/lib/calendar-enlaces";

/**
 * El archivo .ics de una visita, para el calendario de Apple.
 *
 * Se abre en Safari, sin la sesión de la app: lo que da acceso es la firma del
 * enlace (src/lib/calendar-enlaces.ts), no un usuario. Solo para visitas
 * confirmadas o hechas: una demanda pendiente todavía no es una cita.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const id = sp.get("r") ?? "";
  const lado = sp.get("p") as LadoCalendario | null;
  const firma = sp.get("f") ?? "";
  if (!id || (lado !== "storyteller" && lado !== "maison") || !firmaValida(id, lado, firma)) {
    return NextResponse.json({ error: "link" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: r } = await admin
    .from("reservations")
    .select("id, venue_id, creator_id, slot_start, nights, party_size, status")
    .eq("id", id)
    .maybeSingle();
  if (!r || (r.status !== "confirmed" && r.status !== "completed")) {
    return NextResponse.json({ error: "link" }, { status: 404 });
  }
  const [{ data: casa }, { data: creador }] = await Promise.all([
    admin.from("comercios").select("name, address").eq("id", r.venue_id).maybeSingle(),
    admin.from("creators").select("full_name, handle").eq("id", r.creator_id).maybeSingle(),
  ]);

  const evento = eventoDeVisita({
    lado,
    maison: (casa?.name as string | undefined) ?? "Curato",
    address: (casa?.address as string | null) ?? null,
    storyteller: (creador?.full_name as string | null) || (creador?.handle as string | null) || "Storyteller",
    handle: (creador?.handle as string | null) ?? null,
    slotStart: r.slot_start as string,
    nights: (r.nights as number | null) ?? null,
    partySize: (r.party_size as number | null) ?? 1,
  });
  // El mismo UID que el adjunto del correo de confirmación, del lado del
  // storyteller: si añade los dos, el calendario no la duplica.
  const uid = lado === "storyteller" ? `curato-${id}@curatocollective.com` : `curato-${id}-maison@curatocollective.com`;

  return new NextResponse(buildIcs(evento, uid), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="curato-visite.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
