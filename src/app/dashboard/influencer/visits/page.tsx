"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MidiLogo from "@/components/midi-logo";
import { MapPin, Clock, Camera, CheckCircle, UploadSimple, VideoCamera, X } from "@phosphor-icons/react";

type Visit = {
  id: string;
  status: string;
  visit_value_cop: number;
  reserved_at: string;
  check_in_at: string | null;
  completed_at: string | null;
  content_proof_urls: string[];
  offers: {
    title: string;
    address: string;
    category: string;
    comercios: { name: string } | null;
  };
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  reserved: { label: "Reservada", color: "bg-blue-50 text-blue-600" },
  checked_in: { label: "Check-in", color: "bg-yellow-50 text-yellow-700" },
  content_pending: { label: "Contenido pendiente", color: "bg-midi-orange/10 text-midi-orange" },
  content_submitted: { label: "Contenido enviado", color: "bg-accent/10 text-accent" },
  completed: { label: "Completada", color: "bg-green-50 text-green-600" },
  cancelled: { label: "Cancelada", color: "bg-red-50 text-red-500" },
  expired: { label: "Expirada", color: "bg-gray-100 text-gray-500" },
};

const CAT_LABELS: Record<string, string> = { gastronomy: "Gastronomía", beauty: "Beauty", wellness: "Wellness", hospitality: "Hospedaje" };

function UploadModal({ visit, userEmail, onClose, onUploaded }: { visit: Visit; userEmail: string; onClose: () => void; onUploaded: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleUpload = async () => {
    if (files.length === 0) { setError("Selecciona al menos un archivo"); return; }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("visitId", visit.id);
      formData.append("email", userEmail);
      files.forEach(f => formData.append("files", f));

      const res = await fetch("/api/visits/upload-proof", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error subiendo archivos"); return; }
      onUploaded();
      onClose();
    } catch {
      setError("Error de conexión");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-surface rounded-xl max-w-md w-full p-6 border border-border" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary">Subir contenido</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
        </div>

        <p className="text-sm text-text-muted mb-1">{visit.offers?.title}</p>
        <p className="text-xs text-text-muted mb-6">{visit.offers?.comercios?.name}</p>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2 mb-4">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-surface-hover rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  {f.type.startsWith("video") ? <VideoCamera size={16} className="text-accent shrink-0" /> : <Camera size={16} className="text-accent shrink-0" />}
                  <span className="text-xs text-text-primary truncate">{f.name}</span>
                  <span className="text-[10px] text-text-muted shrink-0">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                </div>
                <button onClick={() => removeFile(i)} className="text-text-muted hover:text-red-500 shrink-0 ml-2"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Upload area */}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent/30 hover:bg-accent/3 transition-all duration-300 mb-4"
        >
          <UploadSimple size={28} className="text-text-muted mx-auto mb-2" />
          <p className="text-sm font-medium text-text-primary">Screenshots, fotos o videos</p>
          <p className="text-xs text-text-muted mt-1">de tus stories, reels o posts sobre la visita</p>
        </button>
        <input ref={inputRef} type="file" multiple accept="image/*,video/*" onChange={handleFiles} className="hidden" />

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="w-full bg-text-primary text-white text-[13px] font-semibold py-3 rounded-lg hover:bg-accent transition-all duration-400 disabled:opacity-50 active:scale-[0.97]"
        >
          {uploading ? "Subiendo..." : `Subir ${files.length} archivo${files.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

export default function InfluencerVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [uploadVisit, setUploadVisit] = useState<Visit | null>(null);

  async function loadVisits() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserEmail(user.email || "");

    const { data: creator } = await supabase.from("creators").select("id").eq("owner_id", user.id).maybeSingle();
    if (!creator) { setVisits([]); setLoading(false); return; }

    const { data } = await supabase
      .from("visits")
      .select("*, offers(title, address, category, comercios(name))")
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false });

    setVisits((data || []) as unknown as Visit[]);
    setLoading(false);
  }

  useEffect(() => { loadVisits(); }, []);

  return (
    <div className="min-h-[100dvh] bg-surface">
      <nav className="border-b border-border bg-surface/80 backdrop-blur-xl px-5 h-14 flex items-center">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <Link href="/" aria-label="Midi Pass" className="flex items-center gap-2 text-text-primary">
            <MidiLogo className="h-6 w-auto" />
            <span className="text-lg font-semibold tracking-tight leading-none">Pass</span>
          </Link>
          <div className="flex gap-5 text-[13px] font-medium">
            <Link href="/dashboard/influencer" className="text-text-muted hover:text-text-primary transition-colors">Ofertas</Link>
            <Link href="/dashboard/influencer/visits" className="text-text-primary">Mis Visitas</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-5 py-10">
        <h1 className="text-2xl font-extralight tracking-tighter text-text-primary mb-8">Mis Visitas</h1>

        {loading ? (
          <p className="text-sm text-text-muted py-12 text-center">Cargando...</p>
        ) : visits.length === 0 ? (
          <div className="text-center py-16">
            <Clock size={40} className="text-text-muted mx-auto mb-4" />
            <p className="text-base font-semibold text-text-primary mb-2">Aún no tienes visitas</p>
            <p className="text-sm text-text-muted mb-6">Explora las ofertas disponibles y reserva tu primera experiencia.</p>
            <Link href="/dashboard/influencer" className="text-[13px] font-semibold text-accent hover:text-text-primary transition-colors">
              Ver ofertas
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((visit) => {
              const status = STATUS_LABELS[visit.status] || { label: visit.status, color: "bg-gray-100 text-gray-500" };
              return (
                <div key={visit.id} className="border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide uppercase ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-[10px] text-text-muted uppercase tracking-wide">
                        {CAT_LABELS[visit.offers?.category] || visit.offers?.category}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-text-primary truncate">{visit.offers?.title}</h3>
                    <p className="text-xs text-text-muted truncate">{visit.offers?.comercios?.name}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {visit.offers?.address}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(visit.reserved_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-primary">${visit.visit_value_cop?.toLocaleString()}</p>
                      <p className="text-[10px] text-text-muted">COP</p>
                    </div>

                    {(visit.status === "content_pending" || visit.status === "checked_in" || visit.status === "reserved") && (
                      <button
                        onClick={() => setUploadVisit(visit)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-accent px-3 py-2 rounded-lg hover:bg-accent/80 transition-all active:scale-[0.97]"
                      >
                        <UploadSimple size={14} /> Subir contenido
                      </button>
                    )}

                    {visit.status === "content_submitted" && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent">
                        <CheckCircle size={14} weight="fill" /> Enviado
                      </div>
                    )}

                    {visit.status === "completed" && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-green-600">
                        <CheckCircle size={14} weight="fill" /> Completada
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadVisit && (
        <UploadModal
          visit={uploadVisit}
          userEmail={userEmail}
          onClose={() => setUploadVisit(null)}
          onUploaded={loadVisits}
        />
      )}
    </div>
  );
}
