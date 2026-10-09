import { createHmac, timingSafeEqual } from "crypto";
import QRCode from "qr.js/lib/QRCode";
import ErrorCorrectLevel from "qr.js/lib/ErrorCorrectLevel";
import type { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";
import { nuevoCodigoDeVisita } from "@/lib/check-in";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * El código de una visita, creándolo si aún no tiene. Dos peticiones a la vez
 * pueden pedirlo juntas: solo se escribe si sigue vacío, y si otra ganó se
 * relee el suyo. Un choque con el código de otra visita es casi imposible,
 * pero se reintenta igual.
 */
export async function asegurarCodigo(admin: Admin, reservaId: string, actual: string | null): Promise<string | null> {
  let codigo = actual;
  for (let intento = 0; !codigo && intento < 6; intento++) {
    const { data: escrito, error } = await admin
      .from("reservations")
      .update({ visit_code: nuevoCodigoDeVisita() })
      .eq("id", reservaId)
      .is("visit_code", null)
      .select("visit_code")
      .maybeSingle();
    if (escrito?.visit_code) codigo = escrito.visit_code as string;
    else if (!error) {
      const { data: releida } = await admin.from("reservations").select("visit_code").eq("id", reservaId).maybeSingle();
      codigo = (releida?.visit_code as string | null) ?? null;
    }
  }
  return codigo;
}

// La imagen del código que va en el correo: el correo no tiene sesión, así que
// el enlace lleva una firma que vale solo para esa visita.
function secreto(): string {
  return process.env.CALENDAR_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function firmaTarjeta(reservaId: string): string {
  return createHmac("sha256", secreto()).update(`${reservaId}:tarjeta-qr`).digest("hex").slice(0, 32);
}

export function tarjetaValida(reservaId: string, firma: string): boolean {
  if (!secreto()) return false;
  const esperada = Buffer.from(firmaTarjeta(reservaId));
  const recibida = Buffer.from(firma);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

export function enlaceTarjeta(reservaId: string): string {
  const q = new URLSearchParams({ r: reservaId, f: firmaTarjeta(reservaId) });
  return `${SITE_URL}/api/visite/tarjeta?${q.toString()}`;
}

/** Los módulos del QR (true = oscuro), con el mismo nivel que la pantalla. */
export function matrizQR(texto: string): boolean[][] {
  const qr = new QRCode(-1, ErrorCorrectLevel.L);
  qr.addData(texto);
  qr.make();
  return qr.modules;
}
