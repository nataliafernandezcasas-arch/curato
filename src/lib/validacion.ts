// Cuándo una visita está entregada: al menos dos stories subidas y, de cada
// una, las tres cifras de Instagram (vues, comptes atteints, interactions).
// Hasta entonces la visita no queda validada y el storyteller no puede pedir
// otra (src/app/api/reservations/request). Así las cifras llegan siempre.

export type CifrasStory = { path: string; views: number | null; accounts: number | null; interactions: number | null };

/** Desde aquí se exige: las visitas de antes no traían cifras por story. */
export const VALIDACION_DESDE = "2026-10-01T00:00:00Z";
export const MIN_STORIES = 2;

const completa = (c: CifrasStory | undefined) =>
  Boolean(c) && [c!.views, c!.accounts, c!.interactions].every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0);

/** Cada story subida tiene sus tres cifras. */
export function porteeCompleta(paths: string[], cifras: CifrasStory[] | null | undefined): boolean {
  if (paths.length < MIN_STORIES) return false;
  const porRuta = new Map((cifras ?? []).map((c) => [c.path, c]));
  return paths.every((p) => completa(porRuta.get(p)));
}

/**
 * ¿Esta visita deja al storyteller sin poder reservar? Sí si ya llegó su hora,
 * la casa la aceptó (o ya está hecha) y le faltan stories o cifras. Una
 * cancelada, rechazada o no show no bloquea: no hay nada que entregar.
 */
export function bloqueaReservas(
  r: { status: string; slot_start: string; content_photo_paths: string[] | null; reach_stories: CifrasStory[] | null },
  ahora: Date = new Date()
): boolean {
  if (r.status !== "confirmed" && r.status !== "completed") return false;
  if (new Date(r.slot_start).getTime() > ahora.getTime()) return false;
  if (r.slot_start < VALIDACION_DESDE) return false;
  return !porteeCompleta(r.content_photo_paths ?? [], r.reach_stories);
}

/** Las cifras de una visita, sumadas, para el informe de la casa. */
export function sumarCifras(cifras: CifrasStory[]): { views: number; accounts: number; interactions: number } {
  return cifras.reduce(
    (t, c) => ({
      views: t.views + (c.views ?? 0),
      accounts: t.accounts + (c.accounts ?? 0),
      interactions: t.interactions + (c.interactions ?? 0),
    }),
    { views: 0, accounts: 0, interactions: 0 }
  );
}
