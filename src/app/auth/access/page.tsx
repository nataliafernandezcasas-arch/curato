"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AccessForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Code invalide ou expiré.");
        return;
      }
      window.location.href = data.redirectTo || "/dashboard";
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
          Adresse e-mail
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/50"
          placeholder="votre@email.com"
        />
      </div>

      <div>
        <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
          Code d'accès
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
          maxLength={6}
          className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-2xl text-center tracking-[0.5em] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/30"
          placeholder="000000"
        />
        <p className="font-serif text-[11px] text-text-muted/50 mt-2">
          Le code à 6 chiffres reçu dans votre e-mail de bienvenue
        </p>
      </div>

      {error && (
        <p className="font-serif text-[13px] font-light text-copper/80 leading-relaxed border-l border-copper/40 pl-4">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || code.length !== 6 || !email}
        className="w-full font-serif text-[13px] tracking-widest uppercase text-charcoal-deep bg-champagne py-4 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-50"
      >
        {loading ? "Vérification…" : "Accéder"}
      </button>
    </form>
  );
}

export default function AccessPage() {
  return (
    <div className="min-h-[100dvh] relative flex items-center justify-center px-5">
      <div className="absolute inset-0">
        <img
          src="/hero-floral.jpeg"
          alt=""
          className="w-full h-full object-cover object-center"
        />
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
            Utilisez le code reçu dans votre e-mail
          </p>
        </div>

        <Suspense fallback={<div className="text-center font-serif text-[13px] text-text-muted">Chargement…</div>}>
          <AccessForm />
        </Suspense>

        <p className="text-center mt-10 font-serif text-[12px] font-light text-text-muted tracking-wide">
          Déjà membre ?{" "}
          <Link href="/auth/sign-in" className="text-champagne hover:text-copper transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
