import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; color: string }> = {
  reserved:          { label: "Réservée",          color: "text-champagne/70 border-champagne/20 bg-champagne/5" },
  checked_in:        { label: "Arrivée",            color: "text-copper/70 border-copper/20 bg-copper/5" },
  content_pending:   { label: "Contenu en attente", color: "text-amber-400 border-amber-400/20 bg-amber-400/5" },
  content_submitted: { label: "Contenu envoyé",     color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" },
  completed:         { label: "Complétée",          color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" },
  cancelled:         { label: "Annulée",            color: "text-red-400/70 border-red-400/20 bg-red-400/5" },
  expired:           { label: "Expirée",            color: "text-white/30 border-white/10 bg-white/5" },
};

const CAT_LABELS: Record<string, string> = {
  gastronomy: "Gastronomie",
  beauty: "Beauté",
  wellness: "Bien-être",
  hospitality: "Hôtellerie",
};

export default async function CreatorAdminProfile({ params }: { params: Promise<{ email: string }> }) {
  const ok = await isAdmin();
  if (!ok) return notFound();

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail).toLowerCase();

  const supabase = createAdminClient();

  // Fetch creator
  const { data: creator } = await supabase
    .from("creators")
    .select("id, full_name, handle, email, monthly_credit_cop, credit_used_cop, followers, stage, instagram_connected, phyllo_connected_at, followers_count, engagement_rate, engagement_rate_updated_at")
    .eq("email", email)
    .maybeSingle();

  if (!creator) return notFound();

  // Fetch application
  const { data: application } = await supabase
    .from("applications")
    .select("id, instagram, website, message, created_at, status")
    .eq("email", email)
    .eq("type", "creator")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch visits with offers and content
  const { data: visits } = await supabase
    .from("visits")
    .select("id, status, visit_value_cop, reserved_at, check_in_at, completed_at, content_proof_urls, offers(title, address, category, comercios(name))")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });

  const monthlyCredit = creator.monthly_credit_cop ?? 0;
  const usedCredit = creator.credit_used_cop ?? 0;
  const remaining = monthlyCredit - usedCredit;
  const usedPercent = monthlyCredit > 0 ? Math.min((usedCredit / monthlyCredit) * 100, 100) : 0;

  const totalVisits = visits?.length ?? 0;
  const completedVisits = visits?.filter(v => v.status === "completed").length ?? 0;
  const allProofs = visits?.flatMap(v => (v.content_proof_urls ?? [])) ?? [];

  // Instagram / Phyllo connection
  const igConnected = creator.instagram_connected === true;
  const phylloFollowers = creator.followers_count ?? null;
  const engagementPct = creator.engagement_rate != null ? (creator.engagement_rate * 100).toFixed(1) : null;
  const connectedDate = creator.phyllo_connected_at
    ? new Date(creator.phyllo_connected_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`);

  return (
    <main className="max-w-[900px] mx-auto px-5 py-14">

      {/* Back */}
      {application && (
        <Link href={`/admin/applications/${application.id}`} className="inline-flex items-center gap-2 font-serif text-[11px] tracking-[0.25em] uppercase text-white/30 hover:text-white transition-colors mb-10">
          ← Candidature
        </Link>
      )}
      {!application && (
        <Link href="/admin" className="inline-flex items-center gap-2 font-serif text-[11px] tracking-[0.25em] uppercase text-white/30 hover:text-white transition-colors mb-10">
          ← Candidatures
        </Link>
      )}

      {/* Hero card */}
      <div className="border border-white/10 bg-white/5 p-8 md:p-10 mb-8">
        <div className="flex items-start justify-between flex-wrap gap-6 mb-8">
          <div>
            <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-3">Créateur · Curato</p>
            <h1 className="font-serif text-3xl font-light tracking-[0.25em] uppercase text-white mb-2">
              {creator.full_name}
            </h1>
            {creator.handle && (
              <a
                href={`https://instagram.com/${creator.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-[14px] text-champagne/60 hover:text-champagne transition-colors"
              >
                @{creator.handle}
              </a>
            )}
            <p className="font-serif text-[13px] text-white/30 mt-1">{creator.email}</p>
          </div>
          <div className="text-right">
            {creator.followers != null && creator.followers > 0 && (
              <div className="mb-4">
                <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">Seguidores</p>
                <p className="font-serif text-2xl font-light text-white">
                  {creator.followers >= 1000
                    ? `${(creator.followers / 1000).toFixed(creator.followers >= 10000 ? 0 : 1)}K`
                    : creator.followers}
                </p>
              </div>
            )}
            <div>
              <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">Crédito disponible</p>
              <p className="font-serif text-2xl font-light text-champagne">€{remaining}</p>
              <p className="font-serif text-[11px] text-white/30 mt-0.5">de €{monthlyCredit} mensuales</p>
            </div>
          </div>
        </div>

        {/* Credit bar */}
        {monthlyCredit > 0 && (
          <div className="h-px bg-white/10 relative mb-2">
            <div className="h-full bg-champagne/50 transition-all duration-700" style={{ width: `${usedPercent}%` }} />
          </div>
        )}
        <p className="font-serif text-[11px] text-white/25">€{usedCredit} usado este mes</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-px bg-white/10 mb-10">
        {[
          { label: "Visitas totales", value: totalVisits },
          { label: "Completadas", value: completedVisits },
          { label: "Fotos / Videos", value: allProofs.length },
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
            <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2">Estado</p>
            {igConnected ? (
              <>
                <p className="font-serif text-[15px] font-light text-champagne">Conectado</p>
                {connectedDate && <p className="font-serif text-[12px] text-white/30 mt-0.5">{connectedDate}</p>}
              </>
            ) : (
              <p className="font-serif text-[15px] font-light text-white/40">No conectado</p>
            )}
          </div>
          <div>
            <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2">Engagement</p>
            <p className="font-serif text-[15px] font-light text-white">
              {engagementPct != null ? `${engagementPct}%` : <span className="text-white/40">Pendiente</span>}
            </p>
          </div>
          <div>
            <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2">Seguidores (Phyllo)</p>
            <p className="font-serif text-[15px] font-light text-white">
              {phylloFollowers != null ? fmtK(phylloFollowers) : <span className="text-white/40">N/D</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Content proofs gallery */}
      {allProofs.length > 0 && (
        <div className="mb-12">
          <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/40 mb-6">Contenido publicado</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
            {allProofs.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group aspect-square bg-white/5 overflow-hidden block">
                {url.match(/\.(mp4|mov|webm)$/i) ? (
                  <video src={url} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" muted playsInline />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Visits list */}
      <div>
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/40 mb-6">
          Historial de visitas {totalVisits > 0 && `(${totalVisits})`}
        </p>

        {totalVisits === 0 ? (
          <div className="border border-white/8 py-16 text-center">
            <p className="font-serif text-[15px] font-light text-white/30">Sin visitas registradas aún.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/8">
            {(visits ?? []).map((visit) => {
              const s = STATUS[visit.status] || { label: visit.status, color: "text-white/40 border-white/10 bg-white/5" };
              const offer = visit.offers as any;
              const proofs: string[] = visit.content_proof_urls ?? [];
              return (
                <div key={visit.id} className="py-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`font-serif text-[10px] tracking-[0.2em] uppercase border px-2.5 py-1 ${s.color}`}>
                          {s.label}
                        </span>
                        <span className="font-serif text-[10px] tracking-[0.2em] uppercase text-white/30">
                          {CAT_LABELS[offer?.category] || offer?.category}
                        </span>
                      </div>
                      <h3 className="font-serif text-[17px] font-light text-white">{offer?.title}</h3>
                      <p className="font-serif text-[13px] text-white/40 mt-0.5">{offer?.comercios?.name} · {offer?.address}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {visit.visit_value_cop > 0 && (
                        <p className="font-serif text-lg font-light text-champagne">€{visit.visit_value_cop}</p>
                      )}
                      <p className="font-serif text-[12px] text-white/30 mt-1">
                        {new Date(visit.reserved_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Proof thumbnails */}
                  {proofs.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {proofs.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white/5 overflow-hidden block shrink-0">
                          {url.match(/\.(mp4|mov|webm)$/i) ? (
                            <video src={url} className="w-full h-full object-cover" muted playsInline />
                          ) : (
                            <img src={url} alt="" className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </main>
  );
}
