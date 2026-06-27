"use client";

import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";

export default function SuggestVenue() {
  const { lang } = useLang();
  const t = translations[lang].dashboard;

  const [venue, setVenue] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!venue.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueName: venue, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur.");
        return;
      }
      setDone(true);
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-[460px] mx-auto text-center mt-16">
      <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-4">
        {t.suggestKicker}
      </p>
      <h3 className="font-serif text-[22px] font-light text-white mb-3">{t.suggestTitle}</h3>
      <p className="font-serif text-[13px] font-light text-white/55 leading-relaxed mb-7">
        {t.suggestText}
      </p>

      {done ? (
        <div className="flex items-center justify-center gap-2 border border-champagne/20 bg-champagne/5 px-6 py-4">
          <CheckCircle size={18} weight="thin" className="text-champagne shrink-0" />
          <p className="font-serif text-[13px] font-light text-white/70">{t.suggestThanks}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3 text-left">
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            required
            placeholder={t.suggestPlaceholder}
            className="w-full px-5 py-3.5 border border-white/15 bg-charcoal-mid/60 text-white font-serif text-[14px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-white/35"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={t.suggestNotePlaceholder}
            className="w-full px-5 py-3.5 border border-white/15 bg-charcoal-mid/60 text-white font-serif text-[14px] font-light focus:outline-none focus:border-champagne/40 transition-colors resize-none placeholder:text-white/35"
          />
          {error && <p className="font-serif text-[12px] text-copper/80">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne py-3.5 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-50"
          >
            {busy ? t.suggestSending : t.suggestSubmit}
          </button>
        </form>
      )}
    </div>
  );
}
