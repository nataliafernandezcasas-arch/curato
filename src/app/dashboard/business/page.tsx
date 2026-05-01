"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MidiLogo from "@/components/midi-logo";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import { PencilSimple } from "@phosphor-icons/react";

type Offer = {
  id: string;
  title: string;
  description: string;
  category: string;
  address: string;
  reservation_phone: string;
  visit_value_cop: number;
  is_active: boolean;
};

export default function BusinessDashboard() {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", category: "", address: "", reservation_phone: "", visit_value_cop: "200000", available_hours: "", extras: "" });

  const [comercioId, setComercioId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: comercio } = await supabase.from("comercios").select("id").eq("owner_id", user.id).maybeSingle();
      if (!comercio) { setCreating(true); setLoading(false); return; }
      setComercioId(comercio.id);
      const { data } = await supabase.from("offers").select("*").eq("comercio_id", comercio.id).limit(1).maybeSingle();
      if (data) setOffer(data as Offer); else setCreating(true);
      setLoading(false);
    }
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!comercioId) return;
    setSaving(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase.from("offers").insert({
      comercio_id: comercioId, title: formData.title, description: formData.description, category: formData.category,
      address: formData.address, reservation_phone: formData.reservation_phone,
      visit_value_cop: parseInt(formData.visit_value_cop), available_hours: formData.available_hours, extras: formData.extras, is_active: true,
    }).select().single();

    if (!error && data) {
      setOffer(data as Offer);
      setCreating(false);
    }
    setSaving(false);
  }

  const inputClass = "w-full px-4 py-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all";
  const labelClass = "block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide";

  if (loading) return <div className="min-h-[100dvh] bg-surface flex items-center justify-center text-sm text-text-muted">Cargando...</div>;

  return (
    <div className="min-h-[100dvh] bg-surface">
      <nav className="border-b border-border bg-surface/80 backdrop-blur-xl px-5 h-14 flex items-center">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <Link href="/" aria-label="Midi Pass" className="flex items-center gap-2 text-text-primary">
            <MidiLogo className="h-6 w-auto" />
            <span className="text-lg font-semibold tracking-tight leading-none">Pass</span>
          </Link>
          <div className="flex gap-5 text-[13px] font-medium">
            <Link href="/dashboard/business" className="text-text-primary">Mi Oferta</Link>
            <Link href="/dashboard/business/visits" className="text-text-muted hover:text-text-primary transition-colors">Visitas</Link>
            <Link href="/dashboard/business/qr" className="text-text-muted hover:text-text-primary transition-colors">QR Code</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[600px] mx-auto px-5 py-10">
        {creating ? (
          <>
            <h1 className="text-2xl font-extralight tracking-tighter text-text-primary mb-2">Publica tu oferta</h1>
            <p className="text-sm text-text-muted mb-10">Los influencers verán esto en su catálogo.</p>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className={labelClass}>Nombre de la experiencia *</label>
                <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required className={inputClass} placeholder="ej: Brunch para 2 en terraza" />
              </div>
              <div>
                <label className={labelClass}>Descripción *</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={3} className={`${inputClass} resize-none`} placeholder="Qué incluye la experiencia..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Categoría *</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required className={inputClass}>
                    <option value="">Selecciona</option>
                    {BUSINESS_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Valor por visita (COP) *</label>
                  <input type="number" value={formData.visit_value_cop} onChange={(e) => setFormData({...formData, visit_value_cop: e.target.value})} required className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Dirección *</label>
                <input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required className={inputClass} placeholder="Dirección completa" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Teléfono de reserva *</label>
                  <input value={formData.reservation_phone} onChange={(e) => setFormData({...formData, reservation_phone: e.target.value})} required className={inputClass} placeholder="+57 300 123 4567" />
                </div>
                <div>
                  <label className={labelClass}>Horarios</label>
                  <input value={formData.available_hours} onChange={(e) => setFormData({...formData, available_hours: e.target.value})} className={inputClass} placeholder="Lun-Vie 12-10pm" />
                </div>
              </div>

              <button type="submit" disabled={saving} className="w-full bg-text-primary text-white text-[13px] font-semibold py-3.5 rounded-lg hover:bg-accent transition-all duration-400 disabled:opacity-50 active:scale-[0.97]">
                {saving ? "Publicando..." : "Publicar oferta"}
              </button>
            </form>
          </>
        ) : offer ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-extralight tracking-tighter text-text-primary">Tu oferta</h1>
              <Link href="/dashboard/business/offer/edit" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:text-text-primary transition-colors">
                <PencilSimple size={14} /> Editar
              </Link>
            </div>

            <div className="border border-border rounded-xl p-7">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold text-midi-lime uppercase tracking-wide bg-midi-lime/10 px-2 py-0.5 rounded">{offer.category}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${offer.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                  {offer.is_active ? "Activa" : "Inactiva"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-text-primary tracking-tighter mb-2">{offer.title}</h2>
              <p className="text-sm text-text-muted mb-5 leading-relaxed">{offer.description}</p>
              <div className="divide-y divide-border">
                <div className="py-3 flex justify-between text-sm"><span className="text-text-muted">Dirección</span><span className="text-text-primary font-medium">{offer.address}</span></div>
                <div className="py-3 flex justify-between text-sm"><span className="text-text-muted">Reservas</span><span className="text-text-primary font-medium">{offer.reservation_phone}</span></div>
                <div className="py-3 flex justify-between text-sm"><span className="text-text-muted">Valor por visita</span><span className="text-text-primary font-medium">${offer.visit_value_cop?.toLocaleString()} COP</span></div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
