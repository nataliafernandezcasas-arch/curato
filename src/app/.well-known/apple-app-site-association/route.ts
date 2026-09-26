import { NextResponse } from "next/server";

/**
 * El archivo que hace que un enlace de Curato abra la app y no el navegador.
 *
 * Va como ruta y no como archivo en /public porque Apple exige que se sirva
 * como application/json y sin extensión, y un archivo sin extensión en /public
 * sale con el tipo equivocado. Apple lo pide por HTTPS, sin redirecciones.
 *
 * Con esto, el enlace del correo de restablecer contraseña vuelve a la app con
 * su sesión dentro, que es donde estaba roto: se abría en Safari y la sesión se
 * quedaba fuera.
 */
const TEAM_ID = "P76GMA4YCZ";
const BUNDLE_ID = "com.curatocollective.app";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appID: `${TEAM_ID}.${BUNDLE_ID}`,
            // Lo que pertenece a un miembro. La web pública (candidatura,
            // storytellers, faq) se queda en el navegador a propósito: es lo
            // que se comparte con quien todavía no tiene la app.
            paths: ["/auth/*", "/dashboard/*", "/onboarding/*", "/v/*"],
          },
        ],
      },
    },
    { headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" } }
  );
}
