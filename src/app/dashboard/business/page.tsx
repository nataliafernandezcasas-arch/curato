"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import DashboardNav from "../dashboard-nav";
import { Row } from "@/components/member/row";
import { MAISON_LINKS, isMaisonSection, type MaisonSection } from "./nav-links";
import { GlobeSimple, InstagramLogo, MapPin, X } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";
import MaisonProfile from "./maison-profile";
import MaisonOffer from "./maison-offer";
import MaisonBilling from "./maison-billing";
import MaisonReport from "./maison-report";
import MaisonDemandes from "./maison-demandes";
import { DossierPane } from "./storyteller-dossier";
import type { Dossier } from "@/lib/storyteller-dossier";

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
  comingSoon?: boolean;
};

type RosterItem = {
  id: string;
  name: string;
  handle: string | null;
  followers: number | null;
  content: string[];
  igConnected: boolean;
  engagement: number | null;
  avatar: string | null;
  bio: string | null;
  avgReach: number | null;
  posts3: { url: string | null; thumbnail: string | null }[];
};

// Initials for the monogram fallback when a creator has no Phyllo photo.
function initials(name: string): string {
  const parts = name.replace(/^@/, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

export default function MaisonDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh]" />}>
      <MaisonDashboard />
    </Suspense>
  );
}

function MaisonDashboard() {
  const { lang } = useLang();
  const t = translations[lang].business;

  // Which section is open is part of the address, not local state: that is what
  // lets the five of them be links in the menu instead of a row of buttons.
  const searchParams = useSearchParams();
  const section = searchParams.get("section");
  const tab: MaisonSection = isMaisonSection(section) ? section : "profile";
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
  const [tellerDossier, setTellerDossier] = useState<Dossier | null>(null);
  const [tellerLoading, setTellerLoading] = useState(false);
  const [tellerFailed, setTellerFailed] = useState(false);

  // La ficha del roster es el mismo dossier que acompaña a una demanda, sin
  // la demanda: la misma pieza, con otra cabecera y sin pie.
  function openTeller(c: RosterItem) {
    setTeller(c);
    setTellerDossier(null);
    setTellerFailed(false);
    setTellerLoading(true);
    fetch(`/api/maison/storyteller/${c.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setTellerDossier(d.dossier ?? null))
      .catch(() => setTellerFailed(true))
      .finally(() => setTellerLoading(false));
  }

  const closeTeller = useCallback(() => setTeller(null), []);

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


  return (
    <div className="min-h-[100dvh]">
      {/* Nav */}
      <DashboardNav
        eyebrow="Maison"
        links={MAISON_LINKS(t, tab)}
        settingsHref="/dashboard/business/reglages"
        settingsLabel={translations[lang].dashboard.navSettings}
        maxWidth="1100px"
      />

      <div className="max-w-[1100px] mx-auto px-pagina md:px-8 py-seccion">
        {/* El titular es el de la sección abierta. Antes cualquier sección que
            no fuera perfil o carnet heredaba el de storytellers, así que en
            facturación ponía "Ceux qui racontent les histoires".

            Facturación y vos visiteurs no aparecen aquí porque traen el suyo:
            el estado del abono y la cifra del mes son mejores titulares que
            cualquier rótulo que pudiéramos ponerles encima. */}
        {tab !== "billing" && tab !== "visitors" && tab !== "demandes" && (
          <>
            <p className="mb-bloque text-capitale uppercase tracking-capitale text-accent">
              {tab === "profile" ? t.tabProfile : t.kicker}
            </p>
            <h1 className="mb-fila text-titre uppercase tracking-titre text-text-primary md:text-[32px]">
              {tab === "profile"
                ? maisonName || t.tabProfile
                : tab === "directory"
                ? t.directoryTitle
                : t.title}
            </h1>
            {tab !== "profile" && (
              <p className="mb-seccion max-w-[46ch] text-corps text-text-secondary">
                {tab === "directory" ? t.directorySubtitle : t.subtitle}
              </p>
            )}
          </>
        )}

        {tab === "demandes" ? (
          // Demandes trae su propio titular: cuántas personas esperan dice más
          // que cualquier rótulo.
          <MaisonDemandes />
        ) : tab === "roster" ? (
          <>
          {loading ? (
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
            <div className="grid grid-cols-1 gap-rango md:grid-cols-2">
              {roster.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openTeller(c)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col gap-fila sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-fila">
                      {/* Retrato en 4:5, no un círculo. Un creador es una
                          persona a la que se mira, no un avatar de sistema. */}
                      <div className="aspect-[4/5] w-16 shrink-0 overflow-hidden bg-surface-raised">
                        {c.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-legende text-accent">{initials(c.name)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 break-words text-sous-titre text-text-primary">{c.name}</h3>
                        {c.igConnected && (
                          <span
                            title={t.igVerified}
                            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-capitale uppercase tracking-capitale text-sauge-vif"
                          >
                            <InstagramLogo size={11} weight="fill" />
                            {t.igVerified}
                          </span>
                        )}
                      </div>
                      {c.handle && (
                        <a
                          href={`https://instagram.com/${c.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-legende text-accent transition-colors hover:text-text-primary"
                        >
                          @{c.handle}
                        </a>
                      )}
                      </div>
                    </div>
                    <div className="shrink-0 sm:w-40">
                      <Row
                        label={<span className="text-capitale uppercase tracking-capitale text-text-secondary">{t.followers}</span>}
                        value={<span className="text-sous-titre text-text-primary">{formatFollowers(c.followers)}</span>}
                      />
                      {c.engagement != null && (
                        <Row
                          label={<span className="text-capitale uppercase tracking-capitale text-text-secondary">{t.engagement}</span>}
                          value={<span className="text-sous-titre text-text-primary">{c.engagement}%</span>}
                        />
                      )}
                    </div>
                  </div>

                  {c.content.length > 0 && (
                    <p className="mt-fila text-legende text-brume">{c.content.join(" · ")}</p>
                  )}

                  {/* 3 latest publications */}
                  {c.posts3.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-1.5">
                      {c.posts3.map((p, i) => (
                        <a
                          key={i}
                          href={p.url ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="block aspect-square overflow-hidden bg-charcoal-mid"
                        >
                          {p.thumbnail && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.thumbnail} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          </>
        ) : tab === "profile" ? (
          <div className="space-y-16">
            <MaisonProfile t={t} lang={lang} />
            <div className="pt-4 border-t border-white/10">
              <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-8">{t.tabOffer}</p>
              <MaisonOffer t={t} lang={lang} />
            </div>
          </div>
        ) : tab === "visitors" ? (
          // El informe encabeza la sección: primero cuánto sirvió el mes, y
          // debajo quién vino exactamente.
          <MaisonReport />
        ) : tab === "billing" ? (
          <MaisonBilling />
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
              {directory.map((m) =>
                m.comingSoon ? (
                  <div
                    key={m.id}
                    className="relative border border-white/10 bg-charcoal-deep/60 overflow-hidden select-none"
                  >
                    <div className="aspect-[4/3] bg-charcoal-mid overflow-hidden">
                      {m.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.photos[0]} alt="" className="w-full h-full object-cover blur-xl scale-110 opacity-60" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src="/flor-bg.jpg" alt="" className="w-full h-full object-cover blur-xl scale-110 opacity-40" />
                      )}
                      <div className="absolute inset-0 bg-charcoal-deep/50 flex items-center justify-center">
                        <span className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/80 border border-champagne/30 px-4 py-2">
                          {t.directoryComingSoon}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-champagne/50 mb-1">{placeOf(m)}</p>
                      <div className="h-[1.1em] w-2/3 bg-white/10 rounded-sm" />
                    </div>
                  </div>
                ) : (
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
                )
              )}
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

      {/* La ficha del storyteller: el mismo dossier que en Demandes. */}
      {teller && (
        <DossierPane
          dossier={tellerDossier}
          loading={tellerLoading}
          failed={tellerFailed}
          lang={lang}
          onClose={closeTeller}
        />
      )}
    </div>
  );
}
