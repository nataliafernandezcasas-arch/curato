"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
      if (verifyError) {
        const { error: verifyError2 } = await supabase.auth.verifyOtp({ email, token: code, type: "magiclink" });
        if (verifyError2) { setError("Code invalide ou expiré."); return; }
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-8">
        <p className="font-serif text-[13px] font-light text-text-muted tracking-wide">
          Code envoyé à
        </p>
        <p className="font-serif text-[15px] font-light text-text-primary mt-1">{email}</p>
      </div>

      <div>
        <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
          Code de vérification
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
      </div>

      {error && (
        <p className="font-serif text-[13px] font-light text-copper/80 leading-relaxed border-l border-copper/40 pl-4">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full font-serif text-[13px] tracking-widest uppercase text-charcoal-deep bg-champagne py-4 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-50"
      >
        {loading ? "Vérification…" : "Accéder"}
      </button>

      <p className="text-center font-serif text-[12px] font-light text-text-muted/60 tracking-wide">
        <Link href="/auth/sign-in" className="text-champagne/60 hover:text-champagne transition-colors">
          Changer d'adresse e-mail
        </Link>
      </p>
    </form>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-[100dvh] relative flex items-center justify-center px-5">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/hero-floral.jpeg"
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-charcoal-deep/80 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-8">
            <img src="/logo-curato-simple.png" alt="curato" style={{ height: "14px", width: "auto" }} />
          </Link>
          <h1 className="font-serif text-3xl font-light tracking-[0.35em] uppercase text-text-primary">
            Vérification
          </h1>
          <p className="font-serif text-[13px] font-light text-text-muted mt-3 tracking-wide">
            Saisissez le code reçu par e-mail
          </p>
        </div>

        <Suspense fallback={<div className="text-center font-serif text-[13px] text-text-muted">Chargement…</div>}>
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  );
}
