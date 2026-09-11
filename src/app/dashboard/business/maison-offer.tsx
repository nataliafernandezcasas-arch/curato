"use client";

import { useEffect, useState } from "react";
import { FilePicker } from "@/components/member/file-picker";
import { Plus, X, FilePdf } from "@phosphor-icons/react";
import { Button } from "@/components/member/button";
import { Toast, useToast } from "@/components/member/toast";
import { Lang } from "@/lib/i18n/translations";

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

export default function MaisonOffer({ t, lang }: { t: T; lang: Lang }) {
  const [availability, setAvailability] = useState<Window[]>([]);
  const [blocked, setBlocked] = useState<Block[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [menuUrls, setMenuUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { aviso, mostrar, cerrar } = useToast();
  const [uploading, setUploading] = useState(false);
  const [newBlock, setNewBlock] = useState("");

  useEffect(() => {
    fetch("/api/maison/offer")
      .then((r) => r.json())
      .then((d) => {
        setAvailability(d.availability ?? []);
        setBlocked(d.blockedSlots ?? []);
        setServices(d.services ?? []);
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

  function addService() {
    setServices((prev) => [...prev, { name: "", description: "", price: "" }]);
  }
  function updateService(i: number, field: keyof Service, val: string) {
    setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  }
  function removeService(i: number) {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/maison/offer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability, blockedSlots: blocked, services: services.filter((s) => s.name.trim()) }),
      });
      // La confirmación llega como aviso, encima de la barra, y se va sola en 4 s.
      if (res.ok) mostrar(t.offerSaved);
    } finally {
      setSaving(false);
    }
  }

  async function uploadMenu(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    try {
      const res = await fetch("/api/maison/offer", { method: "POST", body: form });
      const d = await res.json();
      if (res.ok) setMenuUrls(d.menuUrls ?? []);
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
  const days = DAY_LABELS[lang];
  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="max-w-[820px] mx-auto space-y-14 pb-8">
      {/* Availability */}
      <section>
        <p className={`${labelCls} mb-1`}>{t.offerAvailability}</p>
        <p className="font-serif text-[12px] font-light text-white/40 mb-5">{t.offerAvailabilityHint}</p>
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
      <section>
        <p className={`${labelCls} mb-1`}>{t.offerBlocked}</p>
        <p className="font-serif text-[12px] font-light text-white/40 mb-5">{t.offerBlockedHint}</p>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input type="date" value={newBlock} onChange={(e) => setNewBlock(e.target.value)} className={inputCls} />
          <button onClick={addBlock} disabled={!newBlock} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 text-white/70 hover:border-champagne/40 hover:text-champagne px-4 py-2.5 font-serif text-[12px] tracking-wider uppercase transition-colors disabled:opacity-40">
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

      {/* Services */}
      <section>
        <div className="flex items-baseline justify-between mb-1">
          <p className={labelCls}>{t.offerServices}</p>
          <button onClick={addService} className="inline-flex items-center gap-1.5 text-champagne/70 hover:text-champagne font-serif text-[12px] tracking-wider uppercase transition-colors">
            <Plus size={14} /> {t.offerAdd}
          </button>
        </div>
        <p className="font-serif text-[12px] font-light text-white/40 mb-5">{t.offerServicesHint}</p>
        <div className="space-y-3">
          {services.map((s, i) => (
            <div key={i} className="relative pr-10">
              <button onClick={() => removeService(i)} className="absolute top-3 right-3 text-white/40 hover:text-copper-vif" aria-label="X"><X size={15} /></button>
              <div className="grid sm:grid-cols-[1fr_140px] gap-3 mb-3">
                <input value={s.name} onChange={(e) => updateService(i, "name", e.target.value)} placeholder={t.offerServiceName} className={`${inputCls} w-full`} />
                <input value={s.price} onChange={(e) => updateService(i, "price", e.target.value)} placeholder={t.offerServicePrice} className={`${inputCls} w-full`} />
              </div>
              <textarea value={s.description} onChange={(e) => updateService(i, "description", e.target.value)} rows={2} placeholder={t.offerServiceDesc} className={`${inputCls} w-full resize-none`} />
            </div>
          ))}
        </div>
      </section>

      {/* Menu / brochure */}
      <section>
        <p className={`${labelCls} mb-1`}>{t.offerMenu}</p>
        <p className="font-serif text-[12px] font-light text-white/40 mb-5">{t.offerMenuHint}</p>
        <div className="flex flex-wrap gap-3 items-center">
          {menuUrls.map((url) => (
            <div key={url} className="relative inline-flex items-center gap-2 rounded-full border border-white/12 pl-4 pr-9 py-2.5">
              <FilePdf size={16} className="text-champagne/70" />
              <a href={url} target="_blank" rel="noopener noreferrer" className="font-serif text-[13px] text-white/70 hover:text-champagne transition-colors">
                {url.split("/").pop()?.slice(-16) || "menu"}
              </a>
              <button onClick={() => removeMenu(url)} className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 hover:text-copper-vif" aria-label="X"><X size={13} /></button>
            </div>
          ))}
          <FilePicker
            onFiles={uploadMenu}
            accept="application/pdf,image/*"
            multiple
            disabled={uploading}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed border-white/20 px-fila text-capitale uppercase tracking-capitale text-text-muted transition-colors hover:border-champagne/40 hover:text-accent"
          >
            <Plus size={14} /> {t.offerAdd}
          </FilePicker>
        </div>
      </section>

      {/* Guardar. Era el último botón relleno de champagne de la oferta, y
          cambiaba de texto dos segundos y medio para decir que había guardado.
          Ahora es el botón de siempre, y la confirmación llega como aviso. */}
      <div className="flex items-center gap-4">
        <Button onClick={save} disabled={saving}>{t.offerSave}</Button>
      </div>
      <Toast aviso={aviso} onClose={cerrar} />
    </div>
  );
}
