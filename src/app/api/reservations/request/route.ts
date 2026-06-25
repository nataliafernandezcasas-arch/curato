import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReservationRequested, sendReservationAdminAlert } from "@/lib/emails";

// Where new-request alerts are sent (the Curato inbox Natalia manages).
const ADMIN_INBOX = "hello@curatocollective.com";

// Creates a reservation REQUEST (status = pending_review). Credits are NOT
// deducted here — that happens when an admin confirms the request. The insert
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
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!creator) {
      return NextResponse.json({ error: "Profil créateur introuvable." }, { status: 404 });
    }

    // 3. Validate the venue is a live, reservable maison.
    const { data: venue } = await admin
      .from("comercios")
      .select("id, name, category_id, is_reservable")
      .eq("id", venueId)
      .maybeSingle();
    if (!venue || !venue.is_reservable) {
      return NextResponse.json({ error: "Maison indisponible." }, { status: 404 });
    }

    // 4. Compute the credit cost from the venue's category (hotels bill per night).
    let creditsCost = 0;
    if (venue.category_id) {
      const { data: cost } = await admin
        .from("category_costs")
        .select("credits_per_booking, unit")
        .eq("category_id", venue.category_id)
        .maybeSingle();
      if (cost) {
        creditsCost =
          cost.unit === "night" && nights && nights > 0
            ? cost.credits_per_booking * nights
            : cost.credits_per_booking;
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
      return NextResponse.json({ error: `Erreur : ${insertErr.message}` }, { status: 500 });
    }

    // 6. Notify the storyteller + admin. Best-effort: a mail failure must never
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
      await sendReservationAdminAlert({
        to: ADMIN_INBOX,
        creatorName: creator.full_name || creator.email || "Créateur",
        creatorHandle: creator.handle,
        maisonName: venue.name,
        whenLabel,
        partySize: ps,
        note: specialRequests || null,
      });
    } catch (mailErr) {
      console.error("Reservation emails failed:", mailErr);
    }

    return NextResponse.json({ ok: true, reservationId: reservation.id, creditsCost });
  } catch {
    return NextResponse.json({ error: "Erreur serveur. Réessayez." }, { status: 500 });
  }
}
