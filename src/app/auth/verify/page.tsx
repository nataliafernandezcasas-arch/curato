"use client";

import Link from "next/link";
import MidiLogo from "@/components/midi-logo";
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
      const { data, error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
      if (verifyError) {
        // Try magiclink type as fallback
        const { data: data2, error: verifyError2 } = await supabase.auth.verifyOtp({ email, token: code, type: "magiclink" });
        if (verifyError2) { setError("Código inválido o expirado."); return; }
      }
      // Force redirect
      window.location.href = "/dashboard";
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-xl p-7 space-y-5">
      <div className="text-center pb-2">
        <p className="text-sm text-text-muted">Enviamos un código a</p>
        <p className="text-sm font-semibold text-text-primary">{email}</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">Código</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
          maxLength={6}
          className="w-full px-4 py-4 rounded-lg border border-border bg-surface text-text-primary text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
          placeholder="000000"
        />
      </div>

      {error && (
        <div className="bg-midi-orange/8 border border-midi-orange/15 text-midi-orange text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading || code.length !== 6} className="w-full bg-text-primary text-white text-[13px] font-semibold py-3 rounded-lg hover:bg-accent transition-all duration-400 disabled:opacity-50 active:scale-[0.97]">
        {loading ? "Verificando..." : "Verificar"}
      </button>

      <p className="text-center text-[11px] text-text-muted">
        <Link href="/auth/sign-in" className="text-accent hover:text-text-primary transition-colors">Cambiar email</Link>
      </p>
    </form>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-[100dvh] bg-surface flex items-center justify-center px-5">
      <div className="max-w-[380px] w-full">
        <div className="text-center mb-10">
          <Link href="/" aria-label="Midi Pass" className="inline-flex items-center gap-2 text-text-primary">
            <MidiLogo className="h-7 w-auto" />
            <span className="text-xl font-semibold tracking-tight leading-none">Pass</span>
          </Link>
          <h1 className="text-2xl font-extralight tracking-tighter text-text-primary mt-6">Verifica tu email</h1>
        </div>
        <Suspense fallback={<div className="text-center text-text-muted text-sm">Cargando...</div>}>
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  );
}
