// Las ventanas de los avisos de las stories. Lógica pura: la ruta de la tarea
// horaria solo pregunta aquí qué toca con cada visita.
//
// El plazo cuenta desde la hora reservada, igual que la cuenta atrás de
// Mes visites: 24 horas para publicar las dos stories y subirlas a la app.

const HORA = 60 * 60 * 1000;

export const PLAZO_H = 24;
/** El recordatorio sale cuando quedan estas horas. */
export const AVISO_ANTES_H = 6;
/** Pasado esto ya no se avisa a Curato: es historia, no seguimiento. */
export const OLVIDO_H = 72;

export type QueToca = "recordatorio" | "vencida" | null;

/**
 * Qué hacer con una visita confirmada que sigue sin stories.
 *
 *   · entre las 18 y las 24 horas tras la hora reservada: recordárselo al
 *     storyteller, una vez;
 *   · entre las 24 y las 72: avisar a Curato de que el plazo venció, una vez.
 */
export function queToca(
  r: { slot_start: string; recordatorio_6h_at: string | null; aviso_plazo_at: string | null },
  ahora: Date = new Date()
): QueToca {
  const pasadas = (ahora.getTime() - new Date(r.slot_start).getTime()) / HORA;
  if (pasadas >= PLAZO_H - AVISO_ANTES_H && pasadas < PLAZO_H) return r.recordatorio_6h_at ? null : "recordatorio";
  if (pasadas >= PLAZO_H && pasadas < OLVIDO_H) return r.aviso_plazo_at ? null : "vencida";
  return null;
}

/** Las horas que quedan del plazo, redondeadas hacia arriba, para el asunto. */
export function horasQueQuedan(slotStart: string, ahora: Date = new Date()): number {
  return Math.max(0, Math.ceil((new Date(slotStart).getTime() + PLAZO_H * HORA - ahora.getTime()) / HORA));
}

/** Direcciones de cuentas de prueba: no se les escribe. */
export function esCorreoDePrueba(email: string | null | undefined): boolean {
  return !email || /@[^@]+\.test$/i.test(email.trim());
}
