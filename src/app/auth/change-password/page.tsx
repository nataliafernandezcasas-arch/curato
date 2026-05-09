"use client";

import Link from "next/link";
import { useState } from "react";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: updateErr } = await supabase.auth.updateUser({
        password,
        data: { force_password_change: false },
      });
      if (updateErr) {
        setError("Erreur lors du changement. Veuillez réessayer.");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] relative flex items-center justify-center px-5">
      <div className="absolute inset-0">
        <img src="/hero-floral.jpeg" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-charcoal-deep/80 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-8">
            <img src="/logo-curato-simple.png" alt="curato" style={{ height: "14px", width: "auto" }} />
          </Link>
          <h1 className="font-serif text-3xl font-light tracking-[0.35em] uppercase text-text-primary">
            Bienvenue
          </h1>
          <p className="font-serif text-[13px] font-light text-text-muted mt-3 tracking-wide">
            Choisissez votre mot de passe personnel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/50"
              placeholder="Minimum 8 caractères"
            />
          </div>

          <div>
            <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/50"
              placeholder="••••••••"
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
            {loading ? "Enregistrement…" : "Accéder à Curato"}
          </button>
        </form>
      </div>
    </div>
  );
}
