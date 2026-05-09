"use client";

import Link from "next/link";
import { useState } from "react";

const CONTACT_EMAIL = "hello@curatocollective.com";

export default function InvitacionPage() {
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
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-charcoal-deep flex flex-col">
      {/* Hero with floral */}
      <div className="relative h-[50vh] min-h-[320px] overflow-hidden flex-shrink-0">
        <img
          src="/hero-floral.jpeg"
          alt=""
          className="w-full h-full object-cover object-center"
          style={{ opacity: 0.45 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-deep/30 via-transparent to-charcoal-deep" />

        {/* Logo centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Link href="/">
            <img
              src="/logo-curato-simple.png"
              alt="curato"
              style={{ height: "16px", width: "auto", display: "block" }}
            />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 py-16 text-center max-w-[640px] mx-auto w-full">
        {/* Badge */}
        <p className="font-serif text-[11px] tracking-[0.45em] uppercase text-champagne/50 mb-10">
          Paris · Sur invitation
        </p>

        {/* Main message */}
        <h1
          className="font-serif text-[42px] leading-[1.15] font-light uppercase text-text-primary mb-8"
          style={{ letterSpacing: "0.12em" }}
        >
          Vous avez été<br />
          <em style={{ fontStyle: "italic", fontWeight: 300, letterSpacing: "0.08em" }}>sélectionné·e.</em>
        </h1>

        {/* Divider */}
        <div className="w-16 h-px bg-champagne/30 mb-10" />

        {/* Body text */}
        <p className="font-serif text-[16px] font-light leading-[1.85] text-text-muted max-w-[480px]">
          Curato vous ouvre les portes d'un carnet d'adresses parisien soigneusement curé — restaurants,
          sanctuaires de beauté, retraites bien-être, hôtels de caractère.
        </p>

        <p className="font-serif text-[16px] font-light leading-[1.85] text-text-muted max-w-[480px] mt-6">
          Chaque adresse a été choisie pour ce qu'elle offre de rare.{" "}
          <span className="text-champagne/70">Chaque créateur·rice, pour ce qu'il·elle incarne.</span>
        </p>

        {/* CTA */}
        <div className="mt-14">
          <Link
            href="/candidature"
            className="inline-block font-serif text-[13px] tracking-[0.25em] uppercase text-charcoal-deep bg-champagne px-10 py-4 hover:bg-copper hover:text-white transition-all duration-300"
          >
            Rejoindre Curato
          </Link>
        </div>

        {/* Contact section */}
        <div className="mt-20 w-full text-left">
          <div className="w-full h-px bg-white/8 mb-14" />

          <div className="text-center mb-10">
            <p className="font-serif text-[11px] tracking-[0.4em] uppercase text-champagne/40 mb-4">
              Coordonner une visite
            </p>
            <p className="font-serif text-[15px] font-light text-text-muted leading-relaxed max-w-[420px] mx-auto">
              Une adresse vous intéresse ? Écrivez-nous pour organiser votre première visite.
            </p>
          </div>

          {sent ? (
            <div className="border border-champagne/20 bg-champagne/5 px-8 py-10 text-center">
              <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-3">Message envoyé</p>
              <p className="font-serif text-[16px] font-light text-text-muted">
                Nous vous répondrons dans les plus brefs délais.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block font-serif text-[10px] tracking-[0.3em] uppercase text-champagne/40 mb-2">
                    Votre nom
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Prénom Nom"
                    className="w-full bg-transparent border border-white/10 px-4 py-3 font-serif text-[14px] font-light text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-champagne/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-serif text-[10px] tracking-[0.3em] uppercase text-champagne/40 mb-2">
                    Votre e-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="vous@exemple.com"
                    className="w-full bg-transparent border border-white/10 px-4 py-3 font-serif text-[14px] font-light text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-champagne/30 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-serif text-[10px] tracking-[0.3em] uppercase text-champagne/40 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Dites-nous quelle adresse vous intéresse et vos disponibilités…"
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
                {loading ? "Envoi…" : "Envoyer le message"}
              </button>
            </form>
          )}
        </div>

        {/* Secondary note */}
        <p className="font-serif text-[11px] text-text-muted/20 tracking-wider mt-14">
          Accès réservé · Paris
        </p>
      </div>

      {/* Footer strip */}
      <div className="border-t border-white/5 px-6 py-6 text-center">
        <p className="font-serif text-[10px] tracking-[0.4em] uppercase text-champagne/25">
          © Curato — {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
