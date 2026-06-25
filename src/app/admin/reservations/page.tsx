import { createAdminClient } from "@/lib/supabase/admin";
import ReservationsAdmin from "./reservations-admin";

export const dynamic = "force-dynamic";

function whenLabel(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

export default async function AdminReservationsPage() {
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("reservations")
    .select("id, slot_start, party_size, special_requests, credits_cost, created_at, creator_id, venue_id")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false });

  const reservations = rows ?? [];
  const creatorIds = [...new Set(reservations.map((r) => r.creator_id))];
  const venueIds = [...new Set(reservations.map((r) => r.venue_id))];

  const [{ data: creators }, { data: venues }] = await Promise.all([
    admin.from("creators").select("id, full_name, handle").in("id", creatorIds),
    admin.from("comercios").select("id, name").in("id", venueIds),
  ]);

  const creatorMap = new Map((creators ?? []).map((c) => [c.id, c]));
  const venueMap = new Map((venues ?? []).map((v) => [v.id, v]));

  const items = reservations.map((r) => ({
    id: r.id as string,
    venueId: r.venue_id as string,
    venueName: venueMap.get(r.venue_id)?.name ?? "Maison",
    creatorName: creatorMap.get(r.creator_id)?.full_name ?? "Créateur",
    creatorHandle: (creatorMap.get(r.creator_id)?.handle as string | null) ?? null,
    whenLabel: whenLabel(r.slot_start),
    partySize: (r.party_size as number) ?? 1,
    note: (r.special_requests as string | null) ?? null,
    credits: (r.credits_cost as number) ?? 0,
  }));

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-12">
      <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-3">
        Demandes en attente
      </p>
      <h1 className="font-serif text-[32px] font-light tracking-[0.15em] uppercase text-white mb-10">
        Réservations
      </h1>
      <ReservationsAdmin items={items} />
    </div>
  );
}
