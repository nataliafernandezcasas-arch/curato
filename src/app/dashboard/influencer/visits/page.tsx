"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SignOut, Camera, CheckCircle } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

type Visit = {
  id: string;
  maison: string;
  slotStart: string;
  status: string;
  photos: string[];
  rightsExpiresAt: string | null;
};

const STATUS_KEY: Record<string, "confirmed" | "pending" | "visited" | "declined" | "cancelled"> = {
  confirmed: "confirmed",
  pending_review: "pending",
  completed: "visited",
  declined: "declined",
  cancelled: "cancelled",
  no_show: "declined",
};

function VisitCard({
  visit,
  t,
  lang,
  onChanged,
}: {
  visit: Visit;
  t: Record<string, string>;
  lang: Lang;
  onChanged: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const statusKey = STATUS_KEY[visit.status] ?? "pending";
  const canUpload = visit.status === "confirmed" || visit.status === "completed";

  const dateLabel = new Date(visit.slotStart).toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
  const rightsLabel = visit.rightsExpiresAt
    ? new Date(visit.rightsExpiresAt).toLocaleDateString(lang, {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Paris",
      })
    : null;

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    // At least 2 photos required to log a visit (only on the first upload).
    if (visit.photos.length === 0 && files.length < 2) {
      setError(t.minPhotos);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("reservationId", visit.id);
    Array.from(files).forEach((f) => form.append("files", f));
    try {
      const res = await fetch("/api/reservations/visit", { method: "POST", body: form });
      if (res.ok) onChanged();
    } finally {
      setBusy(false);
    }
  }

  // Hidden file input shared by both states.
  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={(e) => upload(e.target.files)}
    />
  );

  // ── Visited: feed-style large photos, place + date below ──────────────────
  if (visit.photos.length > 0) {
    return (
      <div>
        {/* Large photos, side by side */}
        <div className="grid grid-cols-2 gap-1.5">
          {visit.photos.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden bg-charcoal-mid">
              <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </a>
          ))}
        </div>

        {/* Caption: place + date */}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-[20px] font-light text-white">{visit.maison}</h3>
            <p className="font-serif text-[13px] text-white/60 mt-1">{dateLabel}</p>
            {rightsLabel && (
              <p className="font-serif text-[12px] font-light text-white/45 mt-2 italic">
                {t.rightsUntil.replace("{date}", rightsLabel)}
              </p>
            )}
          </div>
          {canUpload && (
            <div className="shrink-0 text-right">
              {fileInput}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="font-serif text-[11px] tracking-wide text-white/55 hover:text-champagne transition-colors disabled:opacity-50"
              >
                {busy ? t.sending : `+ ${t.addMore}`}
              </button>
              {error && <p className="font-serif text-[12px] text-copper/80 mt-1">{error}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Not yet uploaded: prompt to mark visited + upload ─────────────────────
  return (
    <div className="border border-white/10 bg-black/20 p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-[18px] font-light text-white">{visit.maison}</h3>
          <p className="font-serif text-[13px] text-white/55 mt-1">{dateLabel}</p>
        </div>
        <span className="font-serif text-[10px] tracking-[0.25em] uppercase text-champagne/70 border border-champagne/25 px-3 py-1">
          {t[statusKey]}
        </span>
      </div>

      {canUpload && (
        <div className="mt-5">
          {fileInput}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-5 py-3 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-50"
          >
            <Camera size={14} />
            {busy ? t.sending : t.markVisited}
          </button>
          <p className="font-serif text-[11px] font-light text-white/45 mt-2">{t.minPhotos}</p>
          {error && (
            <p className="font-serif text-[12px] text-copper/80 mt-2 border-l border-copper/40 pl-3">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MesVisites() {
  const { lang, setLang } = useLang();
  const t = translations[lang].visits;
  const td = translations[lang].dashboard;

  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/reservations/visit");
      const data = await res.json();
      setVisits(data.visits ?? []);
    } catch {
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function signOut() {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
    window.location.href = "/";
  }

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
            <Link href="/dashboard/influencer" className="font-serif text-[12px] tracking-wider text-white/55 hover:text-champagne transition-colors">
              {td.navAddresses}
            </Link>
            <Link href="/dashboard/influencer/visits" className="font-serif text-[12px] tracking-wider text-champagne">
              {td.navVisits}
            </Link>
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
              {td.signOut}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[920px] mx-auto px-5 py-10">
        <p className="font-serif text-[10px] tracking-[0.4em] uppercase text-champagne/60 mb-3">{t.kicker}</p>
        <h1 className="font-serif text-[32px] md:text-[40px] font-light tracking-[0.15em] uppercase text-white leading-none mb-10">
          {t.title}
        </h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 border border-white/8 bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-24 border border-white/8">
            <CheckCircle size={28} weight="thin" className="text-white/30 mx-auto mb-4" />
            <p className="font-serif text-[14px] font-light text-white/55">{t.empty}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {visits.map((v) => (
              <VisitCard key={v.id} visit={v} t={t} lang={lang} onChanged={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
