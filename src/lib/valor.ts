// Lo que una casa obtiene de Curato, en euros y en porcentajes. Lógica pura:
// la ruta del informe solo suma y pregunta aquí.

/** La suscripción mensual de una casa, IVA incluido (src/lib/i18n/commitment.ts). */
export const ABONO_MENSUAL = 299;

/**
 * Lo que costaría en publicidad mil vistas de stories de Instagram dirigidas a
 * París. Es una referencia para estimar, no una tarifa: el informe lo dice
 * como «équivalent publicitaire estimé». Si cambia, cambia aquí.
 */
export const CPM_REFERENCIA = 12;

/** El equivalente publicitario de unas vistas, en euros redondos. */
export function valorPublicitario(vistas: number, cpm = CPM_REFERENCIA): number {
  return Math.round((Math.max(0, vistas) / 1000) * cpm);
}

/** Lo que el mes le costó a la casa: la suscripción y lo que ofreció en su carta. */
export function costeDelMes(ofrecido: number, abono = ABONO_MENSUAL): number {
  return abono + Math.max(0, ofrecido);
}

/** Cuánto le costó cada visita; null si no hubo ninguna. */
export function costePorVisita(coste: number, visitas: number): number | null {
  return visitas > 0 ? Math.round(coste / visitas) : null;
}

/** Cuánto le costaron mil vistas; null sin vistas. */
export function costePorMilVistas(coste: number, vistas: number): number | null {
  return vistas > 0 ? Math.round((coste / vistas) * 1000 * 10) / 10 : null;
}

/** Interacciones sobre cuentas alcanzadas, en %; null si falta un dato. */
export function tasaDeInteraccion(interacciones: number | null, cuentas: number | null): number | null {
  if (interacciones == null || !cuentas) return null;
  return Math.round((interacciones / cuentas) * 1000) / 10;
}

/** "2026-10" de un instante, en la hora de París. */
export function mesDe(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }).slice(0, 7);
}

/** Los últimos `n` meses hasta `mes` incluido, del más antiguo al más reciente. */
export function mesesHasta(mes: string, n: number): string[] {
  const [a, m] = mes.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(a, m - 1 - (n - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}
