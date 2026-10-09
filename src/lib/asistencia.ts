// Antes de la visita: confirmar que se va, cancelar, y el código QR. Lógica
// pura; la tarea de cada diez minutos y las rutas solo preguntan aquí.

const MIN = 60 * 1000;
const HORA = 60 * MIN;

/** Reservar con más antelación que esto obliga a confirmar la asistencia. */
export const ANTELACION_H = 24;
/** Se pide confirmar a falta de estas horas, y se recuerda a falta de estas otras. */
export const PEDIR_H = 24;
export const RECORDAR_H = 6;
/** Cancelar con menos de estas horas hace perder el crédito. */
export const CANCELAR_GRATIS_H = 24;
/** El correo con el código sale una hora antes; el aviso, quince minutos antes. */
export const CORREO_QR_MIN = 60;
export const AVISO_QR_MIN = 15;

export type ReservaAntes = {
  status: string;
  slot_start: string;
  created_at: string;
  asistencia_confirmada_at: string | null;
  aviso_confirmar_at: string | null;
  recordatorio_confirmar_at: string | null;
  correo_qr_at: string | null;
  aviso_qr_at: string | null;
};

/** Se reservó con más de 24 h: hay que confirmar que se va. */
export function pideConfirmacion(r: Pick<ReservaAntes, "slot_start" | "created_at">): boolean {
  return new Date(r.slot_start).getTime() - new Date(r.created_at).getTime() > ANTELACION_H * HORA;
}

/** Ya no hace falta confirmar: no se pedía, o ya confirmó. */
export function asistenciaConfirmada(r: Pick<ReservaAntes, "slot_start" | "created_at" | "asistencia_confirmada_at">): boolean {
  return Boolean(r.asistencia_confirmada_at) || !pideConfirmacion(r);
}

export type AvisoAntes = "pedir" | "recordar" | "correoQR" | "avisoQR";

/**
 * Qué avisos tocan ahora para una visita confirmada. Cada uno sale una sola
 * vez (su columna) y solo dentro de su ventana: si la tarea se retrasa, el
 * aviso llega tarde, pero no después de la hora de la visita.
 */
export function avisosQueTocan(r: ReservaAntes, ahora: Date = new Date()): AvisoAntes[] {
  if (r.status !== "confirmed") return [];
  const falta = new Date(r.slot_start).getTime() - ahora.getTime();
  if (falta <= -30 * MIN) return [];
  const out: AvisoAntes[] = [];
  const confirmada = asistenciaConfirmada(r);
  if (!confirmada && falta > 0) {
    // Si la casa aceptó tarde y ya estamos dentro de las 6 h, basta con un aviso.
    if (falta <= RECORDAR_H * HORA) {
      const limite = new Date(r.slot_start).getTime() - RECORDAR_H * HORA;
      if (!r.aviso_confirmar_at) out.push("pedir");
      // Se recuerda solo si la petición salió antes de las 6 h: si salió ya
      // dentro, recordarla sería repetirla.
      else if (!r.recordatorio_confirmar_at && new Date(r.aviso_confirmar_at).getTime() < limite) out.push("recordar");
    } else if (falta <= PEDIR_H * HORA && !r.aviso_confirmar_at) {
      out.push("pedir");
    }
  }
  if (falta > 0 && falta <= CORREO_QR_MIN * MIN && !r.correo_qr_at) out.push("correoQR");
  if (falta <= AVISO_QR_MIN * MIN && !r.aviso_qr_at) out.push("avisoQR");
  return out;
}

/** Cancelar ahora, ¿hace perder el crédito? Solo una visita ya aceptada por la casa. */
export function cancelacionTardia(r: { status: string; slot_start: string }, ahora: Date = new Date()): boolean {
  return r.status === "confirmed" && new Date(r.slot_start).getTime() - ahora.getTime() < CANCELAR_GRATIS_H * HORA;
}
