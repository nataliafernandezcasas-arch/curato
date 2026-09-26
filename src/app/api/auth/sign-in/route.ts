import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Entrar con un handle o un correo, y una contraseña.
 *
 * Antes esto eran dos pasos: el navegador preguntaba a /api/auth/lookup-handle
 * qué correo tenía ese handle, y luego hacía el login con el correo. Ese primer
 * paso respondía sin sesión y con permisos de administrador, así que con la
 * lista de cuentas de Instagram del club se sacaba el correo de cada
 * storyteller, uno por uno. Es dato personal de terceros.
 *
 * Aquí el correo no sale nunca de este archivo: se resuelve dentro y el login
 * se hace en el servidor, que escribe las mismas cookies de sesión que
 * escribía el navegador.
 *
 * Y un solo mensaje de error para las tres situaciones (no existe, contraseña
 * mala, correo sin cuenta), porque distinguirlas vuelve a decir quién está en
 * el club.
 */
async function resolverCorreo(identificador: string): Promise<string | null> {
  const admin = createAdminClient();
  // Solo una arroba de más al principio: "@apercu" es un handle, y un correo
  // lleva la suya dentro.
  const limpio = identificador.trim().toLowerCase().replace(/^@/, "");
  if (!limpio) return null;

  const { data: creator } = await admin
    .from("creators")
    .select("email")
    .ilike("handle", limpio)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (creator?.email) return creator.email as string;

  if (!limpio.includes("@")) return null;

  const { data: comercio } = await admin
    .from("comercios")
    .select("email")
    .ilike("email", limpio)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (comercio?.email) return comercio.email as string;

  // Cualquier otra cuenta de Supabase (un apporteur, el admin) entra con su
  // propio correo.
  return limpio;
}

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = (await request.json()) as {
      identifier?: string;
      password?: string;
    };
    if (!identifier || !password) {
      return NextResponse.json({ error: "missing" }, { status: 400 });
    }

    const correo = await resolverCorreo(identifier);
    if (!correo) return NextResponse.json({ error: "invalid" }, { status: 401 });

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password });
    if (error || !data.user) {
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      forcePasswordChange: Boolean(data.user.user_metadata?.force_password_change),
    });
  } catch (err) {
    console.error("sign-in error:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
