import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * La sesión del admin.
 *
 * Antes la cookie guardaba literalmente la contraseña de admin: si se filtraba
 * la cookie se filtraba la contraseña, no había forma de revocar una sesión sin
 * cambiar la variable de entorno, y duraba treinta días.
 *
 * Ahora la cookie es una firma con caducidad: dice hasta cuándo vale y va
 * firmada con un secreto del servidor. No contiene nada que sirva para entrar
 * en otro sitio, y cambiar el secreto cierra todas las sesiones a la vez.
 *
 * El nombre de la cookie cambió a propósito: las sesiones viejas, que llevaban
 * la contraseña dentro, dejan de valer.
 */
export const ADMIN_COOKIE = "curato_admin";

const DURACION_SEGUNDOS = 60 * 60 * 24 * 7;

export function getAdminPass(): string | null {
  const v = process.env.ADMIN_PASS;
  return v && v.length > 0 ? v : null;
}

/** El secreto de firma. Si no hay uno propio, sirve la contraseña. */
function secreto(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASS;
  return s && s.length > 0 ? s : null;
}

function firmar(carga: string, clave: string): string {
  return createHmac("sha256", clave).update(carga).digest("base64url");
}

export function mismoTexto(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** El valor de la cookie para una sesión nueva, y cuánto vive. */
export function nuevaSesion(): { valor: string; maxAge: number } | null {
  const clave = secreto();
  if (!clave) return null;
  const caduca = Date.now() + DURACION_SEGUNDOS * 1000;
  const carga = String(caduca);
  return { valor: `${carga}.${firmar(carga, clave)}`, maxAge: DURACION_SEGUNDOS };
}

export async function isAdmin(): Promise<boolean> {
  const clave = secreto();
  if (!clave) return false;

  const c = await cookies();
  const cookie = c.get(ADMIN_COOKIE)?.value;
  if (!cookie) return false;

  const [carga, firma] = cookie.split(".");
  if (!carga || !firma) return false;
  if (!mismoTexto(firma, firmar(carga, clave))) return false;

  const caduca = Number(carga);
  return Number.isFinite(caduca) && caduca > Date.now();
}
