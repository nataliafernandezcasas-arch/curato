"use client";

import { useNativePlatform } from "@/lib/native/use-native";
import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import Link from "next/link";
import { AuthShell } from "@/components/member/auth-shell";
import { Button } from "@/components/member/button";
import { Field } from "@/components/member/field";

export default function SignInPage() {
  const { lang } = useLang();
  const t = translations[lang].signIn;

  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  // Inside the app the marketing site is not a place to go: the member is
  // already a member, and that page is the shop window.
  const native = useNativePlatform();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Resolve a handle (or email) to the account's email address.
  async function resolveEmail(): Promise<string | null> {
    const lookupRes = await fetch("/api/auth/lookup-handle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    });
    const lookupData = await lookupRes.json();
    if (!lookupRes.ok || !lookupData.email) return null;
    return lookupData.email as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const email = await resolveEmail();
      if (!email) {
        setError(t.errorHandle);
        return;
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) {
        setError(t.errorPassword);
        return;
      }

      if (data.user?.user_metadata?.force_password_change) {
        window.location.href = "/auth/change-password";
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError(t.errorConnection);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Reset email is sent via our own endpoint (Resend), not Supabase's
      // rate-limited built-in mailer. Always show the same confirmation so we
      // don't leak which accounts exist.
      await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      setResetSent(true);
    } catch {
      setError(t.errorConnection);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: "signin" | "reset") {
    setMode(next);
    setError("");
    setResetSent(false);
  }

  return (
    <AuthShell
      title={mode === "reset" ? t.resetTitle : t.title}
      subtitle={mode === "reset" ? t.resetSubtitle : t.subtitle}
      footer={
        mode === "signin" && !native ? (
          <>
            {t.notMember}{" "}
            <Link href="/storytellers" className="text-accent transition-colors hover:text-text-primary">
              {t.requestInvite}
            </Link>
          </>
        ) : undefined
      }
    >
      {mode === "reset" && resetSent ? (
        <div className="space-y-rango">
          {/* La misma frase exista la cuenta o no: decir "no existe" sería
              contar quién es miembro a quien pregunte. */}
          <p className="border-l border-accent/40 pl-fila text-corps text-text-primary">{t.resetSent}</p>
          <button
            onClick={() => switchMode("signin")}
            className="min-h-11 text-capitale uppercase tracking-capitale text-accent transition-colors hover:text-text-primary"
          >
            {t.backToSignIn}
          </button>
        </div>
      ) : (
        <form onSubmit={mode === "reset" ? handleReset : handleSubmit} className="space-y-rango">
          <Field
            label={t.handleLabel}
            type="text"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            required
            placeholder={t.handlePlaceholder}
          />

          {mode === "signin" && (
            <div>
              <div className="relative">
                <Field
                  label={t.passwordLabel}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                  className="absolute bottom-2 right-0 text-text-muted transition-colors hover:text-accent"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => switchMode("reset")}
                className="mt-bloque min-h-11 text-capitale uppercase tracking-capitale text-text-muted transition-colors hover:text-accent"
              >
                {t.forgotPassword}
              </button>
            </div>
          )}

          {error && (
            <p className="border-l-2 border-burgundy-vif pl-fila text-legende text-text-primary">{error}</p>
          )}

          <Button type="submit" full disabled={loading}>
            {mode === "reset"
              ? loading
                ? t.resetSending
                : t.resetSubmit
              : loading
              ? t.submitting
              : t.submitBtn}
          </Button>

          {mode === "reset" && (
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="min-h-11 w-full text-center text-capitale uppercase tracking-capitale text-text-muted transition-colors hover:text-accent"
            >
              {t.backToSignIn}
            </button>
          )}
        </form>
      )}
    </AuthShell>
  );
}
