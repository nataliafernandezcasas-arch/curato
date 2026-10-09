import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";
import { puedeMarcarNoShow } from "@/lib/asistencia";
import { avisar, AVISOS } from "@/lib/push/avisos";
import { sendAbsenceCurato, sendAbsenceSignalee } from "@/lib/emails";
import { esCorreoDePrueba } from "@/lib/recordatorios";

// Donde Curato decide si suspende.
const BUZON_CURATO = "hello@curatocollective.com";

const cuando = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });

/**
 * La casa dice que el storyteller no vino.
 *
 * Solo con una visita suya, aceptada, sin llegada registrada, desde media hora
 * después de la hora y durante tres días (src/lib/asistencia.ts). La visita
 * pasa a no_show: el crédito se pierde (src/lib/credito.ts). Al storyteller se
 * le avisa, con la forma de decir que es un error, y a Curato también, con
 * cuántas ausencias suma, para decidir si suspende.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
    const { id } = (await request.json().catch(() => ({}))) as { id?: string };
    if (!id) return NextResponse.json({ error: "params" }, { status: 400 });

    const admin = createAdminClient();
    const { data: maison } = await admin
      .from("comercios")
      .select("id, name")
      .or(filtroDeUsuario(user))
      .eq("stage", "activo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "maison" }, { status: 403 });

    const { data: r } = await admin
      .from("reservations")
      .select("id, creator_id, slot_start, status, visited_at")
      .eq("id", id)
      .eq("venue_id", maison.id)
      .maybeSingle();
    if (!r) return NextResponse.json({ error: "visita" }, { status: 404 });
    if (!puedeMarcarNoShow(r)) return NextResponse.json({ error: "estado" }, { status: 409 });

    const { data: hecha, error } = await admin
      .from("reservations")
      .update({ status: "no_show" })
      .eq("id", r.id)
      .eq("status", "confirmed")
      .is("visited_at", null)
      .select("id")
      .maybeSingle();
    if (error) return NextResponse.json({ error: "save" }, { status: 500 });
    if (!hecha) return NextResponse.json({ error: "estado" }, { status: 409 });

    after(async () => {
      const { data: creador } = await admin
        .from("creators")
        .select("id, full_name, handle, email, owner_id, is_test")
        .eq("id", r.creator_id)
        .maybeSingle();
      if (!creador) return;
      const nombre = (creador.full_name as string | null) || (creador.handle ? `@${creador.handle}` : "Un storyteller");
      const whenLabel = cuando(r.slot_start as string);
      await avisar(
        { ownerId: (creador.owner_id as string | null) ?? null, email: (creador.email as string | null) ?? null },
        AVISOS.noShow(maison.name as string, r.id as string)
      );
      if (creador.is_test) return;
      const { count } = await admin
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creador.id)
        .eq("status", "no_show");
      try {
        if (!esCorreoDePrueba(creador.email as string | null)) {
          await sendAbsenceSignalee(creador.email as string, {
            firstName: ((creador.full_name as string | null) || "").split(" ")[0],
            maisonName: maison.name as string,
            whenLabel,
          });
        }
        await sendAbsenceCurato(BUZON_CURATO, {
          storyteller: nombre,
          maisonName: maison.name as string,
          whenLabel,
          ausencias: count ?? 1,
        });
      } catch (err) {
        console.error("[curato] correos del no show:", err);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("no-show error:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
