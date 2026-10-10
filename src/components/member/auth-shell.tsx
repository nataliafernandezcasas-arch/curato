"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { getNativePlatform } from "@/lib/native/bridge";
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
  intro = false,
}: {
  title: string;
  subtitle?: string;
  veil?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Al abrir la app: la pantalla de carga se convierte en esta (IntroDeEntrada). */
  intro?: boolean;
}) {
  const { lang, setLang } = useLang();
  const native = useNativePlatform();
  const logo = useRef<HTMLImageElement>(null);
  const reduce = useReducedMotion();
  const [conIntro, setConIntro] = useState(false);

  // Antes de pintar, para que la primera imagen ya sea la de la pantalla de
  // carga y el paso del nativo a la web no se note. Una vez por arranque.
  useLayoutEffect(() => {
    if (!intro || reduce || !getNativePlatform()) return;
    try {
      if (sessionStorage.getItem("curato.intro")) return;
      sessionStorage.setItem("curato.intro", "1");
    } catch {
      /* sin almacenamiento, se enseña igual */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tiene que ser antes de pintar
    setConIntro(true);
  }, [intro, reduce]);

  // El logotipo manda: más grande que el título (Natalia, 2026-10-10).
  const wordmark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={logo}
      src="/logo-curato-simple.png"
      alt="curato"
      style={{ height: "22px", width: "auto", opacity: conIntro ? 0 : 1 }}
    />
  );

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-pagina">
      {conIntro && (
        <IntroDeEntrada
          destino={logo}
          alTerminar={() => {
            if (logo.current) logo.current.style.opacity = "1";
            setConIntro(false);
          }}
        />
      )}
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
            <h1 className="font-titulo text-[20px] uppercase tracking-titre text-text-primary">{title}</h1>
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

/**
 * La pantalla de carga que se convierte en la de entrada (Natalia, 2026-10-10).
 *
 * Empieza idéntica a la de carga del iPhone: las flores a pantalla completa y el
 * logotipo en el mismo sitio y al mismo tamaño (a 43,95 % de alto y 53,3 % del
 * ancho de la foto, medidos en la imagen). La foto va sin el logotipo,
 * intro-flores.jpg, y el logotipo es una pieza aparte: sube hasta donde está
 * el de la página y se encoge a su tamaño mientras las flores se apagan.
 */
function IntroDeEntrada({
  destino,
  alTerminar,
}: {
  destino: React.RefObject<HTMLImageElement | null>;
  alTerminar: () => void;
}) {
  const [caja, animar] = useAnimate<HTMLDivElement>();
  const marca = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    let vivo = true;
    // Un instante quieto, como la pantalla de carga, y luego el viaje. Para
    // entonces la página ya ha subido a su sitio y se puede medir el destino.
    const espera = setTimeout(async () => {
      const desde = marca.current?.getBoundingClientRect();
      const hasta = destino.current?.getBoundingClientRect();
      if (!vivo || !desde || !hasta || !caja.current || !marca.current) return alTerminar();
      const viaje = { duration: 1.1, ease: [0.65, 0, 0.35, 1] as const };
      await Promise.all([
        animar(
          marca.current,
          {
            x: hasta.left + hasta.width / 2 - (desde.left + desde.width / 2),
            y: hasta.top + hasta.height / 2 - (desde.top + desde.height / 2),
            scale: hasta.width / desde.width,
          },
          viaje
        ),
        animar("[data-fondo]", { opacity: 0 }, { ...viaje, duration: 0.9 }),
      ]);
      if (vivo) alTerminar();
    }, 450);
    return () => {
      vivo = false;
      clearTimeout(espera);
    };
    // Una sola vez: la intro no se repite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div ref={caja} aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <div data-fondo className="absolute inset-0 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/intro-flores.jpg" alt="" className="h-full w-full object-cover" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={marca}
        src="/logo-curato-simple.png"
        alt=""
        className="absolute left-1/2 top-[43.95%] h-auto max-w-none -translate-x-1/2 -translate-y-1/2"
        style={{ width: "calc(max(100vw, 100dvh * 0.5623) * 0.533)" }}
      />
    </motion.div>
  );
}
