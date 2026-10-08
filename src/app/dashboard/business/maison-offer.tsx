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

// Cómo se reserva la casa (migración 044): por horas, con una o varias
// franjas por día, o por fechas, como un hotel.
type Agenda = { modo: "horaires" | "dates"; llegadas: number[]; minNoches: number; maxNoches: number };
const AGENDA: Record<Lang, {
  horaires: string;
  dates: string;
  horairesHint: string;
  datesHint: string;
  addService: string;
  removeService: string;
  arrivals: string;
  arrivalsHint: string;
  minNights: string;
  maxNights: string;
  short: string[];
  notSaved: string;
}> = {
  fr: {
    horaires: "Par horaires",
    dates: "Par dates",
    horairesHint: "Restaurants, spas, beauté : une ou plusieurs plages par jour, par exemple deux services. Le storyteller choisit son heure d'arrivée dans une plage.",
    datesHint: "Hôtels : sans horaires. Les jours où l'on peut arriver et le nombre de nuits ; fermez les dates complètes plus bas.",
    addService: "Ajouter une plage",
    removeService: "Retirer cette plage",
    arrivals: "Jours d'arrivée",
    arrivalsHint: "Les jours où un storyteller peut commencer son séjour.",
    minNights: "Nuits minimum",
    maxNights: "Nuits maximum",
    short: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    notSaved: "Le type d'agenda n'a pas été enregistré. Le reste, si.",
  },
  en: {
    horaires: "By time",
    dates: "By dates",
    horairesHint: "Restaurants, spas, beauty: one or more windows a day, for example two services. The storyteller picks an arrival time inside a window.",
    datesHint: "Hotels: no times. The days guests can arrive and the number of nights; close full dates below.",
    addService: "Add a window",
    removeService: "Remove this window",
    arrivals: "Arrival days",
    arrivalsHint: "The days a storyteller can start their stay.",
    minNights: "Minimum nights",
    maxNights: "Maximum nights",
    short: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    notSaved: "The type of schedule wasn't saved. Everything else was.",
  },
  es: {
    horaires: "Por horas",
    dates: "Por fechas",
    horairesHint: "Restaurantes, spas, belleza: una o varias franjas por día, por ejemplo dos servicios. El storyteller elige su hora de llegada dentro de una franja.",
    datesHint: "Hoteles: sin horas. Los días en que se puede llegar y el número de noches; cierra las fechas completas más abajo.",
    addService: "Añadir una franja",
    removeService: "Quitar esta franja",
    arrivals: "Días de llegada",
    arrivalsHint: "Los días en que un storyteller puede empezar su estancia.",
    minNights: "Noches mínimas",
    maxNights: "Noches máximas",
    short: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    notSaved: "El tipo de agenda no se guardó. Lo demás, sí.",
  },
};

export default function MaisonOffer({ t, lang }: { t: T; lang: Lang }) {
  const [availability, setAvailability] = useState<Window[]>([]);
  const [agenda, setAgenda] = useState<Agenda>({ modo: "horaires", llegadas: [0, 1, 2, 3, 4, 5, 6], minNoches: 1, maxNoches: 3 });
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
        if (d.agenda) setAgenda(d.agenda);
        setBlocked(d.blockedSlots ?? []);
        setServices(d.services ?? []);
        setOferta(d.offerEur ? String(d.offerEur) : "");
        setRango(d.offerRange ?? null);
        setMenuUrls(d.menuUrls ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Las franjas se editan por su posición en la lista: un día puede tener
  // varias (un primer y un segundo servicio).
  function toggleDay(day: number, on: boolean) {
    setAvailability((prev) =>
      on ? [...prev, { day, start: "18:00", end: "22:00" }] : prev.filter((w) => w.day !== day)
    );
  }
  function addWindow(day: number) {
    setAvailability((prev) => {
      const delDia = prev.filter((w) => w.day === day);
      const ultima = delDia[delDia.length - 1];
      // La nueva empieza donde acaba la anterior, para no partir de cero.
      const start = ultima?.end ?? "18:00";
      const [h, m] = start.split(":").map(Number);
      const end = `${String(Math.min(h + 2, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      return [...prev, { day, start, end }];
    });
  }
  function setTime(index: number, field: "start" | "end", val: string) {
    setAvailability((prev) => prev.map((w, i) => (i === index ? { ...w, [field]: val } : w)));
  }
  function removeWindow(index: number) {
    setAvailability((prev) => prev.filter((_, i) => i !== index));
  }
  function toggleLlegada(day: number) {
    setAgenda((a) => ({
      ...a,
      llegadas: a.llegadas.includes(day) ? a.llegadas.filter((d) => d !== day) : [...a.llegadas, day].sort(),
    }));
  }
  function setNoches(campo: "minNoches" | "maxNoches", n: number) {
    setAgenda((a) => {
      const v = Math.min(14, Math.max(1, n));
      return campo === "minNoches"
        ? { ...a, minNoches: v, maxNoches: Math.max(a.maxNoches, v) }
        : { ...a, maxNoches: v, minNoches: Math.min(a.minNoches, v) };
    });
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
          agenda,
          blockedSlots: blocked,
          services: services.filter((s) => s.name.trim()),
          offerEur: oferta ? Number(oferta) : null,
        }),
      });
      // La confirmación llega como aviso, encima de la barra, y se va sola en 4 s.
      if (res.ok) mostrar(t.offerSaved);
      else if ((await res.json().catch(() => ({}))).error === "agenda") mostrar(AGENDA[lang].notSaved);
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
  const ta = AGENDA[lang] ?? AGENDA.fr;
  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="max-w-[820px] mx-auto space-y-6 pb-8">
      {/* Cada bloque de la oferta, en su burbuja de cristal: se lee como una
          tarjeta de la app sobre la flor del fondo, y no como texto suelto. */}
      {/* Availability: por horas (una o varias franjas por día) o, un hotel,
          por fechas (días de llegada y noches). */}
      <section className="caja-cristal p-5 sm:p-6">
        <p className={`${labelCls} mb-1`}>{t.offerAvailability}</p>
        <p className="font-serif text-[12px] font-light text-text-secondary mb-5">{t.offerAvailabilityHint}</p>

        <div role="radiogroup" className="mb-fila grid grid-cols-2 gap-bloque rounded-full border border-border p-1">
          {(["horaires", "dates"] as const).map((modo) => (
            <button
              key={modo}
              type="button"
              role="radio"
              aria-checked={agenda.modo === modo}
              onClick={() => setAgenda((a) => ({ ...a, modo }))}
              className={`min-h-11 rounded-full text-capitale uppercase tracking-capitale transition-colors duration-200 ease-curato ${
                agenda.modo === modo ? "bg-accent text-surface" : "text-text-secondary hover:text-accent"
              }`}
            >
              {ta[modo]}
            </button>
          ))}
        </div>
        <p className="mb-5 font-serif text-[12px] font-light text-text-secondary">
          {agenda.modo === "dates" ? ta.datesHint : ta.horairesHint}
        </p>

        {agenda.modo === "horaires" ? (
          <div className="divide-y divide-border">
            {DAY_ORDER.map((day, i) => {
              const franjas = availability.map((w, idx) => ({ w, idx })).filter(({ w }) => w.day === day);
              const abierto = franjas.length > 0;
              return (
                <div key={day} className="py-bloque">
                  <div className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-fila">
                    <button
                      type="button"
                      onClick={() => toggleDay(day, !abierto)}
                      aria-pressed={abierto}
                      className="group flex min-w-0 items-center gap-fila text-left"
                    >
                      <span
                        aria-hidden
                        className={`block h-2.5 w-2.5 shrink-0 rounded-full border transition-colors duration-200 ease-curato ${
                          abierto ? "border-accent bg-accent" : "border-text-muted group-hover:border-accent"
                        }`}
                      />
                      <span className={`text-corps ${abierto ? "text-text-primary" : "text-text-muted"}`}>{days[i]}</span>
                    </button>
                    {!abierto && <span className="shrink-0 text-legende text-text-muted">{t.offerClosed}</span>}
                  </div>
                  {abierto && (
                    <div className="pl-[26px]">
                      {franjas.map(({ w, idx }) => (
                        <div key={idx} className="flex items-center gap-bloque">
                          <input type="time" value={w.start} onChange={(e) => setTime(idx, "start", e.target.value)} className={`${inputCls} w-[104px] text-center`} />
                          <span className="shrink-0 text-text-muted">→</span>
                          <input type="time" value={w.end} onChange={(e) => setTime(idx, "end", e.target.value)} className={`${inputCls} w-[104px] text-center`} />
                          <button
                            type="button"
                            onClick={() => removeWindow(idx)}
                            aria-label={ta.removeService}
                            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center text-text-muted transition-colors hover:text-copper-vif"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addWindow(day)}
                        className="inline-flex min-h-11 items-center gap-1.5 text-capitale uppercase tracking-capitale text-text-muted transition-colors hover:text-accent"
                      >
                        <Plus size={12} /> {ta.addService}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <p className="text-corps text-text-primary">{ta.arrivals}</p>
            <p className="mb-fila font-serif text-[12px] font-light text-text-secondary">{ta.arrivalsHint}</p>
            <div className="mb-rango grid grid-cols-7 gap-1.5">
              {DAY_ORDER.map((day, i) => {
                const si = agenda.llegadas.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleLlegada(day)}
                    aria-pressed={si}
                    aria-label={days[i]}
                    className={`min-h-11 rounded-full border text-[12px] transition-colors duration-200 ease-curato ${
                      si ? "border-accent bg-accent text-surface" : "border-border text-text-muted hover:border-accent hover:text-accent"
                    }`}
                  >
                    {ta.short[i]}
                  </button>
                );
              })}
            </div>
            {(["minNoches", "maxNoches"] as const).map((campo) => (
              <div key={campo} className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-fila">
                <span className="text-corps text-text-primary">{campo === "minNoches" ? ta.minNights : ta.maxNights}</span>
                <span className="flex items-center">
                  <button type="button" aria-label="−" onClick={() => setNoches(campo, agenda[campo] - 1)} className="flex min-h-11 w-11 items-center justify-center text-sous-titre text-text-secondary transition-colors hover:text-accent">−</button>
                  <span className="w-8 text-center text-sous-titre tabular-nums text-text-primary">{agenda[campo]}</span>
                  <button type="button" aria-label="+" onClick={() => setNoches(campo, agenda[campo] + 1)} className="flex min-h-11 w-11 items-center justify-center text-sous-titre text-text-secondary transition-colors hover:text-accent">+</button>
                </span>
              </div>
            ))}
          </>
        )}
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
