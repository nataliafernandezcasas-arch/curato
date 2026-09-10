// Maison availability helpers. Times are interpreted in Europe/Paris (the whole
// platform is Paris-based); slot_start is stored as an absolute ISO instant.

export type AvailWindow = { day: number; start: string; end: string }; // day = JS getDay() 0-6
export type BlockedDate = { date: string }; // "YYYY-MM-DD"

// Paris wall-clock parts of an absolute instant.
export function parisParts(iso: string | Date): { ymd: string; hm: string; dow: number } {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    ymd: `${get("year")}-${get("month")}-${get("day")}`,
    hm: `${get("hour")}:${get("minute")}`,
    dow: dowMap[get("weekday")] ?? 0,
  };
}

/**
 * El instante absoluto de una hora de París: "2026-10-22" y "19:30" dan el ISO
 * que se guarda en slot_start. Antes se construía con la hora local del
 * navegador, que solo acierta si quien reserva está en París.
 */
export function parisToIso(ymd: string, hm: string): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  const [h, mi] = hm.split(":").map(Number);
  const supuesto = Date.UTC(y, mo - 1, d, h, mi);
  // Qué hora marca París en ese instante: la diferencia es el desfase del día.
  const p = parisParts(new Date(supuesto));
  const [py, pmo, pd] = p.ymd.split("-").map(Number);
  const [ph, pmi] = p.hm.split(":").map(Number);
  const desfase = Date.UTC(py, pmo - 1, pd, ph, pmi) - supuesto;
  return new Date(supuesto - desfase).toISOString();
}

// Is this instant an open booking time for the maison? A maison with no
// configured availability is unconstrained (keeps old free-time booking working).
export function isOpenSlot(iso: string, availability: AvailWindow[], blocked: BlockedDate[]): boolean {
  if (!availability || availability.length === 0) return true;
  const { ymd, hm, dow } = parisParts(iso);
  if (blocked?.some((b) => b.date === ymd)) return false;
  return availability.some((w) => w.day === dow && w.start <= hm && hm < w.end);
}
