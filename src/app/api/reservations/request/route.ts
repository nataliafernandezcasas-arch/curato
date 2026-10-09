import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReservationRequested, sendMaisonNewRequest } from "@/lib/emails";
import { avisar, AVISOS } from "@/lib/push/avisos";
import { pendientesDe } from "@/lib/pendientes";
import { agendaDe, estanciaImposibleDesde } from "@/lib/agenda";
import { isOpenSlot } from "@/lib/availability";
import { filtroDeUsuario } from "@/lib/identidad";
import { creditoDelMes, mesDeParis } from "@/lib/credito";
import { rangoDe } from "@/lib/oferta";
import { bloqueaReservas, VALIDACION_DESDE, type CifrasStory } from "@/lib/validacion";


// Creates a reservation REQUEST (status = pending_review). Its credits_cost
// counts against the creator's month as soon as it exists (src/lib/credito.ts)
// and stops counting if the request is declined or cancelled. The insert
// runs through the service-role client because the RLS insert guard on
// `reservations` requires a signed creator + a sufficient monthly credit
// balance, neither of which a request needs to satisfy up front.
export async function POST(request: NextRequest) {
  try {
    // 1. Identify the caller from their session (never trust a client-sent id).
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = await request.json();
    const { venueId, slotStart, partySize, specialRequests, nights } = body as {
      venueId?: string;
      slotStart?: string;
      partySize?: number;
      specialRequests?: string;
      nights?: number;
    };

    if (!venueId || !slotStart) {
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    }

    const admin = createAdminClient();

    // 2. Resolve the creator behind this user (owner_id, then email fallback).
    const { data: creator } = await admin
      .from("creators")
      .select("id, full_name, handle, email")
      .or(filtroDeUsuario(user))
      .maybeSingle();
    if (!creator) {
      return NextResponse.json({ error: "Profil créateur introuvable." }, { status: 404 });
    }

    // Una visita pasada sin todas sus stories y sus cifras bloquea la siguiente
    // (src/lib/validacion.ts): así las cifras llegan siempre. Sin la migración
    // 048 no se puede saber y no se bloquea.
    const { data: entregas, error: sinEntregas } = await admin
      .from("reservations")
      .select("id, status, slot_start, content_photo_paths, reach_stories")
      .eq("creator_id", creator.id)
      .in("status", ["confirmed", "completed"])
      .gte("slot_start", VALIDACION_DESDE)
      .lte("slot_start", new Date().toISOString());
    const sinEntregar = sinEntregas
      ? undefined
      : (entregas ?? []).find((r) =>
          bloqueaReservas({
            status: r.status as string,
            slot_start: r.slot_start as string,
            content_photo_paths: (r.content_photo_paths as string[] | null) ?? [],
            reach_stories: (r.reach_stories as CifrasStory[] | null) ?? null,
          })
        );
    if (sinEntregar) {
      return NextResponse.json(
        { code: "pendiente", error: "Complétez d'abord votre dernière visite." },
        { status: 409 }
      );
    }

    // 3. Validate the venue is a live, reservable maison.
    const { data: venue } = await admin
      .from("comercios")
      .select("id, name, email, owner_id, category_id, is_reservable, availability, blocked_slots")
      .eq("id", venueId)
      .maybeSingle();
    if (!venue || !venue.is_reservable) {
      return NextResponse.json({ error: "Maison indisponible." }, { status: 404 });
    }

    // Slot must fall inside the maison's availability (if configured) and not be
    // blocked or already taken.
    // Un hotel no tiene franjas de llegada: su agenda semanal describe cuándo
    // atiende, no a qué hora se puede llegar, y la pantalla manda siempre las
    // 15:00. Comprobarla contra las franjas rechazaba todas las peticiones de
    // cualquier hotel que tuviera agenda. Las fechas cerradas sí valen.
    //
    // Ahora cada casa dice cómo se reserva (migración 044). Por fechas, se
    // mira el día de llegada, el número de noches y que ninguna noche de la
    // estancia esté cerrada; por horas, que la hora caiga en una franja.
    const { data: conAgenda, error: sinAgenda } = await admin.from("comercios").select("agenda").eq("id", venue.id).maybeSingle();
    const agenda = agendaDe(sinAgenda ? null : (conAgenda as { agenda?: unknown } | null)?.agenda, venue.category_id);
    const abierta =
      agenda.modo === "dates"
        ? !estanciaImposibleDesde(slotStart, Number(nights) || 0, agenda, venue.blocked_slots ?? [])
        : isOpenSlot(slotStart, venue.availability ?? [], venue.blocked_slots ?? []);
    if (!abierta) {
      return NextResponse.json({ code: "unavailable", error: "Créneau indisponible." }, { status: 409 });
    }
    const { data: clash } = await admin
      .from("reservations")
      .select("id")
      .eq("venue_id", venue.id)
      .eq("slot_start", slotStart)
      .in("status", ["pending_review", "confirmed"])
      .maybeSingle();
    if (clash) {
      return NextResponse.json({ code: "taken", error: "Créneau déjà réservé." }, { status: 409 });
    }

    // 4. Lo que cuesta la visita: la oferta de la casa en euros (migración 043),
    // que es lo que el storyteller gasta. Una casa que aún no la ha puesto
    // cuesta lo mínimo de su categoría, también en euros. Antes caía en los
    // costes por categoría de la tabla category_costs, que eran créditos de
    // los de antes (2 por visita): una reserva costaba 2 € en vez de 200.
    const { data: conOferta, error: sinOferta } = await admin
      .from("comercios")
      .select("offer_eur")
      .eq("id", venue.id)
      .maybeSingle();
    const ofertaEur = !sinOferta ? ((conOferta as { offer_eur?: number | null } | null)?.offer_eur ?? null) : null;
    const creditsCost = ofertaEur || rangoDe(venue.category_id as string | null).min;

    // Que le quede crédito en el mes de la visita. Lo pedido y no decidido ya
    // cuenta: si no, se podrían pedir cinco cenas con el crédito de una.
    if (creditsCost > 0) {
      const credito = await creditoDelMes(admin, creator.id, mesDeParis(slotStart));
      if (credito.mensual > 0 && creditsCost > credito.restante) {
        return NextResponse.json(
          { code: "credit", restante: credito.restante, error: "Crédit insuffisant pour ce mois." },
          { status: 409 }
        );
      }
    }

    // 5. Record the request. slot_end is filled by a DB trigger for hotel stays.
    const { data: reservation, error: insertErr } = await admin
      .from("reservations")
      .insert({
        creator_id: creator.id,
        venue_id: venue.id,
        slot_start: slotStart,
        party_size: partySize && partySize > 0 ? partySize : 1,
        nights: nights && nights > 0 ? nights : null,
        status: "pending_review",
        credits_cost: creditsCost,
        special_requests: specialRequests || null,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Reservation insert error:", insertErr);
      return NextResponse.json({ error: "Erreur serveur. Réessayez." }, { status: 500 });
    }

    // 6. Notify the storyteller and the maison. Best-effort: a mail failure must never
    // fail the request — the reservation is already recorded.
    const whenLabel = new Date(slotStart).toLocaleString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });
    const firstName = (creator.full_name || "").split(" ")[0] || "vous";
    const ps = partySize && partySize > 0 ? partySize : 1;
    try {
      if (creator.email) {
        await sendReservationRequested({
          to: creator.email,
          firstName,
          maisonName: venue.name,
          whenLabel,
          partySize: ps,
        });
      }
      // A la casa, que es quien decide. Antes solo se avisaba al creador y al
      // buzón de Curato, así que la casa se enteraba si abría la app mientras
      // su plazo de cuarenta y ocho horas corría igual.
      if (venue.email) {
        await sendMaisonNewRequest({
          to: venue.email,
          creatorName: creator.full_name || creator.handle || "Un storyteller",
          creatorHandle: creator.handle,
          maisonName: venue.name,
          whenLabel,
          partySize: ps,
          note: specialRequests || null,
        });
      }
      // A Curato ya no le llega un correo por demanda: decide la casa, y el
      // panel de admin las enseña todas.
    } catch (mailErr) {
      console.error("Reservation emails failed:", mailErr);
    }

    // El plazo de la casa son cuarenta y ocho horas, así que el aviso en el
    // teléfono es lo que evita que se le vaya el tiempo sin abrir la app.
    await avisar(
      { ownerId: venue.owner_id ?? null, email: venue.email ?? null },
      AVISOS.nuevaDemanda(
        creator.full_name || creator.handle || "Un storyteller",
        whenLabel,
        reservation.id,
        await pendientesDe(admin, venue.id)
      )
    );

    return NextResponse.json({ ok: true, reservationId: reservation.id, creditsCost });
  } catch {
    return NextResponse.json({ error: "Erreur serveur. Réessayez." }, { status: 500 });
  }
}
