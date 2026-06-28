"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, SignOut } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";
import { isBeforeLaunch, LAUNCH_AT } from "@/lib/launch";
import ConnectInstagram from "./connect-instagram";
import SuggestVenue from "./suggest-venue";

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

// A maison = a signed venue from `comercios` (is_reservable = true).
type Maison = {
  id: string;
  name: string;
  arrondissement: string | null;
  address: string | null;
  description: string | null;
  photos: string[] | null;
  website_url: string | null;
  signed_at: string | null;
  category_id: string | null;
};

// Canonical category UUIDs are fixed in migration 009 — map them directly to
// their slug instead of embedding the `categories` relation. The display label
// is resolved per-language from the slug.
const CATEGORY_BY_ID: Record<string, string> = {
  "00000000-0000-0000-0000-0000000ca701": "hoteles",
  "00000000-0000-0000-0000-0000000ca702": "gastronomia",
  "00000000-0000-0000-0000-0000000ca703": "wellness",
  "00000000-0000-0000-0000-0000000ca704": "belleza",
};

const SLUG_LABEL_KEY = {
  gastronomia: "catGastronomy",
  hoteles: "catHotels",
  wellness: "catWellness",
  belleza: "catBeauty",
} as const;

function slugOf(maison: Maison): string | null {
  return maison.category_id ? CATEGORY_BY_ID[maison.category_id] ?? null : null;
}

type Profile = {
  full_name: string | null;
  handle: string | null;
  monthly_credit_cop: number | null;
  credit_used_cop: number | null;
  followers: number | null;
};

// Category filter buttons: slug + the translation key for its label.
const FILTERS = [
  { slug: "all", key: "catAll" },
  { slug: "gastronomia", key: "catGastronomy" },
  { slug: "hoteles", key: "catHotels" },
  { slug: "wellness", key: "catWellness" },
  { slug: "belleza", key: "catBeauty" },
] as const;

// A maison is flagged "Nouveau" if it was signed within the last 45 days.
function isNew(signedAt: string | null): boolean {
  if (!signedAt) return false;
  const signed = new Date(signedAt).getTime();
  return Date.now() - signed < 45 * 24 * 60 * 60 * 1000;
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export default function InfluencerDashboard() {
  const { lang, setLang } = useLang();
  const t = translations[lang].dashboard;

  const [maisons, setMaisons] = useState<Maison[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [maisonsLoading, setMaisonsLoading] = useState(true);
  const [preview, setPreview] = useState(false);

  // Before launch, accepted storytellers see a "coming soon" screen instead of
  // the catalogue. ?preview=1 bypasses it for internal preview.
  useEffect(() => {
    setPreview(new URLSearchParams(window.location.search).has("preview"));
  }, []);
  const gated = isBeforeLaunch() && !preview;
  const launchDateLabel = LAUNCH_AT.toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });

  function catLabel(slug: string | null): string {
    if (!slug) return "";
    const key = SLUG_LABEL_KEY[slug as keyof typeof SLUG_LABEL_KEY];
    return key ? t[key] : "";
  }

  useEffect(() => {
    async function loadProfile() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setProfileLoading(false); return; }

      // Find the creator by the auth link (owner_id) first, then email. Using
      // owner_id keeps the profile working even if the creator's email differs
      // from the login email.
      const { data: creator } = await supabase
        .from("creators")
        .select("full_name, handle, monthly_credit_cop, credit_used_cop, followers")
        .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
        .maybeSingle();

      setProfile(creator);
      setProfileLoading(false);
    }
    loadProfile();
  }, []);

  useEffect(() => {
    async function loadMaisons() {
      setMaisonsLoading(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // RLS ("comercios public catalog") already restricts a storyteller to
      // is_reservable = true rows; the explicit filter keeps it unambiguous.
      // Category filtering is done client-side — the catalogue is small and it
      // avoids filtering the joined `categories` rows instead of the parent.
      const { data, error } = await supabase
        .from("comercios")
        .select(
          "id, name, arrondissement, address, description, photos, website_url, signed_at, category_id"
        )
        .eq("is_reservable", true)
        .order("signed_at", { ascending: false, nullsFirst: false });

      if (error) console.error("Maisons query failed:", error);
      setMaisons((data || []) as unknown as Maison[]);
      setMaisonsLoading(false);
    }
    loadMaisons();
  }, []);

  const filteredMaisons =
    catFilter === "all"
      ? maisons
      : maisons.filter((m) => slugOf(m) === catFilter);

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
    <div className="min-h-[100dvh]">

      {/* Nav */}
      <nav className="border-b border-white/10 px-5 h-14 flex items-center bg-black/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <img src="/logo-curato-simple.png" alt="curato" style={{ height: "12px", width: "auto", display: "block" }} />
            </Link>
            <div className="w-px h-3 bg-white/10" />
            <Link href="/dashboard/influencer" className="font-serif text-[12px] tracking-wider text-champagne">
              {t.navAddresses}
            </Link>
            <Link href="/dashboard/influencer/visits" className="font-serif text-[12px] tracking-wider text-white/55 hover:text-champagne transition-colors">
              {t.navVisits}
            </Link>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              {LANGS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setLang(key)}
                  className={`font-serif text-[11px] tracking-[0.2em] transition-colors ${
                    lang === key ? "text-champagne" : "text-white/55 hover:text-white/60"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="w-px h-3 bg-white/10" />
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 font-serif text-[11px] tracking-wider text-white/55 hover:text-champagne transition-colors"
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
              <div className="w-48 h-4 bg-white/5 animate-pulse" />
            </div>
          ) : (
            <div className="flex items-end justify-between flex-wrap gap-6">

              {/* Left: name + handle */}
              <div>
                <p className="font-serif text-[10px] tracking-[0.4em] uppercase text-champagne/65 mb-3">
                  {t.greeting}
                </p>
                <h1 className="font-serif text-[32px] md:text-[40px] font-light tracking-[0.15em] uppercase text-white leading-none mb-3">
                  {profile?.full_name || profile?.handle || t.defaultName}
                </h1>
                {profile?.handle && (
                  <a
                    href={`https://instagram.com/${profile.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-[13px] text-champagne/65 hover:text-champagne transition-colors tracking-widest"
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
                    <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1">
                      {t.followers}
                    </p>
                    <p className="font-serif text-[32px] font-light text-white/70 leading-none">
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
                  <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1">
                    {t.creditAvailable}
                  </p>
                  <p className="font-serif text-[32px] font-light text-champagne leading-none">
                    €{remaining}
                  </p>
                  {monthlyCredit > 0 && (
                    <p className="font-serif text-[11px] text-white/45 mt-1">
                      {t.creditOf.replace("{total}", String(monthlyCredit))}
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

        {/* Connect Instagram (Phyllo) */}
        {!profileLoading && profile && <ConnectInstagram connected={false} />}

        {gated ? (
          <div className="text-center py-24 md:py-32 border border-white/8">
            <p className="font-serif text-[11px] tracking-[0.4em] uppercase text-champagne/70 mb-6">
              {t.comingSoonKicker}
            </p>
            <h2 className="font-serif text-[26px] md:text-[34px] font-light tracking-[0.1em] text-white mb-6">
              {t.comingSoonTitle}
            </h2>
            <p className="font-serif text-[14px] md:text-[15px] font-light text-white/60 leading-relaxed max-w-[440px] mx-auto px-6">
              {t.comingSoonBody.replace("{date}", launchDateLabel)}
            </p>

            <div className="mt-12 pt-12 border-t border-white/8 max-w-[460px] mx-auto">
              <SuggestVenue />
            </div>
          </div>
        ) : (
        <>
        {/* ── Category filters ── */}
        <div className="flex gap-1 mb-8 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.slug}
              onClick={() => setCatFilter(f.slug)}
              className={`font-serif text-[11px] tracking-[0.2em] uppercase px-4 py-2 transition-all duration-200 ${
                catFilter === f.slug
                  ? "bg-champagne text-charcoal-deep"
                  : "text-white/55 border border-white/10 hover:border-champagne/30 hover:text-champagne"
              }`}
            >
              {t[f.key]}
            </button>
          ))}
        </div>

        {/* Label */}
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/55 mb-8">
          {t.selectedAddresses}
        </p>

        {/* ── Maisons grid ── */}
        {maisonsLoading ? (
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
        ) : filteredMaisons.length === 0 ? (
          <div className="text-center py-24 border border-white/5">
            <p className="font-serif text-[15px] font-light text-white/55 mb-2">
              {t.emptyTitle}
            </p>
            <p className="font-serif text-[13px] font-light text-white/35 italic">
              {t.emptySubtitle}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {filteredMaisons.map((maison) => {
              const label = catLabel(slugOf(maison));
              return (
                <Link
                  key={maison.id}
                  href={`/dashboard/influencer/maison/${maison.id}`}
                  className="bg-charcoal-deep group relative overflow-hidden block"
                >
                  {/* Photo */}
                  <div className="aspect-[4/3] bg-charcoal-mid overflow-hidden relative">
                    {maison.photos?.[0] ? (
                      <img
                        src={maison.photos[0]}
                        alt={maison.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-white/35">
                          {label}
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-3 left-4 font-serif text-[10px] tracking-[0.25em] uppercase text-champagne/70">
                      {label}
                    </span>
                    {isNew(maison.signed_at) && (
                      <span className="absolute top-3 right-3 font-serif text-[9px] tracking-[0.25em] uppercase text-charcoal-deep bg-champagne px-2.5 py-1">
                        {t.badgeNew}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <h3 className="font-serif text-[17px] font-light text-white mb-1 group-hover:text-champagne transition-colors">
                      {maison.name}
                    </h3>
                    {maison.arrondissement && (
                      <p className="font-serif text-[12px] text-white/55 mb-3 tracking-wide">
                        Paris {maison.arrondissement}
                      </p>
                    )}
                    {maison.description && (
                      <p className="font-serif text-[13px] font-light text-white/60 leading-relaxed mb-4 line-clamp-3">
                        {maison.description}
                      </p>
                    )}
                    {maison.address && (
                      <div className="flex items-start gap-1.5 text-white/45 pt-4 border-t border-white/8">
                        <MapPin size={12} className="mt-0.5 shrink-0" />
                        <span className="font-serif text-[12px] font-light leading-snug">
                          {maison.address}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
