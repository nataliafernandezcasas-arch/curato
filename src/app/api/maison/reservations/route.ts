import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { googleCalendarUrl, buildIcs } from "@/lib/calendar";
import { sendReservationConfirmed, sendReservationDeclined } from "@/lib/emails";
import { buildDossiers } from "@/lib/storyteller-dossier";

/**
 * Las visitas que cuentan para el mínimo del mes: las terminadas y los
 * rechazos de la propia casa.
 *
 * La pantalla dice "un refus compte comme une visite offerte", así que la cifra
 * tiene que subir al rechazar. Antes solo contaba las terminadas, y la casa veía
 * el mismo número justo después de que se le dijera que había cambiado.
 *
 * Las terminadas cuentan por el día de la visita; los rechazos, por el día en
 * que se decidieron, que es cuando la casa gastó esa visita. Una demanda
 * caducada no cuenta: no es un rechazo.
 */
async function visitasDelMes(admin: ReturnType<typeof createAdminClient>, venueId: string, desde: Date) {
  const [terminadas, rechazadas] = await Promise.all([
    admin
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("venue_id", venueId)
      .eq("status", "completed")
      .gte("slot_start", desde.toISOString()),
    admin
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("venue_id", venueId)
      .eq("status", "declined")
      .eq("declined_reason", MOTIVO_CASA)
      .gte("declined_at", desde.toISOString()),
  ]);
  return (terminadas.count ?? 0) + (rechazadas.count ?? 0);
}

const MINIMO_MENSUAL = 5;

// Así marca esta ruta un rechazo de la casa, para distinguirlo de uno del admin.
const MOTIVO_CASA = "Refusée par la maison";

// Una demanda caducada se sigue enseñando unos días, para que la casa sepa que
// se cerró sola y no crea que la ha penalizado el silencio.
const CADUCADAS_VISIBLES_DIAS = 14;

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
      .select("id, name, availability")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    const ahora = new Date();
    const visiblesDesde = new Date(ahora.getTime() - CADUCADAS_VISIBLES_DIAS * 86400000);
    const { data: pendientes } = await admin
      .from("reservations")
      .select("id, creator_id, slot_start, party_size, nights, special_requests, created_at")
      .eq("venue_id", maison.id)
      .eq("status", "pending_review")
      .gte("slot_start", visiblesDesde.toISOString())
      .order("slot_start", { ascending: true });

    const filas = pendientes ?? [];
    const dossiers = await buildDossiers(admin, filas.map((r) => r.creator_id));

    const desde = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1));
    const monthVisits = await visitasDelMes(admin, maison.id, desde);

    // Qué días tiene abiertos la casa. Si no llegan demandas, el motivo suele
    // estar aquí, y la pantalla vacía lo dice.
    const franjas = Array.isArray(maison.availability) ? (maison.availability as { day?: number }[]) : [];
    const openDays = [...new Set(franjas.map((w) => w.day).filter((d): d is number => typeof d === "number"))];

    return NextResponse.json({
      maison: maison.name,
      requests: filas.map((r) => ({
        id: r.id,
        slotStart: r.slot_start,
        partySize: r.party_size,
        nights: r.nights,
        note: r.special_requests ?? null,
        createdAt: r.created_at,
        // La fecha pedida ya pasó sin respuesta: se cerró sola y no cuenta
        // como rechazo. No se puede aceptar ni rechazar.
        expired: new Date(r.slot_start) < ahora,
        dossier: dossiers.get(r.creator_id) ?? null,
      })),
      monthVisits,
      guaranteed: MINIMO_MENSUAL,
      openDays,
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
      .select("id, name, address, photos")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    // La reserva tiene que ser de esta casa y seguir pendiente. Sin las dos
    // condiciones, una maison podría tocar la reserva de otra, o revivir una
    // que el admin ya resolvió.
    const { data: r } = await admin
      .from("reservations")
      .select("id, venue_id, creator_id, slot_start, nights, party_size, status")
      .eq("id", id)
      .maybeSingle();
    if (!r || r.venue_id !== maison.id) {
      return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
    }
    if (r.status !== "pending_review") {
      return NextResponse.json({ error: "Cette demande a déjà été traitée." }, { status: 409 });
    }
    // Aceptar una fecha que ya pasó cita a alguien a una hora que no existe, y
    // rechazarla le costaría a la casa una visita del mes por no haber abierto
    // la app a tiempo.
    if (new Date(r.slot_start) < new Date()) {
      return NextResponse.json({ error: "Cette demande a expiré.", expired: true }, { status: 409 });
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
            start,
            partySize: r.party_size ?? undefined,
            coverUrl: (maison.photos as string[] | null)?.[0] ?? null,
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
        declined_reason: MOTIVO_CASA,
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
