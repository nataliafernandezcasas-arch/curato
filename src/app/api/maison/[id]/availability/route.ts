import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Availability of one maison for the booking picker: the weekly windows, the
// blocked dates, and the already-taken slots (times only, no creator info).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();
    const { data: venue } = await admin
      .from("comercios")
      .select("id, availability, blocked_slots, is_reservable, services, menu_urls")
      .eq("id", id)
      .maybeSingle();
    if (!venue || !venue.is_reservable) return NextResponse.json({ error: "Maison indisponible." }, { status: 404 });

    // Slots already requested/confirmed (so they can't be double-booked).
    const { data: taken } = await admin
      .from("reservations")
      .select("slot_start")
      .eq("venue_id", id)
      .in("status", ["pending_review", "confirmed"]);

    return NextResponse.json({
      availability: venue.availability ?? [],
      blocked: venue.blocked_slots ?? [],
      taken: (taken ?? []).map((r) => r.slot_start).filter(Boolean),
      // Los servicios y sus precios, tal como los escribe la propia maison. El
      // creador recibe euros, así que lo que ve antes de reservar tiene que ser
      // el precio real de la casa y no una unidad inventada.
      services: venue.services ?? [],
      // La carta o el folleto que subió la casa, para enseñarlo en su ficha.
      menuUrls: venue.menu_urls ?? [],
      // Lo que la casa ofrece por visita, en euros (migración 043).
      offerEur: await (async () => {
        const { data, error } = await admin.from("comercios").select("offer_eur").eq("id", id).maybeSingle();
        return !error && data ? ((data as { offer_eur?: number | null }).offer_eur ?? null) : null;
      })(),
    });
  } catch {
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}
