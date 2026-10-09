"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CaretDown, Check, MagnifyingGlass, MapPin, SlidersHorizontal, X } from "@phosphor-icons/react";
import type { Lang } from "@/lib/i18n/translations";
import { etiquetaDeCategoria } from "@/components/member/tarjeta-casa";

const TEXTOS: Record<
  Lang,
  { placeholder: string; borrar: string; proponer: (q: string) => string; todas: string; ciudad: string }
> = {
  fr: {
    placeholder: "Rechercher une maison",
    borrar: "Effacer",
    proponer: (q) => `Proposer « ${q} »`,
    todas: "Toutes les villes",
    ciudad: "Ville",
  },
  en: {
    placeholder: "Search for a house",
    borrar: "Clear",
    proponer: (q) => `Suggest "${q}"`,
    todas: "All cities",
    ciudad: "City",
  },
  es: {
    placeholder: "Buscar una casa",
    borrar: "Borrar",
    proponer: (q) => `Proponer «${q}»`,
    todas: "Todas las ciudades",
    ciudad: "Ciudad",
  },
};

export type Sugerencia = {
  id: string;
  name: string;
  arrondissement: string | null;
  category_id: string | null;
  photos: string[] | null;
};

/** Sin acentos ni mayúsculas: «hôtel» encuentra «Hotel». */
export const plano = (x: string | null | undefined) =>
  (x ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * El buscador de Adresses, como el de Mapas: mientras se escribe salen las
 * casas que coinciden debajo del campo, y se toca una para ir a ella. El
 * teclado lleva la tecla «rechercher», que cierra el teclado y deja la lista
 * filtrada a la vista.
 */
export function Buscador({
  valor,
  onChange,
  sugerencias,
  onProponer,
  lang,
}: {
  valor: string;
  onChange: (v: string) => void;
  sugerencias: Sugerencia[];
  /** Ninguna casa coincide: llevar al formulario para proponerla. */
  onProponer: () => void;
  lang: Lang;
}) {
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const campo = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const q = valor.trim();
  const mostrar = abierto && q.length > 0;

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    setAbierto(false);
    campo.current?.blur();
  }

  return (
    <form role="search" action="" onSubmit={buscar} className="relative mb-fila">
      <MagnifyingGlass
        size={16}
        aria-hidden
        className="pointer-events-none absolute left-4 top-[26px] -translate-y-1/2 text-text-muted"
      />
      <input
        ref={campo}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={valor}
        onChange={(e) => {
          onChange(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        // Un momento antes de cerrar, para que el toque en una sugerencia llegue.
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        placeholder={t.placeholder}
        aria-label={t.placeholder}
        aria-expanded={mostrar}
        aria-controls="sugerencias-de-casas"
        className="campo-cristal !pl-11 !pr-11 font-serif text-[15px] font-light [&::-webkit-search-cancel-button]:hidden"
      />
      {valor && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            campo.current?.focus();
          }}
          aria-label={t.borrar}
          className="absolute right-2 top-[26px] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition-colors hover:text-text-primary"
        >
          <X size={16} />
        </button>
      )}

      {mostrar && (
        <ul
          id="sugerencias-de-casas"
          role="listbox"
          className="caja-cristal absolute inset-x-0 top-full z-30 mt-bloque max-h-[60vh] overflow-y-auto !bg-surface/95 !p-0 shadow-2xl"
        >
          {sugerencias.slice(0, 6).map((m) => (
            <li key={m.id} role="option" aria-selected={false}>
              <Link
                href={`/dashboard/storyteller/maison/${m.id}`}
                className="flex items-center gap-fila border-b border-border/60 px-4 py-3 transition-colors last:border-0 hover:bg-white/5"
              >
                {m.photos?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photos[0]} alt="" className="h-11 w-11 shrink-0 rounded-[10px] object-cover" />
                ) : (
                  <div className="h-11 w-11 shrink-0 rounded-[10px] bg-surface-raised" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-titulo text-[18px] leading-tight text-text-primary">
                    <Resaltado texto={m.name} q={q} />
                  </p>
                  <p className="truncate text-legende text-text-secondary">
                    {[etiquetaDeCategoria(m.category_id, lang), m.arrondissement].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {sugerencias.length === 0 && (
            <li>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  onProponer();
                }}
                className="flex w-full items-center gap-fila px-4 py-4 text-left text-corps text-accent"
              >
                <MagnifyingGlass size={16} aria-hidden />
                {t.proponer(q)}
              </button>
            </li>
          )}
        </ul>
      )}
    </form>
  );
}

/** Lo que se ha escrito, marcado dentro del nombre. */
function Resaltado({ texto, q }: { texto: string; q: string }) {
  const i = plano(texto).indexOf(plano(q));
  if (!q || i < 0) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, i)}
      <span className="text-accent">{texto.slice(i, i + q.length)}</span>
      {texto.slice(i + q.length)}
    </>
  );
}

export type Ciudad = { id: string; name: string };

/**
 * La ciudad: una píldora con el alfiler, como en Mapas. Por ahora solo hay
 * París; cuando se abra otra ciudad en la tabla `cities`, aparece aquí sola.
 */
export function SelectorDeCiudad({
  ciudades,
  activa,
  onCambiar,
  lang,
}: {
  ciudades: Ciudad[];
  activa: string | null;
  onCambiar: (id: string | null) => void;
  lang: Lang;
}) {
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  return (
    <Desplegable
      icono={<MapPin size={16} aria-hidden />}
      nombre={t.ciudad}
      opciones={[{ id: null, name: t.todas }, ...ciudades]}
      activa={activa}
      onCambiar={onCambiar}
    />
  );
}

/**
 * Filtrar por categoría, solo si se quiere: un botón «Filtrer» en vez de cinco
 * botones siempre a la vista (Natalia, 2026-10-09). Con un filtro puesto, el
 * botón dice cuál.
 */
export function SelectorDeCategoria({
  categorias,
  activa,
  onCambiar,
  lang,
}: {
  /** La primera es «todas», con id null. */
  categorias: Array<{ id: string | null; name: string }>;
  activa: string | null;
  onCambiar: (id: string | null) => void;
  lang: Lang;
}) {
  const t = FILTRO[lang] ?? FILTRO.fr;
  return (
    <Desplegable
      icono={<SlidersHorizontal size={16} aria-hidden />}
      nombre={t}
      etiquetaVacia={t}
      opciones={categorias}
      activa={activa}
      onCambiar={onCambiar}
    />
  );
}

const FILTRO: Record<Lang, string> = { fr: "Filtrer", en: "Filter", es: "Filtrar" };

/** Una píldora que abre una lista corta; se elige una opción y se cierra. */
function Desplegable({
  icono,
  nombre,
  etiquetaVacia,
  opciones,
  activa,
  onCambiar,
}: {
  icono: React.ReactNode;
  nombre: string;
  /** Lo que dice la píldora sin nada elegido; si no, el nombre de la primera opción. */
  etiquetaVacia?: string;
  opciones: Array<{ id: string | null; name: string }>;
  activa: string | null;
  onCambiar: (id: string | null) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const elegida = opciones.find((c) => c.id === activa && c.id !== null);
  const etiqueta = elegida?.name ?? etiquetaVacia ?? opciones[0]?.name ?? nombre;

  // Tocar fuera cierra.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  return (
    <div ref={caja} className="relative inline-block">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={`${nombre} : ${etiqueta}`}
        aria-current={elegida ? "page" : undefined}
        className="filtro-cristal inline-flex items-center gap-2 text-capitale uppercase tracking-capitale"
      >
        {icono}
        {etiqueta}
        <CaretDown size={12} aria-hidden className={`transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <ul role="listbox" className="caja-cristal absolute left-0 top-full z-30 mt-bloque min-w-[220px] !bg-surface/95 !p-0 shadow-2xl">
          {opciones.map((c) => (
            <li key={c.id ?? "todas"} role="option" aria-selected={c.id === activa}>
              <button
                type="button"
                onClick={() => {
                  onCambiar(c.id);
                  setAbierto(false);
                }}
                className="flex min-h-11 w-full items-center justify-between gap-fila border-b border-border/60 px-4 py-3 text-left text-corps text-text-primary transition-colors last:border-0 hover:bg-white/5"
              >
                {c.name}
                {c.id === activa && <Check size={16} className="text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
