import type { SupabaseClient } from "@supabase/supabase-js";
import { filtroDeUsuario } from "@/lib/identidad";

/**
 * El filtro de `comercios` que encuentra la casa de quien ha entrado: la suya
 * (por su cuenta o su correo, como siempre) o aquella en cuyo equipo está
 * (migración 055). Para usarlo en `.or(...)` sobre `comercios`.
 *
 * Tolerante: sin la tabla del equipo, queda el filtro de siempre.
 */
export async function filtroDeCasa(
  admin: SupabaseClient,
  user: { id: string; email?: string | null }
): Promise<string> {
  const propio = filtroDeUsuario(user);
  const casas = await casasDelEquipo(admin, user);
  return casas.length ? `${propio},id.in.(${casas.join(",")})` : propio;
}

/** Las casas en cuyo equipo está esta cuenta. */
export async function casasDelEquipo(
  admin: SupabaseClient,
  user: { id: string; email?: string | null }
): Promise<string[]> {
  const correo = (user.email || "").trim().toLowerCase().replace(/["\\]/g, "");
  const filtro = correo ? `user_id.eq.${user.id},email.eq."${correo}"` : `user_id.eq.${user.id}`;
  const { data, error } = await admin.from("maison_equipo").select("comercio_id").or(filtro);
  if (error || !data) return [];
  return [...new Set(data.map((f) => f.comercio_id as string))].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
}
