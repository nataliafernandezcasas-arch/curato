"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react";

const PROFILES = [
  { value: "creator", label: "Créateur · Creator" },
  { value: "merchant", label: "Maison · House" },
  { value: "curious", label: "Invité · Guest" },
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
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // placeholder for future prefill logic
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) {
      setError("Veuillez sélectionner votre profil.");
      return;
    }
    if (!ageConfirmed) {
      setError("Vous devez avoir 18 ans révolus pour vous inscrire.");
      return;
    }
    if (!termsAccepted) {
      setError("Vous devez accepter les Conditions Générales pour vous inscrire.");
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
          whatsapp: whatsapp || undefined,
          profile,
          instagram_handle: instagram || undefined,
          source,
          age_confirmed: true,
          terms_accepted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nous n'avons pas pu enregistrer votre inscription.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="border border-white/15 bg-white/5 backdrop-blur-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 border border-champagne/40 mb-5">
          <CheckCircle size={22} weight="fill" className="text-champagne" />
        </div>
        <h2 className="font-serif text-[26px] font-light tracking-wide text-white mb-3">
          Vous êtes confirmé.
        </h2>
        <p className="font-serif text-[14px] font-light text-white/50 leading-relaxed mb-6">
          Un email de confirmation vous sera envoyé.<br />
          À bientôt le{" "}
          <span className="text-champagne">22 juillet à Paris</span>.
        </p>
        <a
          href={googleCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 hover:text-champagne transition-colors"
        >
          Ajouter au calendrier →
        </a>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3 border border-white/15 bg-white/5 text-white font-serif text-[14px] placeholder:text-white/25 focus:outline-none focus:border-champagne/50 transition-all backdrop-blur-sm";

  const labelClass =
    "block font-serif text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2";

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-white/15 bg-white/5 backdrop-blur-sm p-6 md:p-7 space-y-5"
    >
      {/* Name */}
      <div>
        <label className={labelClass}>Nom complet · Full name</label>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
          placeholder="Votre nom · Your name"
        />
      </div>

      {/* Email */}
      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="votre@email.com"
        />
      </div>

      {/* WhatsApp – optional */}
      <div>
        <label className={labelClass}>
          WhatsApp{" "}
          <span className="text-white/20 normal-case tracking-normal font-serif text-[10px]">
            (optionnel · optional)
          </span>
        </label>
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className={inputClass}
          placeholder="+33 6 00 00 00 00"
        />
      </div>

      {/* Profile */}
      <div>
        <label className={labelClass}>Je suis · I am</label>
        <div className="grid grid-cols-3 gap-2">
          {PROFILES.map((p) => {
            const selected = profile === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setProfile(p.value)}
                className={`py-3 font-serif text-[11px] tracking-wide transition-all duration-200 border ${
                  selected
                    ? "border-champagne bg-champagne/15 text-champagne"
                    : "border-white/15 bg-transparent text-white/40 hover:border-white/30 hover:text-white/70"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instagram */}
      <div>
        <label className={labelClass}>
          Instagram{" "}
          <span className="text-white/20 normal-case tracking-normal font-serif text-[10px]">
            (optionnel)
          </span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif text-[14px] text-white/25">
            @
          </span>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
            className={`${inputClass} pl-8`}
            placeholder="votrepseudo"
          />
        </div>
      </div>

      {/* Age 18+ attestation (RGPD) */}
      <label className="flex items-start gap-3 cursor-pointer group pt-1">
        <input
          type="checkbox"
          checked={ageConfirmed}
          onChange={(e) => setAgeConfirmed(e.target.checked)}
          className="mt-1 w-4 h-4 accent-champagne cursor-pointer flex-shrink-0"
        />
        <span className="font-serif text-[12px] font-light text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">
          J&apos;atteste avoir 18 ans révolus.
          <span className="text-copper/70"> *</span>
        </span>
      </label>

      {/* Terms & Conditions acceptance */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-1 w-4 h-4 accent-champagne cursor-pointer flex-shrink-0"
        />
        <span className="font-serif text-[12px] font-light text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">
          J&apos;accepte les{" "}
          <Link
            href="/condiciones"
            target="_blank"
            rel="noopener noreferrer"
            className="text-champagne/80 hover:text-champagne underline underline-offset-2 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Conditions Générales
          </Link>
          <span className="text-copper/70"> *</span>
        </span>
      </label>

      {/* Error */}
      {error && (
        <p className="font-serif text-[12px] text-red-400/80">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !ageConfirmed || !termsAccepted}
        className="w-full font-serif text-[12px] tracking-[0.3em] uppercase text-charcoal-deep bg-champagne py-4 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "…" : "Confirmer ma présence"}
      </button>
    </form>
  );
}

function googleCalendarUrl() {
  // 22 July 2026 19:00 Paris (CEST = UTC+2) → 17:00 UTC; 3h duration
  const start = "20260722T170000Z";
  const end = "20260722T200000Z";
  const urlParams = new URLSearchParams({
    action: "TEMPLATE",
    text: "Lancement Curato · Paris",
    dates: `${start}/${end}`,
    details:
      "Vous avez été sélectionné pour vivre en exclusivité le lancement de Curato — l'écosystème où les créateurs et les maisons qu'ils aiment se rencontrent.",
    location: "Paris, France",
  });
  return `https://www.google.com/calendar/render?${urlParams.toString()}`;
}
