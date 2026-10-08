"use client";

import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";

// La pantalla de "no hay cuestionario". Vive en el cliente porque el idioma
// del miembro solo se conoce aquí (LanguageContext); el detalle técnico se
// queda en los logs del servidor.
const T: Record<Lang, { eyebrow: string; title: string; body: string }> = {
  fr: {
    eyebrow: "Quelque chose ne va pas",
    title: "Le questionnaire n'est pas disponible pour le moment.",
    body: "Réessayez dans un instant.",
  },
  en: {
    eyebrow: "Something went wrong",
    title: "The questionnaire is not available right now.",
    body: "Try again in a moment.",
  },
  es: {
    eyebrow: "Algo no va bien",
    title: "El cuestionario no está disponible ahora mismo.",
    body: "Vuelve a intentarlo en un momento.",
  },
};

export default function SurveyUnavailable() {
  const { lang } = useLang();
  const t = T[lang];
  return (
    <div className="min-h-[100dvh] bg-charcoal-deep flex items-center justify-center px-5">
      <div className="text-center max-w-[480px]">
        <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-copper-vif mb-5">
          {t.eyebrow}
        </p>
        <h1 className="font-serif text-[24px] md:text-[28px] font-light text-white leading-tight mb-4 tracking-wide">
          {t.title}
        </h1>
        <p className="font-serif text-[13px] font-light text-white/40 leading-relaxed tracking-wide">
          {t.body}
        </p>
      </div>
    </div>
  );
}
