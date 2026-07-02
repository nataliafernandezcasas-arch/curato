import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending_review: "En attente",
  confirmed: "Confirmé",
  declined: "Refusé",
  cancelled: "Annulé",
  completed: "Visité",
  no_show: "No-show",
};

function formatFollowers(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export default async function AdminCreatorsPage() {
  const admin = createAdminClient();

  const [{ data: creators }, { data: reservations }, { data: venues }] = await Promise.all([
    admin
      .from("creators")
      .select("id, full_name, handle, email, followers, monthly_credit_cop, instagram_connected, engagement_rate, partnership_stage")
      // Only accepted creators (active members), never prospects/empty imports.
      .in("stage", ["active", "activo"])
      .order("full_name", { ascending: true }),
    admin.from("reservations").select("creator_id, venue_id, status, slot_start"),
    admin.from("comercios").select("id, name"),
  ]);

  const venueName = new Map((venues ?? []).map((v) => [v.id, v.name as string]));

  // Group reservations (visits) by creator.
  const visitsByCreator = new Map<string, { venue: string; status: string }[]>();
  for (const r of reservations ?? []) {
    const list = visitsByCreator.get(r.creator_id) ?? [];
    list.push({ venue: venueName.get(r.venue_id) ?? "—", status: r.status as string });
    visitsByCreator.set(r.creator_id, list);
  }

  const list = creators ?? [];

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-12">
      <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/70 mb-3">
        {list.length} créateurs
      </p>
      <h1 className="font-serif text-[32px] font-light tracking-[0.15em] uppercase text-white mb-10">
        Créateurs
      </h1>

      {list.length === 0 ? (
        <div className="text-center py-20 border border-white/10">
          <p className="font-serif text-[14px] font-light text-white/65">Aucun créateur pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((c) => {
            const visits = visitsByCreator.get(c.id) ?? [];
            const engagement =
              typeof c.engagement_rate === "number" ? `${(c.engagement_rate * 100).toFixed(1)}%` : null;
            return (
              <div key={c.id} className="border border-white/10 bg-black/40 p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  {/* Identity */}
                  <div>
                    <p className="font-serif text-[18px] font-light text-white">
                      {c.full_name || "—"}
                    </p>
                    <p className="font-serif text-[13px] text-white/65 mt-1">
                      {c.handle ? `@${c.handle}` : ""} {c.email ? `· ${c.email}` : ""}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/55">Abonnés</p>
                      <p className="font-serif text-[16px] text-white/80">{formatFollowers(c.followers)}</p>
                    </div>
                    <div>
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/55">Engagement</p>
                      <p className="font-serif text-[16px] text-white/80">{engagement ?? "—"}</p>
                    </div>
                    <div>
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/55">Budget</p>
                      <p className="font-serif text-[16px] text-champagne">€{c.monthly_credit_cop ?? 0}</p>
                    </div>
                    <div>
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/55">Instagram</p>
                      <p className={`font-serif text-[13px] ${c.instagram_connected ? "text-emerald-400" : "text-white/55"}`}>
                        {c.instagram_connected ? "Connecté" : "Non connecté"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visits */}
                {visits.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-white/15">
                    <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-champagne/70 mb-3">
                      Visites · {visits.length}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {visits.map((v, i) => (
                        <span
                          key={i}
                          className="font-serif text-[12px] text-white/70 border border-white/10 px-3 py-1.5"
                        >
                          {v.venue} <span className="text-white/55">· {STATUS_LABEL[v.status] ?? v.status}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
