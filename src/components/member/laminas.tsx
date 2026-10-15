"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CaretLeft, CaretRight, MagnifyingGlassPlus } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";

const TEXTOS: Record<Lang, { pista: string; cerrar: string; antes: string; despues: string }> = {
  fr: { pista: "Touchez une page pour l'agrandir", cerrar: "Fermer", antes: "Page précédente", despues: "Page suivante" },
  en: { pista: "Tap a page to enlarge it", cerrar: "Close", antes: "Previous page", despues: "Next page" },
  es: { pista: "Toca una página para ampliarla", cerrar: "Cerrar", antes: "Página anterior", despues: "Página siguiente" },
};

const MAX = 4;
const DOBLE = 2.5;

type Lamina = { src: string; alt?: string };

/**
 * Las páginas de un dossier, una debajo de otra, y cada una se abre a pantalla
 * completa para ampliarla con dos dedos (Natalia, 2026-10-15: la letra es
 * pequeña). El zoom es nuestro y no del navegador: dentro de la app del iPhone
 * la página entera no se puede ampliar.
 */
export function Laminas({ laminas, label }: { laminas: Lamina[]; label?: string }) {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <section aria-label={label} className="relative">
      {laminas.map((l, i) => (
        <button
          key={l.src}
          type="button"
          onClick={() => setAbierta(i)}
          className="relative block w-full cursor-zoom-in"
          aria-label={l.alt || t.pista}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.src} alt={l.alt ?? ""} loading={i === 0 ? "eager" : "lazy"} className="block h-auto w-full" />
          {i === 0 && (
            <span className="pointer-events-none absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/55 px-3 py-1.5 text-legende text-white backdrop-blur-md">
              <MagnifyingGlassPlus size={14} aria-hidden />
              {t.pista}
            </span>
          )}
        </button>
      ))}
      {abierta !== null && <Visor laminas={laminas} inicio={abierta} onClose={() => setAbierta(null)} />}
    </section>
  );
}

const montado = () => () => {};

function Visor({ laminas, inicio, onClose }: { laminas: Lamina[]; inicio: number; onClose: () => void }) {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const enCliente = useSyncExternalStore(montado, () => true, () => false);
  const [i, setI] = useState(inicio);
  const caja = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  // El zoom vive en una ref y se pinta directo: un render por cada movimiento
  // del dedo iría a tirones.
  const vista = useRef({ s: 1, x: 0, y: 0 });
  const dedos = useRef(new Map<number, { x: number; y: number }>());
  const gesto = useRef<{ d: number; s: number; mx: number; my: number; x: number; y: number } | null>(null);
  const ultimoToque = useRef(0);

  const pintar = useCallback(() => {
    const { s, x, y } = vista.current;
    if (img.current) img.current.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  }, []);

  // Que la imagen no se salga más allá de sus bordes al moverla.
  const limitar = useCallback(() => {
    const v = vista.current;
    const c = caja.current?.getBoundingClientRect();
    const im = img.current;
    if (!c || !im) return;
    const w = im.offsetWidth * v.s;
    const h = im.offsetHeight * v.s;
    const mx = Math.max(0, (w - c.width) / 2);
    const my = Math.max(0, (h - c.height) / 2);
    v.x = Math.min(mx, Math.max(-mx, v.x));
    v.y = Math.min(my, Math.max(-my, v.y));
  }, []);

  const reiniciar = useCallback(() => {
    vista.current = { s: 1, x: 0, y: 0 };
    pintar();
  }, [pintar]);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, laminas.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", alTeclear);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = previo;
    };
  }, [onClose, laminas.length]);

  // Otra página: vuelve a su tamaño.
  useEffect(reiniciar, [i, reiniciar]);

  function centro(e: { clientX: number; clientY: number }) {
    const c = caja.current!.getBoundingClientRect();
    return { x: e.clientX - c.left - c.width / 2, y: e.clientY - c.top - c.height / 2 };
  }

  function bajar(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.current.size === 2) {
      const [a, b] = [...dedos.current.values()];
      const m = centro({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
      gesto.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: vista.current.s, mx: m.x, my: m.y, x: vista.current.x, y: vista.current.y };
    }
  }

  function mover(e: React.PointerEvent) {
    const antes = dedos.current.get(e.pointerId);
    if (!antes) return;
    dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const v = vista.current;
    if (dedos.current.size === 2 && gesto.current) {
      const [a, b] = [...dedos.current.values()];
      const g = gesto.current;
      const s = Math.min(MAX, Math.max(1, (g.s * Math.hypot(a.x - b.x, a.y - b.y)) / g.d));
      // El punto entre los dos dedos se queda bajo los dedos.
      v.x = g.mx - ((g.mx - g.x) * s) / g.s;
      v.y = g.my - ((g.my - g.y) * s) / g.s;
      v.s = s;
    } else if (dedos.current.size === 1 && v.s > 1) {
      v.x += e.clientX - antes.x;
      v.y += e.clientY - antes.y;
    } else return;
    limitar();
    pintar();
  }

  function subir(e: React.PointerEvent) {
    const eraUnDedo = dedos.current.size === 1;
    dedos.current.delete(e.pointerId);
    if (dedos.current.size < 2) gesto.current = null;
    if (!eraUnDedo) return;
    // Dos toques seguidos: ampliar ahí, o volver al tamaño normal.
    const ahora = Date.now();
    if (ahora - ultimoToque.current < 300) {
      const v = vista.current;
      if (v.s > 1) reiniciar();
      else {
        const p = centro(e);
        vista.current = { s: DOBLE, x: -p.x * (DOBLE - 1), y: -p.y * (DOBLE - 1) };
        limitar();
        pintar();
      }
      ultimoToque.current = 0;
    } else ultimoToque.current = ahora;
  }

  if (!enCliente) return null;
  const l = laminas[i];

  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[70] flex flex-col bg-black">
      <header
        className="relative z-10 flex items-center justify-between px-pagina"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 6px)" }}
      >
        <span className="text-capitale tabular-nums tracking-capitale text-white/60">
          {i + 1} / {laminas.length}
        </span>
        <button type="button" onClick={onClose} aria-label={t.cerrar} className="flex h-11 w-11 items-center justify-center text-white">
          <ArrowLeft size={22} />
        </button>
      </header>

      <div
        ref={caja}
        className="relative flex flex-1 touch-none select-none items-center justify-center overflow-hidden"
        onPointerDown={bajar}
        onPointerMove={mover}
        onPointerUp={subir}
        onPointerCancel={subir}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={img}
          src={l.src}
          alt={l.alt ?? ""}
          draggable={false}
          className="max-h-full max-w-full origin-center object-contain will-change-transform"
        />
      </div>

      <footer
        className="relative z-10 flex items-center justify-between px-pagina"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)" }}
      >
        <button
          type="button"
          onClick={() => setI((n) => Math.max(n - 1, 0))}
          disabled={i === 0}
          aria-label={t.antes}
          className="flex h-11 w-11 items-center justify-center text-white disabled:opacity-25"
        >
          <CaretLeft size={22} />
        </button>
        <button
          type="button"
          onClick={() => setI((n) => Math.min(n + 1, laminas.length - 1))}
          disabled={i === laminas.length - 1}
          aria-label={t.despues}
          className="flex h-11 w-11 items-center justify-center text-white disabled:opacity-25"
        >
          <CaretRight size={22} />
        </button>
      </footer>
    </div>,
    document.body
  );
}
