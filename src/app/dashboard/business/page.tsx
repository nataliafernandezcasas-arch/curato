"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SignOut, GlobeSimple, InstagramLogo, MapPin, X } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";
import MaisonProfile from "./maison-profile";
import MaisonOffer from "./maison-offer";
import type { StorytellerMetrics } from "@/lib/phyllo/client";

// Category UUID (migration 009) → translation key in the `dashboard` section.
const CATEGORY_KEY: Record<string, "catGastronomy" | "catHotels" | "catWellness" | "catBeauty"> = {
  "00000000-0000-0000-0000-0000000ca701": "catHotels",
  "00000000-0000-0000-0000-0000000ca702": "catGastronomy",
  "00000000-0000-0000-0000-0000000ca703": "catWellness",
  "00000000-0000-0000-0000-0000000ca704": "catBeauty",
};

type MaisonCard = {
  id: string;
  name: string;
  photos: string[];
  description: string;
  descriptionEn: string;
  descriptionEs: string;
  website: string;
  instagram: string;
  arrondissement: string | null;
  address: string | null;
  categoryId: string | null;
};

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

type RosterItem = {
  id: string;
  name: string;
  handle: string | null;
  followers: number | null;
  content: string[];
  igConnected: boolean;
  engagement: number | null;
};

type Visitor = {
  id: string;
  creator: string;
  handle: string | null;
  visitDate: string;
  rightsExpiresAt: string | null;
  photos: string[];
};

function formatFollowers(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export default function MaisonDashboard() {
  const { lang, setLang } = useLang();
  const t = translations[lang].business;

  const [tab, setTab] = useState<"roster" | "visitors" | "profile" | "directory">("roster");
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [maisonName, setMaisonName] = useState("");
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitorsLoaded, setVisitorsLoaded] = useState(false);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [directory, setDirectory] = useState<MaisonCard[]>([]);
  const [directoryLoaded, setDirectoryLoaded] = useState(false);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [selected, setSelected] = useState<MaisonCard | null>(null);
  const [teller, setTeller] = useState<RosterItem | null>(null);
  const [tellerMetrics, setTellerMetrics] = useState<StorytellerMetrics | null>(null);
  const [tellerLoading, setTellerLoading] = useState(false);
  const [tellerConnected, setTellerConnected] = useState(true);

  function openTeller(c: RosterItem) {
    setTeller(c);
    setTellerMetrics(null);
    setTellerConnected(c.igConnected);
    if (!c.igConnected) return;
    setTellerLoading(true);
    fetch(`/api/maison/storyteller/${c.id}`)
      .then((r) => r.json())
      .then((d) => {
        setTellerConnected(Boolean(d.connected));
        setTellerMetrics(d.metrics ?? null);
      })
      .catch(() => setTellerMetrics(null))
      .finally(() => setTellerLoading(false));
  }

  function placeOf(m: MaisonCard): string {
    const cat = m.categoryId ? translations[lang].dashboard[CATEGORY_KEY[m.categoryId]] : "";
    return [m.arrondissement ? `Paris ${m.arrondissement}` : "Paris", cat].filter(Boolean).join(" · ");
  }
  function descOf(m: MaisonCard): string {
    return (lang === "en" ? m.descriptionEn : lang === "es" ? m.descriptionEs : "") || m.description;
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/maison/roster");
        const data = await res.json();
        setRoster(data.roster ?? []);
        setMaisonName(data.maison ?? "");
      } catch {
        setRoster([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (tab !== "visitors" || visitorsLoaded) return;
    setVisitorsLoading(true);
    fetch("/api/maison/visitors")
      .then((r) => r.json())
      .then((d) => setVisitors(d.visitors ?? []))
      .catch(() => setVisitors([]))
      .finally(() => {
        setVisitorsLoaded(true);
        setVisitorsLoading(false);
      });
  }, [tab, visitorsLoaded]);

  useEffect(() => {
    if (tab !== "directory" || directoryLoaded) return;
    setDirectoryLoading(true);
    fetch("/api/maison/directory")
      .then((r) => r.json())
      .then((d) => setDirectory(d.maisons ?? []))
      .catch(() => setDirectory([]))
      .finally(() => {
        setDirectoryLoaded(true);
        setDirectoryLoading(false);
      });
  }, [tab, directoryLoaded]);

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(lang, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Paris",
    });
  }

  async function signOut() {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="min-h-[100dvh]">
      {/* Nav */}
      <nav className="border-b border-white/10 px-5 h-14 flex items-center bg-black/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img src="/logo-curato-simple.png" alt="curato" style={{ height: "12px", width: "auto", display: "block" }} />
            </Link>
            <div className="w-px h-3 bg-white/10" />
            <span className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/45">Maison</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              {LANGS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setLang(key)}
                  className={`font-serif text-[11px] tracking-[0.2em] transition-colors ${
                    lang === key ? "text-champagne" : "text-white/55 hover:text-white/80"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="w-px h-3 bg-white/10" />
            <button onClick={signOut} className="flex items-center gap-1.5 font-serif text-[11px] tracking-wider text-white/55 hover:text-champagne transition-colors">
              <SignOut size={14} />
              {t.signOut}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1280px] mx-auto px-8 py-12">
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-3">
          {tab === "profile" ? t.tabProfile : t.kicker}
        </p>
        <h1 className="font-serif text-[32px] md:text-[40px] font-light tracking-[0.12em] uppercase text-white leading-none mb-3">
          {tab === "profile"
            ? maisonName || t.tabProfile
            : tab === "directory"
            ? t.directoryTitle
            : t.title}
        </h1>
        {tab !== "profile" && (
          <p className="font-serif text-[14px] font-light text-white/55 mb-8">
            {tab === "directory" ? t.directorySubtitle : t.subtitle}
          </p>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8">
          {([["roster", t.tabRoster], ["visitors", t.tabVisitors], ["directory", t.tabDirectory], ["profile", t.tabProfile]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`font-serif text-[11px] tracking-[0.2em] uppercase px-4 py-2 transition-all duration-200 ${
                tab === key
                  ? "bg-champagne text-charcoal-deep"
                  : "text-white/55 border border-white/12 hover:border-champagne/30 hover:text-champagne"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "roster" ? (
          loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-charcoal-deep h-28 animate-pulse" />
              ))}
            </div>
          ) : roster.length === 0 ? (
            <div className="text-center py-24 border border-white/10">
              <p className="font-serif text-[15px] font-light text-white/55">{t.empty}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
              {roster.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openTeller(c)}
                  className="bg-charcoal-deep p-6 cursor-pointer hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-[18px] font-light text-white">{c.name}</h3>
                        {c.igConnected && (
                          <span
                            title={t.igVerified}
                            className="inline-flex items-center gap-1 border border-champagne/30 text-champagne/80 px-2 py-0.5 rounded-full"
                          >
                            <InstagramLogo size={11} weight="fill" />
                            <span className="font-serif text-[9px] tracking-[0.15em] uppercase">{t.igVerified}</span>
                          </span>
                        )}
                      </div>
                      {c.handle && (
                        <a
                          href={`https://instagram.com/${c.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-serif text-[13px] text-champagne/70 hover:text-champagne transition-colors"
                        >
                          @{c.handle}
                        </a>
                      )}
                    </div>
                    <div className="flex items-start gap-6 shrink-0 text-right">
                      <div>
                        <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/45">{t.followers}</p>
                        <p className="font-serif text-[20px] font-light text-white/85">{formatFollowers(c.followers)}</p>
                      </div>
                      {c.engagement != null && (
                        <div>
                          <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/45">{t.engagement}</p>
                          <p className="font-serif text-[20px] font-light text-white/85">{c.engagement}%</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {c.content.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {c.content.map((tag) => (
                        <span key={tag} className="font-serif text-[11px] tracking-wide text-white/70 border border-white/12 px-3 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : tab === "profile" ? (
          <div className="space-y-16">
            <MaisonProfile t={t} lang={lang} />
            <div className="pt-4 border-t border-white/10">
              <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-8">{t.tabOffer}</p>
              <MaisonOffer t={t} lang={lang} />
            </div>
          </div>
        ) : tab === "directory" ? (
          directoryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-charcoal-deep/60 border border-white/8 h-72 animate-pulse" />
              ))}
            </div>
          ) : directory.length === 0 ? (
            <div className="text-center py-24 border border-white/10">
              <p className="font-serif text-[15px] font-light text-white/55">{t.directoryEmpty}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {directory.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className="text-left group border border-white/10 bg-charcoal-deep/60 overflow-hidden hover:border-champagne/30 transition-colors"
                >
                  <div className="aspect-[4/3] bg-charcoal-mid overflow-hidden">
                    {m.photos[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-champagne/60 mb-1">{placeOf(m)}</p>
                    <h3 className="font-serif text-[18px] font-light text-white">{m.name}</h3>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : visitorsLoading ? (
          <div className="space-y-8">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 border border-white/8 bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : visitors.length === 0 ? (
          <div className="text-center py-24 border border-white/10">
            <p className="font-serif text-[15px] font-light text-white/55">{t.visitorsEmpty}</p>
          </div>
        ) : (
          <div className="space-y-12 max-w-[920px] mx-auto">
            {visitors.map((v) => (
              <div key={v.id}>
                <div className="grid grid-cols-2 gap-1.5">
                  {v.photos.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden bg-charcoal-mid">
                      <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </a>
                  ))}
                </div>
                <div className="mt-4">
                  <h3 className="font-serif text-[18px] font-light text-white">
                    {v.creator}
                    {v.handle && <span className="text-white/45 text-[14px]"> · @{v.handle}</span>}
                  </h3>
                  <p className="font-serif text-[13px] text-white/60 mt-1">
                    {t.visitedOn.replace("{date}", fmtDate(v.visitDate))}
                  </p>
                  {v.rightsExpiresAt && (
                    <p className="font-serif text-[12px] font-light text-white/45 mt-1 italic">
                      {t.visitorsRights.replace("{date}", fmtDate(v.rightsExpiresAt))}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maison profile modal (directory) */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setSelected(null)}
        >
          <div className="relative w-full max-w-[680px] bg-charcoal-deep border border-white/10 my-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelected(null)}
              aria-label="Fermer"
              className="absolute top-3 right-3 z-10 p-2 bg-black/50 text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="relative aspect-[16/9] bg-charcoal-mid">
              {selected.photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.photos[0]} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-champagne/70 mb-1">{placeOf(selected)}</p>
                <h3 className="font-serif text-[26px] font-light tracking-[0.12em] uppercase text-white leading-none">{selected.name}</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {descOf(selected) && (
                <p className="font-serif text-[15px] font-light text-white/70 leading-relaxed">{descOf(selected)}</p>
              )}
              {selected.photos.length > 1 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {selected.photos.slice(1).map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden bg-charcoal-mid">
                      <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </a>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 border-t border-white/8">
                {selected.website && (
                  <a href={selected.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/60 hover:text-champagne transition-colors">
                    <GlobeSimple size={15} />
                    <span className="font-serif text-[13px]">{selected.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
                {selected.instagram.replace(/^@/, "").trim() && (
                  <a href={`https://instagram.com/${selected.instagram.replace(/^@/, "").trim()}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/60 hover:text-champagne transition-colors">
                    <InstagramLogo size={15} />
                    <span className="font-serif text-[13px]">@{selected.instagram.replace(/^@/, "").trim()}</span>
                  </a>
                )}
                {selected.address && (
                  <span className="inline-flex items-center gap-2 text-white/45 font-serif text-[13px]">
                    <MapPin size={14} /> {selected.address}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Storyteller metrics modal */}
      {teller && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setTeller(null)}
        >
          <div className="relative w-full max-w-[560px] bg-charcoal-deep border border-white/10 my-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setTeller(null)}
              aria-label="Fermer"
              className="absolute top-3 right-3 z-10 p-2 bg-black/40 text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="p-6 sm:p-8">
              {/* Identity */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-charcoal-mid shrink-0 border border-white/10">
                  {tellerMetrics?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tellerMetrics.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-[22px] font-light text-white truncate">{teller.name}</h3>
                    {teller.igConnected && <InstagramLogo size={15} weight="fill" className="text-champagne/70 shrink-0" />}
                  </div>
                  {teller.handle && (
                    <a
                      href={`https://instagram.com/${teller.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif text-[13px] text-champagne/70 hover:text-champagne transition-colors"
                    >
                      @{teller.handle}
                    </a>
                  )}
                </div>
              </div>

              {/* Bio */}
              {tellerMetrics?.bio && (
                <p className="font-serif text-[14px] font-light text-white/65 leading-relaxed mt-5 whitespace-pre-line">
                  {tellerMetrics.bio}
                </p>
              )}

              {/* Website + account type */}
              {(tellerMetrics?.website || tellerMetrics?.isBusiness || tellerMetrics?.isVerified) && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
                  {tellerMetrics?.website && (
                    <a href={tellerMetrics.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/60 hover:text-champagne transition-colors">
                      <GlobeSimple size={14} />
                      <span className="font-serif text-[13px]">{tellerMetrics.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                    </a>
                  )}
                  {tellerMetrics?.isVerified && (
                    <span className="font-serif text-[11px] tracking-[0.15em] uppercase text-champagne/70">{t.stVerifiedBadge}</span>
                  )}
                  {tellerMetrics?.isBusiness && (
                    <span className="font-serif text-[11px] tracking-[0.15em] uppercase text-white/45">{t.stBusiness}</span>
                  )}
                </div>
              )}

              {/* Content categories */}
              {teller.content.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {teller.content.map((tag) => (
                    <span key={tag} className="font-serif text-[11px] tracking-wide text-white/70 border border-white/12 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Metrics */}
              {!teller.igConnected ? (
                <p className="font-serif text-[13px] font-light text-white/45 mt-6 italic">{t.stNotConnected}</p>
              ) : tellerLoading ? (
                <div className="grid grid-cols-2 gap-px bg-white/5 mt-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-charcoal-deep h-20 animate-pulse" />
                  ))}
                </div>
              ) : tellerMetrics ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/8 mt-6">
                    <div className="bg-charcoal-deep p-4">
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/45">{t.followers}</p>
                      <p className="font-serif text-[22px] font-light text-white/90 mt-1">{formatFollowers(tellerMetrics.followers)}</p>
                    </div>
                    <div className="bg-charcoal-deep p-4">
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/45">{t.stFollowing}</p>
                      <p className="font-serif text-[22px] font-light text-white/90 mt-1">{formatFollowers(tellerMetrics.following)}</p>
                    </div>
                    <div className="bg-charcoal-deep p-4">
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/45">{t.stPosts}</p>
                      <p className="font-serif text-[22px] font-light text-white/90 mt-1">{tellerMetrics.posts ?? "—"}</p>
                    </div>
                    <div className="bg-charcoal-deep p-4">
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/45">{t.stReach}</p>
                      <p className="font-serif text-[22px] font-light text-champagne mt-1">
                        {tellerMetrics.avgReach != null ? formatFollowers(tellerMetrics.avgReach) : "—"}
                      </p>
                      <p className="font-serif text-[10px] text-white/40 mt-0.5">{t.stPerPost}</p>
                    </div>
                    <div className="bg-charcoal-deep p-4">
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/45">{t.engagement}</p>
                      <p className="font-serif text-[22px] font-light text-white/90 mt-1">
                        {tellerMetrics.engagementPct != null ? `${tellerMetrics.engagementPct}%` : "—"}
                      </p>
                      <p className="font-serif text-[10px] text-white/40 mt-0.5">
                        {t.stLikesComments
                          .replace("{likes}", String(tellerMetrics.avgLikes ?? 0))
                          .replace("{comments}", String(tellerMetrics.avgComments ?? 0))}
                      </p>
                    </div>
                    <div className="bg-charcoal-deep p-4">
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/45">{t.stViews}</p>
                      <p className="font-serif text-[22px] font-light text-white/90 mt-1">
                        {tellerMetrics.avgViews != null ? formatFollowers(tellerMetrics.avgViews) : "—"}
                      </p>
                      <p className="font-serif text-[10px] text-white/40 mt-0.5">{t.stPerPost}</p>
                    </div>
                  </div>
                  <p className="font-serif text-[11px] font-light text-white/40 leading-relaxed mt-4">{t.stHint}</p>

                  {/* Recent publications */}
                  {tellerMetrics.recentPosts.length > 0 && (
                    <div className="mt-8">
                      <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/60 mb-4">{t.stRecent}</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {tellerMetrics.recentPosts.map((p, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <a
                            key={i}
                            href={p.url ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative block aspect-square overflow-hidden bg-charcoal-mid"
                          >
                            {p.thumbnail && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                            )}
                            {p.sponsored && (
                              <span className="absolute top-1 left-1 font-serif text-[8px] tracking-[0.15em] uppercase bg-champagne text-charcoal-deep px-1.5 py-0.5">
                                {t.stSponsored}
                              </span>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                              <div className="font-serif text-[10px] text-white/90 leading-tight">
                                {p.reach != null && <div className="text-champagne">{formatFollowers(p.reach)} {t.stReachShort}</div>}
                                <div>♥ {formatFollowers(p.likes)} · {formatFollowers(p.comments)} 💬</div>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="font-serif text-[13px] font-light text-white/45 mt-6 italic">{t.stUnavailable}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
