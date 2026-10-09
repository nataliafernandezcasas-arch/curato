"use client";

import Link from "next/link";
import { CaretRight, EnvelopeSimple, Question } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";
import { Plegable } from "./plegable";

export const CORREO_DE_AYUDA = "hello@curatocollective.com";

const TEXTOS: Record<Lang, { titulo: string; escribir: string; faq: string; faqNota: string }> = {
  fr: { titulo: "Aide", escribir: "Écrire au service client", faq: "Questions fréquentes", faqNota: "Réservations, crédit, stories…" },
  en: { titulo: "Help", escribir: "Contact customer service", faq: "Frequently asked questions", faqNota: "Bookings, credit, stories…" },
  es: { titulo: "Ayuda", escribir: "Escribir al servicio al cliente", faq: "Preguntas frecuentes", faqNota: "Reservas, crédito, stories…" },
};

/** En Réglages: escribir a Curato y las preguntas frecuentes. */
export function Ayuda() {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const fila =
    "group flex min-h-14 w-full items-center gap-fila text-left transition-colors duration-200 ease-curato";
  return (
    <Plegable titulo={t.titulo}>
      <a href={`mailto:${CORREO_DE_AYUDA}`} className={fila}>
        <EnvelopeSimple size={20} className="shrink-0 text-accent" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-corps text-text-primary group-hover:text-accent">{t.escribir}</span>
          <span className="block break-all text-legende text-text-secondary">{CORREO_DE_AYUDA}</span>
        </span>
        <CaretRight size={14} className="shrink-0 text-text-muted" aria-hidden />
      </a>
      <Link href="/faq" className={fila}>
        <Question size={20} className="shrink-0 text-accent" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-corps text-text-primary group-hover:text-accent">{t.faq}</span>
          <span className="block text-legende text-text-secondary">{t.faqNota}</span>
        </span>
        <CaretRight size={14} className="shrink-0 text-text-muted" aria-hidden />
      </Link>
    </Plegable>
  );
}
