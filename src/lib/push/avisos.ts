import { createAdminClient } from "@/lib/supabase/admin";
import { enviarAPNs, type Aviso } from "./apns";

/**
 * Los cuatro avisos, y ninguno más.
 *
 * El diseño es explícito: visita confirmada, visita rechazada, quedan seis
 * horas para publicar y, para la casa, nueva demanda. Cada uno abre su pantalla
 * y ahí muere. No hay bandeja de entrada: lo pendiente ya vive en À faire y en
 * Demandes, y una bandeja sería un segundo sitio con la misma información.
 *
 * El texto dice la cosa, no la app: "Maison Marceau vous attend jeudi à 19:30",
 * nunca "Vous avez une nouvelle notification".
 */

const VISITAS = "/dashboard/storyteller/visits";
const CARNET = "/dashboard/storyteller";
const DEMANDES = "/dashboard/business";

const PALABRAS = ["aucune", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];

export const AVISOS = {
  visitaConfirmada: (maison: string, cuando: string, id: string): Aviso => ({
    titulo: "Votre visite est confirmée",
    cuerpo: `${maison} vous attend ${cuando}.`,
    ruta: VISITAS,
    agrupar: `visite-${id}`,
  }),

  // El más delicado: un no que no debe sonar a expulsión. Dice el motivo real y
  // lo que no se ha perdido, como el correo.
  visitaRechazada: (maison: string, cuando: string, id: string): Aviso => ({
    titulo: "Ce soir-là, c'est complet",
    cuerpo: `${maison} ne peut pas vous recevoir ${cuando}. Votre crédit est intact.`,
    ruta: CARNET,
    agrupar: `visite-${id}`,
  }),

  seisHoras: (maison: string, horas: number, id: string): Aviso => ({
    titulo: `Il vous reste ${PALABRAS[horas] ?? horas} heure${horas > 1 ? "s" : ""}`,
    cuerpo: `Vos deux stories de ${maison} ne sont pas encore dans l'application.`,
    ruta: VISITAS,
    agrupar: `stories-${id}`,
  }),

  nuevaDemanda: (storyteller: string, cuando: string, id: string): Aviso => ({
    titulo: "Une nouvelle demande",
    cuerpo: `${storyteller} demande une table ${cuando}.`,
    ruta: DEMANDES,
    agrupar: `demande-${id}`,
  }),
};

/** A quién va: su cuenta, su correo, o lo que haya de los dos. */
export type Destinatario = { ownerId?: string | null; email?: string | null };

// El mismo razonamiento que src/lib/identidad.ts, con la columna de esta tabla:
// el correo va entre comillas para que una coma dentro no parta el filtro.
function filtro(destino: Destinatario): string | null {
  const correo = (destino.email || "").trim().toLowerCase().replace(/["\\]/g, "");
  const partes: string[] = [];
  if (destino.ownerId) partes.push(`user_id.eq.${destino.ownerId}`);
  if (correo) partes.push(`email.eq."${correo}"`);
  return partes.length ? partes.join(",") : null;
}

/**
 * Manda un aviso a todos los aparatos de alguien.
 *
 * No lanza nunca y no se espera a que termine para responder a quien pulsó el
 * botón: una visita confirmada lo está aunque el teléfono esté apagado. Si la
 * migración 038 no está aplicada todavía, se queda en el registro y sigue.
 */
export async function avisar(destino: Destinatario, aviso: Aviso): Promise<void> {
  try {
    const donde = filtro(destino);
    if (!donde) return;

    const admin = createAdminClient();
    const { data, error } = await admin.from("device_tokens").select("token").or(donde);
    if (error) {
      console.error("[curato] no se pudieron leer los aparatos:", error.message);
      return;
    }

    const tokens = (data ?? []).map((f) => f.token as string);
    const muertos = await enviarAPNs(tokens, aviso);
    if (muertos.length) await admin.from("device_tokens").delete().in("token", muertos);
  } catch (err) {
    console.error("[curato] aviso no enviado:", err);
  }
}
