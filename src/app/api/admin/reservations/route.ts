import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { googleCalendarUrl, buildIcs } from "@/lib/calendar";
import { sendReservationConfirmed, sendReservationAlternatives } from "@/lib/emails";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://curatocollective.com";

// Format a Paris-local instant for display.
function whenLabel(d: Date): string {
  return d.toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

// Format a "YYYY-MM-DDTHH:MM" datetime-local string (no tz math).
function formatLocal(local: string): string {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return local;
  const [, y, mo, da, h, mi] = m;
  return `${da}/${mo}/${y} à ${h}:${mi}`;
}

type ProposedSlot = { iso: string; local: string };

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, action } = body as { id?: string; action?: string };
  if (!id || !action) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch the reservation + its creator + venue (no embeds — fetch separately).
  const { data: r } = await admin
    .from("reservations")
    .select("id, slot_start, nights, venue_id, creator_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!r) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }

  const { data: creator } = await admin
    .from("creators")
    .select("full_name, email")
    .eq("id", r.creator_id)
    .maybeSingle();
  const { data: venue } = await admin
    .from("comercios")
    .select("name, address")
    .eq("id", r.venue_id)
    .maybeSingle();

  const firstName = (creator?.full_name || "").split(" ")[0] || "vous";
  const maisonName = venue?.name || "la maison";

  if (action === "confirm") {
    const { error: upErr } = await admin
      .from("reservations")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", id);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // Build the calendar event (booking = 2h default; hotels = nights × 24h).
    const start = new Date(r.slot_start);
    const end = r.nights
      ? new Date(start.getTime() + r.nights * 86400000)
      : new Date(start.getTime() + 2 * 3600000);
    const event = {
      title: `Curato · ${maisonName}`,
      start,
      end,
      location: venue?.address || "",
      description: `Réservation Curato chez ${maisonName}.`,
    };

    try {
      if (creator?.email) {
        await sendReservationConfirmed({
          to: creator.email,
          firstName,
          maisonName,
          address: venue?.address ?? null,
          whenLabel: whenLabel(start),
          googleUrl: googleCalendarUrl(event),
          ics: buildIcs(event, `curato-${id}@curatocollective.com`),
        });
      }
    } catch (mailErr) {
      console.error("Confirmation email failed:", mailErr);
    }

    return NextResponse.json({ ok: true, status: "confirmed" });
  }

  if (action === "propose") {
    const slots = (body.slots as ProposedSlot[] | undefined)?.filter((s) => s?.iso && s?.local) ?? [];
    if (slots.length === 0) {
      return NextResponse.json({ error: "Proposez au moins un créneau." }, { status: 400 });
    }

    const { error: upErr } = await admin
      .from("reservations")
      .update({
        status: "declined",
        declined_at: new Date().toISOString(),
        proposed_slots: slots.map((s) => s.iso),
      })
      .eq("id", id);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    try {
      if (creator?.email) {
        await sendReservationAlternatives({
          to: creator.email,
          firstName,
          maisonName,
          slots: slots.map((s) => ({
            label: formatLocal(s.local),
            url: `${SITE_URL}/dashboard/storyteller/maison/${r.venue_id}?slot=${encodeURIComponent(s.local)}`,
          })),
        });
      }
    } catch (mailErr) {
      console.error("Alternatives email failed:", mailErr);
    }

    return NextResponse.json({ ok: true, status: "declined" });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
