"use client";

import Link from "next/link";
import { useState } from "react";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import { FOLLOWER_RANGES, CONTENT_NICHES } from "@/lib/constants";
import CountryPhoneInput from "@/components/forms/CountryPhoneInput";
import { ArrowLeft, CheckCircle } from "@phosphor-icons/react";

export default function InfluencersPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receivesForeignPayments, setReceivesForeignPayments] = useState<boolean | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (receivesForeignPayments === null) {
      setError("Cuéntanos si recibes pagos del extranjero.");
      return;
    }
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "influencer", full_name: form.get("full_name"), email: form.get("email"),
          phone: form.get("phone"), country: form.get("country"), city: form.get("city"),
          instagram_handle: form.get("instagram_handle"), tiktok_handle: form.get("tiktok_handle"),
          follower_range: form.get("follower_range"), content_niche: form.get("content_niche"),
          motivation: form.get("motivation"),
          receives_foreign_payments: receivesForeignPayments,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar");
    } finally { setLoading(false); }
  }

  if (submitted) {
    return (
      <div className="min-h-[100dvh] bg-surface flex items-center justify-center px-5">
        <div className="max-w-[420px] text-center">
          <CheckCircle size={48} weight="duotone" className="text-accent mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-text-primary tracking-tighter mb-3">Aplicación enviada</h1>
          <p className="text-sm text-text-muted mb-2">Nuestro equipo revisará tu perfil.</p>
          <p className="text-sm text-text-muted mb-8">Si eres aceptado, recibirás un correo y un WhatsApp.</p>
          <Link href="/" className="text-[13px] font-semibold text-accent hover:text-text-primary transition-colors">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all";
  const labelClass = "block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide";

  return (
    <>
      <Nav />
      <main className="pt-14">
        <section className="py-16 md:py-24">
          <div className="max-w-[520px] mx-auto px-5">
            <Link href="/creadores" className="inline-flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-primary transition-colors mb-8">
              <ArrowLeft size={14} /> Volver a Creadores
            </Link>

            <h1 className="text-3xl font-extralight tracking-tighter text-text-primary mb-2">
              Aplica como <span className="font-bold">Influencer</span>
            </h1>
            <p className="text-sm text-text-muted mb-10">Revisamos cada aplicación manualmente. Cupos limitados.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelClass}>Nombre completo *</label>
                <input name="full_name" required className={inputClass} placeholder="Tu nombre" />
              </div>

              <div>
                <label className={labelClass}>Email *</label>
                <input name="email" type="email" required className={inputClass} placeholder="tu@email.com" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <CountryPhoneInput
                  countryName="country"
                  phoneName="phone"
                  required
                  inputClass={inputClass}
                  labelClass={labelClass}
                />
              </div>

              <div>
                <label className={labelClass}>Ciudad *</label>
                <input name="city" required className={inputClass} placeholder="ej: Bogotá, Ciudad de México, Lima…" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Instagram *</label>
                  <input name="instagram_handle" required className={inputClass} placeholder="@tuhandle" />
                </div>
                <div>
                  <label className={labelClass}>TikTok</label>
                  <input name="tiktok_handle" className={inputClass} placeholder="@tuhandle" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Seguidores *</label>
                  <select name="follower_range" required className={inputClass}>
                    <option value="">Selecciona</option>
                    {FOLLOWER_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Nicho *</label>
                  <select name="content_niche" required className={inputClass}>
                    <option value="">Selecciona</option>
                    {CONTENT_NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>¿Recibes pagos de clientes en el extranjero? *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: true, label: "Sí" },
                    { value: false, label: "No" },
                  ].map((opt) => {
                    const selected = receivesForeignPayments === opt.value;
                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => setReceivesForeignPayments(opt.value)}
                        className={`py-3 rounded-lg text-[13px] font-medium transition-all duration-200 active:scale-[0.97] ${
                          selected
                            ? "bg-text-primary text-white"
                            : "bg-surface text-text-secondary border border-border hover:border-border-hover"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelClass}>Por qué quieres ser parte?</label>
                <textarea name="motivation" rows={3} className={`${inputClass} resize-none`} placeholder="Cuéntanos sobre ti..." />
              </div>

              {error && <div className="bg-midi-orange/8 border border-midi-orange/15 text-midi-orange text-sm p-3 rounded-lg">{error}</div>}

              <button type="submit" disabled={loading} className="w-full bg-text-primary text-white text-[13px] font-semibold py-3.5 rounded-lg hover:bg-accent transition-all duration-400 disabled:opacity-50 active:scale-[0.97]">
                {loading ? "Enviando..." : "Enviar aplicación"}
              </button>

              <p className="text-center text-[10px] text-text-muted">Al aplicar, aceptas los términos y condiciones de Midi Pass.</p>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
