"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import { downscaleImage } from "@/lib/image-downscale";
import {
  PORTFOLIO_ACCEPT,
  PORTFOLIO_MIN,
  PORTFOLIO_MAX,
  isAllowedImage,
} from "@/lib/candidature-portfolio";

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: d, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
});

type Type = "creator" | "maison" | null;

export default function CandidaturePage() {
  const [type, setType] = useState<Type>(null);
  const [form, setForm] = useState({ name: "", email: "", instagram: "", website: "", message: "", photoStyle: "" });
  // Kept as previews so the applicant sees the edit they are making, and so a
  // second pick adds to the selection instead of silently replacing it.
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { lang } = useLang();
  const t = translations[lang].candidature;

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  function addPhotos(picked: FileList | null) {
    if (!picked) return;
    setError("");
    const room = PORTFOLIO_MAX - photos.length;
    const accepted = Array.from(picked).filter((f) => isAllowedImage(f.type)).slice(0, room);
    if (accepted.length === 0) return;
    setPhotos((prev) => [
      ...prev,
      ...accepted.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ageConfirmed) {
      setError(t.ageRequired);
      return;
    }
    if (!termsAccepted) {
      setError(t.termsRequired);
      return;
    }
    if (type === "creator") {
      if (!form.photoStyle.trim()) {
        setError(t.styleRequired);
        return;
      }
      if (photos.length < PORTFOLIO_MIN) {
        setError(t.portfolioRequired.replace("{min}", String(PORTFOLIO_MIN)));
        return;
      }
    }
    setLoading(true);
    setError("");

    try {
      const body = new FormData();
      body.set("type", type ?? "");
      body.set("name", form.name);
      body.set("email", form.email.toLowerCase().trim());
      if (form.instagram) body.set("instagram", form.instagram);
      if (form.website) body.set("website", form.website);
      if (form.message) body.set("message", form.message);
      if (type === "creator") body.set("photo_style", form.photoStyle.trim());
      body.set("age_confirmed", "true");
      body.set("terms_accepted", "true");

      // Straight off a phone these are far too heavy to travel together, so each
      // one is resized in the browser before it joins the request.
      if (type === "creator") {
        for (const { file } of photos) {
          body.append("photos", await downscaleImage(file));
        }
      }

      const res = await fetch("/api/candidature", { method: "POST", body });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");

      setSubmitted(true);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[100dvh] relative flex items-center justify-center px-5">
        <div className="absolute inset-0">
          <img src="/hero-floral.jpeg" alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-charcoal-deep/85 backdrop-blur-sm" />
        </div>
        <motion.div {...fade()} className="relative z-10 text-center max-w-md">
          <Link href="/" className="inline-block mb-12">
            <img src="/logo-curato-simple.png" alt="curato" style={{ height: "14px", width: "auto" }} />
          </Link>
          <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-6">{t.successBadge}</p>
          <h1 className="font-serif text-4xl font-light tracking-[0.28em] uppercase text-text-primary mb-6">{t.successTitle}</h1>
          <p className="font-serif text-[16px] font-light text-text-secondary leading-relaxed mb-10">{t.successText}</p>
          <Link href="/" className="font-serif text-[12px] tracking-widest uppercase text-champagne/60 hover:text-champagne transition-colors">
            {t.successBack}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] relative flex items-center justify-center px-5 py-20">
      <div className="absolute inset-0">
        <img src="/hero-floral.jpeg" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-charcoal-deep/85 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-[520px]">
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-8">
            <img src="/logo-curato-simple.png" alt="curato" style={{ height: "14px", width: "auto" }} />
          </Link>
          <h1 className="font-serif text-3xl font-light tracking-[0.35em] uppercase text-text-primary">{t.title}</h1>
          <p className="font-serif text-[13px] font-light text-text-muted mt-3 tracking-wide">{t.badge}</p>
        </div>

        {!type ? (
          <motion.div {...fade(0.1)} className="space-y-4">
            <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/50 text-center mb-8">{t.chooseLabel}</p>
            <button
              onClick={() => setType("creator")}
              className="w-full group border border-border bg-charcoal-mid/40 p-8 text-left hover:border-champagne/40 hover:bg-charcoal-mid transition-all duration-300"
            >
              <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/50 mb-3">{t.creatorLabel}</p>
              <p className="font-serif text-xl font-light tracking-wider uppercase text-text-primary">{t.creatorTitle}</p>
              <p className="font-serif text-[14px] font-light text-text-muted mt-3 leading-relaxed">{t.creatorDesc}</p>
            </button>
            <button
              onClick={() => setType("maison")}
              className="w-full group border border-border bg-charcoal-mid/40 p-8 text-left hover:border-copper/40 hover:bg-charcoal-mid transition-all duration-300"
            >
              <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-copper/50 mb-3">{t.maisonLabel}</p>
              <p className="font-serif text-xl font-light tracking-wider uppercase text-text-primary">{t.maisonTitle}</p>
              <p className="font-serif text-[14px] font-light text-text-muted mt-3 leading-relaxed">{t.maisonDesc}</p>
            </button>
          </motion.div>
        ) : (
          <motion.form {...fade(0.1)} onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-4 mb-8">
              <button type="button" onClick={() => setType(null)} className="font-serif text-[11px] tracking-[0.2em] uppercase text-text-muted/50 hover:text-text-muted transition-colors">
                {t.back}
              </button>
              <span className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/50">
                {type === "creator" ? t.creatorLabel : t.maisonLabel}
              </span>
            </div>

            <div>
              <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                {type === "creator" ? t.nameLabel : t.nameLabelMaison}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/40"
                placeholder={type === "creator" ? t.namePlaceholder : t.namePlaceholderMaison}
              />
            </div>

            <div>
              <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">{t.emailLabel}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/40"
                placeholder={t.emailPlaceholder}
              />
            </div>

            {type === "creator" && (
              <div>
                <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">{t.instagramLabel}</label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/40"
                  placeholder={t.instagramPlaceholder}
                />
              </div>
            )}

            {/* A creator is chosen for their eye, so the eye has to be on the form.
                Both fields are required for creators and absent for maisons. */}
            {type === "creator" && (
              <>
                <div>
                  <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                    {t.styleLabel}
                    <span className="text-copper/70"> *</span>
                  </label>
                  <textarea
                    value={form.photoStyle}
                    onChange={(e) => setForm({ ...form, photoStyle: e.target.value })}
                    rows={3}
                    maxLength={400}
                    required
                    className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/40 resize-none"
                    placeholder={t.stylePlaceholder}
                  />
                </div>

                <div>
                  <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                    {t.portfolioLabel}
                    <span className="text-copper/70"> *</span>
                  </label>
                  <p className="font-serif text-[13px] font-light text-text-muted/60 leading-relaxed mb-4">
                    {t.portfolioHelp
                      .replace("{min}", String(PORTFOLIO_MIN))
                      .replace("{max}", String(PORTFOLIO_MAX))}
                  </p>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {photos.map((p, i) => (
                        <div key={p.url} className="relative aspect-square group">
                          <img src={p.url} alt="" className="w-full h-full object-cover border border-border" />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            aria-label={t.portfolioRemove}
                            className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center bg-charcoal-deep/80 border border-border text-text-secondary hover:text-text-primary hover:border-champagne/40 transition-colors font-serif text-[15px] leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {photos.length < PORTFOLIO_MAX && (
                    <label className="block w-full border border-dashed border-border hover:border-champagne/40 bg-charcoal-mid/40 hover:bg-charcoal-mid transition-all duration-300 py-7 text-center cursor-pointer">
                      <input
                        type="file"
                        accept={PORTFOLIO_ACCEPT}
                        multiple
                        onChange={(e) => {
                          addPhotos(e.target.files);
                          // Clear it so picking the same file twice still fires onChange.
                          e.target.value = "";
                        }}
                        className="sr-only"
                      />
                      <span className="font-serif text-[12px] tracking-[0.2em] uppercase text-champagne/60">
                        {t.portfolioAdd}
                      </span>
                    </label>
                  )}

                  <p className="font-serif text-[12px] font-light text-text-muted/40 mt-3 tracking-wide">
                    {t.portfolioCount
                      .replace("{n}", String(photos.length))
                      .replace("{min}", String(PORTFOLIO_MIN))}
                  </p>
                </div>
              </>
            )}

            {type === "maison" && (
              <div>
                <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">{t.websiteLabel}</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/40"
                  placeholder={t.websitePlaceholder}
                />
              </div>
            )}

            <div>
              <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                {type === "creator" ? t.whyLabel : t.describeLabel}
                <span className="normal-case tracking-normal ml-2 text-text-muted/40">{t.optional}</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/40 resize-none"
                placeholder={type === "creator" ? t.whyPlaceholder : t.describePlaceholder}
              />
            </div>

            {/* Age 18+ attestation (RGPD) */}
            <label className="flex items-start gap-3 cursor-pointer group pt-2">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 accent-champagne cursor-pointer flex-shrink-0"
              />
              <span className="font-serif text-[13px] font-light text-text-secondary leading-relaxed tracking-wide group-hover:text-text-primary transition-colors">
                {t.ageLabel}
                <span className="text-copper/70"> *</span>
              </span>
            </label>

            {/* Terms & Conditions acceptance */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 accent-champagne cursor-pointer flex-shrink-0"
              />
              <span className="font-serif text-[13px] font-light text-text-secondary leading-relaxed tracking-wide group-hover:text-text-primary transition-colors">
                {t.termsLabel}{" "}
                <Link
                  href="/condiciones"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-champagne/80 hover:text-champagne underline underline-offset-2 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t.termsLink}
                </Link>
                <span className="text-copper/70"> *</span>
              </span>
            </label>

            {error && (
              <p className="font-serif text-[13px] font-light text-copper/80 leading-relaxed border-l border-copper/40 pl-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                !ageConfirmed ||
                !termsAccepted ||
                (type === "creator" && (photos.length < PORTFOLIO_MIN || !form.photoStyle.trim()))
              }
              className="w-full font-serif text-[13px] tracking-widest uppercase text-charcoal-deep bg-champagne py-4 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.submitting : t.submitBtn}
            </button>

            <p className="text-center font-serif text-[12px] font-light text-text-muted/50 tracking-wide">{t.note}</p>
          </motion.form>
        )}
      </div>
    </div>
  );
}
