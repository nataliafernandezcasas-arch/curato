"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, FilePdf, FloppyDisk, Check } from "@phosphor-icons/react";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [availability, setAvailability] = useState<Window[]>([]);
  const [blocked, setBlocked] = useState<Block[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [menuUrls, setMenuUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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
    setSaved(false);
    setAvailability((prev) =>
      on ? [...prev.filter((w) => w.day !== day), { day, start: "18:00", end: "22:00" }] : prev.filter((w) => w.day !== day)
    );
  }
  function setTime(day: number, field: "start" | "end", val: string) {
    setSaved(false);
    setAvailability((prev) => prev.map((w) => (w.day === day ? { ...w, [field]: val } : w)));
  }

  function addBlock() {
    if (!newBlock || blocked.some((b) => b.date === newBlock)) { setNewBlock(""); return; }
    setSaved(false);
    setBlocked((prev) => [...prev, { date: newBlock }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewBlock("");
  }
  function removeBlock(date: string) {
    setSaved(false);
    setBlocked((prev) => prev.filter((b) => b.date !== date));
  }

  function addService() {
    setSaved(false);
    setServices((prev) => [...prev, { name: "", description: "", price: "" }]);
  }
  function updateService(i: number, field: keyof Service, val: string) {
    setSaved(false);
    setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  }
  function removeService(i: number) {
    setSaved(false);
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
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
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
      if (fileRef.current) fileRef.current.value = "";
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

  if (loading) return <div className="h-64 border border-white/8 bg-white/5 animate-pulse" />;

  const inputCls =
    "px-4 py-2.5 border border-white/15 bg-charcoal-mid/50 text-white font-serif text-[14px] font-light focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-white/30";
  const labelCls = "font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/70";
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
              <div key={day} className="flex items-center gap-4 border-b border-white/8 py-2.5">
                <label className="flex items-center gap-2.5 w-40 shrink-0 cursor-pointer">
                  <input type="checkbox" checked={!!w} onChange={(e) => toggleDay(day, e.target.checked)} className="accent-champagne" />
                  <span className="font-serif text-[14px] text-white/85">{days[i]}</span>
                </label>
                {w ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={w.start} onChange={(e) => setTime(day, "start", e.target.value)} className={inputCls} />
                    <span className="text-white/30">→</span>
                    <input type="time" value={w.end} onChange={(e) => setTime(day, "end", e.target.value)} className={inputCls} />
                  </div>
                ) : (
                  <span className="font-serif text-[13px] font-light text-white/25">{t.offerClosed}</span>
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
        <div className="flex items-center gap-2 mb-4">
          <input type="date" value={newBlock} onChange={(e) => setNewBlock(e.target.value)} className={inputCls} />
          <button onClick={addBlock} disabled={!newBlock} className="inline-flex items-center gap-1.5 border border-white/15 text-white/70 hover:border-champagne/40 hover:text-champagne px-4 py-2.5 font-serif text-[12px] tracking-wider uppercase transition-colors disabled:opacity-40">
            <Plus size={14} /> {t.offerAdd}
          </button>
        </div>
        {blocked.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {blocked.map((b) => (
              <span key={b.date} className="inline-flex items-center gap-2 border border-white/12 px-3 py-1.5 font-serif text-[12px] text-white/70">
                {fmtDate(b.date)}
                <button onClick={() => removeBlock(b.date)} className="text-white/40 hover:text-copper" aria-label="X"><X size={12} /></button>
              </span>
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
            <div key={i} className="relative border border-white/10 bg-charcoal-deep/40 p-4 pr-10">
              <button onClick={() => removeService(i)} className="absolute top-3 right-3 text-white/40 hover:text-copper" aria-label="X"><X size={15} /></button>
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
            <div key={url} className="relative inline-flex items-center gap-2 border border-white/12 pl-3 pr-8 py-2.5">
              <FilePdf size={16} className="text-champagne/70" />
              <a href={url} target="_blank" rel="noopener noreferrer" className="font-serif text-[13px] text-white/70 hover:text-champagne transition-colors">
                {url.split("/").pop()?.slice(-16) || "menu"}
              </a>
              <button onClick={() => removeMenu(url)} className="absolute top-1.5 right-1.5 text-white/40 hover:text-copper" aria-label="X"><X size={13} /></button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 border border-dashed border-white/20 text-white/40 hover:border-champagne/40 hover:text-champagne px-5 py-2.5 font-serif text-[12px] tracking-wider uppercase transition-colors disabled:opacity-50">
            <Plus size={14} /> {t.offerAdd}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/pdf,image/*" multiple className="hidden" onChange={(e) => uploadMenu(e.target.files)} />
      </section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-8 py-3.5 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-50">
          {saved ? <Check size={15} /> : <FloppyDisk size={15} />}
          {saved ? t.offerSaved : t.offerSave}
        </button>
      </div>
    </div>
  );
}
