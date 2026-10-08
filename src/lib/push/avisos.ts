import { createAdminClient } from "@/lib/supabase/admin";
import { enviarAPNs, type Aviso } from "./apns";

/**
 * Los seis avisos, y ninguno más (más el que solo cambia la cifra del icono).
 *
 * El diseño es explícito: visita confirmada, visita rechazada, quedan seis
 * horas para publicar y, para la casa, nueva demanda y el fin de su
 * exclusividad sobre unas fotos (siete días antes y el mismo día; migración
 * 041). Cada uno abre su pantalla
 * y ahí muere. No hay bandeja de entrada: lo pendiente ya vive en À faire y en
 * Demandes, y una bandeja sería un segundo sitio con la misma información.
 *
 * El texto dice la cosa, no la app: "Maison Marceau vous attend jeudi à 19:30",
 * nunca "Vous avez une nouvelle notification".
 */

const VISITAS = "/dashboard/storyteller/visits";
const CARNET = "/dashboard/storyteller";
const DEMANDES = "/dashboard/business";
const VISITEURS = "/dashboard/business?section=visitors";

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

  // Lleva la cifra de demandas por responder, que se ve en el icono de la app.
  nuevaDemanda: (storyteller: string, cuando: string, id: string, pendientes: number): Aviso => ({
    titulo: "Une nouvelle demande",
    cuerpo: `${storyteller} demande une table ${cuando}.`,
    ruta: DEMANDES,
    agrupar: `demande-${id}`,
    insignia: pendientes,
  }),

  // Sin texto: solo pone al día la cifra del icono cuando la casa contesta o
  // una demanda caduca. No suena ni aparece en la pantalla.
  insignia: (pendientes: number): Aviso => ({
    titulo: "",
    cuerpo: "",
    ruta: DEMANDES,
    insignia: pendientes,
  }),

  // Informan, no piden borrar: tras los 90 días la casa conserva una licencia
  // no exclusiva. Comparten grupo para que el del día del fin sustituya al de
  // los siete días en la pantalla.
  derechosSieteDias: (storyteller: string, fecha: string, id: string): Aviso => ({
    titulo: "Plus que sept jours d'exclusivité",
    cuerpo: `Votre exclusivité sur les photos de ${storyteller} se termine le ${fecha}.`,
    ruta: VISITEURS,
    agrupar: `droits-${id}`,
  }),

  derechosFin: (storyteller: string, id: string): Aviso => ({
    titulo: "L'exclusivité a pris fin",
    cuerpo: `Les photos de ${storyteller} restent utilisables sur vos canaux, sans exclusivité.`,
    ruta: VISITEURS,
    agrupar: `droits-${id}`,
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
