import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ approved: false, message: "Email requis." });

    const normalizedEmail = email.toLowerCase().trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase env vars");
      return NextResponse.json({ approved: false, message: "Votre candidature est en cours d'examen. Nous vous contacterons prochainement." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("applications")
      .select("id, type, status")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ approved: false, message: "Votre candidature est en cours d'examen. Nous vous contacterons prochainement." });
    }

    if (!data) {
      return NextResponse.json({ approved: false, message: "Aucune candidature trouvée avec cet e-mail. Candidatez d'abord." });
    }

    if (data.status === "approved") {
      const type = data.type === "creator" ? "influencer" : "business";
      return NextResponse.json({ approved: true, type });
    }

    return NextResponse.json({ approved: false, message: "Votre candidature est en cours d'examen. Nous vous contacterons prochainement." });
  } catch (err) {
    console.error("Check approved error:", err);
    return NextResponse.json({ approved: false, message: "Votre candidature est en cours d'examen. Nous vous contacterons prochainement." });
  }
}
