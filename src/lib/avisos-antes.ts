import type { createAdminClient } from "@/lib/supabase/admin";
import { avisosQueTocan, PEDIR_H, type AvisoAntes, type ReservaAntes } from "@/lib/asistencia";
import { avisar, AVISOS } from "@/lib/push/avisos";
import { sendCodeDeVisite, sendConfirmerVenue } from "@/lib/emails";
import { esCorreoDePrueba } from "@/lib/recordatorios";
import { asegurarCodigo, enlaceTarjeta } from "@/lib/codigo-visita";
import { mostrarCodigo } from "@/lib/check-in";

type Admin = ReturnType<typeof createAdminClient>;

const COLUMNA: Record<AvisoAntes, keyof ReservaAntes> = {
  pedir: "aviso_confirmar_at",
  recordar: "recordatorio_confirmar_at",
  correoQR: "correo_qr_at",
  avisoQR: "aviso_qr_at",
};

const cuando = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });

/**
 * Los avisos de antes de la visita (migración 046), en cada pasada de la tarea:
 * pedir que confirme (24 h antes), recordarlo (6 h antes), el correo con el
 * código (1 h antes) y el aviso con el código (15 min antes).
 *
 * Cada aviso se reclama en la base antes de enviarse (la columna a NULL), así
 * que aunque la tarea corra dos veces a la vez nadie recibe dos. Las cuentas
 * de prueba reciben los avisos del teléfono, para poder probarlos, pero no
 * correos. Sin la migración, no hace nada.
 */
export async function avisosAntesDeLaVisita(admin: Admin, ahora: Date = new Date()): Promise<Record<AvisoAntes, number>> {
  const cuenta: Record<AvisoAntes, number> = { pedir: 0, recordar: 0, correoQR: 0, avisoQR: 0 };
  const desde = new Date(ahora.getTime() - 30 * 60 * 1000).toISOString();
  const hasta = new Date(ahora.getTime() + (PEDIR_H + 1) * 3600 * 1000).toISOString();

  const { data, error } = await admin
    .from("reservations")
    .select(
      "id, creator_id, venue_id, slot_start, status, created_at, visit_code, asistencia_confirmada_at, aviso_confirmar_at, recordatorio_confirmar_at, correo_qr_at, aviso_qr_at"
    )
    .eq("status", "confirmed")
    .gte("slot_start", desde)
    .lte("slot_start", hasta);
  if (error) {
    console.info("[curato] avisos de antes de la visita sin migración 046:", error.message);
    return cuenta;
  }

  const filas = (data ?? []).map((r) => ({ ...(r as unknown as ReservaAntes), raw: r }));
  const conAvisos = filas.map((r) => ({ r, toca: avisosQueTocan(r, ahora) })).filter((x) => x.toca.length > 0);
  if (conAvisos.length === 0) return cuenta;

  const creatorIds = [...new Set(conAvisos.map((x) => x.r.raw.creator_id as string))];
  const venueIds = [...new Set(conAvisos.map((x) => x.r.raw.venue_id as string))];
  const [{ data: creators }, { data: casas }] = await Promise.all([
    admin.from("creators").select("id, full_name, email, owner_id, is_test").in("id", creatorIds),
    admin.from("comercios").select("id, name, address").in("id", venueIds),
  ]);
  const creadorDe = new Map((creators ?? []).map((c) => [c.id as string, c]));
  const casaDe = new Map((casas ?? []).map((c) => [c.id as string, c]));

  for (const { r, toca } of conAvisos) {
    const id = r.raw.id as string;
    const creador = creadorDe.get(r.raw.creator_id as string);
    if (!creador) continue;
    const casa = casaDe.get(r.raw.venue_id as string);
    const maison = (casa?.name as string | undefined) ?? "la maison";
    const whenLabel = cuando(r.slot_start);
    const destino = { ownerId: (creador.owner_id as string | null) ?? null, email: (creador.email as string | null) ?? null };
    const conCorreo = !creador.is_test && !esCorreoDePrueba(creador.email as string | null);
    const firstName = ((creador.full_name as string | null) || "").split(" ")[0];

    for (const aviso of toca) {
      const columna = COLUMNA[aviso];
      const { data: reclamada } = await admin
        .from("reservations")
        .update({ [columna]: ahora.toISOString() })
        .eq("id", id)
        .is(columna, null)
        .select("id")
        .maybeSingle();
      if (!reclamada) continue;
      cuenta[aviso]++;

      try {
        if (aviso === "pedir" || aviso === "recordar") {
          await avisar(
            destino,
            aviso === "pedir"
              ? AVISOS.confirmarAsistencia(maison, whenLabel, id)
              : AVISOS.recordarAsistencia(maison, whenLabel, id)
          );
          if (conCorreo) {
            await sendConfirmerVenue(creador.email as string, {
              firstName,
              maisonName: maison,
              whenLabel,
              reservaId: id,
              recordatorio: aviso === "recordar",
            });
          }
        } else if (aviso === "correoQR") {
          if (!conCorreo) continue;
          const codigo = await asegurarCodigo(admin, id, (r.raw.visit_code as string | null) ?? null);
          if (!codigo) continue;
          await sendCodeDeVisite(creador.email as string, {
            firstName,
            maisonName: maison,
            whenLabel,
            address: (casa?.address as string | null) ?? null,
            tarjetaUrl: enlaceTarjeta(id),
            codigo: mostrarCodigo(codigo),
            reservaId: id,
          });
        } else {
          await avisar(destino, AVISOS.codigoDeVisita(maison, id));
        }
      } catch (err) {
        // La marca se queda: mejor un aviso perdido que dos.
        console.error(`[curato] aviso «${aviso}» de ${id} no enviado:`, err);
      }
    }
  }
  return cuenta;
}
