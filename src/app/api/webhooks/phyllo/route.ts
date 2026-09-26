import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * El webhook de Phyllo.
 *
 * Antes no comprobaba nada: cualquiera que acertase un identificador podía
 * marcar una cuenta como conectada, porque la ruta escribe en `creators` con
 * permisos de administrador. Y devolvía 200 a todo, así que un fallo tampoco
 * se veía.
 *
 * Ahora exige el secreto compartido que se configura en el panel de Phyllo, y
 * si no hay secreto en el entorno la ruta queda cerrada. Cerrarla no rompe la
 * conexión de Instagram: quien conecta su cuenta desde la app llama a
 * /api/phyllo/sync-engagement, que es lo que de verdad guarda las cifras. Este
 * aviso solo adelanta la marca.
 */
function autorizado(request: NextRequest, cuerpo: string): boolean {
  const secreto = process.env.PHYLLO_WEBHOOK_SECRET;
  if (!secreto) return false;

  // Phyllo permite una cabecera propia; se aceptan las dos formas habituales,
  // el secreto tal cual o su HMAC del cuerpo.
  const enviado =
    request.headers.get("x-phyllo-secret") ??
    request.headers.get("x-webhook-secret") ??
    (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!enviado) return false;

  const iguales = (a: string, b: string) => {
    const x = Buffer.from(a);
    const y = Buffer.from(b);
    return x.length === y.length && timingSafeEqual(x, y);
  };
  if (iguales(enviado.trim(), secreto.trim())) return true;

  const firma = request.headers.get("x-phyllo-signature");
  if (firma) {
    const esperada = createHmac("sha256", secreto).update(cuerpo).digest("hex");
    return iguales(firma.trim().replace(/^sha256=/, ""), esperada);
  }
  return false;
}

export async function POST(request: NextRequest) {
  const cuerpo = await request.text();

  if (!autorizado(request, cuerpo)) {
    console.error("Phyllo webhook rechazado: firma o secreto inválidos");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { event, data } = JSON.parse(cuerpo) as {
      event?: string;
      data?: { user?: { id?: string } };
    };

    if (event === "ACCOUNTS.CONNECTED") {
      // OJO con el nombre de la columna: `phyllo_account_id` guarda el **user
      // id** de Phyllo, no el id de la cuenta. Lo usa así todo el código
      // (getPhylloAccounts lo manda como user_id, createSDKToken igual).
      const userId = data?.user?.id;
      if (userId) {
        const { error } = await createAdminClient()
          .from("creators")
          .update({ instagram_connected: true, phyllo_connected_at: new Date().toISOString() })
          .eq("phyllo_account_id", userId);
        if (error) {
          console.error("Phyllo webhook update error:", error);
          return NextResponse.json({ error: "save" }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Phyllo webhook error:", err);
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
