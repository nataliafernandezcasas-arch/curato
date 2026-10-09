import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAvisoDerechos, sendAvisoStoriesManquantes, sendRecordatorioSeisHoras } from "@/lib/emails";
import { avisar, AVISOS } from "@/lib/push/avisos";
import { OLVIDO_H, PLAZO_H, AVISO_ANTES_H, esCorreoDePrueba, horasQueQuedan, queToca } from "@/lib/recordatorios";
import { AVISO_ANTES_D, OLVIDO_D, queTocaDerechos } from "@/lib/derechos";
import { avisosAntesDeLaVisita } from "@/lib/avisos-antes";

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

// El día, sin hora: los derechos acaban un día, no a una hora concreta.
function dia(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
}

const DIA_MS = 24 * 3600000;

/**
 * Los avisos del fin de la exclusividad, a la casa: siete días antes y el día
 * del fin. Mismo reclamo que los de las stories: la columna se escribe antes
 * de enviar, así que nunca salen dos.
 */
async function avisosDeDerechos(admin: ReturnType<typeof createAdminClient>, ahora: Date): Promise<number> {
  const { data: reservas, error } = await admin
    .from("reservations")
    .select("id, creator_id, venue_id, content_photo_paths, content_rights_expires_at, aviso_derechos_7d_at, aviso_derechos_fin_at")
    .eq("status", "completed")
    .not("content_photo_paths", "is", null)
    .gte("content_rights_expires_at", new Date(ahora.getTime() - OLVIDO_D * DIA_MS).toISOString())
    .lte("content_rights_expires_at", new Date(ahora.getTime() + AVISO_ANTES_D * DIA_MS).toISOString())
    .or("aviso_derechos_7d_at.is.null,aviso_derechos_fin_at.is.null");
  // Si la migración 041 no está aplicada, los recordatorios de las stories
  // siguen saliendo: esto se queda en el registro.
  if (error) {
    console.error("Avisos de derechos: no se pudieron leer las reservas:", error.message);
    return 0;
  }

  // Sin fotos no hay derechos de los que avisar.
  const filas = (reservas ?? []).filter((r) => ((r.content_photo_paths as string[] | null) ?? []).length > 0);
  if (filas.length === 0) return 0;

  const creatorIds = [...new Set(filas.map((r) => r.creator_id))];
  const venueIds = [...new Set(filas.map((r) => r.venue_id))];
  const [{ data: creators }, { data: casas }] = await Promise.all([
    admin.from("creators").select("id, full_name, handle, is_test").in("id", creatorIds),
    admin.from("comercios").select("id, name, email, owner_id, is_test").in("id", venueIds),
  ]);
  const creatorPorId = new Map((creators ?? []).map((c) => [c.id, c]));
  const casaPorId = new Map((casas ?? []).map((c) => [c.id, c]));

  let enviados = 0;
  for (const r of filas) {
    const toca = queTocaDerechos(r, ahora);
    if (toca.saltarSieteDias) {
      // Vencida ya la exclusividad, "quedan siete días" sería falso: se marca
      // sin enviar para que no salga nunca.
      await admin
        .from("reservations")
        .update({ aviso_derechos_7d_at: ahora.toISOString() })
        .eq("id", r.id)
        .is("aviso_derechos_7d_at", null);
    }
    if (!toca.enviar) continue;

    const columna = toca.enviar === "7d" ? "aviso_derechos_7d_at" : "aviso_derechos_fin_at";
    const { data: reclamada } = await admin
      .from("reservations")
      .update({ [columna]: ahora.toISOString() })
      .eq("id", r.id)
      .is(columna, null)
      .select("id")
      .maybeSingle();
    const casa = casaPorId.get(r.venue_id);
    const creador = creatorPorId.get(r.creator_id);
    // Las cuentas de prueba se marcan igual y no reciben nada.
    if (!reclamada || !casa || casa.is_test || creador?.is_test) continue;

    const storyteller = creador?.full_name || (creador?.handle ? `@${creador.handle}` : "votre storyteller");
    const expiresLabel = dia(new Date(r.content_rights_expires_at as string));
    if (!esCorreoDePrueba(casa.email)) {
      try {
        await sendAvisoDerechos(casa.email as string, {
          maisonName: casa.name,
          storytellerName: storyteller,
          expiresLabel,
          fase: toca.enviar,
        });
        enviados++;
      } catch (err) {
        // Mejor un aviso perdido que dos: la marca se queda.
        console.error(`Aviso de derechos (${toca.enviar}) falló:`, err);
      }
    }
    await avisar(
      { ownerId: casa.owner_id ?? null, email: casa.email ?? null },
      toca.enviar === "7d" ? AVISOS.derechosSieteDias(storyteller, expiresLabel, r.id) : AVISOS.derechosFin(storyteller, r.id)
    );
  }
  return enviados;
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
 * Y a las casas, el fin de su exclusividad sobre las fotos de una visita:
 * siete días antes y el mismo día (src/lib/derechos.ts).
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
      ? admin.from("creators").select("id, full_name, handle, email, owner_id, is_test").in("id", creatorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; handle: string | null; email: string | null; owner_id: string | null; is_test: boolean | null }[] }),
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
      await avisar(
        { ownerId: creador.owner_id ?? null, email: creador.email },
        AVISOS.seisHoras(maison, horasQueQuedan(v.slot_start, ahora), v.id)
      );
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

  const derechos = await avisosDeDerechos(admin, ahora);
  // Antes de la visita: confirmar que se va y el código QR (src/lib/avisos-antes.ts).
  const antes = await avisosAntesDeLaVisita(admin, ahora);

  return NextResponse.json({ revisadas: filas.length, recordatorios, vencidas: vencidas.length, derechos, antes });
}
