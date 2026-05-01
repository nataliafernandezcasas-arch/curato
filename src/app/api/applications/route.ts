import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApplicationReceived } from "@/lib/emails";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, full_name, email, phone, country, city } = body;

    if (!type || !full_name || !email || !phone) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (type === "influencer") {
      // Check duplicate
      const { data: existing } = await supabase
        .from("creators")
        .select("id, stage")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (existing) {
        if (existing.stage === "active") return NextResponse.json({ error: "Ya eres miembro activo. Inicia sesion." }, { status: 400 });
        if (existing.stage === "applied") return NextResponse.json({ error: "Ya tienes una aplicación pendiente." }, { status: 400 });
      }

      const { error: insertError } = await supabase.from("creators").insert({
        handle: body.instagram_handle || "",
        platform: "instagram",
        category: body.content_niche || "",
        followers: 0,
        country: country || "CO",
        city: city || "Bogotá",
        stage: "applied",
        full_name,
        email: email.toLowerCase().trim(),
        phone,
        tiktok_handle: body.tiktok_handle,
        follower_range: body.follower_range,
        motivation: body.motivation,
        receives_foreign_payments: typeof body.receives_foreign_payments === "boolean" ? body.receives_foreign_payments : null,
        visits_count: 0,
        content_rate: 0,
        rating: 0,
        usage_percent: 0,
      });

      if (insertError) {
        console.error("Insert creator error:", insertError);
        return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
      }
    } else if (type === "business") {
      // Check duplicate
      const { data: existing } = await supabase
        .from("comercios")
        .select("id, stage")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (existing) {
        if (existing.stage === "activo") return NextResponse.json({ error: "Ya eres miembro activo. Inicia sesion." }, { status: 400 });
        if (existing.stage === "prospecto") return NextResponse.json({ error: "Ya tienes una aplicación pendiente." }, { status: 400 });
      }

      const { error: insertError } = await supabase.from("comercios").insert({
        name: body.business_name || full_name,
        category: body.business_type || "gastronomy",
        country: country || "CO",
        city: city || "Bogotá",
        plan: "1_month",
        monthly_price: 250,
        stage: "prospecto",
        rating: 0,
        contact_name: full_name,
        email: email.toLowerCase().trim(),
        phone,
        address: body.business_address,
        website_url: body.website_url,
        description: body.business_description,
      });

      if (insertError) {
        console.error("Insert comercio error:", insertError);
        return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "Tipo invalido" }, { status: 400 });
    }

    // Send confirmation email
    try {
      const result = await sendApplicationReceived(email.toLowerCase().trim(), full_name, type);
      console.log("Email sent:", JSON.stringify(result));
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Application error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
