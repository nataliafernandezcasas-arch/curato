"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react";

const PROFILES = [
  { value: "creator", label: "Creador" },
  { value: "merchant", label: "Comercio" },
  { value: "curious", label: "Curioso" },
] as const;

type Profile = (typeof PROFILES)[number]["value"];

export default function LaunchForm() {
  const params = useSearchParams();
  const source = params.get("from") || params.get("utm_source") || "direct";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Persist any UTM source server-side later if needed; here we just send it.
  useEffect(() => {
    // No-op; placeholder if we ever add prefill from query.
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) {
      setError("Cuéntanos qué eres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/launch-signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          whatsapp,
          profile,
          instagram_handle: instagram || undefined,
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No pudimos guardar tu registro.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="border border-border rounded-2xl bg-surface-raised p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-midi-lime mb-5">
          <CheckCircle size={24} weight="fill" className="text-text-primary" />
        </div>
        <h2 className="text-2xl font-extralight tracking-tighter text-text-primary mb-2">
          Estás dentro.
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-6">
          Te llega un email con la confirmación.<br />
          Nos vemos el <span className="text-text-primary font-medium">13 de mayo en Bogotá</span>.
        </p>
        <a
          href={googleCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[12px] font-semibold text-accent hover:text-text-primary transition-colors underline underline-offset-4"
        >
          Agregar al calendario
        </a>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-border bg-surface-raised text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all";
  const labelClass = "block text-[11px] font-medium text-text-secondary mb-2 uppercase tracking-[0.12em]";

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-2xl bg-surface-raised p-6 md:p-7 space-y-5">
      <div>
        <label className={labelClass}>Nombre completo</label>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label className={labelClass}>WhatsApp</label>
        <input
          type="tel"
          required
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className={inputClass}
          placeholder="+57 300 000 0000"
        />
      </div>

      <div>
        <label className={labelClass}>Soy</label>
        <div className="grid grid-cols-3 gap-2">
          {PROFILES.map((p) => {
            const selected = profile === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setProfile(p.value)}
                className={`py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 active:scale-[0.97] ${
                  selected
                    ? "bg-text-primary text-white"
                    : "bg-surface text-text-secondary border border-border hover:border-border-hover"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Instagram <span className="text-text-muted normal-case tracking-normal">(opcional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">@</span>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
            className={`${inputClass} pl-8`}
            placeholder="tuusuario"
          />
        </div>
      </div>

      {error && (
        <div className="bg-midi-orange/8 border border-midi-orange/20 text-midi-orange text-sm px-3 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-text-primary text-white text-[13px] font-semibold py-3.5 rounded-lg hover:bg-accent transition-all duration-300 disabled:opacity-50 active:scale-[0.97]"
      >
        {loading ? "Enviando..." : "Asegurar mi lugar"}
      </button>
    </form>
  );
}

function googleCalendarUrl() {
  // 13 May 2026 17:30 Bogotá (UTC-5) → 22:30 UTC; estimated 4h duration.
  const start = "20260513T223000Z";
  const end = "20260514T023000Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Lanzamiento Midi Pass",
    dates: `${start}/${end}`,
    details: "Has sido seleccionado para vivir en exclusiva el lanzamiento de Midi Pass.",
    location: "Amora Vida — Cr 12 # 98-87, Bogotá",
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}
