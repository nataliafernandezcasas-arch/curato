"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MidiLogo from "@/components/midi-logo";
import { Clock, MapPin } from "@phosphor-icons/react";

type Visit = {
  id: string;
  status: string;
  visit_value_cop: number;
  reserved_at: string;
  content_verified: boolean;
  content_proof_urls: string[];
  creators: { full_name: string; handle: string; email: string };
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  reserved: { label: "Reservada", color: "bg-blue-50 text-blue-600" },
  checked_in: { label: "Check-in", color: "bg-yellow-50 text-yellow-700" },
  content_pending: { label: "Contenido pendiente", color: "bg-midi-orange/10 text-midi-orange" },
  content_submitted: { label: "Contenido enviado", color: "bg-accent/10 text-accent" },
  completed: { label: "Completada", color: "bg-green-50 text-green-600" },
  cancelled: { label: "Cancelada", color: "bg-red-50 text-red-500" },
};

export default function BusinessVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: comercio } = await supabase.from("comercios").select("id").eq("owner_id", user.id).maybeSingle();
      if (!comercio) { setVisits([]); setLoading(false); return; }
      const { data } = await supabase
        .from("visits")
        .select("*, creators(full_name, handle, email)")
        .eq("comercio_id", comercio.id)
        .order("created_at", { ascending: false });
      setVisits((data || []) as unknown as Visit[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-surface">
      <nav className="border-b border-border bg-surface/80 backdrop-blur-xl px-5 h-14 flex items-center">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <Link href="/" aria-label="Midi Pass" className="flex items-center gap-2 text-text-primary">
            <MidiLogo className="h-6 w-auto" />
            <span className="text-lg font-semibold tracking-tight leading-none">Pass</span>
          </Link>
          <div className="flex gap-5 text-[13px] font-medium">
            <Link href="/dashboard/business" className="text-text-muted hover:text-text-primary transition-colors">Mi Oferta</Link>
            <Link href="/dashboard/business/visits" className="text-text-primary">Visitas</Link>
            <Link href="/dashboard/business/qr" className="text-text-muted hover:text-text-primary transition-colors">QR Code</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-5 py-10">
        <h1 className="text-2xl font-extralight tracking-tighter text-text-primary mb-8">Visitas recibidas</h1>

        {loading ? (
          <p className="text-sm text-text-muted py-12 text-center">Cargando...</p>
        ) : visits.length === 0 ? (
          <div className="text-center py-16">
            <Clock size={40} className="text-text-muted mx-auto mb-4" />
            <p className="text-base font-semibold text-text-primary mb-2">Aún no tienes visitas</p>
            <p className="text-sm text-text-muted">Cuando un influencer visite tu negocio, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((visit) => {
              const status = STATUS_LABELS[visit.status] || { label: visit.status, color: "bg-gray-100 text-gray-500" };
              return (
                <div key={visit.id} className="border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide uppercase ${status.color}`}>{status.label}</span>
                      <span className="text-[10px] text-text-muted"><Clock size={10} className="inline mr-0.5" /> {new Date(visit.reserved_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[15px] font-semibold text-text-primary">{visit.creators?.full_name || "Influencer"}</p>
                    <p className="text-xs text-text-muted">@{visit.creators?.handle} · {visit.creators?.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-text-primary">${visit.visit_value_cop?.toLocaleString()} COP</p>
                    {visit.content_verified && <p className="text-[10px] text-green-600 font-medium mt-1">Contenido verificado</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
