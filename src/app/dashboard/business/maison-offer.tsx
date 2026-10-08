"use client";

import { useEffect, useState } from "react";
import { FilePicker } from "@/components/member/file-picker";
import { Plus } from "@phosphor-icons/react";
import { Carta } from "@/components/member/carta";
import { Button } from "@/components/member/button";
import { Toast, useToast } from "@/components/member/toast";
import { Lang } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";

type T = Record<string, string>;
type Window = { day: number; start: string; end: string };
type Block = { date: string };
type Service = { name: string; description: string; price: string };

const DAY_LABELS: Record<Lang, string[]> = {
  fr: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  es: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
};
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // JS getDay(): Mon..Sun

// Por qué falló una subida de la carta. Antes no se decía nada.
const ERROR_MENU: Record<Lang, Record<"format" | "size" | "upload", string>> = {
  fr: {
    format: "Ce format n'est pas accepté : PDF, JPEG, PNG ou WEBP.",
    size: "Ce fichier dépasse 20 Mo.",
    upload: "L'envoi n'a pas abouti. Réessayez dans un instant.",
  },
  en: {
    format: "This format isn't accepted: PDF, JPEG, PNG or WEBP.",
    size: "This file is over 20 MB.",
    upload: "The upload didn't go through. Try again in a moment.",
  },
  es: {
    format: "Este formato no se acepta: PDF, JPEG, PNG o WEBP.",
    size: "Este archivo pasa de 20 MB.",
    upload: "No se pudo subir. Vuelve a intentarlo en un momento.",
  },
};

// La oferta es un importe: lo que la casa ofrece por visita, y el storyteller
// lo gasta como quiera en la carta (migración 043).
const OFERTA: Record<Lang, {
  title: string;
  hint: string;
  placeholder: string;
  perVisit: string;
  range: (min: number, max: number) => string;
  outOfRange: (min: number, max: number) => string;
}> = {
  fr: {
    title: "Votre offre",
    hint: "Le montant que vous offrez à chaque storyteller, par visite. Il le dépense librement sur votre carte.",
    placeholder: "200",
    perVisit: "€ par visite",
    range: (min, max) => `Entre ${min} € et ${max} € pour votre catégorie.`,
    outOfRange: (min, max) => `Choisissez un montant entre ${min} € et ${max} €.`,
  },
  en: {
    title: "Your offer",
    hint: "The amount you offer each storyteller, per visit. They spend it freely on your menu.",
    placeholder: "200",
    perVisit: "€ per visit",
    range: (min, max) => `Between ${min} € and ${max} € for your category.`,
    outOfRange: (min, max) => `Choose an amount between ${min} € and ${max} €.`,
  },
  es: {
    title: "Tu oferta",
    hint: "El importe que ofreces a cada storyteller, por visita. Lo gasta como quiera en tu carta.",
    placeholder: "200",
    perVisit: "€ por visita",
    range: (min, max) => `Entre ${min} € y ${max} € para tu categoría.`,
    outOfRange: (min, max) => `Elige un importe entre ${min} € y ${max} €.`,
  },
};

export default function MaisonOffer({ t, lang }: { t: T; lang: Lang }) {
  const [availability, setAvailability] = useState<Window[]>([]);
  const [blocked, setBlocked] = useState<Block[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [oferta, setOferta] = useState("");
  const [rango, setRango] = useState<{ min: number; max: number } | null>(null);
  const [menuUrls, setMenuUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { aviso, mostrar, cerrar } = useToast();
  const [uploading, setUploading] = useState(false);
  const [menuError, setMenuError] = useState<"format" | "size" | "upload" | null>(null);
  const [newBlock, setNewBlock] = useState("");

  useEffect(() => {
    fetch("/api/maison/offer")
      .then((r) => r.json())
      .then((d) => {
        setAvailability(d.availability ?? []);
        setBlocked(d.blockedSlots ?? []);
        setServices(d.services ?? []);
        setOferta(d.offerEur ? String(d.offerEur) : "");
        setRango(d.offerRange ?? null);
        setMenuUrls(d.menuUrls ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function winFor(day: number) {
    return availability.find((w) => w.day === day);
  }
  function toggleDay(day: number, on: boolean) {
    setAvailability((prev) =>
      on ? [...prev.filter((w) => w.day !== day), { day, start: "18:00", end: "22:00" }] : prev.filter((w) => w.day !== day)
    );
  }
  function setTime(day: number, field: "start" | "end", val: string) {
    setAvailability((prev) => prev.map((w) => (w.day === day ? { ...w, [field]: val } : w)));
  }

  function addBlock() {
    if (!newBlock || blocked.some((b) => b.date === newBlock)) { setNewBlock(""); return; }
    setBlocked((prev) => [...prev, { date: newBlock }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewBlock("");
  }
  function removeBlock(date: string) {
    setBlocked((prev) => prev.filter((b) => b.date !== date));
  }


  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/maison/offer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availability,
          blockedSlots: blocked,
          services: services.filter((s) => s.name.trim()),
          offerEur: oferta ? Number(oferta) : null,
        }),
      });
      // La confirmación llega como aviso, encima de la barra, y se va sola en 4 s.
      if (res.ok) mostrar(t.offerSaved);
    } finally {
      setSaving(false);
    }
  }

  // Directo al almacenamiento, con un permiso firmado por archivo: por el
  // servidor, Vercel cortaba todo lo que pasara de 4,5 MB (/api/maison/offer).
  async function uploadMenu(files: FileList | null) {
    if (!files || files.length === 0) return;
    const lista = Array.from(files);
    setUploading(true);
    setMenuError(null);
    try {
      const res = await fetch("/api/maison/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subir: lista.map((f) => ({ type: f.type, size: f.size })) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(d.permisos)) {
        setMenuError(d.error === "format" ? "format" : d.error === "size" ? "size" : "upload");
        return;
      }
      const almacen = createClient().storage.from("maison-menus");
      const subidas: string[] = [];
      for (let i = 0; i < lista.length; i++) {
        const { path, token } = d.permisos[i] as { path: string; token: string };
        const { error } = await almacen.uploadToSignedUrl(path, token, lista[i], { contentType: lista[i].type });
        if (error) setMenuError("upload");
        else subidas.push(path);
      }
      if (subidas.length === 0) return;
      const fin = await fetch("/api/maison/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: subidas }),
      });
      const hecho = await fin.json().catch(() => ({}));
      if (fin.ok) setMenuUrls(hecho.menuUrls ?? []);
      else setMenuError("upload");
    } catch {
      setMenuError("upload");
    } finally {
      setUploading(false);
    }
  }
  async function removeMenu(url: string) {
    const res = await fetch("/api/maison/offer", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const d = await res.json();
    if (res.ok) setMenuUrls(d.menuUrls ?? []);
  }

  if (loading) return <div className="h-64 rounded-2xl bg-border animate-pulse [animation-duration:1.6s]" />;

  const inputCls =
    "min-w-0 border-0 border-b border-transparent bg-transparent py-bloque text-champ font-light text-text-primary transition-colors duration-200 ease-curato outline-none placeholder:text-text-muted focus:border-accent";
  const labelCls = "text-capitale uppercase tracking-capitale text-accent";
  // Un importe escrito fuera del rango de su categoría no se puede guardar.
  const fueraDeRango = Boolean(oferta && rango && (Number(oferta) < rango.min || Number(oferta) > rango.max));
  const days = DAY_LABELS[lang];
  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="max-w-[820px] mx-auto space-y-6 pb-8">
      {/* Cada bloque de la oferta, en su burbuja de cristal: se lee como una
          tarjeta de la app sobre la flor del fondo, y no como texto suelto. */}
      {/* Availability */}
      <section className="caja-cristal p-5 sm:p-6">
        <p className={`${labelCls} mb-1`}>{t.offerAvailability}</p>
        <p className="font-serif text-[12px] font-light text-text-secondary mb-5">{t.offerAvailabilityHint}</p>
        <div className="space-y-2">
          {DAY_ORDER.map((day, i) => {
            const w = winFor(day);
            return (
              <div key={day} className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-fila py-bloque">
                <button
                  type="button"
                  onClick={() => toggleDay(day, !w)}
                  aria-pressed={!!w}
                  className="group flex min-w-0 items-center gap-fila text-left"
                >
                  <span
                    aria-hidden
                    className={`block h-2.5 w-2.5 shrink-0 rounded-full border transition-colors duration-200 ease-curato ${
                      w ? "border-accent bg-accent" : "border-text-muted group-hover:border-accent"
                    }`}
                  />
                  <span className={`truncate text-corps ${w ? "text-text-primary" : "text-text-muted"}`}>
                    {days[i]}
                  </span>
                </button>
                {w ? (
                  <div className="flex shrink-0 items-center gap-bloque">
                    <input type="time" value={w.start} onChange={(e) => setTime(day, "start", e.target.value)} className={`${inputCls} w-[99px] text-center`} />
                    <span className="shrink-0 text-text-muted">→</span>
                    <input type="time" value={w.end} onChange={(e) => setTime(day, "end", e.target.value)} className={`${inputCls} w-[99px] text-center`} />
                  </div>
                ) : (
                  <span className="shrink-0 text-legende text-text-muted">{t.offerClosed}</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Blocked dates */}
      <section className="caja-cristal p-5 sm:p-6">
        <p className={`${labelCls} mb-1`}>{t.offerBlocked}</p>
        <p className="font-serif text-[12px] font-light text-text-secondary mb-5">{t.offerBlockedHint}</p>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input type="date" value={newBlock} onChange={(e) => setNewBlock(e.target.value)} className={inputCls} />
          <button onClick={addBlock} disabled={!newBlock} className="inline-flex items-center gap-1.5 rounded-full border border-border-hover text-text-secondary hover:border-accent hover:text-accent px-4 py-2.5 font-serif text-[12px] tracking-wider uppercase transition-colors disabled:opacity-40">
            <Plus size={14} /> {t.offerAdd}
          </button>
        </div>
        {blocked.length > 0 && (
          <div>
            {blocked.map((b) => (
              <div key={b.date} className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-fila">
                <span className="truncate text-corps text-text-primary">{fmtDate(b.date)}</span>
                <button
                  onClick={() => removeBlock(b.date)}
                  className="shrink-0 text-capitale uppercase tracking-capitale text-text-muted transition-colors duration-200 ease-curato hover:text-copper-vif"
                >
                  {t.offerRemove}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* La oferta: un importe en euros por visita. La lista de servicios con
          precio que había antes se queda guardada, pero ya no se edita. */}
      <section className="caja-cristal p-5 sm:p-6">
        <label htmlFor="oferta-eur" className={`${labelCls} mb-1 block`}>{OFERTA[lang].title}</label>
        <p className="font-serif text-[12px] font-light text-text-secondary mb-1">{OFERTA[lang].hint}</p>
        {rango && (
          <p className="font-serif text-[12px] text-accent mb-5">{OFERTA[lang].range(rango.min, rango.max)}</p>
        )}
        <div className="flex items-baseline gap-3">
          <input
            id="oferta-eur"
            inputMode="numeric"
            value={oferta}
            onChange={(e) => setOferta(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder={OFERTA[lang].placeholder}
            className={`${inputCls} w-28 text-[34px] tabular-nums`}
          />
          <span className="font-serif text-[15px] text-text-secondary">{OFERTA[lang].perVisit}</span>
        </div>
        {fueraDeRango && rango && (
          <p className="mt-3 font-serif text-[13px] text-copper-vif">{OFERTA[lang].outOfRange(rango.min, rango.max)}</p>
        )}
      </section>

      {/* Menu / brochure */}
      <section className="caja-cristal p-5 sm:p-6">
        <p className={`${labelCls} mb-1`}>{t.offerMenu}</p>
        <p className="font-serif text-[12px] font-light text-text-secondary mb-5">{t.offerMenuHint}</p>
        <Carta urls={menuUrls} lang={lang} onRemove={removeMenu} removeLabel={t.offerRemove} />
        <div className={`flex flex-wrap gap-3 items-center${menuUrls.length > 0 ? " mt-fila" : ""}`}>
          <FilePicker
            onFiles={uploadMenu}
            accept="application/pdf,image/*"
            multiple
            disabled={uploading}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed border-border-hover px-fila text-capitale uppercase tracking-capitale text-text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <Plus size={14} /> {t.offerAdd}
          </FilePicker>
        </div>
        {menuError && <p className="mt-fila font-serif text-[13px] text-copper-vif">{ERROR_MENU[lang][menuError]}</p>}
      </section>

      {/* Guardar. Era el último botón relleno de champagne de la oferta, y
          cambiaba de texto dos segundos y medio para decir que había guardado.
          Ahora es el botón de siempre, y la confirmación llega como aviso. */}
      <div className="flex items-center gap-4">
        <Button onClick={save} disabled={saving || fueraDeRango}>{t.offerSave}</Button>
      </div>
      <Toast aviso={aviso} onClose={cerrar} />
    </div>
  );
}
