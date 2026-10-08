"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import type { Lang } from "@/lib/i18n/translations";
import { COMUN } from "@/lib/i18n/comun";

/**
 * La carta o el folleto de una casa, para leerlo dentro de la app.
 *
 * Antes era un enlace al archivo: había que descargarlo y, en el iPhone, salir
 * de la app. Una foto se enseña tal cual. Un PDF se dibuja página a página con
 * pdf.js, porque dentro del WebView de iOS un PDF incrustado solo enseña la
 * primera página y no se puede desplazar.
 */
const TEXTOS: Record<Lang, { open: string; loading: string; failed: string; doc: (n: number) => string }> = {
  fr: {
    open: "Ouvrir",
    loading: "Chargement…",
    failed: "Ce document ne s'est pas chargé. Réessayez dans un instant.",
    doc: (n) => `Document ${n}`,
  },
  en: {
    open: "Open",
    loading: "Loading…",
    failed: "This document didn't load. Try again in a moment.",
    doc: (n) => `Document ${n}`,
  },
  es: {
    open: "Abrir",
    loading: "Cargando…",
    failed: "Este documento no se cargó. Vuelve a intentarlo en un momento.",
    doc: (n) => `Documento ${n}`,
  },
};

const esPdf = (url: string) => /\.pdf($|\?)/i.test(url);

/**
 * Las páginas de un PDF como imágenes, a `ancho` píxeles CSS. pdf.js se carga
 * solo cuando hace falta: pesa, y casi ninguna página lo necesita. Es la
 * versión «legacy»: la normal usa funciones de JavaScript tan nuevas que el
 * Safari de muchos iPhone todavía no las tiene, y no dibujaba nada.
 */
async function paginasDePdf(url: string, ancho: number, maximo: number, calidad: number): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
  const carga = pdfjs.getDocument({ url });
  try {
    const doc = await carga.promise;
    const paginas: string[] = [];
    // Más resolución que la pantalla: se lee la letra pequeña de una carta.
    const nitidez = Math.min(window.devicePixelRatio || 1, 2) * 1.5;
    for (let n = 1; n <= Math.min(doc.numPages, maximo); n++) {
      const pagina = await doc.getPage(n);
      const base = pagina.getViewport({ scale: 1 });
      const vista = pagina.getViewport({ scale: (ancho / base.width) * nitidez });
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.floor(vista.width);
      lienzo.height = Math.floor(vista.height);
      await pagina.render({ canvas: lienzo, viewport: vista }).promise;
      paginas.push(lienzo.toDataURL("image/jpeg", calidad));
    }
    return paginas;
  } finally {
    await carga.destroy();
  }
}

function Visor({ url, lang, onClose }: { url: string; lang: Lang; onClose: () => void }) {
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const [paginas, setPaginas] = useState<string[] | null>(esPdf(url) ? null : [url]);
  const [fallo, setFallo] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!esPdf(url)) return;
    let vivo = true;
    const ancho = Math.min(caja.current?.clientWidth ?? window.innerWidth, 900);
    paginasDePdf(url, ancho, 30, 0.85)
      .then((p) => vivo && setPaginas(p))
      .catch(() => vivo && setFallo(true));
    return () => {
      vivo = false;
    };
  }, [url]);

  // Escape cierra, y la página de debajo no se mueve mientras se lee.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alTeclear);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = previo;
    };
  }, [onClose]);

  // En el body: dentro de una caja con desenfoque (la oferta de la casa), un
  // `fixed` queda encerrado en la caja y el visor salía diminuto.
  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-surface">
      <header
        className="barra-panel sticky top-0 z-10 flex items-center justify-end px-pagina"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={COMUN[lang].close}
          className="-mr-2 flex h-[52px] w-11 items-center justify-center text-accent transition-colors duration-200 ease-curato hover:text-text-primary"
        >
          <ArrowLeft size={22} />
        </button>
      </header>
      <div ref={caja} className="mx-auto max-w-[900px] px-pagina pb-seccion pt-fila">
        {fallo ? (
          <p className="text-corps text-text-secondary">{t.failed}</p>
        ) : !paginas ? (
          <p className="text-corps text-text-secondary">{t.loading}</p>
        ) : (
          <div className="space-y-fila">
            {paginas.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="w-full rounded-[12px] bg-white" />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/**
 * Los documentos de la carta, como miniaturas que se abren en la app. Con
 * `onRemove`, la casa ve lo mismo que el storyteller y puede quitar cada uno.
 */
export function Carta({
  urls,
  lang,
  onRemove,
  removeLabel,
}: {
  urls: string[];
  lang: Lang;
  onRemove?: (url: string) => void;
  removeLabel?: string;
}) {
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const [abierto, setAbierto] = useState<string | null>(null);
  if (urls.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-fila sm:grid-cols-3">
        {urls.map((url, i) => (
          <div key={url} className="relative">
            <button
              type="button"
              onClick={() => setAbierto(url)}
              className="block w-full overflow-hidden rounded-[14px] border border-border text-left transition-colors hover:border-accent"
            >
              <div className="aspect-[3/4] overflow-hidden bg-surface-raised">
                {esPdf(url) ? (
                  <PortadaPdf url={url} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between px-bloque py-bloque">
                <span className="text-legende text-text-primary">{t.doc(i + 1)}</span>
                <span className="text-capitale uppercase tracking-capitale text-accent">{t.open}</span>
              </div>
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(url)}
                aria-label={removeLabel}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-[15px] text-white backdrop-blur transition-colors hover:bg-black/80"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {abierto && <Visor url={abierto} lang={lang} onClose={() => setAbierto(null)} />}
    </>
  );
}

/** La primera página de un PDF, como miniatura. */
function PortadaPdf({ url }: { url: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    paginasDePdf(url, 180, 1, 0.8)
      .then(([portada]) => vivo && portada && setSrc(portada))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [url]);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-full w-full bg-white object-cover object-top" />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-capitale uppercase tracking-capitale text-text-muted">PDF</div>
  );
}
