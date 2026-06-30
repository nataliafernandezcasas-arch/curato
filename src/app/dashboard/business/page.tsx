"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SignOut } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";
import MaisonProfile from "./maison-profile";

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

  const [tab, setTab] = useState<"roster" | "visitors" | "profile">("roster");
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [maisonName, setMaisonName] = useState("");
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitorsLoaded, setVisitorsLoaded] = useState(false);
  const [visitorsLoading, setVisitorsLoading] = useState(false);

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
          {tab === "profile" ? maisonName || t.tabProfile : t.title}
        </h1>
        {tab !== "profile" && (
          <p className="font-serif text-[14px] font-light text-white/55 mb-8">{t.subtitle}</p>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8">
          {([["roster", t.tabRoster], ["visitors", t.tabVisitors], ["profile", t.tabProfile]] as const).map(([key, label]) => (
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
                <div key={c.id} className="bg-charcoal-deep p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-[18px] font-light text-white">{c.name}</h3>
                      {c.handle && (
                        <a
                          href={`https://instagram.com/${c.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-serif text-[13px] text-champagne/70 hover:text-champagne transition-colors"
                        >
                          @{c.handle}
                        </a>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/45">{t.followers}</p>
                      <p className="font-serif text-[20px] font-light text-white/85">{formatFollowers(c.followers)}</p>
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
          <MaisonProfile t={t} />
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
    </div>
  );
}
