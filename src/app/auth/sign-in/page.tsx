"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

export default function SignInPage() {
  const { lang, setLang } = useLang();
  const t = translations[lang].signIn;

  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
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
      const email = await resolveEmail();
      // Always show the same confirmation, even if the handle is unknown, so
      // we don't leak which accounts exist.
      if (email) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/change-password`,
        });
      }
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
    <div className="min-h-[100dvh] relative flex items-center justify-center px-5">
      <div className="absolute inset-0">
        <img src="/hero-floral.jpeg" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-charcoal-deep/80 backdrop-blur-sm" />
      </div>

      {/* Language switcher */}
      <div className="absolute top-5 right-5 flex items-center gap-3 z-20">
        {LANGS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setLang(key)}
            className={`font-serif text-[11px] tracking-[0.2em] transition-colors ${
              lang === key ? "text-champagne" : "text-white/30 hover:text-white/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-8">
            <img src="/logo-curato-simple.png" alt="curato" style={{ height: "14px", width: "auto" }} />
          </Link>
          <h1 className="font-serif text-3xl font-light tracking-[0.35em] uppercase text-text-primary">
            {mode === "reset" ? t.resetTitle : t.title}
          </h1>
          <p className="font-serif text-[13px] font-light text-text-muted mt-3 tracking-wide">
            {mode === "reset" ? t.resetSubtitle : t.subtitle}
          </p>
        </div>

        {mode === "reset" && resetSent ? (
          <div className="text-center space-y-8">
            <p className="font-serif text-[14px] font-light text-text-primary/80 leading-relaxed border-l border-champagne/40 pl-4 text-left">
              {t.resetSent}
            </p>
            <button
              onClick={() => switchMode("signin")}
              className="font-serif text-[12px] tracking-wide text-champagne hover:text-copper transition-colors"
            >
              {t.backToSignIn}
            </button>
          </div>
        ) : (
          <form onSubmit={mode === "reset" ? handleReset : handleSubmit} className="space-y-5">
            <div>
              <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
                {t.handleLabel}
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
                className="w-full px-5 py-4 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/50"
                placeholder={t.handlePlaceholder}
              />
            </div>

            {mode === "signin" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60">
                    {t.passwordLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode("reset")}
                    className="font-serif text-[11px] font-light text-text-muted hover:text-champagne transition-colors tracking-wide"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-5 py-4 pr-12 border border-border bg-charcoal-mid/60 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-text-muted/50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-champagne transition-colors"
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

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
              {mode === "reset"
                ? loading
                  ? t.resetSending
                  : t.resetSubmit
                : loading
                ? t.submitting
                : t.submitBtn}
            </button>

            {mode === "reset" && (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="w-full text-center font-serif text-[12px] font-light text-text-muted hover:text-champagne transition-colors tracking-wide"
              >
                {t.backToSignIn}
              </button>
            )}
          </form>
        )}

        {mode === "signin" && (
          <p className="text-center mt-10 font-serif text-[12px] font-light text-text-muted tracking-wide">
            {t.notMember}{" "}
            <Link href="/creadores" className="text-champagne hover:text-copper transition-colors">
              {t.requestInvite}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
