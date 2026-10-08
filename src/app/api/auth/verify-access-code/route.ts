import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";

// Cada error lleva un `code` estable: la pantalla lo traduce al idioma del
// miembro. El `error` en francés se queda para quien aún lea el texto.
export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ code: "missing", error: "Email et code requis." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: app, error } = await supabase
      .from("applications")
      .select("id, email, status, access_code, access_code_expires_at, access_code_attempts")
      .eq("email", email.toLowerCase().trim())
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !app) {
      return NextResponse.json({ code: "not_found", error: "Aucune candidature approuvée trouvée pour cet e-mail." }, { status: 404 });
    }

    // Seis cifras se adivinan a fuerza de intentos, así que se cuentan. A los
    // cinco fallos el código queda bloqueado y hay que pedir otro.
    const intentos = (app.access_code_attempts as number | null) ?? 0;
    if (intentos >= 5) {
      return NextResponse.json(
        { code: "too_many", error: "Trop de tentatives. Écrivez-nous à hello@curatocollective.com pour un nouveau code." },
        { status: 429 }
      );
    }

    if (!app.access_code || app.access_code !== code) {
      await supabase.from("applications").update({ access_code_attempts: intentos + 1 }).eq("id", app.id);
      const quedan = 4 - intentos;
      return NextResponse.json(
        {
          code: "invalid",
          remaining: Math.max(quedan, 0),
          error:
            quedan > 0
              ? `Code invalide. Il vous reste ${quedan} tentative${quedan > 1 ? "s" : ""}.`
              : "Code invalide. C'était la dernière tentative : écrivez-nous pour un nouveau code.",
        },
        { status: 401 }
      );
    }

    if (!app.access_code_expires_at || new Date(app.access_code_expires_at) < new Date()) {
      return NextResponse.json({ code: "expired", error: "Ce code a expiré. Contactez-nous à hello@curatocollective.com." }, { status: 401 });
    }

    // Generate a magic link so the user gets a real Supabase session
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email.toLowerCase().trim(),
    });

    // Same reason as the password-reset route: Supabase's own action_link bounces
    // through /auth/v1/verify, which returns the session in the URL fragment
    // (#access_token=...). A fragment never reaches a server route, so
    // /auth/callback would see nothing and bounce the user to /auth/sign-in.
    // Send them straight to our callback with the hashed token instead.
    const hashedToken = linkData?.properties?.hashed_token;
    if (linkError || !hashedToken) {
      console.error("generateLink error:", linkError);
      return NextResponse.json({ code: "link", error: "Erreur lors de la génération du lien. Réessayez." }, { status: 500 });
    }

    // El código no se borra aquí: se le deja una ventana de quince minutos.
    // Borrarlo antes de que la sesión exista dejaba a quien se interrumpía con
    // un código muerto y un mensaje que le decía que escribiera a Curato. El
    // enlace de Supabase ya es de un solo uso.
    await supabase
      .from("applications")
      .update({
        access_code_attempts: 0,
        access_code_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      .eq("id", app.id);

    // Y acaba fijando su contraseña: entró con un código, así que todavía no
    // tiene una suya.
    const destino = encodeURIComponent("/auth/change-password");
    return NextResponse.json({
      redirectTo: `${SITE_URL}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink&next=${destino}`,
    });
  } catch (err) {
    console.error("verify-access-code error:", err);
    return NextResponse.json({ code: "server", error: "Erreur serveur." }, { status: 500 });
  }
}
