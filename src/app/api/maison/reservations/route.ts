import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { googleCalendarUrl, buildIcs } from "@/lib/calendar";
import { sendReservationConfirmed, sendReservationDeclined } from "@/lib/emails";

const MINIMO_MENSUAL = 5;

function cuando(d: Date) {
  return d.toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

/**
 * Las demandas de visita, decididas por la propia maison.
 *
 * Hasta ahora esto solo lo podía hacer el admin, así que una casa tenía que
 * escribirle a Curato para aceptar a alguien que ya le había pedido mesa. Con
 * cinco visitas garantizadas al mes, ese ida y vuelta se come el plazo.
 *
 * Rechazar tiene consecuencia contractual: cuenta como visita ofrecida dentro
 * del mínimo del mes. La pantalla lo dice **antes** de pulsar, no después en un
 * diálogo de confirmación, que es donde nadie lee.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();
    const { data: maison } = await admin
      .from("comercios")
      .select("id")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    const { data: pendientes } = await admin
      .from("reservations")
      .select("id, creator_id, slot_start, party_size, nights, special_requests")
      .eq("venue_id", maison.id)
      .eq("status", "pending_review")
      .order("slot_start", { ascending: true });

    const filas = pendientes ?? [];
    const ids = [...new Set(filas.map((r) => r.creator_id))];
    const { data: creators } = ids.length
      ? await admin.from("creators").select("id, full_name, handle, followers").in("id", ids)
      : { data: [] as { id: string; full_name: string | null; handle: string | null; followers: number | null }[] };
    const porId = new Map((creators ?? []).map((c) => [c.id, c]));

    // Cuántas visitas lleva el mes: sin ese número, "rechazar cuenta como
    // visita ofrecida" es una frase abstracta.
    const ahora = new Date();
    const desde = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1));
    const { count } = await admin
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("venue_id", maison.id)
      .eq("status", "completed")
      .gte("slot_start", desde.toISOString());

    return NextResponse.json({
      requests: filas.map((r) => {
        const c = porId.get(r.creator_id);
        return {
          id: r.id,
          name: c?.full_name ?? c?.handle ?? "",
          handle: c?.handle ?? null,
          followers: c?.followers ?? null,
          slotStart: r.slot_start,
          partySize: r.party_size,
          nights: r.nights,
          note: r.special_requests ?? null,
        };
      }),
      monthVisits: count ?? 0,
      guaranteed: MINIMO_MENSUAL,
    });
  } catch (err) {
    console.error("maison reservations GET error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const { id, action } = (await request.json()) as { id?: string; action?: string };
    if (!id || (action !== "confirm" && action !== "decline")) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: maison } = await admin
      .from("comercios")
      .select("id, name, address")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    // La reserva tiene que ser de esta casa y seguir pendiente. Sin las dos
    // condiciones, una maison podría tocar la reserva de otra, o revivir una
    // que el admin ya resolvió.
    const { data: r } = await admin
      .from("reservations")
      .select("id, venue_id, creator_id, slot_start, nights, status")
      .eq("id", id)
      .maybeSingle();
    if (!r || r.venue_id !== maison.id) {
      return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
    }
    if (r.status !== "pending_review") {
      return NextResponse.json({ error: "Cette demande a déjà été traitée." }, { status: 409 });
    }

    const { data: creator } = await admin
      .from("creators")
      .select("full_name, email")
      .eq("id", r.creator_id)
      .maybeSingle();
    const firstName = (creator?.full_name || "").split(" ")[0] || "vous";

    if (action === "confirm") {
      const { error } = await admin
        .from("reservations")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", id)
        .eq("status", "pending_review");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const start = new Date(r.slot_start);
      const end = r.nights
        ? new Date(start.getTime() + r.nights * 86400000)
        : new Date(start.getTime() + 2 * 3600000);
      const event = {
        title: `Curato · ${maison.name}`,
        start,
        end,
        location: maison.address || "",
        description: `Réservation Curato chez ${maison.name}.`,
      };

      try {
        if (creator?.email) {
          await sendReservationConfirmed({
            to: creator.email,
            firstName,
            maisonName: maison.name,
            address: maison.address ?? null,
            whenLabel: cuando(start),
            googleUrl: googleCalendarUrl(event),
            ics: buildIcs(event, `curato-${id}@curatocollective.com`),
          });
        }
      } catch (mailErr) {
        console.error("Confirmation email failed:", mailErr);
      }

      return NextResponse.json({ ok: true, status: "confirmed" });
    }

    const { error } = await admin
      .from("reservations")
      .update({
        status: "declined",
        declined_at: new Date().toISOString(),
        declined_reason: "Refusée par la maison",
      })
      .eq("id", id)
      .eq("status", "pending_review");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // El creador se entera por correo. Si el correo falla, el rechazo no se
    // deshace: la decisión de la casa ya está tomada y guardada.
    try {
      if (creator?.email) {
        await sendReservationDeclined({
          to: creator.email,
          firstName: (creator.full_name || "").split(" ")[0],
          maisonName: maison.name,
          whenLabel: cuando(new Date(r.slot_start)),
        });
      }
    } catch (mailErr) {
      console.error("Decline email failed:", mailErr);
    }

    return NextResponse.json({ ok: true, status: "declined" });
  } catch (err) {
    console.error("maison reservations POST error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}
