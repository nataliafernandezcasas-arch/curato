"use client";

import Link from "next/link";
import { useState } from "react";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import CountryPhoneInput from "@/components/forms/CountryPhoneInput";
import { ArrowLeft, CheckCircle } from "@phosphor-icons/react";

export default function BusinessesPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "business", full_name: form.get("full_name"), email: form.get("email"),
          phone: form.get("phone"), country: form.get("country"), city: form.get("city"),
          business_name: form.get("business_name"), business_type: form.get("business_type"),
          business_address: form.get("business_address"), website_url: form.get("website_url"),
          business_description: form.get("business_description"),
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
          <CheckCircle size={48} weight="duotone" className="text-midi-lime mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-text-primary tracking-tighter mb-3">Aplicación enviada</h1>
          <p className="text-sm text-text-muted mb-2">Nuestro equipo revisará tu negocio.</p>
          <p className="text-sm text-text-muted mb-8">Te contactaremos por correo y WhatsApp si eres aceptado.</p>
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
            <Link href="/comercios" className="inline-flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-primary transition-colors mb-8">
              <ArrowLeft size={14} /> Volver a Comercios
            </Link>

            <h1 className="text-3xl font-extralight tracking-tighter text-text-primary mb-2">
              Aplica como <span className="font-bold">Comercio</span>
            </h1>
            <p className="text-sm text-text-muted mb-10">15 días de prueba gratis. Sin compromiso.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelClass}>Nombre del negocio *</label>
                <input name="business_name" required className={inputClass} placeholder="Tu negocio" />
              </div>

              <div>
                <label className={labelClass}>Categoría *</label>
                <select name="business_type" required className={inputClass}>
                  <option value="">Selecciona</option>
                  {BUSINESS_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
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

              <div>
                <label className={labelClass}>Dirección *</label>
                <input name="business_address" required className={inputClass} placeholder="Dirección completa" />
              </div>

              <div className="h-px bg-border my-2" />

              <div>
                <label className={labelClass}>Nombre del contacto *</label>
                <input name="full_name" required className={inputClass} placeholder="Persona responsable" />
              </div>

              <div>
                <label className={labelClass}>Email *</label>
                <input name="email" type="email" required className={inputClass} placeholder="correo@negocio.com" />
              </div>

              <div>
                <label className={labelClass}>Sitio web</label>
                <input name="website_url" className={inputClass} placeholder="https://tunegocio.com" />
              </div>

              <div>
                <label className={labelClass}>Describe tu oferta para influencers</label>
                <textarea name="business_description" rows={3} className={`${inputClass} resize-none`} placeholder="¿Qué experiencia ofrecerías?" />
              </div>

              {error && <div className="bg-midi-orange/8 border border-midi-orange/15 text-midi-orange text-sm p-3 rounded-lg">{error}</div>}

              <button type="submit" disabled={loading} className="w-full bg-text-primary text-white text-[13px] font-semibold py-3.5 rounded-lg hover:bg-accent transition-all duration-400 disabled:opacity-50 active:scale-[0.97]">
                {loading ? "Enviando..." : "Enviar aplicación"}
              </button>

              <p className="text-center text-[10px] text-text-muted">Todos los planes incluyen 15 días de prueba gratis.</p>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
