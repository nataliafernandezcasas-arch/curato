"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Look up email by handle via server API (bypasses RLS)
      const lookupRes = await fetch("/api/auth/lookup-handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const lookupData = await lookupRes.json();
      if (!lookupRes.ok || !lookupData.email) {
        setError("Identifiant introuvable. Vérifiez votre e-mail de bienvenue.");
        return;
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: lookupData.email,
        password,
      });

      if (signInErr) {
        setError("Mot de passe incorrect. Vérifiez votre e-mail de bienvenue.");
        return;
      }

      if (data.user?.user_metadata?.force_password_change) {
        window.location.href = "/auth/change-password";
      } else {
        window.location.href = "/dashboard";
      }
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
            Accéder
          </h1>
          <p className="font-serif text-[13px] font-light text-text-muted mt-3 tracking-wide">
            Réservé aux membres de Curato
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
              Identifiant
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              required
              className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/50"
              placeholder="@votrehandle"
            />
          </div>

          <div>
            <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="text-center mt-10 font-serif text-[12px] font-light text-text-muted tracking-wide">
          Pas encore membre ?{" "}
          <Link href="/creadores" className="text-champagne hover:text-copper transition-colors">
            Demander une invitation
          </Link>
        </p>
      </div>
    </div>
  );
}
