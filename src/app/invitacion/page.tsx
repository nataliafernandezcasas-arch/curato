"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

export default function InvitacionPage() {
  const { lang, setLang } = useLang();
  const t = translations[lang].invitacion;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError(t.errorText);
      }
    } catch {
      setError(t.errorText);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-charcoal-deep flex flex-col">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[320px] overflow-hidden flex-shrink-0">
        <img
          src="/hero-floral.jpeg"
          alt=""
          className="w-full h-full object-cover object-center"
          style={{ opacity: 0.45 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-deep/30 via-transparent to-charcoal-deep" />

        {/* Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Link href="/">
            <img
              src="/logo-curato-simple.png"
              alt="curato"
              style={{ height: "16px", width: "auto", display: "block" }}
            />
          </Link>
        </div>

        {/* Language switcher */}
        <div className="absolute top-5 right-5 flex items-center gap-3">
          {LANGS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setLang(key)}
              className={`font-serif text-[11px] tracking-[0.2em] transition-colors ${
                lang === key ? "text-champagne" : "text-white/30 hover:text-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 py-16 text-center max-w-[640px] mx-auto w-full">
        <p className="font-serif text-[11px] tracking-[0.45em] uppercase text-champagne/50 mb-10">
          {t.badge}
        </p>

        <h1
          className="font-serif text-[42px] leading-[1.15] font-light uppercase text-text-primary mb-8"
          style={{ letterSpacing: "0.12em" }}
        >
          {t.title1}<br />
          <em style={{ fontStyle: "italic", fontWeight: 300, letterSpacing: "0.08em" }}>{t.title2}</em>
        </h1>

        <div className="w-16 h-px bg-champagne/30 mb-10" />

        <p className="font-serif text-[16px] font-light leading-[1.85] text-text-muted max-w-[480px]">
          {t.body1}
        </p>

        <p className="font-serif text-[16px] font-light leading-[1.85] text-text-muted max-w-[480px] mt-6">
          {t.body2}{" "}
          <span className="text-champagne/70">{t.body2accent}</span>
        </p>

        <div className="mt-14">
          <Link
            href="/candidature"
            className="inline-block font-serif text-[13px] tracking-[0.25em] uppercase text-charcoal-deep bg-champagne px-10 py-4 hover:bg-copper hover:text-white transition-all duration-300"
          >
            {t.cta}
          </Link>
        </div>

        {/* Contact section */}
        <div className="mt-20 w-full text-left">
          <div className="w-full h-px bg-white/8 mb-14" />

          <div className="text-center mb-10">
            <p className="font-serif text-[11px] tracking-[0.4em] uppercase text-champagne/40 mb-4">
              {t.contactTitle}
            </p>
            <p className="font-serif text-[15px] font-light text-text-muted leading-relaxed max-w-[420px] mx-auto">
              {t.contactSubtitle}
            </p>
          </div>

          {sent ? (
            <div className="border border-champagne/20 bg-champagne/5 px-8 py-10 text-center">
              <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-3">{t.sentTitle}</p>
              <p className="font-serif text-[16px] font-light text-text-muted">{t.sentText}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block font-serif text-[10px] tracking-[0.3em] uppercase text-champagne/40 mb-2">
                    {t.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={t.namePlaceholder}
                    className="w-full bg-transparent border border-white/10 px-4 py-3 font-serif text-[14px] font-light text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-champagne/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-serif text-[10px] tracking-[0.3em] uppercase text-champagne/40 mb-2">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t.emailPlaceholder}
                    className="w-full bg-transparent border border-white/10 px-4 py-3 font-serif text-[14px] font-light text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-champagne/30 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-serif text-[10px] tracking-[0.3em] uppercase text-champagne/40 mb-2">
                  {t.messageLabel}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder={t.messagePlaceholder}
                  className="w-full bg-transparent border border-white/10 px-4 py-3 font-serif text-[14px] font-light text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-champagne/30 transition-colors resize-none"
                />
              </div>

              {error && (
                <p className="font-serif text-[12px] text-copper/70 border-l border-copper/30 pl-4">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="font-serif text-[12px] tracking-[0.25em] uppercase text-charcoal-deep bg-champagne px-10 py-4 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-50"
              >
                {loading ? t.submitting : t.submitBtn}
              </button>
            </form>
          )}
        </div>

        <p className="font-serif text-[11px] text-text-muted/20 tracking-wider mt-14">
          {t.accessNote}
        </p>
      </div>

      <div className="border-t border-white/5 px-6 py-6 text-center">
        <p className="font-serif text-[10px] tracking-[0.4em] uppercase text-champagne/25">
          © Curato — {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
