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

  // Las valoraciones de las visitas (migración 049), aparte y tolerante: sin
  // la columna, la sección no sale.
  const { data: rated } = await admin
    .from("reservations")
    .select("id, slot_start, creator_id, venue_id, rating, rating_note, rated_at")
    .not("rating", "is", null)
    .order("rated_at", { ascending: false })
    .limit(50);
  const valoradas = rated ?? [];

  const creatorIds = [...new Set([...reservations, ...valoradas].map((r) => r.creator_id))];
  const venueIds = [...new Set([...reservations, ...valoradas].map((r) => r.venue_id))];

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

      {valoradas.length > 0 && (
        <section className="mt-16">
          <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-6">
            Avis des storytellers
          </p>
          <ul className="space-y-4">
            {valoradas.map((r) => (
              <li key={r.id as string} className="border border-white/10 rounded-[14px] p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-serif text-[16px] text-white">
                    {venueMap.get(r.venue_id)?.name ?? "Maison"}
                    <span className="text-white/50"> · {creatorMap.get(r.creator_id)?.full_name ?? "Créateur"}</span>
                  </p>
                  <p className="text-[18px] tracking-[0.15em] text-champagne" aria-label={`${r.rating} / 5`}>
                    {"★".repeat(r.rating as number)}
                    <span className="text-white/20">{"★".repeat(5 - (r.rating as number))}</span>
                  </p>
                </div>
                <p className="mt-1 text-[12px] text-white/50">{whenLabel(r.slot_start as string)}</p>
                {r.rating_note && <p className="mt-3 text-[14px] text-white/80 whitespace-pre-line">{r.rating_note as string}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
