import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

    const supabase = createAdminClient();
    const normalizedEmail = email.toLowerCase().trim();

    // Check creators table first
    const { data: creator } = await supabase
      .from("creators")
      .select("id, stage")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (creator) {
      if (creator.stage === "applied") return NextResponse.json({ approved: false, message: "Tu aplicación está en proceso de revisión. Te avisaremos cuando seas aceptado." });
      if (creator.stage === "suspended") return NextResponse.json({ approved: false, message: "Tu cuenta fue suspendida. Contacta a soporte." });
      if (creator.stage === "verified" || creator.stage === "active") return NextResponse.json({ approved: true, type: "influencer" });
    }

    // Check comercios table
    const { data: comercio } = await supabase
      .from("comercios")
      .select("id, stage")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (comercio) {
      if (comercio.stage === "prospecto" || comercio.stage === "contactado" || comercio.stage === "demo") return NextResponse.json({ approved: false, message: "Tu aplicación está en proceso de revisión. Te avisaremos cuando seas aceptado." });
      if (comercio.stage === "suspendido") return NextResponse.json({ approved: false, message: "Tu cuenta fue suspendida. Contacta a soporte." });
      if (comercio.stage === "activo") return NextResponse.json({ approved: true, type: "business" });
    }

    return NextResponse.json({ approved: false, message: "No encontramos una aplicación con este email. Aplica primero." });
  } catch (err) {
    console.error("Check approved error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
