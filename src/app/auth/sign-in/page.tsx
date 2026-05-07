"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const checkRes = await fetch("/api/auth/check-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const checkData = await checkRes.json();

      if (!checkRes.ok) { setError(checkData.error || "Une erreur s'est produite."); return; }
      if (!checkData.approved) { setError("Votre candidature est en cours d'examen. Nous vous contacterons prochainement."); return; }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: { shouldCreateUser: true },
      });
      if (otpError) { setError("Erreur lors de l'envoi du code. Veuillez réessayer."); return; }

      router.push(`/auth/verify?email=${encodeURIComponent(email.toLowerCase().trim())}`);
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

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
            Accéder
          </h1>
          <p className="font-serif text-[13px] font-light text-text-muted mt-3 tracking-wide">
            Réservé aux membres de Curato
          </p>
        </div>

        {/* Form */}
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
            {loading ? "Vérification…" : "Envoyer le code"}
          </button>

          <p className="text-center font-serif text-[12px] font-light text-text-muted/60 tracking-wide">
            Nous vous enverrons un code à 6 chiffres
          </p>
        </form>

        {/* Footer link */}
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
