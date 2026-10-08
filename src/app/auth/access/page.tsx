"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/member/auth-shell";
import { Button } from "@/components/member/button";
import { CodeField } from "@/components/member/code-field";
import { Field } from "@/components/member/field";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";

// Los códigos que devuelve /api/auth/verify-access-code.
type CodigoError = "missing" | "not_found" | "too_many" | "invalid" | "expired" | "link" | "server" | "connection";

const T: Record<Lang, {
  title: string;
  subtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  codeLabel: string;
  codeHint: string;
  verifying: string;
  submit: string;
  alreadyMember: string;
  signIn: string;
  loading: string;
  errors: Record<Exclude<CodigoError, "invalid">, string>;
  invalid: (quedan: number) => string;
}> = {
  fr: {
    title: "Accéder",
    subtitle: "Utilisez le code reçu dans votre e-mail",
    emailLabel: "Adresse e-mail",
    emailPlaceholder: "votre@email.com",
    codeLabel: "Code d'accès",
    codeHint: "Le code à 6 chiffres reçu dans votre e-mail de bienvenue",
    verifying: "Vérification…",
    submit: "Accéder",
    alreadyMember: "Déjà membre ?",
    signIn: "Se connecter",
    loading: "Chargement…",
    errors: {
      missing: "Saisissez votre e-mail et votre code.",
      not_found: "Aucune candidature approuvée trouvée pour cet e-mail.",
      too_many: "Trop de tentatives. Écrivez-nous à hello@curatocollective.com pour un nouveau code.",
      expired: "Ce code a expiré. Contactez-nous à hello@curatocollective.com.",
      link: "Erreur lors de la génération du lien. Réessayez.",
      server: "Une erreur est survenue. Réessayez.",
      connection: "Erreur de connexion. Veuillez réessayer.",
    },
    invalid: (n) =>
      n > 0
        ? `Code invalide. Il vous reste ${n} tentative${n > 1 ? "s" : ""}.`
        : "Code invalide. C'était la dernière tentative : écrivez-nous pour un nouveau code.",
  },
  en: {
    title: "Access",
    subtitle: "Use the code from your email",
    emailLabel: "Email address",
    emailPlaceholder: "you@email.com",
    codeLabel: "Access code",
    codeHint: "The 6-digit code from your welcome email",
    verifying: "Verifying…",
    submit: "Continue",
    alreadyMember: "Already a member?",
    signIn: "Sign in",
    loading: "Loading…",
    errors: {
      missing: "Enter your email and your code.",
      not_found: "No approved application found for this email.",
      too_many: "Too many attempts. Write to us at hello@curatocollective.com for a new code.",
      expired: "This code has expired. Contact us at hello@curatocollective.com.",
      link: "We could not create your sign-in link. Try again.",
      server: "Something went wrong. Try again.",
      connection: "Connection error. Please try again.",
    },
    invalid: (n) =>
      n > 0
        ? `Invalid code. You have ${n} attempt${n > 1 ? "s" : ""} left.`
        : "Invalid code. That was your last attempt: write to us for a new code.",
  },
  es: {
    title: "Entrar",
    subtitle: "Usa el código que te llegó por correo",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "tu@correo.com",
    codeLabel: "Código de acceso",
    codeHint: "El código de 6 cifras de tu correo de bienvenida",
    verifying: "Verificando…",
    submit: "Entrar",
    alreadyMember: "¿Ya eres miembro?",
    signIn: "Iniciar sesión",
    loading: "Cargando…",
    errors: {
      missing: "Escribe tu correo y tu código.",
      not_found: "No hay ninguna candidatura aprobada con este correo.",
      too_many: "Demasiados intentos. Escríbenos a hello@curatocollective.com para recibir un código nuevo.",
      expired: "Este código ha caducado. Escríbenos a hello@curatocollective.com.",
      link: "No se pudo generar el enlace. Vuelve a intentarlo.",
      server: "Algo ha fallado. Vuelve a intentarlo.",
      connection: "Error de conexión. Vuelve a intentarlo.",
    },
    invalid: (n) =>
      n > 0
        ? `Código no válido. Te ${n > 1 ? "quedan" : "queda"} ${n} intento${n > 1 ? "s" : ""}.`
        : "Código no válido. Era el último intento: escríbenos para recibir un código nuevo.",
  },
};

function AccessForm() {
  const { lang } = useLang();
  const t = T[lang];
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  // El código del error y no su texto, para traducirlo al pintar.
  const [error, setError] = useState<{ code: CodigoError; remaining?: number } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code }),
      });
      const data = await res.json();
      if (!res.ok) {
        const conocido = typeof data.code === "string" && (data.code in t.errors || data.code === "invalid");
        setError({
          code: conocido ? (data.code as CodigoError) : "server",
          remaining: typeof data.remaining === "number" ? data.remaining : undefined,
        });
        return;
      }
      window.location.href = data.redirectTo || "/dashboard";
    } catch {
      setError({ code: "connection" });
    } finally {
      setLoading(false);
    }
  }

  const errorTexto = !error
    ? ""
    : error.code === "invalid"
      ? t.invalid(error.remaining ?? 1)
      : t.errors[error.code];

  return (
    <form onSubmit={handleSubmit} className="space-y-rango">
      <Field
        label={t.emailLabel}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder={t.emailPlaceholder}
      />

      <CodeField
        label={t.codeLabel}
        value={code}
        onChange={setCode}
        hint={t.codeHint}
      />

      {errorTexto && (
        <p className="border-l-2 border-burgundy-vif pl-fila text-legende text-text-primary">{errorTexto}</p>
      )}

      {/* Inactivo hasta tener las seis cifras: pulsarlo antes solo devuelve un
          error que ya sabíamos. */}
      <Button type="submit" full disabled={loading || code.length !== 6 || !email}>
        {loading ? t.verifying : t.submit}
      </Button>
    </form>
  );
}

export default function AccessPage() {
  const { lang } = useLang();
  const t = T[lang];
  return (
    // Poco texto que proteger, así que aquí la flor se ve más que en el resto.
    <AuthShell
      title={t.title}
      subtitle={t.subtitle}
      veil={0.8}
      footer={
        <>
          {t.alreadyMember}{" "}
          <Link href="/auth/sign-in" className="text-accent transition-colors hover:text-text-primary">
            {t.signIn}
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-center text-legende text-text-muted">{t.loading}</p>}>
        <AccessForm />
      </Suspense>
    </AuthShell>
  );
}
