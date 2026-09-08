"use client";

import Link from "next/link";
import FloralBackdrop from "@/app/dashboard/floral-backdrop";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Lang } from "@/lib/i18n/translations";
import { useNativePlatform } from "@/lib/native/use-native";
import { Rise } from "./motion";

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

/**
 * La cáscara de las cuatro pantallas de entrada.
 *
 * Antes cada una traía su propia imagen fija y su propio velo, y una de ellas
 * ni siquiera usaba la misma fotografía. Ahora la flor está detrás de todas,
 * que es lo que separa a Curato de una app oscura cualquiera.
 *
 * El velo se mueve según cuánto texto haya que proteger, y nunca baja de 0.80:
 * la flor tiene un centro pálido y esto se lee con mala luz.
 *
 * En la app el logotipo no es un enlace. Quien tiene la app ya es miembro y el
 * escaparate no es un sitio al que pueda ir.
 */
export function AuthShell({
  title,
  subtitle,
  veil = 0.86,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  veil?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { lang, setLang } = useLang();
  const native = useNativePlatform();

  const wordmark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo-curato-simple.png" alt="curato" style={{ height: "14px", width: "auto" }} />
  );

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-pagina">
      <FloralBackdrop opacity={veil} breathe />

      <div className="absolute right-pagina top-pagina z-20 flex items-center gap-fila">
        {LANGS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setLang(key)}
            className={`min-h-11 text-capitale tracking-capitale transition-colors duration-200 ease-curato ${
              lang === key ? "text-accent" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[340px] py-respiro">
        <Rise immediate>
          <div className="mb-rango text-center">
            {native ? (
              <span className="mb-rango inline-block">{wordmark}</span>
            ) : (
              <Link href="/" className="mb-rango inline-block">
                {wordmark}
              </Link>
            )}
            <h1 className="text-titre uppercase tracking-titre text-text-primary">{title}</h1>
            {subtitle && (
              <p className="mt-bloque text-corps text-text-secondary">{subtitle}</p>
            )}
          </div>
        </Rise>

        <Rise immediate index={1}>{children}</Rise>

        {footer && (
          <Rise immediate index={2}>
            <div className="mt-seccion text-center text-legende text-text-muted">{footer}</div>
          </Rise>
        )}
      </div>
    </div>
  );
}
