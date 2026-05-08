"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MapPin, Clock, Camera, CheckCircle, UploadSimple, VideoCamera, X, SignOut } from "@phosphor-icons/react";

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

const STATUS: Record<string, { label: string; color: string }> = {
  reserved:          { label: "Réservée",           color: "text-champagne/70 border-champagne/20 bg-champagne/5" },
  checked_in:        { label: "Arrivée",             color: "text-copper/70 border-copper/20 bg-copper/5" },
  content_pending:   { label: "Contenu en attente",  color: "text-amber-400 border-amber-400/20 bg-amber-400/5" },
  content_submitted: { label: "Contenu envoyé",      color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" },
  completed:         { label: "Complétée",           color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" },
  cancelled:         { label: "Annulée",             color: "text-red-400/70 border-red-400/20 bg-red-400/5" },
  expired:           { label: "Expirée",             color: "text-text-muted border-white/10 bg-white/3" },
};

const CAT_LABELS: Record<string, string> = {
  gastronomy: "Gastronomie",
  beauty: "Beauté",
  wellness: "Bien-être",
  hospitality: "Hôtellerie",
};

function UploadModal({ visit, userEmail, onClose, onUploaded }: {
  visit: Visit; userEmail: string; onClose: () => void; onUploaded: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleUpload = async () => {
    if (files.length === 0) { setError("Sélectionne au moins un fichier"); return; }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("visitId", visit.id);
      formData.append("email", userEmail);
      files.forEach(f => formData.append("files", f));
      const res = await fetch("/api/visits/upload-proof", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur lors de l'envoi"); return; }
      onUploaded();
      onClose();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-charcoal-mid border border-white/10 max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-lg font-light tracking-wider text-text-primary">Partager le contenu</h3>
          <button onClick={onClose} className="text-text-muted hover:text-champagne transition-colors"><X size={18} /></button>
        </div>

        <p className="font-serif text-[14px] font-light text-text-secondary mb-1">{visit.offers?.title}</p>
        <p className="font-serif text-[12px] text-text-muted mb-6">{visit.offers?.comercios?.name}</p>

        {files.length > 0 && (
          <div className="space-y-2 mb-4">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between border border-white/8 px-4 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  {f.type.startsWith("video") ? <VideoCamera size={14} className="text-champagne/60 shrink-0" /> : <Camera size={14} className="text-champagne/60 shrink-0" />}
                  <span className="font-serif text-[12px] text-text-secondary truncate">{f.name}</span>
                </div>
                <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-text-muted hover:text-copper ml-2"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border border-dashed border-white/15 p-8 text-center hover:border-champagne/30 transition-all duration-300 mb-4"
        >
          <UploadSimple size={24} className="text-text-muted mx-auto mb-3" />
          <p className="font-serif text-[13px] font-light text-text-secondary">Photos ou vidéos</p>
          <p className="font-serif text-[11px] text-text-muted mt-1">Stories, reels ou posts de votre visite</p>
        </button>
        <input ref={inputRef} type="file" multiple accept="image/*,video/*" onChange={handleFiles} className="hidden" />

        {error && <p className="font-serif text-[13px] text-copper/80 mb-4">{error}</p>}

        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="w-full font-serif text-[12px] tracking-widest uppercase text-charcoal-deep bg-champagne py-4 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-40"
        >
          {uploading ? "Envoi en cours…" : `Envoyer ${files.length} fichier${files.length !== 1 ? "s" : ""}`}
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

  async function signOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  useEffect(() => { loadVisits(); }, []);

  return (
    <div className="min-h-[100dvh] bg-charcoal-deep">
      {/* Nav */}
      <nav className="border-b border-white/10 px-5 h-14 flex items-center bg-black/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <img src="/logo-curato-simple.png" alt="curato" style={{ height: "12px", width: "auto", display: "block" }} />
            </Link>
            <div className="w-px h-3 bg-white/10" />
            <Link href="/dashboard/influencer" className="font-serif text-[12px] tracking-wider text-text-muted hover:text-champagne transition-colors">
              Adresses
            </Link>
            <Link href="/dashboard/influencer/visits" className="font-serif text-[12px] tracking-wider text-champagne transition-colors">
              Mes visites
            </Link>
          </div>
          <button onClick={signOut} className="flex items-center gap-1.5 font-serif text-[11px] tracking-wider text-text-muted hover:text-champagne transition-colors">
            <SignOut size={14} />
            Sortir
          </button>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-5 py-12">
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/40 mb-4">Historique</p>
        <h1 className="font-serif text-4xl font-light tracking-[0.28em] uppercase text-text-primary mb-12">Mes visites</h1>

        {loading ? (
          <p className="font-serif text-[14px] font-light text-text-muted py-20 text-center">Chargement…</p>
        ) : visits.length === 0 ? (
          <div className="text-center py-24 border border-white/5">
            <Clock size={32} className="text-text-muted mx-auto mb-4" />
            <p className="font-serif text-[16px] font-light text-text-muted mb-2">Aucune visite pour le moment.</p>
            <p className="font-serif text-[13px] font-light text-text-muted/50 mb-8">
              Explorez les adresses sélectionnées et réservez votre première expérience.
            </p>
            <Link href="/dashboard/influencer" className="font-serif text-[12px] tracking-widest uppercase text-charcoal-deep bg-champagne px-8 py-3 hover:bg-copper hover:text-white transition-all duration-300">
              Voir les adresses
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {visits.map((visit) => {
              const status = STATUS[visit.status] || { label: visit.status, color: "text-text-muted border-white/10 bg-white/3" };
              return (
                <div key={visit.id} className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`font-serif text-[10px] tracking-[0.2em] uppercase border px-2.5 py-1 ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="font-serif text-[10px] tracking-[0.2em] uppercase text-text-muted/50">
                        {CAT_LABELS[visit.offers?.category] || visit.offers?.category}
                      </span>
                    </div>
                    <h3 className="font-serif text-[17px] font-light text-text-primary">{visit.offers?.title}</h3>
                    <p className="font-serif text-[12px] text-text-muted">{visit.offers?.comercios?.name}</p>
                    <div className="flex items-center gap-4 text-text-muted/50">
                      <span className="flex items-center gap-1.5 font-serif text-[12px]">
                        <MapPin size={12} /> {visit.offers?.address}
                      </span>
                      <span className="flex items-center gap-1.5 font-serif text-[12px]">
                        <Clock size={12} /> {new Date(visit.reserved_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {visit.visit_value_cop > 0 && (
                      <div className="text-right">
                        <p className="font-serif text-lg font-light text-champagne">€{visit.visit_value_cop}</p>
                      </div>
                    )}

                    {["content_pending", "checked_in", "reserved"].includes(visit.status) && (
                      <button
                        onClick={() => setUploadVisit(visit)}
                        className="flex items-center gap-1.5 font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-4 py-2 hover:bg-copper hover:text-white transition-all duration-300"
                      >
                        <UploadSimple size={12} /> Partager
                      </button>
                    )}

                    {visit.status === "content_submitted" && (
                      <div className="flex items-center gap-1.5 font-serif text-[11px] tracking-wider text-emerald-400">
                        <CheckCircle size={14} weight="fill" /> Envoyé
                      </div>
                    )}

                    {visit.status === "completed" && (
                      <div className="flex items-center gap-1.5 font-serif text-[11px] tracking-wider text-emerald-400">
                        <CheckCircle size={14} weight="fill" /> Complétée
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
