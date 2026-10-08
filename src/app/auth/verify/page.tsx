"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/member/auth-shell";
import { Button } from "@/components/member/button";
import { CodeField } from "@/components/member/code-field";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";

const T: Record<Lang, {
  title: string;
  subtitle: string;
  sentTo: string;
  codeLabel: string;
  verifying: string;
  submit: string;
  errorCode: string;
  errorConnection: string;
  changeEmail: string;
  loading: string;
}> = {
  fr: {
    title: "Vérification",
    subtitle: "Saisissez le code reçu par e-mail",
    sentTo: "Code envoyé à",
    codeLabel: "Code de vérification",
    verifying: "Vérification…",
    submit: "Accéder",
    errorCode: "Code invalide ou expiré.",
    errorConnection: "Erreur de connexion.",
    changeEmail: "Changer d'adresse e-mail",
    loading: "Chargement…",
  },
  en: {
    title: "Verification",
    subtitle: "Enter the code we sent you by email",
    sentTo: "Code sent to",
    codeLabel: "Verification code",
    verifying: "Verifying…",
    submit: "Continue",
    errorCode: "Invalid or expired code.",
    errorConnection: "Connection error.",
    changeEmail: "Use a different email address",
    loading: "Loading…",
  },
  es: {
    title: "Verificación",
    subtitle: "Escribe el código que te llegó por correo",
    sentTo: "Código enviado a",
    codeLabel: "Código de verificación",
    verifying: "Verificando…",
    submit: "Entrar",
    errorCode: "Código no válido o caducado.",
    errorConnection: "Error de conexión.",
    changeEmail: "Cambiar de correo",
    loading: "Cargando…",
  },
};

function VerifyForm() {
  const { lang } = useLang();
  const t = T[lang];
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  // La clave y no el texto: si cambia el idioma, el error cambia con él.
  const [error, setError] = useState<"" | "errorCode" | "errorConnection">("");
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
        if (verifyError2) { setError("errorCode"); return; }
      }
      window.location.href = "/dashboard";
    } catch {
      setError("errorConnection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-rango">
      {/* El correo entero y sin cortar: si alguien se equivocó al escribirlo,
          esta es la pantalla donde tiene que poder verlo. */}
      <div className="text-center">
        <p className="text-capitale uppercase tracking-capitale text-text-secondary">{t.sentTo}</p>
        <p className="mt-bloque break-words text-corps text-text-primary">{email}</p>
      </div>

      <CodeField label={t.codeLabel} value={code} onChange={setCode} />

      {error && (
        <p className="border-l-2 border-burgundy-vif pl-fila text-legende text-text-primary">{t[error]}</p>
      )}

      <Button type="submit" full disabled={loading || code.length !== 6}>
        {loading ? t.verifying : t.submit}
      </Button>
    </form>
  );
}

export default function VerifyPage() {
  const { lang } = useLang();
  const t = T[lang];
  return (
    <AuthShell
      title={t.title}
      subtitle={t.subtitle}
      footer={
        <Link href="/auth/sign-in" className="text-accent transition-colors hover:text-text-primary">
          {t.changeEmail}
        </Link>
      }
    >
      <Suspense fallback={<p className="text-center text-legende text-text-muted">{t.loading}</p>}>
        <VerifyForm />
      </Suspense>
    </AuthShell>
  );
}
