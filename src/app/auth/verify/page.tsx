"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/member/auth-shell";
import { Button } from "@/components/member/button";
import { CodeField } from "@/components/member/code-field";

function VerifyForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    <form onSubmit={handleSubmit} className="space-y-rango">
      {/* El correo entero y sin cortar: si alguien se equivocó al escribirlo,
          esta es la pantalla donde tiene que poder verlo. */}
      <div className="text-center">
        <p className="text-capitale uppercase tracking-capitale text-text-secondary">Code envoyé à</p>
        <p className="mt-bloque break-words text-corps text-text-primary">{email}</p>
      </div>

      <CodeField label="Code de vérification" value={code} onChange={setCode} />

      {error && (
        <p className="border-l-2 border-burgundy pl-fila text-legende text-text-primary">{error}</p>
      )}

      <Button type="submit" full disabled={loading || code.length !== 6}>
        {loading ? "Vérification…" : "Accéder"}
      </Button>
    </form>
  );
}

export default function VerifyPage() {
  return (
    <AuthShell
      title="Vérification"
      subtitle="Saisissez le code reçu par e-mail"
      footer={
        <Link href="/auth/sign-in" className="text-accent transition-colors hover:text-text-primary">
          Changer d&apos;adresse e-mail
        </Link>
      }
    >
      <Suspense fallback={<p className="text-center text-legende text-text-muted">Chargement…</p>}>
        <VerifyForm />
      </Suspense>
    </AuthShell>
  );
}
