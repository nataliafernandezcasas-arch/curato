"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n/translations";
import { Section } from "@/components/member/section";
import { Button } from "@/components/member/button";
import { Ciudades } from "@/components/member/ciudades";

const TEXTOS: Record<Lang, { titulo: string; hint: string; placeholder: string; add: string; remove: string; save: string; saved: string; error: string }> = {
  fr: {
    titulo: "Basé(e) à",
    hint: "Une ville, ou plusieurs si vous vivez entre deux villes ou voyagez souvent.",
    placeholder: "Paris",
    add: "Ajouter",
    remove: "Retirer",
    save: "Enregistrer",
    saved: "Enregistré.",
    error: "Ça n'a pas été enregistré. Réessayez dans un instant.",
  },
  en: {
    titulo: "Based in",
    hint: "One city, or several if you live between two cities or travel often.",
    placeholder: "Paris",
    add: "Add",
    remove: "Remove",
    save: "Save",
    saved: "Saved.",
    error: "That wasn't saved. Try again in a moment.",
  },
  es: {
    titulo: "Basado/a en",
    hint: "Una ciudad, o varias si vives entre dos ciudades o viajas a menudo.",
    placeholder: "París",
    add: "Añadir",
    remove: "Quitar",
    save: "Guardar",
    saved: "Guardado.",
    error: "No se guardó. Vuelve a intentarlo en un momento.",
  },
};

/** Dónde está basado el storyteller, editable desde su perfil (migración 056). */
export function CiudadesPerfil({ lang }: { lang: Lang }) {
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const [ciudades, setCiudades] = useState<string[] | null>(null);
  const [cambiado, setCambiado] = useState(false);
  const [estado, setEstado] = useState<"" | "guardando" | "ok" | "error">("");

  useEffect(() => {
    fetch("/api/storyteller/ciudades", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCiudades(d.cities ?? []))
      .catch(() => {});
  }, []);

  async function guardar() {
    setEstado("guardando");
    const res = await fetch("/api/storyteller/ciudades", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cities: ciudades ?? [] }),
    }).catch(() => null);
    setEstado(res?.ok ? "ok" : "error");
    if (res?.ok) setCambiado(false);
  }

  if (ciudades === null) return null;
  return (
    <Section title={t.titulo} hint={t.hint} className="mt-seccion">
      <Ciudades
        valor={ciudades}
        onChange={(c) => {
          setCiudades(c);
          setCambiado(true);
          setEstado("");
        }}
        placeholder={t.placeholder}
        anadir={t.add}
        quitar={t.remove}
        inputClassName="campo-cristal"
      />
      {cambiado && (
        <div className="mt-fila">
          <Button onClick={guardar} disabled={estado === "guardando"}>{t.save}</Button>
        </div>
      )}
      {estado === "ok" && <p className="mt-bloque text-legende text-sauge-vif">{t.saved}</p>}
      {estado === "error" && <p className="mt-bloque text-legende text-copper-vif">{t.error}</p>}
    </Section>
  );
}
