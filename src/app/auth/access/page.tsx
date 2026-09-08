"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/member/auth-shell";
import { Button } from "@/components/member/button";
import { CodeField } from "@/components/member/code-field";
import { Field } from "@/components/member/field";

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
    <form onSubmit={handleSubmit} className="space-y-rango">
      <Field
        label="Adresse e-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="votre@email.com"
      />

      <CodeField
        label="Code d'accès"
        value={code}
        onChange={setCode}
        hint="Le code à 6 chiffres reçu dans votre e-mail de bienvenue"
      />

      {error && (
        <p className="border-l-2 border-burgundy pl-fila text-legende text-text-primary">{error}</p>
      )}

      {/* Inactivo hasta tener las seis cifras: pulsarlo antes solo devuelve un
          error que ya sabíamos. */}
      <Button type="submit" full disabled={loading || code.length !== 6 || !email}>
        {loading ? "Vérification…" : "Accéder"}
      </Button>
    </form>
  );
}

export default function AccessPage() {
  return (
    // Poco texto que proteger, así que aquí la flor se ve más que en el resto.
    <AuthShell
      title="Accéder"
      subtitle="Utilisez le code reçu dans votre e-mail"
      veil={0.8}
      footer={
        <>
          Déjà membre ?{" "}
          <Link href="/auth/sign-in" className="text-accent transition-colors hover:text-text-primary">
            Se connecter
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-center text-legende text-text-muted">Chargement…</p>}>
        <AccessForm />
      </Suspense>
    </AuthShell>
  );
}
