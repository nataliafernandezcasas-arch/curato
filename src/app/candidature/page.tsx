"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: d, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
});

type Type = "creator" | "maison" | null;

export default function CandidaturePage() {
  const [type, setType] = useState<Type>(null);
  const [form, setForm] = useState({ name: "", email: "", instagram: "", website: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: dbError } = await supabase.from("applications").insert({
        type,
        name: form.name,
        email: form.email.toLowerCase().trim(),
        instagram: form.instagram || null,
        website: form.website || null,
        message: form.message || null,
      });
      if (dbError) throw dbError;
      setSubmitted(true);
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
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
          <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-6">Candidature reçue</p>
          <h1 className="font-serif text-4xl font-light tracking-[0.28em] uppercase text-text-primary mb-6">
            Merci.
          </h1>
          <p className="font-serif text-[16px] font-light text-text-secondary leading-relaxed mb-10">
            Nous étudions chaque candidature avec soin. Vous recevrez une réponse prochainement.
          </p>
          <Link href="/" className="font-serif text-[12px] tracking-widest uppercase text-champagne/60 hover:text-champagne transition-colors">
            Retour à l'accueil
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
          <h1 className="font-serif text-3xl font-light tracking-[0.35em] uppercase text-text-primary">
            Candidature
          </h1>
          <p className="font-serif text-[13px] font-light text-text-muted mt-3 tracking-wide">
            Sur invitation · Places limitées
          </p>
        </div>

        {!type ? (
          <motion.div {...fade(0.1)} className="space-y-4">
            <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/50 text-center mb-8">
              Je suis
            </p>
            <button
              onClick={() => setType("creator")}
              className="w-full group border border-border bg-charcoal-mid/40 p-8 text-left hover:border-champagne/40 hover:bg-charcoal-mid transition-all duration-300"
            >
              <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/50 mb-3">Créateur · Créatrice</p>
              <p className="font-serif text-xl font-light tracking-wider uppercase text-text-primary">
                Je veux découvrir Paris.
              </p>
              <p className="font-serif text-[14px] font-light text-text-muted mt-3 leading-relaxed">
                Crédit mensuel pour explorer les meilleures adresses de la ville.
              </p>
            </button>
            <button
              onClick={() => setType("maison")}
              className="w-full group border border-border bg-charcoal-mid/40 p-8 text-left hover:border-copper/40 hover:bg-charcoal-mid transition-all duration-300"
            >
              <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-copper/50 mb-3">Maison · Commerce</p>
              <p className="font-serif text-xl font-light tracking-wider uppercase text-text-primary">
                Je veux rejoindre le carnet.
              </p>
              <p className="font-serif text-[14px] font-light text-text-muted mt-3 leading-relaxed">
                Accueillir des créateurs qui vous ont sincèrement choisi.
              </p>
            </button>
          </motion.div>
        ) : (
          <motion.form {...fade(0.1)} onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-4 mb-8">
              <button
                type="button"
                onClick={() => setType(null)}
                className="font-serif text-[11px] tracking-[0.2em] uppercase text-text-muted/50 hover:text-text-muted transition-colors"
              >
                ← Retour
              </button>
              <span className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/50">
                {type === "creator" ? "Créateur · Créatrice" : "Maison · Commerce"}
              </span>
            </div>

            <div>
              <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                {type === "creator" ? "Nom complet" : "Nom de la maison"}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/40"
                placeholder={type === "creator" ? "Votre nom" : "Le Cinq, Café de Flore…"}
              />
            </div>

            <div>
              <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/40"
                placeholder="votre@email.com"
              />
            </div>

            {type === "creator" && (
              <div>
                <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                  Instagram
                </label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/40"
                  placeholder="@votrehandle"
                />
              </div>
            )}

            {type === "maison" && (
              <div>
                <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                  Site web
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/40"
                  placeholder="https://votresite.com"
                />
              </div>
            )}

            <div>
              <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                {type === "creator" ? "Pourquoi Curato ?" : "Décrivez votre maison"}
                <span className="normal-case tracking-normal ml-2 text-text-muted/40">— facultatif</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/40 resize-none"
                placeholder={type === "creator" ? "Quelques mots sur vous et votre univers…" : "Votre histoire, votre adresse, ce qui vous rend unique…"}
              />
            </div>

            {error && (
              <p className="font-serif text-[13px] font-light text-copper/80 leading-relaxed border-l border-copper/40 pl-4">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-serif text-[13px] tracking-widest uppercase text-charcoal-deep bg-champagne py-4 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Envoi en cours…" : "Envoyer ma candidature"}
            </button>

            <p className="text-center font-serif text-[12px] font-light text-text-muted/50 tracking-wide">
              Chaque candidature est étudiée manuellement.
            </p>
          </motion.form>
        )}
      </div>
    </div>
  );
}
