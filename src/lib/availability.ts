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

// Is this instant an open booking time for the maison? A maison with no
// configured availability is unconstrained (keeps old free-time booking working).
export function isOpenSlot(iso: string, availability: AvailWindow[], blocked: BlockedDate[]): boolean {
  if (!availability || availability.length === 0) return true;
  const { ymd, hm, dow } = parisParts(iso);
  if (blocked?.some((b) => b.date === ymd)) return false;
  return availability.some((w) => w.day === dow && w.start <= hm && hm < w.end);
}
