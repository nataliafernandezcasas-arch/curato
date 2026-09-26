/**
 * El filtro que identifica a quien ha entrado, por su cuenta o por su correo.
 *
 * Se construía interpolando el correo dentro de un `.or()` de PostgREST, que
 * usa la coma como separador y los paréntesis como agrupación: un correo con
 * una coma en la parte local cambia el filtro y puede hacerle devolver filas de
 * otra persona. El correo lo elige quien se registra, así que no es dato de
 * fiar. Entre comillas dobles, PostgREST lo trata como un valor y no como
 * sintaxis.
 */
export function filtroDeUsuario(user: { id: string; email?: string | null }): string {
  const correo = (user.email || "").trim().toLowerCase().replace(/["\\]/g, "");
  return correo ? `owner_id.eq.${user.id},email.eq."${correo}"` : `owner_id.eq.${user.id}`;
}

/** La misma cosa cuando el id y el correo llegan sueltos. */
export function filtroDe(id: string, email?: string | null): string {
  return filtroDeUsuario({ id, email });
}
