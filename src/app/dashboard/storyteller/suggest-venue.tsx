"use client";

import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import { Button } from "@/components/member/button";

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
      <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-accent mb-4">
        {t.suggestKicker}
      </p>
      <h3 className="font-serif text-[22px] font-light text-text-primary mb-3">{t.suggestTitle}</h3>
      <p className="font-serif text-[13px] font-light text-text-secondary leading-relaxed mb-7">
        {t.suggestText}
      </p>

      {done ? (
        <div className="caja-cristal flex items-center justify-center gap-2 px-6 py-4">
          <CheckCircle size={18} weight="thin" className="text-accent shrink-0" />
          <p className="font-serif text-[13px] font-light text-text-secondary">{t.suggestThanks}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3 text-left">
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            required
            placeholder={t.suggestPlaceholder}
            className="campo-cristal font-serif text-[14px] font-light"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={t.suggestNotePlaceholder}
            className="campo-cristal resize-none font-serif text-[14px] font-light"
          />
          {error && <p className="font-serif text-[12px] text-copper-vif">{error}</p>}
          <Button type="submit" full disabled={busy}>
            {busy ? t.suggestSending : t.suggestSubmit}
          </Button>
        </form>
      )}
    </div>
  );
}
