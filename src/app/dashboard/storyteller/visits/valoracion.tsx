"use client";

import { useState } from "react";
import { Star } from "@phosphor-icons/react";
import type { Lang } from "@/lib/i18n/translations";
import { Button } from "@/components/member/button";

const TEXTOS: Record<
  Lang,
  { titulo: string; nota: string; enviar: string; cambiar: string; gracias: string; error: string; estrella: (n: number) => string }
> = {
  fr: {
    titulo: "Comment s'est passée la visite ?",
    nota: "Un mot sur votre visite (facultatif)",
    enviar: "Envoyer mon avis",
    cambiar: "Mettre à jour",
    gracias: "Merci, votre avis est envoyé à Curato.",
    error: "L'avis n'a pas été envoyé. Réessayez dans un instant.",
    estrella: (n) => (n > 1 ? `${n} étoiles` : "1 étoile"),
  },
  en: {
    titulo: "How was the visit?",
    nota: "A few words about your visit (optional)",
    enviar: "Send my review",
    cambiar: "Update",
    gracias: "Thank you, your review has been sent to Curato.",
    error: "The review wasn't sent. Try again in a moment.",
    estrella: (n) => (n > 1 ? `${n} stars` : "1 star"),
  },
  es: {
    titulo: "¿Qué tal fue la visita?",
    nota: "Unas líneas sobre tu visita (opcional)",
    enviar: "Enviar mi opinión",
    cambiar: "Actualizar",
    gracias: "Gracias, tu opinión ha llegado a Curato.",
    error: "La opinión no se envió. Vuelve a intentarlo en un momento.",
    estrella: (n) => (n > 1 ? `${n} estrellas` : "1 estrella"),
  },
};

/**
 * Después de la visita, el storyteller la valora: de 1 a 5 estrellas y, si
 * quiere, unas líneas. Lo lee Curato, no la casa. Se puede cambiar después.
 */
export function Valoracion({
  id,
  inicial,
  lang,
}: {
  id: string;
  inicial: { estrellas: number | null; nota: string } | null;
  lang: Lang;
}) {
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const [estrellas, setEstrellas] = useState(inicial?.estrellas ?? 0);
  const [nota, setNota] = useState(inicial?.nota ?? "");
  const [enviada, setEnviada] = useState(Boolean(inicial?.estrellas));
  const [cambiada, setCambiada] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState(false);

  async function enviar() {
    setEnviando(true);
    setFallo(false);
    const res = await fetch("/api/reservations/valoracion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estrellas, nota }),
    }).catch(() => null);
    setEnviando(false);
    if (res?.ok) {
      setEnviada(true);
      setCambiada(false);
    } else {
      setFallo(true);
    }
  }

  return (
    <div className="mt-rango border-t border-border pt-fila">
      <p className="text-capitale uppercase tracking-capitale text-accent">{t.titulo}</p>
      <div role="radiogroup" aria-label={t.titulo} className="mt-bloque flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={estrellas === n}
            aria-label={t.estrella(n)}
            onClick={() => {
              setEstrellas(n);
              setCambiada(true);
            }}
            className="flex h-11 w-11 items-center justify-center text-accent transition-transform active:scale-90"
          >
            <Star size={28} weight={n <= estrellas ? "fill" : "thin"} />
          </button>
        ))}
      </div>
      {estrellas > 0 && (
        <>
          <textarea
            value={nota}
            onChange={(e) => {
              setNota(e.target.value);
              setCambiada(true);
            }}
            rows={3}
            maxLength={2000}
            placeholder={t.nota}
            aria-label={t.nota}
            className="campo-cristal mt-fila resize-none text-[15px]"
          />
          {(!enviada || cambiada) && (
            <div className="mt-fila">
              <Button onClick={enviar} disabled={enviando}>
                {enviada ? t.cambiar : t.enviar}
              </Button>
            </div>
          )}
        </>
      )}
      {enviada && !cambiada && <p className="mt-fila text-legende text-sauge-vif">{t.gracias}</p>}
      {fallo && <p className="mt-fila text-legende text-copper-vif">{t.error}</p>}
    </div>
  );
}
