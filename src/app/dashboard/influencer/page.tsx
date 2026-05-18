"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Phone, SignOut } from "@phosphor-icons/react";

type Offer = {
  id: string;
  title: string;
  description: string;
  category: string;
  address: string;
  reservation_phone: string;
  photos: string[];
  visit_value_cop: number;
  available_hours: string;
  comercios: { name: string } | null;
};

type Profile = {
  full_name: string | null;
  handle: string | null;
  monthly_credit_cop: number | null;
  credit_used_cop: number | null;
  followers: number | null;
};

const CAT_LABELS: Record<string, string> = {
  gastronomy: "Gastronomie",
  beauty: "Beauté",
  wellness: "Bien-être",
  hospitality: "Hôtellerie",
  fashion: "Mode",
  art: "Art & Culture",
};

const CAT_KEYS = ["all", "gastronomy", "beauty", "wellness", "hospitality", "fashion", "art"];

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export default function InfluencerDashboard() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [offersLoading, setOffersLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setProfileLoading(false); return; }

      const { data: creator } = await supabase
        .from("creators")
        .select("full_name, handle, monthly_credit_cop, credit_used_cop, followers")
        .eq("email", (user.email || "").toLowerCase())
        .maybeSingle();

      setProfile(creator);
      setProfileLoading(false);
    }
    loadProfile();
  }, []);

  useEffect(() => {
    async function loadOffers() {
      setOffersLoading(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      let q = supabase.from("offers").select("*, comercios(name)").eq("is_active", true);
      if (catFilter !== "all") q = q.eq("category", catFilter);
      const { data } = await q.order("created_at", { ascending: false });
      setOffers((data || []) as unknown as Offer[]);
      setOffersLoading(false);
    }
    loadOffers();
  }, [catFilter]);

  async function signOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const monthlyCredit = profile?.monthly_credit_cop ?? 0;
  const usedCredit = profile?.credit_used_cop ?? 0;
  const remaining = monthlyCredit - usedCredit;
  const usedPercent = monthlyCredit > 0 ? Math.min((usedCredit / monthlyCredit) * 100, 100) : 0;

  return (
    <div className="min-h-[100dvh] bg-charcoal-deep">

      {/* Nav */}
      <nav className="border-b border-white/10 px-5 h-14 flex items-center bg-black/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <img src="/logo-curato-simple.png" alt="curato" style={{ height: "12px", width: "auto", display: "block" }} />
            </Link>
            <div className="w-px h-3 bg-white/10" />
            <Link href="/dashboard/influencer" className="font-serif text-[12px] tracking-wider text-champagne">
              Adresses
            </Link>
            <Link href="/dashboard/influencer/visits" className="font-serif text-[12px] tracking-wider text-white/75 hover:text-champagne transition-colors">
              Mes visites
            </Link>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 font-serif text-[11px] tracking-wider text-white/75 hover:text-champagne transition-colors"
          >
            <SignOut size={14} />
            Sortir
          </button>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-5 py-10">

        {/* ── Profile header ── */}
        <div className="border-b border-white/8 mb-10 pb-10">
          {profileLoading ? (
            <div className="h-20 flex items-center">
              <div className="w-48 h-4 bg-white/5 animate-pulse" />
            </div>
          ) : (
            <div className="flex items-end justify-between flex-wrap gap-6">

              {/* Left: name + handle */}
              <div>
                <p className="font-serif text-[10px] tracking-[0.4em] uppercase text-champagne/90 mb-3">
                  Bonjour
                </p>
                <h1 className="font-serif text-[32px] md:text-[40px] font-light tracking-[0.15em] uppercase text-white leading-none mb-3">
                  {profile?.full_name || profile?.handle || "Créateur"}
                </h1>
                {profile?.handle && (
                  <a
                    href={`https://instagram.com/${profile.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-[13px] text-champagne/90 hover:text-champagne transition-colors tracking-widest"
                  >
                    @{profile.handle}
                  </a>
                )}
              </div>

              {/* Right: stats */}
              <div className="flex items-end gap-8 flex-wrap">

                {/* Followers */}
                {profile?.followers != null && profile.followers > 0 && (
                  <div className="text-right">
                    <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/75 mb-1">
                      Abonnés
                    </p>
                    <p className="font-serif text-[32px] font-light text-white leading-none">
                      {formatFollowers(profile.followers)}
                    </p>
                  </div>
                )}

                {/* Divider */}
                {profile?.followers != null && profile.followers > 0 && (
                  <div className="w-px h-10 bg-white/10 self-center" />
                )}

                {/* Credit */}
                <div className="text-right">
                  <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/75 mb-1">
                    Crédit disponible
                  </p>
                  <p className="font-serif text-[32px] font-light text-champagne leading-none">
                    €{remaining}
                  </p>
                  {monthlyCredit > 0 && (
                    <p className="font-serif text-[11px] text-white/75 mt-1">
                      sur €{monthlyCredit} ce mois
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Credit bar */}
          {!profileLoading && monthlyCredit > 0 && (
            <div className="mt-6 h-px bg-white/8 relative">
              <div
                className="absolute top-0 left-0 h-full bg-champagne/50 transition-all duration-700"
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* ── Category filters ── */}
        <div className="flex gap-1 mb-8 flex-wrap">
          {CAT_KEYS.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`font-serif text-[11px] tracking-[0.2em] uppercase px-4 py-2 transition-all duration-200 ${
                catFilter === c
                  ? "bg-champagne text-charcoal-deep"
                  : "text-white/85 border border-white/25 hover:border-champagne/60 hover:text-champagne"
              }`}
            >
              {c === "all" ? "Toutes" : CAT_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Label */}
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/90 mb-8">
          Adresses sélectionnées · Paris
        </p>

        {/* ── Offers grid ── */}
        {offersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-charcoal-deep">
                <div className="aspect-[4/3] bg-white/5 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-white/5 animate-pulse w-3/4" />
                  <div className="h-3 bg-white/5 animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-24 border border-white/15">
            <p className="font-serif text-[16px] font-light text-white/95 mb-2">
              Aucune adresse disponible pour le moment.
            </p>
            <p className="font-serif text-[13px] font-light text-white/70 italic">
              De nouvelles adresses arrivent chaque saison.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-charcoal-deep group relative overflow-hidden">
                {/* Photo */}
                <div className="aspect-[4/3] bg-charcoal-mid overflow-hidden relative">
                  {offer.photos?.[0] ? (
                    <img
                      src={offer.photos[0]}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-white/15">
                        {CAT_LABELS[offer.category] ?? offer.category}
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-3 left-4 font-serif text-[10px] tracking-[0.25em] uppercase text-champagne/70">
                    {CAT_LABELS[offer.category] ?? offer.category}
                  </span>
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="font-serif text-[17px] font-light text-white mb-1 group-hover:text-champagne transition-colors">
                    {offer.title}
                  </h3>
                  <p className="font-serif text-[12px] text-white/75 mb-3 tracking-wide">
                    {offer.comercios?.name}
                  </p>
                  {offer.description && (
                    <p className="font-serif text-[13px] font-light text-white/85 leading-relaxed mb-4 line-clamp-2">
                      {offer.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-white/15">
                    <div className="flex items-center gap-1.5 text-white/75">
                      <MapPin size={12} />
                      <span className="font-serif text-[12px] font-light">{offer.address}</span>
                    </div>
                    {offer.reservation_phone && (
                      <a
                        href={`https://wa.me/${offer.reservation_phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-4 py-2 hover:bg-copper hover:text-white transition-all duration-300"
                      >
                        <Phone size={12} />
                        Réserver
                      </a>
                    )}
                  </div>
                  {offer.visit_value_cop > 0 && (
                    <p className="font-serif text-[11px] text-champagne/90 mt-3">
                      Jusqu'à €{offer.visit_value_cop}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
