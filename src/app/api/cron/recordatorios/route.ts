import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAvisoStoriesManquantes, sendRecordatorioSeisHoras } from "@/lib/emails";
import { OLVIDO_H, PLAZO_H, AVISO_ANTES_H, esCorreoDePrueba, horasQueQuedan, queToca } from "@/lib/recordatorios";

// Donde llega el aviso de las stories que no llegaron.
const BUZON_CURATO = "hello@curatocollective.com";

function cuando(d: Date) {
  return d.toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

/**
 * La tarea de cada hora (la llama .github/workflows/recordatorios.yml).
 *
 * Revisa las visitas confirmadas que siguen sin stories. Que una reserva siga
 * en "confirmed" pasada la hora es la señal: cuando el storyteller sube sus
 * stories en Mes visites, pasa a "completed".
 *
 *   · Entre las 18 y las 24 horas: recordatorio al storyteller, una vez.
 *   · Entre las 24 y las 72: aviso a Curato, una vez, en un solo correo.
 *
 * Cada aviso se reclama en la base antes de enviarse (update con la columna a
 * NULL), así que aunque la tarea corra dos veces a la vez nadie recibe dos.
 */
export async function GET(request: NextRequest) {
  // Sin espacios ni saltos de línea en ninguno de los dos lados: al pegar una
  // clave en un panel es fácil que se cuele un salto al final.
  const secreto = process.env.CRON_SECRET?.replace(/\s+/g, "");
  if (!secreto) return NextResponse.json({ error: "CRON_SECRET no configurado." }, { status: 500 });
  const recibida = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").replace(/\s+/g, "");
  if (recibida !== secreto) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const ahora = new Date();
  const desde = new Date(ahora.getTime() - OLVIDO_H * 3600000).toISOString();
  const hasta = new Date(ahora.getTime() - (PLAZO_H - AVISO_ANTES_H) * 3600000).toISOString();

  const { data: visitas, error } = await admin
    .from("reservations")
    .select("id, creator_id, venue_id, slot_start, recordatorio_6h_at, aviso_plazo_at")
    .eq("status", "confirmed")
    .gte("slot_start", desde)
    .lte("slot_start", hasta);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filas = visitas ?? [];
  const creatorIds = [...new Set(filas.map((v) => v.creator_id))];
  const venueIds = [...new Set(filas.map((v) => v.venue_id))];
  const [{ data: creators }, { data: casas }] = await Promise.all([
    creatorIds.length
      ? admin.from("creators").select("id, full_name, handle, email, is_test").in("id", creatorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; handle: string | null; email: string | null; is_test: boolean | null }[] }),
    venueIds.length
      ? admin.from("comercios").select("id, name").in("id", venueIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const creatorPorId = new Map((creators ?? []).map((c) => [c.id, c]));
  const casaPorId = new Map((casas ?? []).map((c) => [c.id, c]));

  let recordatorios = 0;
  const vencidas: { storyteller: string; maison: string; whenLabel: string }[] = [];

  for (const v of filas) {
    const toca = queToca(v, ahora);
    if (!toca) continue;
    const creador = creatorPorId.get(v.creator_id);
    const maison = casaPorId.get(v.venue_id)?.name ?? "la maison";
    const whenLabel = cuando(new Date(v.slot_start));

    if (toca === "recordatorio") {
      // Las cuentas de prueba no reciben correos, pero la visita se marca
      // igual: si no, se revisaría cada hora.
      const { data: reclamada } = await admin
        .from("reservations")
        .update({ recordatorio_6h_at: ahora.toISOString() })
        .eq("id", v.id)
        .is("recordatorio_6h_at", null)
        .select("id")
        .maybeSingle();
      if (!reclamada || !creador || creador.is_test || esCorreoDePrueba(creador.email)) continue;
      try {
        await sendRecordatorioSeisHoras({
          to: creador.email as string,
          firstName: (creador.full_name || "").split(" ")[0],
          maisonName: maison,
          whenLabel,
          horas: horasQueQuedan(v.slot_start, ahora),
        });
        recordatorios++;
      } catch (err) {
        // Si el correo falla, se deja la marca: mejor un recordatorio perdido
        // que dos.
        console.error("Recordatorio 6h falló:", err);
      }
      continue;
    }

    const { data: reclamada } = await admin
      .from("reservations")
      .update({ aviso_plazo_at: ahora.toISOString() })
      .eq("id", v.id)
      .is("aviso_plazo_at", null)
      .select("id")
      .maybeSingle();
    if (!reclamada || creador?.is_test) continue;
    vencidas.push({
      storyteller: creador?.full_name || (creador?.handle ? `@${creador.handle}` : "Un storyteller"),
      maison,
      whenLabel,
    });
  }

  if (vencidas.length > 0) {
    try {
      await sendAvisoStoriesManquantes({ to: BUZON_CURATO, visitas: vencidas });
    } catch (err) {
      console.error("Aviso de stories manquantes falló:", err);
    }
  }

  return NextResponse.json({ revisadas: filas.length, recordatorios, vencidas: vencidas.length });
}
