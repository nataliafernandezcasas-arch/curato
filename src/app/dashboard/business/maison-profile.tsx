"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, GlobeSimple, InstagramLogo, PencilSimple } from "@phosphor-icons/react";

type T = Record<string, string>;

export default function MaisonProfile({ t }: { t: T }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/maison/profile")
      .then((r) => r.json())
      .then((d) => {
        setPhotos(d.photos ?? []);
        setDescription(d.description ?? "");
        setWebsite(d.website ?? "");
        setInstagram(d.instagram ?? "");
        // Empty profile → open the editor straight away.
        if ((d.photos ?? []).length === 0 && !(d.description ?? "").trim()) setEditing(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function uploadPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    try {
      const res = await fetch("/api/maison/profile", { method: "POST", body: form });
      const d = await res.json();
      if (res.ok) setPhotos(d.photos ?? []);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto(url: string) {
    const res = await fetch("/api/maison/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const d = await res.json();
    if (res.ok) setPhotos(d.photos ?? []);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/maison/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, website, instagram }),
      });
      if (res.ok) setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-64 border border-white/8 bg-white/5 animate-pulse" />;
  }

  const inputCls =
    "w-full px-5 py-3.5 border border-white/15 bg-charcoal-mid/60 text-white font-serif text-[14px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-white/35";
  const igHandle = instagram.replace(/^@/, "").trim();

  // ── PROFILE VIEW ──────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="w-full">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setEditing(true)}
            aria-label={t.profileEdit}
            title={t.profileEdit}
            className="shrink-0 p-2.5 border border-white/15 text-white/55 hover:border-champagne/40 hover:text-champagne transition-all duration-200"
          >
            <PencilSimple size={16} />
          </button>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 mb-8">
            {photos.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block overflow-hidden bg-charcoal-mid ${i === 0 ? "col-span-2 md:col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-square"}`}
              >
                <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </a>
            ))}
          </div>
        )}

        {description && (
          <p className="font-serif text-[16px] font-light text-white/70 leading-relaxed max-w-[640px] mb-8">
            {description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/60 hover:text-champagne transition-colors">
              <GlobeSimple size={15} />
              <span className="font-serif text-[13px]">{website.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
          {igHandle && (
            <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/60 hover:text-champagne transition-colors">
              <InstagramLogo size={15} />
              <span className="font-serif text-[13px]">@{igHandle}</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── EDIT FORM ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[760px] space-y-10">
      {photos.length === 0 && (
        <p className="font-serif text-[13px] font-light text-white/55">{t.profileEmpty}</p>
      )}

      {/* Photos */}
      <div>
        <p className="font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/70 mb-4">{t.profilePhotos}</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden bg-charcoal-mid group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(url)}
                className="absolute top-1.5 right-1.5 bg-black/70 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Supprimer"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square border border-dashed border-white/20 flex items-center justify-center text-white/40 hover:border-champagne/40 hover:text-champagne transition-colors disabled:opacity-50"
          >
            <Plus size={22} weight="thin" />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadPhotos(e.target.files)} />
      </div>

      {/* Text fields */}
      <div className="space-y-5">
        <div>
          <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/70 mb-3">{t.profileDescription}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={t.profileDescPlaceholder}
            className={`${inputCls} resize-none`}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/70 mb-3">{t.profileWebsite}</label>
            <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className={inputCls} />
          </div>
          <div>
            <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/70 mb-3">{t.profileInstagram}</label>
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@…" className={inputCls} />
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-8 py-3.5 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-50"
      >
        {saving ? t.profileSaving : t.profileSave}
      </button>
    </div>
  );
}
