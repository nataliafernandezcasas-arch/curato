import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Donde la app deja su token de avisos, y donde lo retira.
 *
 * Un token es de un aparato. La misma persona puede tener el teléfono y el
 * iPad, y un teléfono prestado se queda con el token de quien entró antes: por
 * eso el dueño se reescribe entero en cada entrada en vez de añadirse.
 *
 * Solo escribe quien tiene sesión. Sin esto, cualquiera podría apuntar el token
 * de otra persona a su nombre y leer en su pantalla apagada el nombre de las
 * casas que visita.
 */

const PLATAFORMAS = ["ios", "android"];

async function quienEs() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// El token de Apple es hexadecimal; el de Google, más largo y con guiones. Se
// acota por longitud y alfabeto para no guardar cualquier cosa.
function tokenValido(v: unknown): v is string {
  return typeof v === "string" && v.length >= 32 && v.length <= 512 && /^[A-Za-z0-9:_-]+$/.test(v);
}

export async function POST(request: NextRequest) {
  try {
    const user = await quienEs();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const { token, platform } = (await request.json()) as { token?: unknown; platform?: unknown };
    if (!tokenValido(token) || typeof platform !== "string" || !PLATAFORMAS.includes(platform)) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    const { error } = await createAdminClient()
      .from("device_tokens")
      .upsert(
        {
          token,
          user_id: user.id,
          email: (user.email || "").trim().toLowerCase() || null,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" }
      );
    if (error) {
      console.error("[curato] no se pudo guardar el aparato:", error.message);
      return NextResponse.json({ error: "Erreur." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

/** Al apagar los avisos o al cerrar sesión: el aparato deja de recibir nada. */
export async function DELETE(request: NextRequest) {
  try {
    const user = await quienEs();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const { token } = (await request.json().catch(() => ({}))) as { token?: unknown };
    if (!tokenValido(token)) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

    // Solo se borra el propio: el token viaja desde el aparato y no es secreto.
    await createAdminClient().from("device_tokens").delete().eq("token", token).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}
