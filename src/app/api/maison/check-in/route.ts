import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { codigoDelQR, visitaDeHoy } from "@/lib/check-in";
import { filtroDeUsuario } from "@/lib/identidad";
import { signPortraits } from "@/lib/creator-portrait";
import { buildDossiers } from "@/lib/storyteller-dossier";

/**
 * La casa escanea el código que le enseña el storyteller (migración 040).
 *
 * Dos pasos, con la misma llamada: sin `confirmar` solo dice quién es, con su
 * cara, para que la sala compruebe que la persona que tiene delante es la de la
 * reserva; con `confirmar` registra la visita (visited_at). No cambia el estado
 * de la reserva: eso sigue llegando con las stories.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

    const { code, confirmar } = (await request.json().catch(() => ({}))) as { code?: string; confirmar?: boolean };
    const codigo = codigoDelQR(code ?? "");
    if (!codigo) return NextResponse.json({ error: "code" }, { status: 400 });

    const admin = createAdminClient();
    const { data: maison } = await admin
      .from("comercios")
      .select("id")
      .or(filtroDeUsuario(user))
      .eq("stage", "activo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "maison" }, { status: 403 });

    // Solo las visitas de esta casa: el código de otra casa no existe aquí, y
    // se dice igual que uno inventado.
    const { data: reserva } = await admin
      .from("reservations")
      .select("id, creator_id, slot_start, slot_end, status, visited_at, party_size")
      .eq("visit_code", codigo)
      .eq("venue_id", maison.id)
      .maybeSingle();
    if (!reserva) return NextResponse.json({ error: "code" }, { status: 404 });

    const { data: creator } = await admin
      .from("creators")
      .select("id, full_name, handle, portrait_urls")
      .eq("id", reserva.creator_id)
      .maybeSingle();

    // Su retrato; si no subió ninguno, el de Instagram, que es más lento.
    const retratos: string[] = (creator?.portrait_urls as string[] | null) ?? [];
    let portrait = retratos.length ? (await signPortraits(admin, [retratos[0]]))[0] : null;
    if (!portrait && creator) portrait = (await buildDossiers(admin, [creator.id])).get(creator.id)?.portrait ?? null;

    const visita = {
      name: (creator?.full_name as string | null) ?? "",
      handle: (creator?.handle as string | null) ?? null,
      portrait,
      slotStart: reserva.slot_start as string,
      partySize: (reserva.party_size as number | null) ?? 1,
    };

    if (!visitaDeHoy([reserva])) return NextResponse.json({ error: "dia", visita }, { status: 409 });
    if (reserva.visited_at) return NextResponse.json({ ok: true, ya: true, visita });
    if (!confirmar) return NextResponse.json({ ok: true, ya: false, visita });

    const { error } = await admin
      .from("reservations")
      .update({ visited_at: new Date().toISOString(), checked_in_by: user.id })
      .eq("id", reserva.id)
      .is("visited_at", null);
    if (error) return NextResponse.json({ error: "save" }, { status: 500 });

    return NextResponse.json({ ok: true, ya: false, registrada: true, visita });
  } catch (err) {
    console.error("maison check-in error:", err);
    return NextResponse.json({ error: "save" }, { status: 500 });
  }
}
