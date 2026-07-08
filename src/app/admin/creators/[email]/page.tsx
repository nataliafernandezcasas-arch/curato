import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin/auth";
import { getPhylloAccounts, getPhylloProfile, getPhylloContents, summarizeMetrics } from "@/lib/phyllo/client";
import CreatorEditForm from "./edit-form";

export const dynamic = "force-dynamic";

const RES_STATUS: Record<string, { label: string; color: string }> = {
  pending_review: { label: "En attente", color: "text-amber-400 border-amber-400/20 bg-amber-400/5" },
  confirmed: { label: "Confirmée", color: "text-champagne/70 border-champagne/20 bg-champagne/5" },
  completed: { label: "Complétée", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" },
  declined: { label: "Refusée", color: "text-red-400/70 border-red-400/20 bg-red-400/5" },
  cancelled: { label: "Annulée", color: "text-white/40 border-white/10 bg-white/5" },
  no_show: { label: "No-show", color: "text-red-400/70 border-red-400/20 bg-red-400/5" },
};

const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`);
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }) : "—";

export default async function CreatorAdminProfile({ params }: { params: Promise<{ email: string }> }) {
  if (!(await isAdmin())) return notFound();

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail).toLowerCase();
  const supabase = createAdminClient();

  const { data: creator } = await supabase
    .from("creators")
    .select("id, full_name, handle, email, monthly_credit_cop, credit_used_cop, followers, stage, instagram_connected, phyllo_account_id, phyllo_connected_at, followers_count, engagement_rate")
    .eq("email", email)
    .maybeSingle();
  if (!creator) return notFound();

  // Reservations (the places they visited) + venue names, fetched separately to
  // avoid embed ambiguity.
  const { data: reservations } = await supabase
    .from("reservations")
    .select("id, status, slot_start, credits_cost, party_size, content_photo_paths, venue_id")
    .eq("creator_id", creator.id)
    .order("slot_start", { ascending: false });
  const res = reservations ?? [];
  const venueIds = [...new Set(res.map((r) => r.venue_id).filter(Boolean))];
  const { data: venues } = venueIds.length
    ? await supabase.from("comercios").select("id, name, address, arrondissement").in("id", venueIds)
    : { data: [] };
  const venueById = new Map((venues ?? []).map((v) => [v.id, v]));

  const totalVisits = res.length;
  const completedVisits = res.filter((r) => r.status === "completed").length;

  const monthlyCredit = creator.monthly_credit_cop ?? 0;
  const usedCredit = creator.credit_used_cop ?? 0;
  const remaining = monthlyCredit - usedCredit;
  const usedPercent = monthlyCredit > 0 ? Math.min((usedCredit / monthlyCredit) * 100, 100) : 0;

  // Images they posted: live Instagram feed via Phyllo + any Curato visit content.
  let phylloPosts: { url: string | null; thumbnail: string | null }[] = [];
  let phylloAvatar: string | null = null;
  if (creator.instagram_connected && creator.phyllo_account_id) {
    try {
      const accounts = await getPhylloAccounts(creator.phyllo_account_id);
      const acc = accounts?.data?.[0];
      if (acc?.id) {
        const [p, c] = await Promise.all([getPhylloProfile(acc.id), getPhylloContents(acc.id, 50)]);
        const { metrics } = summarizeMetrics(p?.data?.[0], c?.data ?? [], "");
        phylloAvatar = metrics.imageUrl;
        phylloPosts = metrics.recentPosts.map((x) => ({ url: x.url, thumbnail: x.thumbnail }));
      }
    } catch {
      /* Phyllo best-effort */
    }
  }
  const initials = (creator.full_name || creator.handle || "?")
    .replace(/^@/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();
  const visitPhotos = res.flatMap((r) => (r.content_photo_paths as string[] | null) ?? []).filter((u) => typeof u === "string" && /^https?:\/\//.test(u));

  const igConnected = creator.instagram_connected === true;
  const phylloFollowers = creator.followers_count ?? null;
  const engagementPct = creator.engagement_rate != null ? (creator.engagement_rate * 100).toFixed(1) : null;
  const connectedDate = creator.phyllo_connected_at ? fmtDate(creator.phyllo_connected_at) : null;

  return (
    <main className="max-w-[900px] mx-auto px-5 py-14">
      <Link href="/admin/creators" className="inline-flex items-center gap-2 font-serif text-[11px] tracking-[0.25em] uppercase text-white/30 hover:text-white transition-colors mb-10">
        ← Créateurs
      </Link>

      {/* Hero card */}
      <div className="border border-white/10 bg-white/5 p-8 md:p-10 mb-8">
        <div className="flex items-start justify-between flex-wrap gap-6 mb-6">
          <div className="flex items-start gap-5">
            {/* Instagram profile photo (Phyllo) — falls back to initials */}
            <div className="w-[72px] h-[72px] rounded-full overflow-hidden shrink-0 bg-white/5 border border-white/10 flex items-center justify-center">
              {phylloAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={phylloAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-[20px] text-champagne/60">{initials}</span>
              )}
            </div>
            <div>
              <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-3">
                Créateur · Curato{creator.stage === "archived" ? " · Archivé" : ""}
              </p>
              <h1 className="font-serif text-3xl font-light tracking-[0.25em] uppercase text-white mb-2">{creator.full_name || "—"}</h1>
              {creator.handle && (
                <a href={`https://instagram.com/${creator.handle}`} target="_blank" rel="noopener noreferrer" className="font-serif text-[14px] text-champagne/60 hover:text-champagne transition-colors">
                  @{creator.handle}
                </a>
              )}
              <p className="font-serif text-[13px] text-white/30 mt-1">{creator.email}</p>

              {/* 3 latest posts */}
              {phylloPosts.length > 0 && (
                <div className="flex gap-1.5 mt-4">
                  {phylloPosts.slice(0, 3).map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={i} href={p.url ?? undefined} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white/5 overflow-hidden block shrink-0 hover:opacity-80 transition-opacity">
                      {p.thumbnail && <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            {creator.followers != null && creator.followers > 0 && (
              <div className="mb-4">
                <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">Abonnés</p>
                <p className="font-serif text-2xl font-light text-white">{fmtK(creator.followers)}</p>
              </div>
            )}
            <div>
              <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">Crédit disponible</p>
              <p className="font-serif text-2xl font-light text-champagne">€{remaining}</p>
              <p className="font-serif text-[11px] text-white/30 mt-0.5">de €{monthlyCredit} par mois</p>
            </div>
          </div>
        </div>

        {monthlyCredit > 0 && (
          <div className="h-px bg-white/10 relative mb-2">
            <div className="h-full bg-champagne/50 transition-all duration-700" style={{ width: `${usedPercent}%` }} />
          </div>
        )}
        <p className="font-serif text-[11px] text-white/25 mb-2">€{usedCredit} dépensés ce mois</p>

        <CreatorEditForm
          email={creator.email as string}
          initial={{
            full_name: creator.full_name ?? "",
            handle: creator.handle ?? "",
            followers: creator.followers ?? null,
            monthly_credit_cop: creator.monthly_credit_cop ?? null,
            stage: creator.stage ?? "active",
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-white/10 mb-10">
        {[
          { label: "Réservations", value: totalVisits },
          { label: "Complétées", value: completedVisits },
          { label: "Crédits dépensés", value: `€${usedCredit}` },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 px-6 py-5">
            <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2">{s.label}</p>
            <p className="font-serif text-2xl font-light text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Instagram · Phyllo */}
      <div className="border border-white/10 bg-white/5 p-6 md:p-8 mb-10">
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/40 mb-5">Instagram · Phyllo</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2">État</p>
            {igConnected ? (
              <>
                <p className="font-serif text-[15px] font-light text-champagne">Connecté</p>
                {connectedDate && <p className="font-serif text-[12px] text-white/30 mt-0.5">{connectedDate}</p>}
              </>
            ) : (
              <p className="font-serif text-[15px] font-light text-white/40">Non connecté</p>
            )}
          </div>
          <div>
            <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2">Engagement</p>
            <p className="font-serif text-[15px] font-light text-white">{engagementPct != null ? `${engagementPct}%` : <span className="text-white/40">—</span>}</p>
          </div>
          <div>
            <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2">Abonnés (Phyllo)</p>
            <p className="font-serif text-[15px] font-light text-white">{phylloFollowers != null ? fmtK(phylloFollowers) : <span className="text-white/40">N/D</span>}</p>
          </div>
        </div>
      </div>

      {/* Posted images */}
      {(phylloPosts.length > 0 || visitPhotos.length > 0) && (
        <div className="mb-12">
          <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/40 mb-6">Publications récentes</p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-1">
            {phylloPosts.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a key={`ph-${i}`} href={p.url ?? undefined} target="_blank" rel="noopener noreferrer" className="group aspect-square bg-white/5 overflow-hidden block">
                {p.thumbnail && <img src={p.thumbnail} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />}
              </a>
            ))}
            {visitPhotos.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a key={`v-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="group aspect-square bg-white/5 overflow-hidden block">
                {/\.(mp4|mov|webm)$/i.test(url) ? (
                  <video src={url} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Reservations (places visited) */}
      <div>
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/40 mb-6">
          Réservations {totalVisits > 0 && `(${totalVisits})`}
        </p>
        {totalVisits === 0 ? (
          <div className="border border-white/8 py-16 text-center">
            <p className="font-serif text-[15px] font-light text-white/30">Aucune réservation pour le moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/8">
            {res.map((r) => {
              const s = RES_STATUS[r.status] || { label: r.status, color: "text-white/40 border-white/10 bg-white/5" };
              const v = venueById.get(r.venue_id) as { name?: string; address?: string; arrondissement?: string } | undefined;
              return (
                <div key={r.id} className="py-6 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <span className={`font-serif text-[10px] tracking-[0.2em] uppercase border px-2.5 py-1 ${s.color}`}>{s.label}</span>
                    <h3 className="font-serif text-[17px] font-light text-white mt-2">{v?.name || "—"}</h3>
                    <p className="font-serif text-[13px] text-white/40 mt-0.5">
                      {[v?.arrondissement ? `Paris ${v.arrondissement}` : null, v?.address].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {r.credits_cost > 0 && <p className="font-serif text-lg font-light text-champagne">€{r.credits_cost}</p>}
                    <p className="font-serif text-[12px] text-white/30 mt-1">{fmtDate(r.slot_start)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
