"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";
import { Section } from "@/components/member/section";
import { Rise, Photo } from "@/components/member/motion";
import { Viewer } from "@/components/member/viewer";
import { Medio } from "@/components/member/medio";
import { esVideo } from "@/lib/medio";
import { DownloadSimple } from "@/components/member/iconos";

type Visita = {
  id: string;
  creatorId: string;
  name: string;
  handle: string | null;
  date: string;
  rightsExpiresAt: string | null;
  vigente: boolean;
  diasQuedan: number;
  total: number;
  fotos: { url: string; download: string }[];
};

const T: Record<Lang, {
  titulo: string;
  hint: string;
  todos: string;
  soloExclusivas: string;
  vacio: string;
  quedan: (d: number) => string;
  hasta: (f: string) => string;
  terminada: (n: number) => string;
  descargar: string;
}> = {
  fr: {
    titulo: "Vos contenus",
    hint: "Toutes les photos de vos visites, en haute définition. Elles sont exclusives 90 jours après chaque visite ; ensuite, elles restent au storyteller.",
    todos: "Tous les storytellers",
    soloExclusivas: "Exclusives uniquement",
    vacio: "Aucune photo pour l'instant. Elles arrivent après chaque visite.",
    quedan: (d) => (d <= 1 ? "Exclusivité : dernier jour" : `Exclusivité : encore ${d} jours`),
    hasta: (f) => `Exclusives jusqu'au ${f}`,
    terminada: (n) => `Exclusivité terminée · ${n} ${n > 1 ? "photos" : "photo"}`,
    descargar: "Télécharger",
  },
  en: {
    titulo: "Your content",
    hint: "All the photos from your visits, in high definition. They're exclusive for 90 days after each visit; after that, they stay with the storyteller.",
    todos: "All storytellers",
    soloExclusivas: "Exclusive only",
    vacio: "No photos yet. They arrive after each visit.",
    quedan: (d) => (d <= 1 ? "Exclusivity: last day" : `Exclusivity: ${d} days left`),
    hasta: (f) => `Exclusive until ${f}`,
    terminada: (n) => `Exclusivity ended · ${n} ${n > 1 ? "photos" : "photo"}`,
    descargar: "Download",
  },
  es: {
    titulo: "Tu contenido",
    hint: "Todas las fotos de tus visitas, en alta definición. Son exclusivas durante 90 días tras cada visita; después, quedan para el storyteller.",
    todos: "Todos los storytellers",
    soloExclusivas: "Solo exclusivas",
    vacio: "Todavía no hay fotos. Llegan después de cada visita.",
    quedan: (d) => (d <= 1 ? "Exclusividad: último día" : `Exclusividad: quedan ${d} días`),
    hasta: (f) => `Exclusivas hasta el ${f}`,
    terminada: (n) => `Exclusividad terminada · ${n} ${n > 1 ? "fotos" : "foto"}`,
    descargar: "Descargar",
  },
};

/**
 * La biblioteca de contenido de la casa: todas las fotos del último año, por
 * visita, con cuánto les queda de exclusividad.
 */
export default function MaisonContenus() {
  const { lang } = useLang();
  const t = T[lang] ?? T.fr;
  const [visitas, setVisitas] = useState<Visita[] | null>(null);
  const [quien, setQuien] = useState<string>("todos");
  const [soloVigentes, setSoloVigentes] = useState(false);
  const [visor, setVisor] = useState<{ fotos: string[]; i: number } | null>(null);

  useEffect(() => {
    fetch("/api/maison/contenus")
      .then((r) => r.json())
      .then((d) => setVisitas(d.visitas ?? []))
      .catch(() => setVisitas([]));
  }, []);

  const storytellers = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of visitas ?? []) if (!m.has(v.creatorId)) m.set(v.creatorId, v.name);
    return [...m.entries()];
  }, [visitas]);

  if (!visitas) return <div className="h-64 animate-pulse bg-border [animation-duration:1.6s]" />;

  const lista = visitas.filter((v) => (quien === "todos" || v.creatorId === quien) && (!soloVigentes || v.vigente));
  const fecha = (iso: string, conAnio = false) =>
    new Date(iso).toLocaleDateString(lang, { day: "numeric", month: "long", ...(conAnio ? { year: "numeric" } : {}), timeZone: "Europe/Paris" });

  return (
    <Section title={t.titulo} hint={t.hint}>
      {visitas.length === 0 ? (
        <p className="py-respiro text-center text-corps text-text-secondary">{t.vacio}</p>
      ) : (
        <>
          <div className="mb-seccion flex flex-wrap items-center gap-bloque">
            <select
              value={quien}
              onChange={(e) => setQuien(e.target.value)}
              aria-label={t.todos}
              className="min-h-11 rounded-full border border-border bg-transparent px-4 text-champ text-text-primary"
            >
              <option value="todos">{t.todos}</option>
              {storytellers.map(([id, nombre]) => (
                <option key={id} value={id}>
                  {nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSoloVigentes((v) => !v)}
              aria-pressed={soloVigentes}
              className={`min-h-11 rounded-full border px-4 text-legende transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97] ${
                soloVigentes ? "border-accent bg-accent text-charcoal-deep" : "border-border text-text-secondary hover:text-accent"
              }`}
            >
              {t.soloExclusivas}
            </button>
          </div>

          <div className="space-y-seccion">
            {lista.map((v, k) => {
              const dias = v.diasQuedan;
              return (
                <Rise key={v.id} index={Math.min(k, 6)}>
                  <div className="flex items-baseline justify-between gap-fila">
                    <p className="min-w-0 truncate font-titulo text-sous-titre text-text-primary">{v.name}</p>
                    <p className="shrink-0 text-legende text-text-secondary">{fecha(v.date, true)}</p>
                  </div>
                  {v.vigente && v.rightsExpiresAt ? (
                    <p className={`mt-etiqueta text-legende ${dias <= 14 ? "text-copper-vif" : "text-sauge-vif"}`}>
                      {dias <= 14 ? t.quedan(dias) : t.hasta(fecha(v.rightsExpiresAt))}
                    </p>
                  ) : (
                    <p className="mt-etiqueta text-legende text-text-muted">{t.terminada(v.total)}</p>
                  )}
                  {v.fotos.length > 0 && (
                    <div className="mt-fila grid grid-cols-3 gap-bloque sm:grid-cols-4">
                      {v.fotos.map((f, i) => (
                        <div key={f.url} className="relative">
                          <button
                            type="button"
                            onClick={() => setVisor({ fotos: v.fotos.map((x) => x.url), i })}
                            className="block w-full"
                          >
                            {esVideo(f.url) ? <Medio url={f.url} className="aspect-square" /> : <Photo src={f.url} className="aspect-square" />}
                          </button>
                          <a
                            href={f.download}
                            target="_blank"
                            rel="noopener"
                            aria-label={`${t.descargar} · ${v.name}`}
                            className="absolute bottom-1.5 right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
                          >
                            <DownloadSimple size={16} />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </Rise>
              );
            })}
          </div>
          <Viewer photos={visor?.fotos ?? []} index={visor?.i ?? null} onClose={() => setVisor(null)} />
        </>
      )}
    </Section>
  );
}
