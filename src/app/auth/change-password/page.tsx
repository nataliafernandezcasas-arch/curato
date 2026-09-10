"use client";

import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import { AuthShell } from "@/components/member/auth-shell";
import { Button } from "@/components/member/button";
import { Field } from "@/components/member/field";
import { StrengthMeter } from "@/components/member/strength-meter";

export default function ChangePasswordPage() {
  const { lang } = useLang();
  const t = translations[lang].changePassword;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError(t.errorMin);
      return;
    }
    if (password !== confirm) {
      setError(t.errorMatch);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: updateErr } = await supabase.auth.updateUser({
        password,
        data: { force_password_change: false },
      });
      if (updateErr) {
        setError(t.errorUpdate);
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError(t.errorConnection);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t.title} subtitle={t.subtitle} veil={0.9}>
      <form onSubmit={handleSubmit} className="space-y-rango">
        <div>
          <div className="relative">
            <Field
              label={t.newLabel}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t.newPlaceholder}
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
          <StrengthMeter
            password={password}
            words={{ weak: t.strengthWeak, fair: t.strengthFair, strong: t.strengthStrong }}
          />
        </div>

        <div className="relative">
          <Field
            label={t.confirmLabel}
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder={t.newPlaceholder}
            className="pr-10"
            error={confirm && password !== confirm ? t.errorMatch : undefined}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            aria-label={showConfirm ? "Masquer" : "Afficher"}
            className="absolute bottom-2 right-0 text-text-muted transition-colors hover:text-accent"
          >
            {showConfirm ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && (
          <p className="border-l-2 border-burgundy-vif pl-fila text-legende text-text-primary">{error}</p>
        )}

        <Button type="submit" full disabled={loading}>
          {loading ? t.submitting : t.submit}
        </Button>
      </form>
    </AuthShell>
  );
}
