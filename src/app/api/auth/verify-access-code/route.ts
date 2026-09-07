import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.curatocollective.com";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Email et code requis." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: app, error } = await supabase
      .from("applications")
      .select("id, email, status, access_code, access_code_expires_at")
      .eq("email", email.toLowerCase().trim())
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !app) {
      return NextResponse.json({ error: "Aucune candidature approuvée trouvée pour cet e-mail." }, { status: 404 });
    }

    if (!app.access_code || app.access_code !== code) {
      return NextResponse.json({ error: "Code invalide. Vérifiez votre e-mail de bienvenue." }, { status: 401 });
    }

    if (!app.access_code_expires_at || new Date(app.access_code_expires_at) < new Date()) {
      return NextResponse.json({ error: "Ce code a expiré. Contactez-nous à hello@curatocollective.com." }, { status: 401 });
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
      return NextResponse.json({ error: "Erreur lors de la génération du lien. Réessayez." }, { status: 500 });
    }

    // Invalidate the code after use
    await supabase
      .from("applications")
      .update({ access_code: null, access_code_expires_at: null })
      .eq("id", app.id);

    return NextResponse.json({
      redirectTo: `${SITE_URL}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink`,
    });
  } catch (err) {
    console.error("verify-access-code error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
