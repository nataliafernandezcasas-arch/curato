import { createHmac, timingSafeEqual } from "crypto";
import { SITE_URL } from "@/lib/site";

// Los enlaces "Apple" de una visita. Se abren en Safari, fuera de la app y sin
// su sesión (la app manda a Safari lo que se abre en otra ventana), así que el
// enlace lleva una firma: vale solo para esa visita y ese lado, y no se puede
// adivinar cambiando el id.

export type LadoCalendario = "storyteller" | "maison";

function secreto(): string {
  return process.env.CALENDAR_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function firmaCalendario(reservaId: string, lado: LadoCalendario): string {
  return createHmac("sha256", secreto()).update(`${reservaId}:${lado}`).digest("hex").slice(0, 32);
}

export function firmaValida(reservaId: string, lado: LadoCalendario, firma: string): boolean {
  if (!secreto()) return false;
  const esperada = Buffer.from(firmaCalendario(reservaId, lado));
  const recibida = Buffer.from(firma);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

export function enlaceIcs(reservaId: string, lado: LadoCalendario): string {
  const q = new URLSearchParams({ r: reservaId, p: lado, f: firmaCalendario(reservaId, lado) });
  return `${SITE_URL}/api/calendario/ics?${q.toString()}`;
}
