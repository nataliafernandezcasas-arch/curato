"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, ArrowLeft, SignOut, GlobeSimple, X, CheckCircle } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";
import { isBeforeLaunch, LAUNCH_AT } from "@/lib/launch";
import { parisParts, AvailWindow } from "@/lib/availability";

type MaisonAvail = { availability: AvailWindow[]; blocked: { date: string }[]; taken: string[] };

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

type Maison = {
  id: string;
  name: string;
  arrondissement: string | null;
  address: string | null;
  description: string | null;
  description_en: string | null;
  description_es: string | null;
  photos: string[] | null;
  website_url: string | null;
  category_id: string | null;
};

// Category label keys live in the `dashboard` translation section.
const SLUG_LABEL_KEY = {
  gastronomia: "catGastronomy",
  hoteles: "catHotels",
  wellness: "catWellness",
  belleza: "catBeauty",
} as const;

// Canonical category UUIDs (migration 009) → slug + credit cost. The label is
// resolved per-language from the slug.
const CATEGORY: Record<string, { slug: keyof typeof SLUG_LABEL_KEY; credits: number; unit: string }> = {
  "00000000-0000-0000-0000-0000000ca701": { slug: "hoteles", credits: 8, unit: "night" },
  "00000000-0000-0000-0000-0000000ca702": { slug: "gastronomia", credits: 2, unit: "booking" },
  "00000000-0000-0000-0000-0000000ca703": { slug: "wellness", credits: 3, unit: "booking" },
  "00000000-0000-0000-0000-0000000ca704": { slug: "belleza", credits: 3, unit: "booking" },
};

function ReserveModal({ maison, onClose, initialSlot }: { maison: Maison; onClose: () => void; initialSlot?: string }) {
  const { lang } = useLang();
  const t = translations[lang].maison;
  const cat = maison.category_id ? CATEGORY[maison.category_id] : null;
  const isHotel = cat?.unit === "night";

  const [slot, setSlot] = useState(initialSlot ?? "");
  const [partySize, setPartySize] = useState(1);
  const [nights, setNights] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [avail, setAvail] = useState<MaisonAvail | null>(null);
  const [selDate, setSelDate] = useState("");

  useEffect(() => {
    fetch(`/api/maison/${maison.id}/availability`)
      .then((r) => r.json())
      .then((d) => setAvail(d))
      .catch(() => {});
  }, [maison.id]);

  // Time-slot booking is used when the maison has weekly windows (and it isn't a
  // hotel, which books per arrival night). Otherwise the free datetime input.
  const hasSchedule = !isHotel && (avail?.availability?.length ?? 0) > 0;

  const availDates = (() => {
    if (!hasSchedule || !avail) return [] as { ymd: string; dow: number; d: Date }[];
    const days = new Set(avail.availability.map((w) => w.day));
    const blocked = new Set(avail.blocked.map((b) => b.date));
    const now = new Date();
    const list: { ymd: string; dow: number; d: Date }[] = [];
    for (let i = 0; i < 28; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (days.has(d.getDay()) && !blocked.has(ymd)) list.push({ ymd, dow: d.getDay(), d });
    }
    return list;
  })();

  const slotTimes = (() => {
    if (!hasSchedule || !avail || !selDate) return [] as { label: string; iso: string }[];
    const date = availDates.find((x) => x.ymd === selDate);
    if (!date) return [];
    const takenKeys = new Set(avail.taken.map((iso) => { const p = parisParts(iso); return `${p.ymd} ${p.hm}`; }));
    const out: { label: string; iso: string }[] = [];
    for (const w of avail.availability.filter((x) => x.day === date.dow)) {
      const [sh, sm] = w.start.split(":").map(Number);
      const [eh, em] = w.end.split(":").map(Number);
      for (let mins = sh * 60 + sm; mins < eh * 60 + em; mins += 30) {
        const hh = String(Math.floor(mins / 60)).padStart(2, "0");
        const mm = String(mins % 60).padStart(2, "0");
        const dt = new Date(date.d);
        dt.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
        if (dt.getTime() <= Date.now()) continue;
        if (takenKeys.has(`${selDate} ${hh}:${mm}`)) continue;
        out.push({ label: `${hh}:${mm}`, iso: dt.toISOString() });
      }
    }
    return out;
  })();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) { setError(t.errorDate); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reservations/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: maison.id,
          slotStart: new Date(slot).toISOString(),
          partySize,
          nights: isHotel ? nights : undefined,
          specialRequests: note,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.errorRequest); return; }
      setDone(true);
    } catch {
      setError(t.errorConnection);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm px-4 pb-4 md:pb-0" onClick={onClose}>
      <div className="bg-charcoal-mid border border-white/10 w-full max-w-lg p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/70 mb-2">
              {t.modalTitle}
            </p>
            <h3 className="font-serif text-xl font-light text-white">{maison.name}</h3>
          </div>
          <button onClick={onClose} className="text-white/55 hover:text-white transition-colors mt-1">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-8 space-y-5">
            <CheckCircle size={40} weight="thin" className="text-champagne mx-auto" />
            <p className="font-serif text-[15px] font-light text-white/80 leading-relaxed">
              {t.successTitle}<br />
              {t.successSubtitle}
            </p>
            <button
              onClick={onClose}
              className="font-serif text-[12px] tracking-widest uppercase text-charcoal-deep bg-champagne px-8 py-3 hover:bg-copper hover:text-white transition-all duration-300"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                {isHotel ? t.arrivalDate : t.dateTime}
              </label>
              {hasSchedule ? (
                <>
                  <select
                    value={selDate}
                    onChange={(e) => { setSelDate(e.target.value); setSlot(""); }}
                    className="w-full px-5 py-4 border border-border bg-charcoal-deep/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors"
                  >
                    <option value="">{t.chooseDate}</option>
                    {availDates.map((d) => (
                      <option key={d.ymd} value={d.ymd}>
                        {d.d.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" })}
                      </option>
                    ))}
                  </select>
                  {selDate &&
                    (slotTimes.length ? (
                      <div className="grid grid-cols-4 gap-1.5 mt-3">
                        {slotTimes.map((ts) => (
                          <button
                            key={ts.iso}
                            type="button"
                            onClick={() => setSlot(ts.iso)}
                            className={`font-serif text-[13px] py-2 border transition-colors ${
                              slot === ts.iso
                                ? "bg-champagne text-charcoal-deep border-champagne"
                                : "border-white/15 text-white/70 hover:border-champagne/40 hover:text-champagne"
                            }`}
                          >
                            {ts.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="font-serif text-[13px] text-white/45 mt-3">{t.noSlots}</p>
                    ))}
                </>
              ) : (
                <input
                  type="datetime-local"
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  required
                  step={1800}
                  className="w-full px-5 py-4 border border-border bg-charcoal-deep/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                  {t.people}
                </label>
                <input
                  type="number"
                  min={1}
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full px-5 py-4 border border-border bg-charcoal-deep/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors"
                />
              </div>
              {isHotel && (
                <div>
                  <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                    {t.nights}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={nights}
                    onChange={(e) => setNights(Number(e.target.value))}
                    className="w-full px-5 py-4 border border-border bg-charcoal-deep/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                {t.note} <span className="text-white/45 normal-case tracking-normal">{t.optional}</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-5 py-4 border border-border bg-charcoal-deep/60 text-text-primary font-serif text-[14px] font-light focus:outline-none focus:border-champagne/40 transition-colors resize-none"
                placeholder={t.notePlaceholder}
              />
            </div>

            {cat && (
              <p className="font-serif text-[12px] text-white/55">
                {t.indicativeCost.replace("{n}", String(isHotel ? cat.credits * nights : cat.credits))}
              </p>
            )}

            {error && (
              <p className="font-serif text-[13px] font-light text-copper/80 leading-relaxed border-l border-copper/40 pl-4">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-serif text-[12px] tracking-widest uppercase text-charcoal-deep bg-champagne py-4 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-50"
            >
              {loading ? t.sending : t.send}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function MaisonProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [maison, setMaison] = useState<Maison | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [initialSlot, setInitialSlot] = useState("");
  const [preview, setPreview] = useState(false);

  // A "?slot=" param (from a proposed-créneaux email) pre-fills + opens the form.
  // "?preview=1" bypasses the pre-launch gate (internal preview).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setPreview(sp.has("preview"));
    const slot = sp.get("slot");
    if (slot) {
      setInitialSlot(slot);
      setReserveOpen(true);
    }
  }, []);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("comercios")
        .select("id, name, arrondissement, address, description, description_en, description_es, photos, website_url, category_id")
        .eq("id", id)
        .eq("is_reservable", true)
        .maybeSingle();
      setMaison((data as Maison) ?? null);
      setLoading(false);
    }
    load();
  }, [id]);

  async function signOut() {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  const { lang, setLang } = useLang();
  const td = translations[lang].dashboard;
  const t = translations[lang].maison;
  const cat = maison?.category_id ? CATEGORY[maison.category_id] : null;
  const catLabelText = cat ? td[SLUG_LABEL_KEY[cat.slug]] : "";
  // Description in the storyteller's language, falling back to French.
  const desc = maison
    ? (lang === "en" ? maison.description_en : lang === "es" ? maison.description_es : null) || maison.description
    : null;
  const gated = isBeforeLaunch() && !preview;
  const launchDateLabel = LAUNCH_AT.toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });

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
            <Link href="/dashboard/storyteller" className="font-serif text-[12px] tracking-wider text-white/50 hover:text-champagne transition-colors">
              {td.navAddresses}
            </Link>
            <Link href="/dashboard/storyteller/visits" className="font-serif text-[12px] tracking-wider text-white/55 hover:text-champagne transition-colors">
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
                    lang === key ? "text-champagne" : "text-white/55 hover:text-white/60"
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

      <div className="max-w-[1000px] mx-auto px-5 py-10">
        <Link href="/dashboard/storyteller" className="inline-flex items-center gap-2 font-serif text-[11px] tracking-[0.2em] uppercase text-white/55 hover:text-champagne transition-colors mb-8">
          <ArrowLeft size={14} />
          {t.backToAll}
        </Link>

        {gated ? (
          <div className="text-center py-24 md:py-32 border border-white/8">
            <p className="font-serif text-[11px] tracking-[0.4em] uppercase text-champagne/70 mb-6">
              {td.comingSoonKicker}
            </p>
            <h2 className="font-serif text-[26px] md:text-[34px] font-light tracking-[0.1em] text-white mb-6">
              {td.comingSoonTitle}
            </h2>
            <p className="font-serif text-[14px] md:text-[15px] font-light text-white/60 leading-relaxed max-w-[440px] mx-auto px-6">
              {td.comingSoonBody.replace("{date}", launchDateLabel)}
            </p>
          </div>
        ) : loading ? (
          <div className="space-y-6">
            <div className="aspect-[16/9] bg-white/5 animate-pulse" />
            <div className="h-6 bg-white/5 animate-pulse w-1/3" />
          </div>
        ) : !maison ? (
          <div className="text-center py-24 border border-white/5">
            <p className="font-serif text-[15px] font-light text-white/55">{t.notFound}</p>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className="aspect-[16/9] bg-charcoal-mid overflow-hidden relative mb-8">
              {maison.photos?.[0] ? (
                <img src={maison.photos[0]} alt={maison.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="font-serif text-[12px] tracking-[0.3em] uppercase text-white/35">{catLabelText}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {/* Left: info */}
              <div className="md:col-span-2">
                {cat && (
                  <span className="font-serif text-[10px] tracking-[0.3em] uppercase text-champagne/60">
                    {catLabelText}
                  </span>
                )}
                <h1 className="font-serif text-[34px] font-light text-white leading-tight mt-2 mb-1">
                  {maison.name}
                </h1>
                {maison.arrondissement && (
                  <p className="font-serif text-[13px] text-white/55 tracking-wide mb-6">Paris {maison.arrondissement}</p>
                )}

                {desc && (
                  <p className="font-serif text-[15px] font-light text-white/60 leading-relaxed mb-8">
                    {desc}
                  </p>
                )}

                {/* Map */}
                {maison.address && (
                  <div className="mb-8">
                    <p className="font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/65 mb-3">{t.location}</p>
                    <div className="aspect-[16/9] border border-white/10 overflow-hidden">
                      <iframe
                        title="map"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(maison.address)}&z=15&output=embed`}
                        className="w-full h-full"
                        style={{ border: 0, filter: "grayscale(0.4) contrast(0.9)" }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right: actions */}
              <div className="md:col-span-1">
                <div className="border border-white/10 p-6 sticky top-20 space-y-5">
                  {maison.address && (
                    <div className="flex items-start gap-2 text-white/60">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <span className="font-serif text-[13px] font-light leading-snug">{maison.address}</span>
                    </div>
                  )}
                  {maison.website_url && (
                    <a
                      href={maison.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-white/60 hover:text-champagne transition-colors"
                    >
                      <GlobeSimple size={14} className="shrink-0" />
                      <span className="font-serif text-[13px] font-light truncate">{maison.website_url.replace(/^https?:\/\//, "")}</span>
                    </a>
                  )}

                  <button
                    onClick={() => setReserveOpen(true)}
                    className="w-full font-serif text-[12px] tracking-widest uppercase text-charcoal-deep bg-champagne py-4 hover:bg-copper hover:text-white transition-all duration-300"
                  >
                    {t.requestReservation}
                  </button>
                  <p className="font-serif text-[11px] font-light text-white/45 leading-relaxed text-center">
                    {t.willBeConfirmed}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {maison && reserveOpen && !gated && <ReserveModal maison={maison} onClose={() => setReserveOpen(false)} initialSlot={initialSlot} />}
    </div>
  );
}
