"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Phone, SignOut } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, type Lang } from "@/lib/i18n/translations";

// ────────────────────────────────────────────────────────────────────────────
// Types — mirror what we select from Supabase
// ────────────────────────────────────────────────────────────────────────────

type Profile = {
  full_name: string | null;
  handle: string | null;
  monthly_credit_cop: number | null;  // TODO: migrate to credit_balances + influencer_tiers
  credit_used_cop: number | null;
  followers: number | null;
};

type Category = {
  id: string;
  slug: string;
};

type Venue = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  arrondissement: string | null;
  contact_phone: string | null;
  category_id: string | null;
};

// Canonical category slugs (per migration 009). Used for both the filter UI
// and the per-card category badge. Order matches sort_order in the DB.
const CAT_SLUGS = ["hoteles", "gastronomia", "wellness", "belleza"] as const;
type CatSlug = (typeof CAT_SLUGS)[number];
type CatFilter = "all" | CatSlug;

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export default function InfluencerDashboard() {
  const { lang, setLang } = useLang();
  const t = translations[lang].influencerDashboard;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [catFilter, setCatFilter] = useState<CatFilter>("all");

  // ── Load profile (creator linked to current auth user)
  useEffect(() => {
    async function loadProfile() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfileLoading(false);
        return;
      }

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

  // ── Load canonical categories once (4 rows, used for filter + badges)
  useEffect(() => {
    async function loadCategories() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("id, slug")
        .order("sort_order", { ascending: true });
      setCategories((data ?? []) as Category[]);
    }
    loadCategories();
  }, []);

  // ── Load venues. Replaces the legacy `offers` query (table was renamed
  //    to `legacy_offers` in migration 009). Public RLS on `comercios`
  //    only exposes rows where `is_reservable = true` (i.e. partnership
  //    is signed). Until at least one venue is signed, this returns [].
  useEffect(() => {
    async function loadVenues() {
      if (categories.length === 0 && catFilter !== "all") return; // wait for categories before filtering
      setVenuesLoading(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      let q = supabase
        .from("comercios")
        .select("id, name, description, address, arrondissement, contact_phone, category_id")
        .eq("is_reservable", true);

      if (catFilter !== "all") {
        const cat = categories.find((c) => c.slug === catFilter);
        if (cat) q = q.eq("category_id", cat.id);
      }

      const { data } = await q.order("name", { ascending: true });
      setVenues((data ?? []) as Venue[]);
      setVenuesLoading(false);
    }
    loadVenues();
  }, [catFilter, categories]);

  async function signOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  // ── Category label resolver (slug → localized name)
  function categoryLabel(slug: string | undefined): string {
    switch (slug) {
      case "hoteles":     return t.catHoteles;
      case "gastronomia": return t.catGastronomia;
      case "wellness":    return t.catWellness;
      case "belleza":     return t.catBelleza;
      default:            return "";
    }
  }

  function categoryLabelFromId(catId: string | null): string {
    if (!catId) return "";
    const slug = categories.find((c) => c.id === catId)?.slug;
    return categoryLabel(slug);
  }

  // ── Credit display (still using legacy columns; TODO: migrate to
  //    credit_balances + influencer_tiers when reservation flow is built)
  const monthlyCredit = profile?.monthly_credit_cop ?? 0;
  const usedCredit = profile?.credit_used_cop ?? 0;
  const remaining = monthlyCredit - usedCredit;
  const usedPercent = monthlyCredit > 0 ? Math.min((usedCredit / monthlyCredit) * 100, 100) : 0;

  // ── Filter buttons config — "all" plus the 4 canonical category slugs
  const filterOptions: CatFilter[] = ["all", ...CAT_SLUGS];

  return (
    <div className="min-h-[100dvh] bg-charcoal-deep">

      {/* Nav */}
      <nav className="border-b border-white/10 px-5 h-14 flex items-center bg-black/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <img
                src="/logo-curato-simple.png"
                alt="curato"
                style={{ height: "12px", width: "auto", display: "block" }}
              />
            </Link>
            <div className="w-px h-3 bg-white/10" />
            <Link
              href="/dashboard/influencer"
              className="font-serif text-[12px] tracking-wider text-champagne"
            >
              {t.navAddresses}
            </Link>
            <Link
              href="/dashboard/influencer/visits"
              className="font-serif text-[12px] tracking-wider text-white/75 hover:text-champagne transition-colors"
            >
              {t.navVisits}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Language switcher */}
            <div className="flex items-center gap-3">
              {LANGS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLang(key)}
                  className={`font-serif text-[11px] tracking-[0.2em] transition-colors ${
                    lang === key ? "text-champagne" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="w-px h-3 bg-white/10" />

            <button
              onClick={signOut}
              className="flex items-center gap-1.5 font-serif text-[11px] tracking-wider text-white/75 hover:text-champagne transition-colors"
            >
              <SignOut size={14} />
              {t.signOut}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-5 py-10">

        {/* ── Profile header ── */}
        <div className="border-b border-white/8 mb-10 pb-10">
          {profileLoading ? (
            <div className="h-20 flex items-center">
              <div className="w-48 h-4 bg-white/10 animate-pulse" />
            </div>
          ) : (
            <div className="flex items-end justify-between flex-wrap gap-6">

              {/* Left: name + handle */}
              <div>
                <p className="font-serif text-[10px] tracking-[0.4em] uppercase text-champagne/90 mb-3">
                  {t.greeting}
                </p>
                <h1 className="font-serif text-[32px] md:text-[40px] font-light tracking-[0.15em] uppercase text-white leading-none mb-3">
                  {profile?.full_name || profile?.handle || t.fallbackName}
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
                      {t.followersLabel}
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
                    {t.creditLabel}
                  </p>
                  <p className="font-serif text-[32px] font-light text-champagne leading-none">
                    €{remaining}
                  </p>
                  {monthlyCredit > 0 && (
                    <p className="font-serif text-[11px] text-white/75 mt-1">
                      {t.creditOfMonth(monthlyCredit)}
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
          {filterOptions.map((slug) => {
            const label = slug === "all" ? t.catAll : categoryLabel(slug);
            const isActive = catFilter === slug;
            return (
              <button
                key={slug}
                onClick={() => setCatFilter(slug)}
                className={`font-serif text-[11px] tracking-[0.2em] uppercase px-4 py-2 transition-all duration-200 ${
                  isActive
                    ? "bg-champagne text-charcoal-deep"
                    : "text-white/85 border border-white/25 hover:border-champagne/60 hover:text-champagne"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Section label */}
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/90 mb-8">
          {t.selectedAddresses}
        </p>

        {/* ── Venues grid ── */}
        {venuesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-charcoal-deep">
                <div className="aspect-[4/3] bg-white/10 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-white/10 animate-pulse w-3/4" />
                  <div className="h-3 bg-white/10 animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-24 border border-white/15">
            <p className="font-serif text-[16px] font-light text-white/95 mb-2">
              {t.emptyTitle}
            </p>
            <p className="font-serif text-[13px] font-light text-white/70 italic">
              {t.emptySubtitle}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {venues.map((venue) => {
              const catLabel = categoryLabelFromId(venue.category_id);
              // Address line: prefer arrondissement if set, fall back to full address
              const addressDisplay = venue.arrondissement || venue.address || "";

              return (
                <div key={venue.id} className="bg-charcoal-deep group relative overflow-hidden">
                  {/* Photo placeholder — comercios doesn't have a photos
                      column yet. When added, render <img> from venue.photos[0]
                      with same hover/scale treatment as the previous offers. */}
                  <div className="aspect-[4/3] bg-charcoal-mid overflow-hidden relative">
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-white/25">
                        {catLabel}
                      </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-3 left-4 font-serif text-[10px] tracking-[0.25em] uppercase text-champagne/80">
                      {catLabel}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <h3 className="font-serif text-[17px] font-light text-white mb-1 group-hover:text-champagne transition-colors">
                      {venue.name}
                    </h3>
                    {venue.description && (
                      <p className="font-serif text-[13px] font-light text-white/85 leading-relaxed mb-4 line-clamp-2 mt-3">
                        {venue.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-white/15">
                      <div className="flex items-center gap-1.5 text-white/75">
                        <MapPin size={12} />
                        <span className="font-serif text-[12px] font-light">
                          {addressDisplay}
                        </span>
                      </div>
                      {/* Reservation button — for now opens phone link if a
                          contact phone exists. When the reservation modal is
                          built, swap this for a button that opens it. */}
                      {venue.contact_phone ? (
                        <a
                          href={`tel:${venue.contact_phone.replace(/\s+/g, "")}`}
                          className="flex items-center gap-1.5 font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-4 py-2 hover:bg-copper hover:text-white transition-all duration-300"
                        >
                          <Phone size={12} />
                          {t.reserve}
                        </a>
                      ) : (
                        <span className="font-serif text-[11px] tracking-widest uppercase text-white/40 border border-white/15 px-4 py-2">
                          {t.reserveSoon}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
