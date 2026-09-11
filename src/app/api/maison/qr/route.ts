import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nuevoCodigo } from "@/lib/check-in";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://curatocollective.com";

// Una visita registrada hace menos de esto se enseña en la pantalla del QR:
// quien la tiene abierta en sala ve que el escaneo ha funcionado.
const RECIENTE_MS = 10 * 60 * 1000;

/**
 * El QR de sala de la maison: su código (se crea la primera vez), la dirección
 * que lleva dentro y la última visita registrada, si acaba de pasar.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();
    const { data: maison } = await admin
      .from("comercios")
      .select("id, name, check_in_code")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    let code = maison.check_in_code as string | null;
    // La primera vez se genera. Si choca con el de otra casa, se prueba otro.
    for (let intento = 0; !code && intento < 6; intento++) {
      const candidato = nuevoCodigo(maison.name || "");
      const { error } = await admin
        .from("comercios")
        .update({ check_in_code: candidato })
        .eq("id", maison.id)
        .is("check_in_code", null);
      if (!error) {
        const { data: releida } = await admin.from("comercios").select("check_in_code").eq("id", maison.id).maybeSingle();
        code = (releida?.check_in_code as string | null) ?? null;
      }
    }
    if (!code) return NextResponse.json({ error: "Code indisponible." }, { status: 500 });

    const { data: ultima } = await admin
      .from("reservations")
      .select("creator_id, visited_at")
      .eq("venue_id", maison.id)
      .gte("visited_at", new Date(Date.now() - RECIENTE_MS).toISOString())
      .order("visited_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    let lastCheckIn: { name: string; at: string } | null = null;
    if (ultima?.visited_at) {
      const { data: c } = await admin.from("creators").select("full_name, handle").eq("id", ultima.creator_id).maybeSingle();
      const nombre = (c?.full_name || "").split(" ")[0] || (c?.handle ? `@${c.handle}` : "");
      lastCheckIn = { name: nombre, at: ultima.visited_at };
    }

    return NextResponse.json({ maison: maison.name, code, url: `${SITE_URL}/v/${code}`, lastCheckIn });
  } catch (err) {
    console.error("maison qr GET error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}
