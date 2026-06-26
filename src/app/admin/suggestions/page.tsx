import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

export default async function AdminSuggestionsPage() {
  const admin = createAdminClient();

  const { data: suggestions } = await admin
    .from("venue_suggestions")
    .select("id, creator_id, venue_name, note, created_at")
    .order("created_at", { ascending: false });

  const rows = suggestions ?? [];
  const creatorIds = [...new Set(rows.map((s) => s.creator_id).filter(Boolean))];
  const { data: creators } = await admin
    .from("creators")
    .select("id, full_name, handle")
    .in("id", creatorIds.length ? creatorIds : ["00000000-0000-0000-0000-000000000000"]);
  const creatorMap = new Map((creators ?? []).map((c) => [c.id, c]));

  // Most-requested venues (normalized by lowercased name).
  const counts = new Map<string, { label: string; count: number }>();
  for (const s of rows) {
    const key = (s.venue_name as string).trim().toLowerCase();
    const entry = counts.get(key) ?? { label: s.venue_name as string, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  const top = [...counts.values()].sort((a, b) => b.count - a.count).filter((v) => v.count > 1).slice(0, 8);

  return (
    <div className="max-w-[1000px] mx-auto px-5 py-12">
      <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/70 mb-3">
        {rows.length} suggestions
      </p>
      <h1 className="font-serif text-[32px] font-light tracking-[0.15em] uppercase text-white mb-10">
        Suggestions
      </h1>

      {/* Most requested */}
      {top.length > 0 && (
        <div className="mb-12">
          <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-champagne/70 mb-4">
            Les plus demandées
          </p>
          <div className="flex flex-wrap gap-2">
            {top.map((v) => (
              <span key={v.label} className="font-serif text-[13px] text-white border border-champagne/25 bg-champagne/5 px-4 py-2">
                {v.label} <span className="text-champagne">· {v.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-20 border border-white/10">
          <p className="font-serif text-[14px] font-light text-white/65">Aucune suggestion pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((s) => {
            const c = s.creator_id ? creatorMap.get(s.creator_id) : null;
            return (
              <div key={s.id} className="border border-white/10 bg-black/40 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-serif text-[16px] text-white">{s.venue_name}</p>
                    {s.note && (
                      <p className="font-serif text-[13px] font-light text-white/55 italic mt-1">« {s.note} »</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-[12px] text-white/65">
                      {c ? c.full_name || (c.handle ? `@${c.handle}` : "—") : "—"}
                    </p>
                    <p className="font-serif text-[11px] text-white/45 mt-1">{formatDate(s.created_at)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
