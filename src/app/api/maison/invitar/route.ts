import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeCasa } from "@/lib/casa";
import { avisar, AVISOS } from "@/lib/push/avisos";
import { sendInvitacionCasa } from "@/lib/emails";

// Una invitación por casa y storyteller cada 30 días: más sería insistir.
const ESPERA_DIAS = 30;

/**
 * « Inviter à nouveau » (migración 057).
 *
 * La casa invita otra vez a un storyteller que ya la visitó. Se identifica por
 * una de sus visitas completadas, para que una casa solo pueda invitar a quien
 * de verdad recibió. Aviso al teléfono y correo, sin esperar a que lleguen.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const { reservationId } = await request.json().catch(() => ({}));
    if (typeof reservationId !== "string" || !/^[0-9a-f-]{36}$/i.test(reservationId)) {
      return NextResponse.json({ error: "Visite inconnue." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: maison } = await admin
      .from("comercios")
      .select("id, name")
      .or(await filtroDeCasa(admin, user))
      .eq("stage", "activo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    const { data: visita } = await admin
      .from("reservations")
      .select("creator_id")
      .eq("id", reservationId)
      .eq("venue_id", maison.id)
      .eq("status", "completed")
      .maybeSingle();
    if (!visita) return NextResponse.json({ error: "Visite introuvable." }, { status: 404 });

    const desde = new Date(Date.now() - ESPERA_DIAS * 24 * 3600 * 1000).toISOString();
    const { data: reciente, error: errLeer } = await admin
      .from("maison_invitaciones")
      .select("created_at")
      .eq("comercio_id", maison.id)
      .eq("creator_id", visita.creator_id)
      .gte("created_at", desde)
      .limit(1)
      .maybeSingle();
    if (errLeer) {
      console.error("[curato] invitaciones sin tabla (migración 057):", errLeer.message);
      return NextResponse.json({ error: "Indisponible pour le moment." }, { status: 503 });
    }
    if (reciente) return NextResponse.json({ ok: true, yaInvitado: true, desde: reciente.created_at });

    const { error: errGuardar } = await admin
      .from("maison_invitaciones")
      .insert({ comercio_id: maison.id, creator_id: visita.creator_id });
    if (errGuardar) return NextResponse.json({ error: "Indisponible pour le moment." }, { status: 500 });

    const { data: creator } = await admin
      .from("creators")
      .select("owner_id, email, full_name")
      .eq("id", visita.creator_id)
      .maybeSingle();

    if (creator) {
      void avisar({ ownerId: creator.owner_id, email: creator.email }, AVISOS.invitacionCasa(maison.name as string, maison.id as string));
      if (creator.email) {
        sendInvitacionCasa(creator.email as string, {
          nombre: (creator.full_name as string | null) ?? "",
          maison: maison.name as string,
          maisonId: maison.id as string,
        }).catch((e) => console.error("[curato] correo de invitación no enviado:", e));
      }
    }

    return NextResponse.json({ ok: true, yaInvitado: false });
  } catch (err) {
    console.error("maison/invitar:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

/** Los storytellers que esta casa ya invitó en los últimos 30 días. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ invitados: [] }, { status: 401 });

  const admin = createAdminClient();
  const { data: maison } = await admin
    .from("comercios")
    .select("id")
    .or(await filtroDeCasa(admin, user))
    .eq("stage", "activo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!maison) return NextResponse.json({ invitados: [] });

  const desde = new Date(Date.now() - ESPERA_DIAS * 24 * 3600 * 1000).toISOString();
  const { data } = await admin
    .from("maison_invitaciones")
    .select("creator_id")
    .eq("comercio_id", maison.id)
    .gte("created_at", desde);
  return NextResponse.json({ invitados: [...new Set((data ?? []).map((f) => f.creator_id as string))] });
}
