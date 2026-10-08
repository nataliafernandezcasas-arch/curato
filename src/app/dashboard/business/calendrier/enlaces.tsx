"use client";

import type { Lang } from "@/lib/i18n/translations";

const ANADIR: Record<Lang, string> = {
  fr: "Ajouter à mon calendrier",
  en: "Add to my calendar",
  es: "Añadir a mi calendario",
};

/**
 * Apuntar una visita en el calendario del teléfono: Google o Apple. En una
 * sola línea; antes «Apple» caía sola a la línea de abajo.
 */
export function EnlacesDeCalendario({
  calendar,
  lang,
  className = "",
}: {
  calendar: { google: string; ics: string };
  lang: Lang;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-fila ${className}`}>
      <span className="mr-auto text-capitale uppercase tracking-capitale text-text-muted">{ANADIR[lang] ?? ANADIR.fr}</span>
      <span className="flex items-center gap-x-fila">
        {[
          { href: calendar.google, label: "Google" },
          { href: calendar.ics, label: "Apple" },
        ].map((enlace) => (
          <a
            key={enlace.label}
            href={enlace.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-legende text-accent underline underline-offset-4 transition-colors hover:text-text-primary"
          >
            {enlace.label}
          </a>
        ))}
      </span>
    </div>
  );
}
