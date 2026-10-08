import { parisParts, type BlockedDate } from "./availability";

/**
 * Cómo se reserva una casa (migración 044).
 *
 * - `horaires`: por horas. Restaurantes, spas y salones. Cada día puede tener
 *   varias franjas (un primer y un segundo servicio) y el storyteller elige su
 *   hora de llegada dentro de una, cada cuarto de hora.
 * - `dates`: por fechas. Hoteles. Sin horas: los días en que se puede llegar,
 *   cuántas noches como mínimo y como máximo, y las fechas cerradas.
 */
export type Modo = "horaires" | "dates";
export type Agenda = { modo: Modo; llegadas: number[]; minNoches: number; maxNoches: number };

export const HOTEL = "00000000-0000-0000-0000-0000000ca701";
// Cada cuánto se ofrece una hora de llegada dentro de una franja.
export const PASO_MINUTOS = 15;
export const MAX_NOCHES = 14;
const TODOS_LOS_DIAS = [0, 1, 2, 3, 4, 5, 6];

/** La agenda guardada, completada con lo de su categoría si falta algo. */
export function agendaDe(guardada: unknown, categoria: string | null): Agenda {
  const g = (guardada && typeof guardada === "object" ? guardada : {}) as Partial<Agenda>;
  const modo: Modo = g.modo === "dates" || g.modo === "horaires" ? g.modo : categoria === HOTEL ? "dates" : "horaires";
  const llegadas = Array.isArray(g.llegadas)
    ? [...new Set(g.llegadas.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort()
    : TODOS_LOS_DIAS;
  const minNoches = entero(g.minNoches, 1, MAX_NOCHES, 1);
  const maxNoches = Math.max(minNoches, entero(g.maxNoches, 1, MAX_NOCHES, 3));
  return { modo, llegadas, minNoches, maxNoches };
}

function entero(v: unknown, min: number, max: number, defecto: number): number {
  const n = Number(v);
  return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : defecto;
}

/** "2026-10-22" más n días, sin pasar por la zona horaria del aparato. */
export function sumarDias(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const f = new Date(Date.UTC(y, m - 1, d + n));
  return f.toISOString().slice(0, 10);
}

/**
 * Por qué no se puede llegar un día a un hotel, o null si se puede: el día de
 * la semana no admite llegadas, las noches no están entre el mínimo y el
 * máximo, o alguna de las noches de la estancia está cerrada.
 */
export function estanciaImposible(
  llegadaYmd: string,
  noches: number,
  agenda: Agenda,
  cerradas: BlockedDate[]
): "dia" | "noches" | "cerrada" | null {
  const dow = new Date(`${llegadaYmd}T12:00:00Z`).getUTCDay();
  if (!agenda.llegadas.includes(dow)) return "dia";
  if (!Number.isInteger(noches) || noches < agenda.minNoches || noches > agenda.maxNoches) return "noches";
  const cerrado = new Set((cerradas ?? []).map((b) => b.date));
  for (let i = 0; i < noches; i++) if (cerrado.has(sumarDias(llegadaYmd, i))) return "cerrada";
  return null;
}

/** La estancia de un hotel a partir del instante de llegada que se guarda. */
export function estanciaImposibleDesde(slotStart: string, noches: number, agenda: Agenda, cerradas: BlockedDate[]) {
  return estanciaImposible(parisParts(slotStart).ymd, noches, agenda, cerradas);
}
