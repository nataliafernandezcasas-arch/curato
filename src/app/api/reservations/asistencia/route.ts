import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";
import { asistenciaConfirmada, cancelacionTardia } from "@/lib/asistencia";
import { avisar, AVISOS } from "@/lib/push/avisos";
import { pendientesDe } from "@/lib/pendientes";
import { sendVisiteAnnulee } from "@/lib/emails";
import { esCorreoDePrueba } from "@/lib/recordatorios";
import type { CasaTarjeta } from "@/components/member/tarjeta-casa";

const cuando = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });

type Reserva = {
  id: string;
  creator_id: string;
  venue_id: string;
  slot_start: string;
  status: string;
  created_at: string;
  credits_cost: number | null;
  party_size: number | null;
  asistencia_confirmada_at: string | null;
};

/** La reserva, solo si es del storyteller que pregunta: el id llega del navegador. */
async function suReserva(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "auth" }, { status: 401 }) };
  const admin = createAdminClient();
  const { data: creator } = await admin
    .from("creators")
    .select("id, full_name, handle")
    .or(filtroDeUsuario(user))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!creator) return { error: NextResponse.json({ error: "creator" }, { status: 403 }) };
  const { data: r, error } = await admin
    .from("reservations")
    .select("id, creator_id, venue_id, slot_start, status, created_at, credits_cost, party_size, asistencia_confirmada_at")
    .eq("id", id)
    .eq("creator_id", creator.id)
    .maybeSingle();
  if (error) return { error: NextResponse.json({ error: "migracion" }, { status: 500 }) };
  if (!r) return { error: NextResponse.json({ error: "reserva" }, { status: 404 }) };
  return { admin, creator, r: r as Reserva };
}

/**
 * La visita, para la página de confirmar: la casa, cuándo, cuánto cuesta, si
 * falta confirmar y si cancelar ahora haría perder el crédito.
 */
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id") ?? "";
    const res = await suReserva(id);
    if ("error" in res) return res.error;
    const { admin, r } = res;
    const { data: casa } = await admin
      .from("comercios")
      .select("id, name, address, arrondissement, description, description_en, description_es, photos, signed_at, category_id")
      .eq("id", r.venue_id)
      .maybeSingle();
    const futura = new Date(r.slot_start).getTime() > Date.now();
    return NextResponse.json({
      casa: (casa as CasaTarjeta | null) ?? null,
      slotStart: r.slot_start,
      partySize: r.party_size ?? 1,
      status: r.status,
      cost: r.credits_cost ?? 0,
      confirmed: asistenciaConfirmada(r),
      canConfirm: r.status === "confirmed" && futura,
      canCancel: (r.status === "confirmed" || r.status === "pending_review") && futura,
      lateIfCancel: cancelacionTardia(r),
    });
  } catch (err) {
    console.error("asistencia GET error:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

/**
 * Confirmar que va, o cancelar.
 *
 * Cancelar una visita aceptada a menos de 24 h la marca como cancelada tarde:
 * el crédito no vuelve (src/lib/credito.ts). Una demanda que la casa aún no
 * aceptó se cancela gratis. A la casa se le avisa en el teléfono y por correo.
 */
export async function POST(request: NextRequest) {
  try {
    const { id, accion } = (await request.json().catch(() => ({}))) as { id?: string; accion?: string };
    if (!id || (accion !== "confirmar" && accion !== "cancelar")) {
      return NextResponse.json({ error: "params" }, { status: 400 });
    }
    const res = await suReserva(id);
    if ("error" in res) return res.error;
    const { admin, creator, r } = res;
    if (new Date(r.slot_start).getTime() <= Date.now()) {
      return NextResponse.json({ error: "pasada" }, { status: 409 });
    }

    if (accion === "confirmar") {
      if (r.status !== "confirmed") return NextResponse.json({ error: "estado" }, { status: 409 });
      const { error } = await admin
        .from("reservations")
        .update({ asistencia_confirmada_at: new Date().toISOString() })
        .eq("id", r.id)
        .is("asistencia_confirmada_at", null);
      if (error) return NextResponse.json({ error: "save" }, { status: 500 });
      return NextResponse.json({ ok: true, confirmed: true });
    }

    if (r.status !== "confirmed" && r.status !== "pending_review") {
      return NextResponse.json({ error: "estado" }, { status: 409 });
    }
    const tarde = cancelacionTardia(r);
    const { data: hecha, error } = await admin
      .from("reservations")
      .update({ status: "cancelled", cancelada_at: new Date().toISOString(), cancelada_tarde: tarde })
      .eq("id", r.id)
      .eq("status", r.status)
      .select("id")
      .maybeSingle();
    if (error) return NextResponse.json({ error: "save" }, { status: 500 });
    if (!hecha) return NextResponse.json({ error: "estado" }, { status: 409 });

    // A la casa, cuando ya salió la respuesta: el storyteller no espera.
    const nombre = (creator.full_name as string | null) || (creator.handle ? `@${creator.handle}` : "Un storyteller");
    after(async () => {
      const { data: casa } = await admin.from("comercios").select("id, email, owner_id").eq("id", r.venue_id).maybeSingle();
      if (!casa) return;
      const destino = { ownerId: (casa.owner_id as string | null) ?? null, email: (casa.email as string | null) ?? null };
      await avisar(destino, AVISOS.visitaCancelada(nombre, cuando(r.slot_start), r.id));
      // Si era una demanda sin responder, baja la cifra del icono.
      if (r.status === "pending_review") await avisar(destino, AVISOS.insignia(await pendientesDe(admin, casa.id as string)));
      if (casa.email && !esCorreoDePrueba(casa.email as string)) {
        await sendVisiteAnnulee(casa.email as string, { storyteller: nombre, whenLabel: cuando(r.slot_start) }).catch((e) =>
          console.error("[curato] correo de visita anulada:", e)
        );
      }
    });

    return NextResponse.json({ ok: true, cancelled: true, late: tarde });
  } catch (err) {
    console.error("asistencia POST error:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
