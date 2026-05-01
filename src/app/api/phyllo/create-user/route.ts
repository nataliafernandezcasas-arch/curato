import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPhylloUser, createSDKToken } from "@/lib/phyllo/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email?.toLowerCase().trim();

    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

    const admin = createAdminClient();
    const { data: creator, error: creatorErr } = await admin
      .from("creators")
      .select("id, full_name, email, phyllo_account_id")
      .eq("email", email)
      .single();

    if (!creator) {
      console.error("Creator not found for email:", email, creatorErr?.message);
      return NextResponse.json({ error: "No encontramos tu cuenta. Asegúrate de estar logueado con el email correcto." }, { status: 404 });
    }

    // If already has Phyllo account, just create new SDK token
    if (creator.phyllo_account_id) {
      console.log("Creator already has Phyllo account:", creator.phyllo_account_id);
      const tokenData = await createSDKToken(creator.phyllo_account_id);
      console.log("SDK token response:", JSON.stringify(tokenData).slice(0, 100));
      if (!tokenData.sdk_token) {
        return NextResponse.json({ error: "Error generando token de Phyllo" }, { status: 500 });
      }
      return NextResponse.json({ sdk_token: tokenData.sdk_token, user_id: creator.phyllo_account_id });
    }

    // Create new Phyllo user
    const phylloUser = await createPhylloUser(
      creator.full_name || email,
      `midi-${creator.id}`
    );

    if (!phylloUser.id) {
      console.error("Phyllo user creation failed:", JSON.stringify(phylloUser));
      // If external_id already exists, try to find existing user
      if (phylloUser.error?.message?.includes("external_id")) {
        return NextResponse.json({ error: "Usuario ya existe en Phyllo. Contacta soporte." }, { status: 500 });
      }
      return NextResponse.json({ error: "Error creando usuario en Phyllo: " + (phylloUser.error?.message || "desconocido") }, { status: 500 });
    }

    // Save Phyllo user ID
    await admin.from("creators").update({ phyllo_account_id: phylloUser.id }).eq("id", creator.id);

    // Create SDK token
    const tokenData = await createSDKToken(phylloUser.id);

    return NextResponse.json({ sdk_token: tokenData.sdk_token, user_id: phylloUser.id });
  } catch (err) {
    console.error("Phyllo create-user error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
