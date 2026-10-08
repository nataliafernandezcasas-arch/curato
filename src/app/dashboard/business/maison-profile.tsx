"use client";

import { useEffect, useRef, useState } from "react";
import { FilePicker } from "@/components/member/file-picker";
import { Plus, X, GlobeSimple, InstagramLogo, PencilSimple, DotsSixVertical, Eye, MapPin, Check, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { translations, Lang } from "@/lib/i18n/translations";
import { COMUN } from "@/lib/i18n/comun";
import { Button } from "@/components/member/button";
import { Collage } from "@/components/member/collage";

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

// La descripción se escribe en un idioma y los otros dos los traduce Claude al
// guardar (src/lib/traducir.ts). La casa puede retocar cualquiera.
const TRAD: Record<Lang, {
  writeIn: string;
  hint: string;
  auto: string;
  failed: string;
  names: Record<"fr" | "en" | "es", string>;
}> = {
  fr: {
    writeIn: "Je rédige en",
    hint: "Écrivez dans votre langue : les deux autres se traduisent à l'enregistrement. Vous pouvez ensuite les retoucher.",
    auto: "Traduit automatiquement depuis votre texte. Vous pouvez le retoucher.",
    failed: "Enregistré, mais la traduction n'a pas abouti. Réessayez plus tard, ou complétez les autres langues à la main.",
    names: { fr: "Français", en: "English", es: "Español" },
  },
  en: {
    writeIn: "I write in",
    hint: "Write in your language: the other two are translated when you save. You can then fine-tune them.",
    auto: "Translated automatically from your text. You can fine-tune it.",
    failed: "Saved, but the translation didn't go through. Try again later, or fill in the other languages by hand.",
    names: { fr: "Français", en: "English", es: "Español" },
  },
  es: {
    writeIn: "Escribo en",
    hint: "Escribe en tu idioma: los otros dos se traducen al guardar. Después puedes retocarlos.",
    auto: "Traducido automáticamente de tu texto. Puedes retocarlo.",
    failed: "Guardado, pero la traducción no salió. Vuelve a intentarlo más tarde o completa los otros idiomas a mano.",
    names: { fr: "Français", en: "English", es: "Español" },
  },
};

/** La lista con una foto cambiada de sitio. */
function moverFoto(fotos: string[], desde: number, hasta: number): string[] {
  const next = [...fotos];
  const [foto] = next.splice(desde, 1);
  next.splice(hasta, 0, foto);
  return next;
}

export default function MaisonProfile({ t, lang }: { t: T; lang: Lang }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionEs, setDescriptionEs] = useState("");
  const [descLang, setDescLang] = useState<"fr" | "en" | "es">("fr");
  // El idioma en que escribe la casa, lo que había al abrir y lo que retocó: con
  // eso se decide qué traducir al guardar.
  const [fuente, setFuente] = useState<"fr" | "en" | "es">("fr");
  const inicial = useRef<Record<"fr" | "en" | "es", string>>({ fr: "", en: "", es: "" });
  const tocadas = useRef<Set<"fr" | "en" | "es">>(new Set());
  const [traduccionFallida, setTraduccionFallida] = useState(false);
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [name, setName] = useState("");
  const [arrondissement, setArrondissement] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Un aviso y no su texto: si cambia el idioma, el aviso cambia con él.
  const [hdRejected, setHdRejected] = useState(false);
  const [preview, setPreview] = useState(false);
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [fileDrag, setFileDrag] = useState(false);

  useEffect(() => {
    fetch("/api/maison/profile")
      .then((r) => r.json())
      .then((d) => {
        const p = d.photos ?? [];
        const desc = d.description ?? "";
        setPhotos(p);
        setDescription(desc);
        setDescriptionEn(d.descriptionEn ?? "");
        setDescriptionEs(d.descriptionEs ?? "");
        const suya = d.descriptionLang === "en" || d.descriptionLang === "es" ? d.descriptionLang : "fr";
        setFuente(suya);
        setDescLang(suya);
        inicial.current = { fr: desc, en: d.descriptionEn ?? "", es: d.descriptionEs ?? "" };
        setWebsite(d.website ?? "");
        setInstagram(d.instagram ?? "");
        setName(d.name ?? "");
        setArrondissement(d.arrondissement ?? null);
        setCategoryId(d.categoryId ?? null);
        const propia = suya === "en" ? d.descriptionEn ?? "" : suya === "es" ? d.descriptionEs ?? "" : desc;
        if (p.length < MIN_PHOTOS || propia.trim().length < MIN_DESC) setEditing(true);
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
    setHdRejected(false);
    setUploading(true);
    try {
      const arr = Array.from(files);
      const checks = await Promise.all(arr.map(isHd));
      const ok = arr.filter((_, i) => checks[i]);
      if (ok.length < arr.length) setHdRejected(true);
      if (ok.length === 0) return;
      const form = new FormData();
      ok.forEach((f) => form.append("files", f));
      const res = await fetch("/api/maison/profile", { method: "POST", body: form });
      const d = await res.json();
      if (res.ok) setPhotos(d.photos ?? []);
    } finally {
      setUploading(false);
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
    setTraduccionFallida(false);
    const textos = { fr: description, en: descriptionEn, es: descriptionEs };
    // Se traduce lo que está vacío y, si la casa cambió su propio texto, lo que
    // no retocó a mano en esta edición.
    const cambioLaFuente = textos[fuente].trim() !== inicial.current[fuente].trim();
    const traducir = (["fr", "en", "es"] as const).filter(
      (l) => l !== fuente && (!textos[l].trim() || (cambioLaFuente && !tocadas.current.has(l)))
    );
    try {
      const res = await fetch("/api/maison/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, descriptionEn, descriptionEs, descriptionLang: fuente, traducir, website, instagram }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        const guardado = { fr: d.description ?? description, en: d.descriptionEn ?? descriptionEn, es: d.descriptionEs ?? descriptionEs };
        setDescription(guardado.fr);
        setDescriptionEn(guardado.en);
        setDescriptionEs(guardado.es);
        inicial.current = guardado;
        tocadas.current = new Set();
        setTraduccionFallida(Boolean(d.traduccionFallida));
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-64 bg-border animate-pulse [animation-duration:1.6s]" />;
  }

  const inputCls =
    "w-full min-w-0 border-0 border-b border-transparent bg-transparent py-bloque text-champ font-light text-text-primary transition-colors duration-200 ease-curato outline-none placeholder:text-text-muted focus:border-accent";
  const igHandle = instagram.replace(/^@/, "").trim();
  // El mínimo vale para el texto que escribe la casa, en su idioma.
  const descLen = (fuente === "en" ? descriptionEn : fuente === "es" ? descriptionEs : description).trim().length;
  const photosOk = photos.length >= MIN_PHOTOS;
  const descOk = descLen >= MIN_DESC;
  const canSave = photosOk && descOk && !saving;
  const catKey = categoryId ? CATEGORY_KEY[categoryId] : null;
  const catLabel = catKey ? translations[lang].dashboard[catKey] : "";
  const place = [arrondissement ? `Paris ${arrondissement}` : "Paris", catLabel].filter(Boolean).join(" · ");
  const descValue = descLang === "fr" ? description : descLang === "en" ? descriptionEn : descriptionEs;
  const setDescValue = (v: string) => {
    tocadas.current.add(descLang);
    if (descLang === "fr") setDescription(v);
    else if (descLang === "en") setDescriptionEn(v);
    else setDescriptionEs(v);
  };
  // Storyteller-facing copy: the maison's current app language, falling back to FR.
  const previewDesc = lang === "en" ? descriptionEn || description : lang === "es" ? descriptionEs || description : description;

  // ── STORYTELLER PREVIEW (how the venue appears to creators) ─────────────────
  function StorytellerPreview() {
    return (
      <div className="overflow-hidden">
        <div className="relative aspect-[16/9] bg-surface-raised">
          {photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted font-serif text-[12px]">—</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="mb-bloque text-capitale uppercase tracking-capitale text-brume">{place}</p>
            <h3 className="text-titre uppercase tracking-titre text-text-primary">{name}</h3>
          </div>
        </div>
        {previewDesc && (
          <p className="font-serif text-[14px] font-light text-text-secondary leading-relaxed p-6">
            {previewDesc.length > 240 ? `${previewDesc.slice(0, 240)}…` : previewDesc}
          </p>
        )}
      </div>
    );
  }

  // ── PROFILE VIEW ──────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="max-w-[1100px] mx-auto">
        {traduccionFallida && (
          <p className="mb-6 border-l-2 border-copper-vif pl-3 font-serif text-[13px] text-text-primary">{TRAD[lang].failed}</p>
        )}
        <div className="flex justify-end gap-2 mb-6">
          <button
            onClick={() => setPreview((p) => !p)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 border font-serif text-[11px] tracking-[0.2em] uppercase transition-all duration-200 ${preview ? "border-accent text-accent" : "border-border-hover text-text-secondary hover:border-accent hover:text-accent"}`}
          >
            <Eye size={15} /> {t.profilePreview}
          </button>
          <button
            onClick={() => setEditing(true)}
            aria-label={t.profileEdit}
            title={t.profileEdit}
            className="shrink-0 rounded-full p-2.5 border border-border-hover text-text-secondary hover:border-accent hover:text-accent transition-all duration-200"
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
              <div className="mb-10">
                <Collage photos={photos} />
              </div>
            )}

            {previewDesc && (
              <p className="font-serif text-[17px] font-light text-text-primary leading-relaxed max-w-[720px] mb-10">
                {previewDesc}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              {website && (
                <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors">
                  <GlobeSimple size={15} />
                  <span className="font-serif text-[13px]">{website.replace(/^https?:\/\//, "")}</span>
                </a>
              )}
              {igHandle && (
                <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors">
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
    <div className="max-w-[1100px] mx-auto">
      {/* Let's get started — guided checklist while the profile is incomplete */}
      {(!photosOk || !descOk) && (
        <div className="mb-seccion">
          <p className="text-capitale uppercase tracking-capitale text-accent">{t.gsEyebrow}</p>
          <h2 className="mt-bloque text-titre tracking-titre text-text-primary">{t.gsTitle}</h2>
          <p className="mt-fila mb-rango max-w-[46ch] text-corps text-text-secondary">{t.gsSubtitle}</p>
          <div>
            {[
              { done: photosOk, label: t.gsStepPhotos.replace("{n}", String(photos.length)) },
              { done: descOk, label: t.gsStepDesc.replace("{n}", String(descLen)) },
            ].map((s, i) => (
              <div key={i} className="flex min-h-11 items-center gap-fila">
                <span
                  aria-hidden
                  className={`block h-2.5 w-2.5 shrink-0 rounded-full ${s.done ? "bg-sauge-vif" : "bg-copper-vif"}`}
                />
                <span className={`text-corps ${s.done ? "text-text-muted" : "text-text-primary"}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-12 items-start">
      <div className="space-y-12">
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-accent">{t.profilePhotos}</p>
            <span className={`font-serif text-[12px] ${photosOk ? "text-accent" : "text-copper-vif"}`}>
              {photos.length}/{MIN_PHOTOS}
            </span>
          </div>
          <p className="font-serif text-[12px] font-light text-text-secondary mb-4">{t.profilePhotosHint}</p>

          <div
            onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setFileDrag(true); } }}
            onDragLeave={(e) => { if (e.currentTarget === e.target) setFileDrag(false); }}
            onDrop={(e) => { if (e.dataTransfer.files?.length) { e.preventDefault(); uploadPhotos(e.dataTransfer.files); } setFileDrag(false); }}
            className={`grid grid-cols-3 gap-2 transition-all ${fileDrag ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}
          >
            {photos.map((url, i) => (
              <div
                key={url}
                draggable
                onDragStart={(e) => { dragFrom.current = i; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); }}
                onDragOver={(e) => { if (!e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragOver(i); } }}
                onDragLeave={() => setDragOver((d) => (d === i ? null : d))}
                onDrop={(e) => { if (e.dataTransfer.files?.length) { e.preventDefault(); uploadPhotos(e.dataTransfer.files); setFileDrag(false); } else handleDrop(i); }}
                onDragEnd={() => { dragFrom.current = null; setDragOver(null); }}
                className={`relative aspect-square overflow-hidden rounded-xl bg-surface-raised group cursor-move transition-all ${dragOver === i ? "ring-2 ring-accent" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 font-serif text-[9px] tracking-[0.25em] uppercase text-charcoal-deep bg-champagne/90 rounded-full px-2 py-1">
                    {t.profileCover}
                  </span>
                )}
                {/* En un ordenador, los controles salen al pasar el ratón. En un
                    teléfono no hay ratón: estaban siempre invisibles, y no se podía
                    ni borrar ni reordenar. Ahí se ven siempre, y el arrastre, que
                    el dedo no hace, lo sustituyen dos flechas. */}
                <span className="absolute bottom-1.5 left-1.5 hidden rounded-full bg-black/45 p-0.5 text-white/70 opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:hover)]:block">
                  <DotsSixVertical size={14} />
                </span>
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between [@media(hover:hover)]:hidden">
                  <button
                    type="button"
                    onClick={() => i > 0 && persistOrder(moverFoto(photos, i, i - 1))}
                    disabled={i === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white disabled:invisible"
                    aria-label={COMUN[lang].moveBefore}
                  >
                    <CaretLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => i < photos.length - 1 && persistOrder(moverFoto(photos, i, i + 1))}
                    disabled={i === photos.length - 1}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white disabled:invisible"
                    aria-label={COMUN[lang].moveAfter}
                  >
                    <CaretRight size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition-opacity [@media(hover:hover)]:h-auto [@media(hover:hover)]:w-auto [@media(hover:hover)]:p-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                  aria-label={COMUN[lang].remove}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <FilePicker
              onFiles={uploadPhotos}
              multiple
              disabled={uploading}
              className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border-hover text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              <Plus size={22} weight="thin" />
            </FilePicker>
          </div>
          {hdRejected && <p className="font-serif text-[12px] text-copper-vif mt-3 border-l border-copper-vif pl-3">{t.profileHdRejected}</p>}
        </div>

        {/* Description */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <label className="font-serif text-[11px] tracking-[0.3em] uppercase text-accent">{t.profileDescription}</label>
            <span className={`font-serif text-[12px] ${descLang === fuente ? (descOk ? "text-accent" : "text-copper-vif") : "text-text-secondary"}`}>
              {descValue.trim().length}/{MIN_DESC}
            </span>
          </div>
          {/* El idioma en que escribe la casa. Los otros dos los pone Claude. */}
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-serif text-[12px] text-text-secondary">{TRAD[lang].writeIn}</span>
            <select
              id="idioma-descripcion"
              value={fuente}
              onChange={(e) => {
                const l = e.target.value as "fr" | "en" | "es";
                setFuente(l);
                setDescLang(l);
              }}
              className="min-h-11 rounded-full border border-border bg-transparent px-3 font-serif text-[13px] text-text-primary outline-none focus:border-accent"
            >
              {(["fr", "en", "es"] as const).map((l) => (
                <option key={l} value={l}>
                  {TRAD[lang].names[l]}
                </option>
              ))}
            </select>
          </div>
          <p className="mb-3 font-serif text-[12px] font-light text-text-secondary">{TRAD[lang].hint}</p>
          <div className="flex gap-1.5 mb-3">
            {(["fr", "en", "es"] as const).map((lg) => {
              const filled = (lg === "fr" ? description : lg === "en" ? descriptionEn : descriptionEs).trim().length > 0;
              return (
                <button
                  key={lg}
                  onClick={() => setDescLang(lg)}
                  className={`min-h-11 px-2 text-capitale uppercase tracking-capitale transition-colors duration-200 ease-curato ${
                    descLang === lg
                      ? "text-accent"
                      : filled
                      ? "text-brume hover:text-accent"
                      : "text-text-muted hover:text-accent"
                  }`}
                >
                  {lg}{filled && descLang !== lg ? " ·" : ""}
                </button>
              );
            })}
          </div>
          <textarea
            value={descValue}
            onChange={(e) => setDescValue(e.target.value)}
            rows={6}
            placeholder={t.profileDescPlaceholder}
            className={`${inputCls} resize-none leading-relaxed`}
          />
          <p className="font-serif text-[12px] font-light text-text-secondary mt-2">
            {descLang === fuente ? t.profileDescMin : TRAD[lang].auto}
          </p>
        </div>

        {/* Links */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-serif text-[11px] tracking-[0.3em] uppercase text-accent mb-3">{t.profileWebsite}</label>
            <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className={inputCls} />
          </div>
          <div>
            <label className="block font-serif text-[11px] tracking-[0.3em] uppercase text-accent mb-3">{t.profileInstagram}</label>
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@…" className={inputCls} />
          </div>
        </div>

        <div className="flex items-center gap-5 pt-2">
          <Button onClick={save} disabled={!canSave}>
            {saving ? t.profileSaving : t.profileSave}
          </Button>
          {!canSave && !saving && (
            <span className="font-serif text-[12px] font-light text-copper-vif">
              {!photosOk
                ? t.profilePhotosNeed.replace("{n}", String(MIN_PHOTOS - photos.length))
                : t.profileDescMin}
            </span>
          )}
        </div>
      </div>

      {/* Live storyteller preview */}
      <div className="lg:sticky lg:top-6">
        <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-accent mb-4 flex items-center gap-2"><Eye size={14} /> {t.profilePreview}</p>
        <StorytellerPreview />
        {place && (
          <p className="font-serif text-[11px] text-text-muted mt-3 flex items-center gap-1.5"><MapPin size={12} /> {place}</p>
        )}
      </div>
      </div>
    </div>
  );
}
