/**
 * La dirección de Curato, en un solo sitio.
 *
 * Siempre con www, y esto no es un detalle de gusto: la app de iOS reclama
 * `applinks:www.curatocollective.com`, y el dominio sin www responde una
 * redirección. Apple no sigue redirecciones cuando comprueba los enlaces de una
 * app, así que un enlace sin www se abre en Safari y deja la sesión fuera de la
 * app, que es exactamente el fallo del correo de restablecer la contraseña.
 *
 * Estaba escrito siete veces con dos valores distintos, unos con www y otros
 * sin. De ahí venía que unos correos abrieran la app y otros no.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.curatocollective.com";
