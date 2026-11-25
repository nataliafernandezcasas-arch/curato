"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n/translations";
import { Rise } from "@/components/member/motion";

type Invitacion = { id: string; name: string; arrondissement: string | null; photo: string | null; invitedAt: string };

const T: Record<Lang, { titulo: string; cuerpo: string; reservar: string }> = {
  fr: { titulo: "Elles vous réinvitent", cuerpo: "Votre dernière visite leur a plu.", reservar: "Choisir une date" },
  en: { titulo: "They'd love to have you back", cuerpo: "They enjoyed your last visit.", reservar: "Pick a date" },
  es: { titulo: "Te vuelven a invitar", cuerpo: "Les gustó tu última visita.", reservar: "Elegir una fecha" },
};

/**
 * Las casas que han vuelto a invitar al storyteller (migración 057), arriba
 * del carnet. Desaparece sola cuando reserva en esa casa.
 */
export default function Invitaciones({ lang }: { lang: Lang }) {
  const t = T[lang] ?? T.fr;
  const [lista, setLista] = useState<Invitacion[]>([]);

  useEffect(() => {
    fetch("/api/storyteller/invitaciones")
      .then((r) => r.json())
      .then((d) => setLista(d.invitaciones ?? []))
      .catch(() => {});
  }, []);

  if (lista.length === 0) return null;

  return (
    <Rise className="mb-seccion">
      <p className="mb-fila text-capitale uppercase tracking-capitale text-accent">{t.titulo}</p>
      <div className="space-y-bloque">
        {lista.map((c) => (
          <div key={c.id} className="caja-cristal flex items-center gap-fila p-fila">
            {c.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.photo} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-[10px] object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-titulo text-sous-titre text-text-primary">{c.name}</p>
              <p className="truncate text-legende text-text-secondary">
                {[c.arrondissement, t.cuerpo].filter(Boolean).join(" · ")}
              </p>
            </div>
            <Link
              href={`/dashboard/storyteller/maison/${c.id}/reserver`}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-accent px-4 text-legende text-charcoal-deep transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              {t.reservar}
            </Link>
          </div>
        ))}
      </div>
    </Rise>
  );
}
