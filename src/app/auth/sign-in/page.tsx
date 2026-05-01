"use client";

import Link from "next/link";
import MidiLogo from "@/components/midi-logo";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";

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

      if (!checkRes.ok) { setError(checkData.error || "Error verificando tu cuenta"); return; }
      if (!checkData.approved) { setError(checkData.message || "Tu aplicación esta en proceso de revisión."); return; }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.toLowerCase().trim(), options: { shouldCreateUser: true } });
      if (otpError) { setError("Error enviando el código. Intenta de nuevo."); return; }

      router.push(`/auth/verify?email=${encodeURIComponent(email.toLowerCase().trim())}`);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-surface flex items-center justify-center px-5">
      <div className="max-w-[380px] w-full">
        <div className="text-center mb-10">
          <Link href="/" aria-label="Midi Pass" className="inline-flex items-center gap-2 text-text-primary mb-1">
            <MidiLogo className="h-7 w-auto" />
            <span className="text-xl font-semibold tracking-tight leading-none">Pass</span>
          </Link>
          <h1 className="text-2xl font-extralight tracking-tighter text-text-primary mt-6">Iniciar Sesión</h1>
          <p className="text-sm text-text-muted mt-2">Solo para miembros aceptados</p>
        </div>

        <form onSubmit={handleSubmit} className="border border-border rounded-xl p-7 space-y-5">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
              placeholder="tu@email.com"
            />
          </div>

          {error && (
            <div className="bg-midi-orange/8 border border-midi-orange/15 text-midi-orange text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-text-primary text-white text-[13px] font-semibold py-3 rounded-lg hover:bg-accent transition-all duration-400 disabled:opacity-50 active:scale-[0.97]">
            {loading ? "Verificando..." : "Enviar código"}
          </button>

          <p className="text-center text-[11px] text-text-muted">
            Te enviaremos un código de 6 dígitos a tu correo
          </p>
        </form>

        <p className="text-center mt-8 text-sm text-text-muted">
          ¿No tienes cuenta?{" "}
          <Link href="/influencers" className="font-semibold text-accent hover:text-text-primary transition-colors">
            Aplica aquí <ArrowRight size={12} weight="bold" className="inline ml-0.5" />
          </Link>
        </p>
      </div>
    </div>
  );
}
