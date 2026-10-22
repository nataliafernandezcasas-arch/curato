"use client";

import { useState } from "react";
import { X } from "@/components/member/iconos";

/** Las ciudades que más salen, para tocarlas sin escribir. */
const SUGERIDAS = ["Paris", "Londres", "Madrid", "Barcelone", "Milan", "New York", "Lisbonne", "Bruxelles"];

/**
 * Dónde está basado un storyteller: una ciudad o varias, si viaja o vive
 * entre dos sitios (Natalia, 2026-10-22). Se escribe una y se añade con
 * Entrée o con el botón; cada una sale como una píldora que se puede quitar.
 */
export function Ciudades({
  valor,
  onChange,
  placeholder,
  anadir,
  quitar,
  inputClassName,
  max = 6,
}: {
  valor: string[];
  onChange: (ciudades: string[]) => void;
  placeholder: string;
  anadir: string;
  quitar: string;
  inputClassName: string;
  max?: number;
}) {
  const [texto, setTexto] = useState("");
  const poner = (c: string) => {
    const limpia = c.trim().replace(/\s+/g, " ").slice(0, 60);
    if (!limpia || valor.length >= max || valor.some((v) => v.toLowerCase() === limpia.toLowerCase())) return;
    onChange([...valor, limpia]);
    setTexto("");
  };

  return (
    <div>
      {valor.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {valor.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-champagne/40 py-1 pl-3 pr-1 text-legende text-text-primary">
              {c}
              <button
                type="button"
                onClick={() => onChange(valor.filter((v) => v !== c))}
                aria-label={`${quitar} ${c}`}
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:text-copper-vif"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
      {valor.length < max && (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  poner(texto);
                }
              }}
              onBlur={() => texto.trim() && poner(texto)}
              placeholder={placeholder}
              aria-label={placeholder}
              className={`min-w-0 flex-1 ${inputClassName}`}
            />
            <button
              type="button"
              onClick={() => poner(texto)}
              disabled={!texto.trim()}
              className="shrink-0 rounded-full border border-champagne/40 px-4 text-capitale uppercase tracking-capitale text-champagne transition-colors hover:border-champagne disabled:opacity-40"
            >
              {anadir}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGERIDAS.filter((s) => !valor.some((v) => v.toLowerCase() === s.toLowerCase())).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => poner(s)}
                className="rounded-full px-2.5 py-1 text-legende text-text-muted transition-colors hover:text-champagne"
              >
                + {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
