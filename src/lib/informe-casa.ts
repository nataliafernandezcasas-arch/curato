// Las cifras del informe de una casa. Lógica pura: la ruta del informe solo
// suma y pregunta aquí.

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
