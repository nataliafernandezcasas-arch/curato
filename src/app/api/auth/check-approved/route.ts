import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const normalizedEmail = email.toLowerCase().trim();

    const { data, error } = await supabase
      .from("applications")
      .select("id, type, status")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({
        approved: false,
        message: "No encontramos una candidature avec cet e-mail. Candidatez d'abord.",
      });
    }

    if (data.status === "approved") {
      const type = data.type === "creator" ? "influencer" : "business";
      return NextResponse.json({ approved: true, type });
    }

    return NextResponse.json({
      approved: false,
      message: "Votre candidature est en cours d'examen. Nous vous contacterons prochainement.",
    });
  } catch (err) {
    console.error("Check approved error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
