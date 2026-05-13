"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SignOut, InstagramLogo } from "@phosphor-icons/react";

type Creator = {
  full_name: string | null;
  handle: string | null;
  followers: number | null;
  email: string;
};

type Visit = {
  id: string;
  status: string;
  reserved_at: string;
  completed_at: string | null;
  content_proof_urls: string[];
  creators: Creator | null;
  offers: { title: string; category: string } | null;
};

type Comercio = {
  id: string;
  name: string;
  stage: string | null;
};

const STATUS: Record<string, { label: string; color: string }> = {
  reserved:          { label: "Réservée",          color: "text-champagne/70 border-champagne/20 bg-champagne/5" },
  checked_in:        { label: "En visite",          color: "text-copper/70 border-copper/20 bg-copper/5" },
  content_pending:   { label: "Contenu en attente", color: "text-amber-300 border-amber-400/30 bg-amber-400/5" },
  content_submitted: { label: "Contenu reçu",       color: "text-emerald-300 border-emerald-400/30 bg-emerald-400/5" },
  completed:         { label: "Complétée",          color: "text-emerald-300 border-emerald-400/30 bg-emerald-400/5" },
  cancelled:         { label: "Annulée",            color: "text-red-400/60 border-red-400/20 bg-red-400/5" },
  expired:           { label: "Expirée",            color: "text-white/25 border-white/10 bg-white/3" },
};

const CAT_LABELS: Record<string, string> = {
  gastronomy: "Gastronomie",
  beauty: "Beauté",
  wellness: "Bien-être",
  hospitality: "Hôtellerie",
};

function formatFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export default function BusinessDashboard() {
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Visit | null>(null);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/auth/sign-in"; return; }

      const { data: com } = await supabase
        .from("comercios")
        .select("id, name, stage")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!com) { setLoading(false); return; }
      setComercio(com);

      const { data } = await supabase
        .from("visits")
        .select("id, status, reserved_at, completed_at, content_proof_urls, creators(full_name, handle, followers, email), offers(title, category)")
        .eq("comercio_id", com.id)
        .order("reserved_at", { ascending: false });

      setVisits((data || []) as unknown as Visit[]);
      setLoading(false);
    }
    load();
  }, []);

  async function signOut() {
    const { createClient } = await import("@/lib/supabase/client");
    await (await import("@/lib/supabase/client")).createClient().auth.signOut();
    window.location.href = "/";
  }

  const totalVisits = visits.length;
  const withContent = visits.filter(v => (v.content_proof_urls?.length ?? 0) > 0).length;
  const allContent = visits.flatMap(v => v.content_proof_urls ?? []);

  return (
    <div className="min-h-[100dvh] bg-charcoal-deep">

      {/* Nav */}
      <nav className="border-b border-white/10 px-5 h-14 flex items-center sticky top-0 z-40 bg-charcoal-deep/90 backdrop-blur-sm">
        <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <img src="/logo-curato-simple.png" alt="curato" style={{ height: "12px", width: "auto", display: "block" }} />
            </Link>
            <div className="w-px h-3 bg-white/10" />
            <span className="font-serif text-[12px] tracking-wider text-champagne">Visites</span>
          </div>
          <button onClick={signOut} className="flex items-center gap-1.5 font-serif text-[11px] tracking-wider text-white/30 hover:text-white transition-colors">
            <SignOut size={14} />
            Sortir
          </button>
        </div>
      </nav>

      <div className="max-w-[1100px] mx-auto px-5 py-12">

        {loading ? (
          <p className="font-serif text-[14px] font-light text-white/30 py-20 text-center">Chargement…</p>
        ) : !comercio ? (
          <div className="py-24 text-center border border-white/8">
            <p className="font-serif text-[15px] font-light text-white/40">Votre maison n'est pas encore configurée.</p>
            <p className="font-serif text-[13px] text-white/25 mt-2">Contactez Curato pour activer votre accès.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-12">
              <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-4">Curato · Maison partenaire</p>
              <h1 className="font-serif text-4xl font-light tracking-[0.28em] uppercase text-white">{comercio.name}</h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-px bg-white/10 mb-12">
              {[
                { label: "Visites reçues", value: totalVisits },
                { label: "Avec contenu", value: withContent },
                { label: "Fichiers totaux", value: allContent.length },
              ].map((s) => (
                <div key={s.label} className="bg-charcoal-deep px-6 py-6">
                  <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2">{s.label}</p>
                  <p className="font-serif text-3xl font-light text-white">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Content gallery */}
            {allContent.length > 0 && (
              <div className="mb-14">
                <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/40 mb-6">Tout le contenu</p>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
                  {allContent.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square bg-white/5 overflow-hidden block group">
                      {url.match(/\.(mp4|mov|webm)$/i) ? (
                        <video src={url} className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" muted playsInline />
                      ) : (
                        <img src={url} alt="" className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Visits */}
            <div>
              <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/40 mb-6">
                Historique des visites {totalVisits > 0 && `(${totalVisits})`}
              </p>

              {totalVisits === 0 ? (
                <div className="border border-white/8 py-20 text-center">
                  <p className="font-serif text-[16px] font-light text-white/30">Aucune visite pour le moment.</p>
                  <p className="font-serif text-[13px] text-white/20 mt-2">Des créateurs vous découvriront prochainement.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/8">
                  {visits.map((visit) => {
                    const s = STATUS[visit.status] || { label: visit.status, color: "text-white/30 border-white/10 bg-white/3" };
                    const creator = visit.creators;
                    const proofs = visit.content_proof_urls ?? [];
                    return (
                      <div key={visit.id} className="py-8">
                        <div className="flex items-start justify-between gap-6 flex-wrap mb-5">

                          {/* Creator info */}
                          <div className="flex items-start gap-5">
                            {/* Avatar placeholder */}
                            <div className="w-12 h-12 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
                              <span className="font-serif text-[16px] font-light text-white/40">
                                {(creator?.full_name || creator?.handle || "?")[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-serif text-[17px] font-light text-white mb-1">
                                {creator?.full_name || creator?.handle || "Créateur"}
                              </p>
                              <div className="flex items-center gap-3 flex-wrap">
                                {creator?.handle && (
                                  <a
                                    href={`https://instagram.com/${creator.handle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 font-serif text-[12px] text-champagne/50 hover:text-champagne transition-colors"
                                  >
                                    <InstagramLogo size={12} />
                                    @{creator.handle}
                                  </a>
                                )}
                                {creator?.followers != null && creator.followers > 0 && (
                                  <span className="font-serif text-[12px] text-white/30">
                                    {formatFollowers(creator.followers)} seguidores
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Visit meta */}
                          <div className="text-right">
                            <span className={`inline-block font-serif text-[10px] tracking-[0.2em] uppercase border px-2.5 py-1 mb-2 ${s.color}`}>
                              {s.label}
                            </span>
                            <p className="font-serif text-[12px] text-white/30">
                              {new Date(visit.reserved_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                            {visit.offers?.category && (
                              <p className="font-serif text-[11px] text-white/20 mt-0.5">{CAT_LABELS[visit.offers.category] || visit.offers.category}</p>
                            )}
                          </div>
                        </div>

                        {/* Content proofs */}
                        {proofs.length > 0 ? (
                          <div>
                            <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/25 mb-3">Contenu · {proofs.length} fichier{proofs.length > 1 ? "s" : ""}</p>
                            <div className="flex gap-2 flex-wrap">
                              {proofs.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-20 h-20 md:w-24 md:h-24 bg-white/5 overflow-hidden block group shrink-0">
                                  {url.match(/\.(mp4|mov|webm)$/i) ? (
                                    <video src={url} className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" muted playsInline />
                                  ) : (
                                    <img src={url} alt="" className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" />
                                  )}
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : (
                          visit.status !== "cancelled" && visit.status !== "expired" && (
                            <p className="font-serif text-[12px] text-white/20 italic">Contenu en attente de publication…</p>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
