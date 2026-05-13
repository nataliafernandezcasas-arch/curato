"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react";

type MemberType = "creator" | "maison";

export default function AdminNuevoPage() {
  const [type, setType] = useState<MemberType>("creator");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [followers, setFollowers] = useState("");
  const [credit, setCredit] = useState("300");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ tempPassword: string; email: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/create-member", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: name.trim(),
          email: email.trim(),
          handle: handle.trim().replace("@", ""),
          followers: followers ? parseInt(followers) : 0,
          monthly_credit: credit ? parseInt(credit) : 300,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear el miembro");
        return;
      }
      setSuccess({ tempPassword: data.tempPassword, email: email.trim() });
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSuccess(null);
    setName("");
    setEmail("");
    setHandle("");
    setFollowers("");
    setCredit("300");
    setError("");
  }

  const inputClass = "w-full font-serif text-[14px] font-light text-white bg-white/5 border border-white/15 px-4 py-3 focus:outline-none focus:border-champagne/50 transition-colors placeholder:text-white/20";
  const labelClass = "block font-serif text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2";

  if (success) {
    return (
      <main className="max-w-[520px] mx-auto px-5 py-14">
        <Link href="/admin" className="inline-flex items-center gap-2 font-serif text-[11px] tracking-[0.25em] uppercase text-white/30 hover:text-white transition-colors mb-10">
          ← Admin
        </Link>

        <div className="border border-emerald-400/20 bg-emerald-400/5 p-8">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle size={20} weight="fill" className="text-emerald-400 shrink-0" />
            <p className="font-serif text-[13px] tracking-[0.2em] uppercase text-emerald-300">
              Membre créé
            </p>
          </div>

          <p className="font-serif text-[14px] font-light text-white/60 leading-relaxed mb-8">
            Un email de bienvenue avec les identifiants a été envoyé à{" "}
            <span className="text-champagne">{success.email}</span>.
          </p>

          <div className="border border-white/10 bg-white/5 p-6 mb-8">
            <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/25 mb-4">
              Mot de passe temporaire
            </p>
            <p className="font-serif text-[22px] font-light text-champagne tracking-widest">
              {success.tempPassword}
            </p>
            <p className="font-serif text-[11px] text-white/25 mt-3">
              Le membre devra le changer à la première connexion.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={reset}
              className="font-serif text-[12px] tracking-widest uppercase text-charcoal-deep bg-champagne px-6 py-3 hover:bg-copper hover:text-white transition-all duration-300"
            >
              Nouveau membre
            </button>
            <Link
              href="/admin"
              className="font-serif text-[12px] tracking-widest uppercase text-white/40 hover:text-white transition-colors"
            >
              Retour
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[520px] mx-auto px-5 py-14">
      <Link href="/admin" className="inline-flex items-center gap-2 font-serif text-[11px] tracking-[0.25em] uppercase text-white/30 hover:text-white transition-colors mb-10">
        ← Admin
      </Link>

      <div className="mb-10">
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-4">
          Curato · Admin · Nouveau membre
        </p>
        <h1 className="font-serif text-4xl font-light tracking-[0.28em] uppercase text-white">
          Créer un compte
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Type selector */}
        <div>
          <p className={labelClass}>Type de membre</p>
          <div className="grid grid-cols-2 gap-px bg-white/10">
            {(["creator", "maison"] as MemberType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-3.5 font-serif text-[12px] tracking-[0.25em] uppercase transition-all duration-200 ${
                  type === t
                    ? "bg-champagne text-charcoal-deep"
                    : "bg-white/5 text-white/40 hover:text-white/70"
                }`}
              >
                {t === "creator" ? "Créateur" : "Maison"}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/8" />

        {/* Common fields */}
        <div>
          <label className={labelClass}>
            {type === "creator" ? "Nom complet *" : "Nom de la maison *"}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder={type === "creator" ? "Prénom Nom" : "Le Comptoir du Marais"}
          />
        </div>

        <div>
          <label className={labelClass}>Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="contact@example.com"
          />
        </div>

        {/* Creator-only fields */}
        {type === "creator" && (
          <>
            <div>
              <label className={labelClass}>Handle Instagram *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif text-[14px] text-white/25">@</span>
                <input
                  type="text"
                  required
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.replace("@", ""))}
                  className={`${inputClass} pl-8`}
                  placeholder="handle"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Abonnés</label>
                <input
                  type="number"
                  value={followers}
                  onChange={(e) => setFollowers(e.target.value)}
                  className={inputClass}
                  placeholder="45000"
                  min="0"
                />
              </div>
              <div>
                <label className={labelClass}>Crédit mensuel (€)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif text-[14px] text-white/25">€</span>
                  <input
                    type="number"
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                    className={`${inputClass} pl-8`}
                    placeholder="300"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {error && (
          <p className="font-serif text-[12px] text-red-400/80 border-l border-red-400/30 pl-4">
            {error}
          </p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full font-serif text-[12px] tracking-[0.3em] uppercase text-charcoal-deep bg-champagne py-4 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-40"
          >
            {loading ? "Création en cours…" : "Créer le compte et envoyer l'email"}
          </button>
          <p className="font-serif text-[11px] text-white/20 text-center mt-4">
            Un email avec les identifiants sera envoyé automatiquement.
          </p>
        </div>
      </form>
    </main>
  );
}
