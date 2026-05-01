"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MidiLogo from "@/components/midi-logo";
import { ArrowLeft } from "@phosphor-icons/react";
import { BUSINESS_CATEGORIES } from "@/lib/constants";

export default function EditOfferPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: "", description: "", category: "", address: "", reservation_phone: "", visit_value_cop: "200000", available_hours: "", extras: "" });

  const [comercioId, setComercioId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: comercio } = await supabase.from("comercios").select("id").eq("owner_id", user.id).maybeSingle();
      if (!comercio) { setLoading(false); return; }
      setComercioId(comercio.id);
      const { data } = await supabase.from("offers").select("*").eq("comercio_id", comercio.id).limit(1).maybeSingle();
      if (data) {
        setFormData({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          address: data.address || "",
          reservation_phone: data.reservation_phone || "",
          visit_value_cop: String(data.visit_value_cop || "200000"),
          available_hours: data.available_hours || "",
          extras: data.extras || "",
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!comercioId) return;
    setSaving(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    await supabase.from("offers").update({
      title: formData.title, description: formData.description, category: formData.category,
      address: formData.address, reservation_phone: formData.reservation_phone,
      visit_value_cop: parseInt(formData.visit_value_cop), available_hours: formData.available_hours, extras: formData.extras,
      updated_at: new Date().toISOString(),
    }).eq("comercio_id", comercioId);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
        </div>
      </nav>

      <div className="max-w-[600px] mx-auto px-5 py-10">
        <Link href="/dashboard/business" className="inline-flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-primary transition-colors mb-8">
          <ArrowLeft size={14} /> Volver
        </Link>

        <h1 className="text-2xl font-extralight tracking-tighter text-text-primary mb-2">Editar oferta</h1>
        <p className="text-sm text-text-muted mb-10">Los cambios se reflejan inmediatamente en el catálogo.</p>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className={labelClass}>Nombre de la experiencia *</label>
            <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Descripción *</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={3} className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Categoría *</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required className={inputClass}>
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
            <input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Teléfono de reserva *</label>
              <input value={formData.reservation_phone} onChange={(e) => setFormData({...formData, reservation_phone: e.target.value})} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Horarios</label>
              <input value={formData.available_hours} onChange={(e) => setFormData({...formData, available_hours: e.target.value})} className={inputClass} />
            </div>
          </div>

          <button type="submit" disabled={saving} className="w-full bg-text-primary text-white text-[13px] font-semibold py-3.5 rounded-lg hover:bg-accent transition-all duration-400 disabled:opacity-50 active:scale-[0.97]">
            {saving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
