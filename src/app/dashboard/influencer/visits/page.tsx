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
  checked_in:        { label: "En visite",           color: "text-copper/70 border-copper/20 bg-copper/5" },
  content_pending:   { label: "Contenu en attente",  color: "text-amber-300 border-amber-400/30 bg-amber-400/5" },
  content_submitted: { label: "Contenu envoyé",      color: "text-emerald-300 border-emerald-400/30 bg-emerald-400/5" },
  completed:         { label: "Complétée",           color: "text-emerald-300 border-emerald-400/30 bg-emerald-400/5" },
  cancelled:         { label: "Annulée",             color: "text-red-400/60 border-red-400/20 bg-red-400/5" },
  expired:           { label: "Expirée",             color: "text-white/25 border-white/10 bg-white/3" },
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"));
    setFiles(prev => [...prev, ...dropped]);
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
      setError("Erreur de connexion. Réessaie.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm px-4 pb-4 md:pb-0" onClick={onClose}>
      <div className="bg-charcoal-mid border border-white/10 w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/50 mb-2">Partager le contenu</p>
            <h3 className="font-serif text-xl font-light text-white">{visit.offers?.title}</h3>
            <p className="font-serif text-[13px] text-white/40 mt-0.5">{visit.offers?.comercios?.name}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors mt-1">
            <X size={18} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border border-dashed border-white/15 p-10 text-center hover:border-champagne/30 transition-all duration-300 mb-5 cursor-pointer group"
        >
          <UploadSimple size={28} className="text-white/20 group-hover:text-champagne/50 mx-auto mb-3 transition-colors" />
          <p className="font-serif text-[14px] font-light text-white/50 group-hover:text-white/70 transition-colors">Photos ou vidéos</p>
          <p className="font-serif text-[11px] text-white/25 mt-1">Stories, reels, posts · Glisse ou clique</p>
        </div>
        <input ref={inputRef} type="file" multiple accept="image/*,video/*" onChange={handleFiles} className="hidden" />

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2 mb-5">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between border border-white/8 bg-white/3 px-4 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {f.type.startsWith("video") ? (
                    <VideoCamera size={14} className="text-champagne/50 shrink-0" />
                  ) : (
                    <Camera size={14} className="text-champagne/50 shrink-0" />
                  )}
                  <span className="font-serif text-[12px] text-white/60 truncate">{f.name}</span>
                  <span className="font-serif text-[10px] text-white/25 shrink-0">
                    {(f.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-white/25 hover:text-red-400 transition-colors ml-2 shrink-0">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="font-serif text-[13px] text-red-400 mb-4">{error}</p>}

        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="w-full font-serif text-[12px] tracking-widest uppercase text-charcoal-deep bg-champagne py-4 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-40"
        >
          {uploading
            ? "Envoi en cours…"
            : files.length === 0
            ? "Sélectionne des fichiers"
            : `Envoyer ${files.length} fichier${files.length !== 1 ? "s" : ""}`}
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
    if (!user) { window.location.href = "/auth/sign-in"; return; }
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
    await (await import("@/lib/supabase/client")).createClient().auth.signOut();
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
            <Link href="/dashboard/influencer" className="font-serif text-[12px] tracking-wider text-white/50 hover:text-champagne transition-colors">
              Adresses
            </Link>
            <Link href="/dashboard/influencer/visits" className="font-serif text-[12px] tracking-wider text-champagne transition-colors">
              Mes visites
            </Link>
          </div>
          <button onClick={signOut} className="flex items-center gap-1.5 font-serif text-[11px] tracking-wider text-white/30 hover:text-white transition-colors">
            <SignOut size={14} />
            Sortir
          </button>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-5 py-12">
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/40 mb-4">Historique</p>
        <h1 className="font-serif text-4xl font-light tracking-[0.28em] uppercase text-white mb-12">Mes visites</h1>

        {loading ? (
          <p className="font-serif text-[14px] font-light text-white/30 py-20 text-center">Chargement…</p>
        ) : visits.length === 0 ? (
          <div className="text-center py-24 border border-white/5">
            <Clock size={32} className="text-white/20 mx-auto mb-4" />
            <p className="font-serif text-[16px] font-light text-white/40 mb-2">Aucune visite pour le moment.</p>
            <p className="font-serif text-[13px] font-light text-white/25 mb-8">
              Explorez les adresses et réservez votre première expérience.
            </p>
            <Link href="/dashboard/influencer" className="font-serif text-[12px] tracking-widest uppercase text-charcoal-deep bg-champagne px-8 py-3 hover:bg-copper hover:text-white transition-all duration-300">
              Voir les adresses
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/8">
            {visits.map((visit) => {
              const status = STATUS[visit.status] || { label: visit.status, color: "text-white/30 border-white/10 bg-white/3" };
              const proofs = visit.content_proof_urls ?? [];
              const canUpload = ["content_pending", "checked_in", "reserved"].includes(visit.status);

              return (
                <div key={visit.id} className="py-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`font-serif text-[10px] tracking-[0.2em] uppercase border px-2.5 py-1 ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="font-serif text-[10px] tracking-[0.2em] uppercase text-white/25">
                          {CAT_LABELS[visit.offers?.category] || visit.offers?.category}
                        </span>
                      </div>
                      <h3 className="font-serif text-[18px] font-light text-white">{visit.offers?.title}</h3>
                      <p className="font-serif text-[13px] text-white/40">{visit.offers?.comercios?.name}</p>
                      <div className="flex items-center gap-4 text-white/25 flex-wrap">
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
                        <p className="font-serif text-xl font-light text-champagne">€{visit.visit_value_cop}</p>
                      )}
                      {canUpload && (
                        <button
                          onClick={() => setUploadVisit(visit)}
                          className="flex items-center gap-1.5 font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-5 py-2.5 hover:bg-copper hover:text-white transition-all duration-300"
                        >
                          <UploadSimple size={12} />
                          Partager
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

                  {/* Content thumbnails */}
                  {proofs.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-3">
                      {proofs.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white/5 overflow-hidden block group shrink-0">
                          {url.match(/\.(mp4|mov|webm)$/i) ? (
                            <video src={url} className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" muted playsInline />
                          ) : (
                            <img src={url} alt="" className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" />
                          )}
                        </a>
                      ))}
                    </div>
                  )}
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
