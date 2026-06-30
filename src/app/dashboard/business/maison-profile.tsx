"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, GlobeSimple, InstagramLogo, PencilSimple, DotsSixVertical, Eye, MapPin } from "@phosphor-icons/react";
import { translations, Lang } from "@/lib/i18n/translations";

type T = Record<string, string>;

const MIN_PHOTOS = 5;
const MIN_DESC = 200;
const MIN_WIDTH = 1280; // HD threshold (longest side)

// Category UUID (migration 009) → translation key in the `dashboard` section.
const CATEGORY_KEY: Record<string, "catGastronomy" | "catHotels" | "catWellness" | "catBeauty"> = {
  "00000000-0000-0000-0000-0000000ca701": "catHotels",
  "00000000-0000-0000-0000-0000000ca702": "catGastronomy",
  "00000000-0000-0000-0000-0000000ca703": "catWellness",
  "00000000-0000-0000-0000-0000000ca704": "catBeauty",
};

export default function MaisonProfile({ t, lang }: { t: T; lang: Lang }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [name, setName] = useState("");
  const [arrondissement, setArrondissement] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(false);
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/maison/profile")
      .then((r) => r.json())
      .then((d) => {
        const p = d.photos ?? [];
        const desc = d.description ?? "";
        setPhotos(p);
        setDescription(desc);
        setWebsite(d.website ?? "");
        setInstagram(d.instagram ?? "");
        setName(d.name ?? "");
        setArrondissement(d.arrondissement ?? null);
        setCategoryId(d.categoryId ?? null);
        if (p.length < MIN_PHOTOS || desc.trim().length < MIN_DESC) setEditing(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function isHd(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(Math.max(img.naturalWidth, img.naturalHeight) >= MIN_WIDTH);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
      img.src = url;
    });
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setNotice("");
    setUploading(true);
    try {
      const arr = Array.from(files);
      const checks = await Promise.all(arr.map(isHd));
      const ok = arr.filter((_, i) => checks[i]);
      if (ok.length < arr.length) setNotice(t.profileHdRejected);
      if (ok.length === 0) return;
      const form = new FormData();
      ok.forEach((f) => form.append("files", f));
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

  async function persistOrder(next: string[]) {
    setPhotos(next);
    try {
      await fetch("/api/maison/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: next }),
      });
    } catch {
      /* best-effort */
    }
  }

  function handleDrop(to: number) {
    const from = dragFrom.current;
    dragFrom.current = null;
    setDragOver(null);
    if (from === null || from === to) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persistOrder(next);
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
    "w-full px-5 py-3.5 border border-white/15 bg-charcoal-mid/50 text-white font-serif text-[14px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-white/30";
  const igHandle = instagram.replace(/^@/, "").trim();
  const descLen = description.trim().length;
  const photosOk = photos.length >= MIN_PHOTOS;
  const descOk = descLen >= MIN_DESC;
  const canSave = photosOk && descOk && !saving;
  const catKey = categoryId ? CATEGORY_KEY[categoryId] : null;
  const catLabel = catKey ? translations[lang].dashboard[catKey] : "";
  const place = [arrondissement ? `Paris ${arrondissement}` : "Paris", catLabel].filter(Boolean).join(" · ");

  // ── STORYTELLER PREVIEW (how the venue appears to creators) ─────────────────
  function StorytellerPreview() {
    return (
      <div className="border border-white/10 bg-charcoal-deep/70 overflow-hidden">
        <div className="relative aspect-[16/9] bg-charcoal-mid">
          {photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/25 font-serif text-[12px]">—</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-champagne/70 mb-1">{place}</p>
            <h3 className="font-serif text-[26px] font-light tracking-[0.12em] uppercase text-white leading-none">{name}</h3>
          </div>
        </div>
        {description && (
          <p className="font-serif text-[14px] font-light text-white/65 leading-relaxed p-6">
            {description.length > 240 ? `${description.slice(0, 240)}…` : description}
          </p>
        )}
      </div>
    );
  }

  // ── PROFILE VIEW ──────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="max-w-[1100px] mx-auto">
        <div className="flex justify-end gap-2 mb-6">
          <button
            onClick={() => setPreview((p) => !p)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border font-serif text-[11px] tracking-[0.2em] uppercase transition-all duration-200 ${preview ? "border-champagne/50 text-champagne" : "border-white/15 text-white/55 hover:border-champagne/40 hover:text-champagne"}`}
          >
            <Eye size={15} /> {t.profilePreview}
          </button>
          <button
            onClick={() => setEditing(true)}
            aria-label={t.profileEdit}
            title={t.profileEdit}
            className="shrink-0 p-2.5 border border-white/15 text-white/55 hover:border-champagne/40 hover:text-champagne transition-all duration-200"
          >
            <PencilSimple size={16} />
          </button>
        </div>

        {preview ? (
          <div className="max-w-[560px] mx-auto mb-4">
            <StorytellerPreview />
          </div>
        ) : (
          <>
            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 mb-10">
                {photos.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block overflow-hidden bg-charcoal-mid ${i === 0 ? "col-span-2 md:col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-square"}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  </a>
                ))}
              </div>
            )}

            {description && (
              <p className="font-serif text-[17px] font-light text-white/75 leading-relaxed max-w-[720px] mb-10">
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
          </>
        )}
      </div>
    );
  }

  // ── EDIT FORM ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1100px] mx-auto grid lg:grid-cols-[1fr_360px] gap-12 items-start">
      <div className="space-y-12">
        {/* Photos */}
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/70">{t.profilePhotos}</p>
            <span className={`font-serif text-[12px] ${photosOk ? "text-champagne/60" : "text-copper/80"}`}>
              {photos.length}/{MIN_PHOTOS}
            </span>
          </div>
          <p className="font-serif text-[12px] font-light text-white/40 mb-4">{t.profilePhotosHint}</p>

          <div className="grid grid-cols-4 gap-2">
            {photos.map((url, i) => (
              <div
                key={url}
                draggable
                onDragStart={(e) => { dragFrom.current = i; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                onDragLeave={() => setDragOver((d) => (d === i ? null : d))}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { dragFrom.current = null; setDragOver(null); }}
                className={`relative overflow-hidden bg-charcoal-mid group cursor-move transition-all ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"} ${dragOver === i ? "ring-2 ring-champagne/70" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 font-serif text-[9px] tracking-[0.25em] uppercase text-charcoal-deep bg-champagne/90 px-2 py-1">
                    {t.profileCover}
                  </span>
                )}
                <span className="absolute bottom-1.5 left-1.5 text-white/70 bg-black/45 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DotsSixVertical size={14} />
                </span>
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
          {notice && <p className="font-serif text-[12px] text-copper/80 mt-3 border-l border-copper/40 pl-3">{notice}</p>}
        </div>

        {/* Description */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <label className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/70">{t.profileDescription}</label>
            <span className={`font-serif text-[12px] ${descOk ? "text-champagne/60" : "text-copper/80"}`}>
              {descLen}/{MIN_DESC}
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder={t.profileDescPlaceholder}
            className={`${inputCls} resize-none leading-relaxed`}
          />
          <p className="font-serif text-[12px] font-light text-white/40 mt-2">{t.profileDescMin}</p>
        </div>

        {/* Links */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/70 mb-3">{t.profileWebsite}</label>
            <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className={inputCls} />
          </div>
          <div>
            <label className="block font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/70 mb-3">{t.profileInstagram}</label>
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@…" className={inputCls} />
          </div>
        </div>

        <div className="flex items-center gap-5 pt-2">
          <button
            onClick={save}
            disabled={!canSave}
            className="font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-8 py-3.5 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? t.profileSaving : t.profileSave}
          </button>
          {!canSave && !saving && (
            <span className="font-serif text-[12px] font-light text-copper/80">
              {!photosOk
                ? t.profilePhotosNeed.replace("{n}", String(MIN_PHOTOS - photos.length))
                : t.profileDescMin}
            </span>
          )}
        </div>
      </div>

      {/* Live storyteller preview */}
      <div className="lg:sticky lg:top-6">
        <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/70 mb-4 flex items-center gap-2"><Eye size={14} /> {t.profilePreview}</p>
        <StorytellerPreview />
        {place && (
          <p className="font-serif text-[11px] text-white/35 mt-3 flex items-center gap-1.5"><MapPin size={12} /> {place}</p>
        )}
      </div>
    </div>
  );
}
