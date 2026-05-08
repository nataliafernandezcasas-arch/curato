import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://curatocollective.com"}/auth/callback?next=/dashboard`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("generateLink error:", linkError);
      return NextResponse.json({ error: "Erreur lors de la génération du lien. Réessayez." }, { status: 500 });
    }

    // Invalidate the code after use
    await supabase
      .from("applications")
      .update({ access_code: null, access_code_expires_at: null })
      .eq("id", app.id);

    return NextResponse.json({ redirectTo: linkData.properties.action_link });
  } catch (err) {
    console.error("verify-access-code error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
