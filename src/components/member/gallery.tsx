"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Una galería que se arrastra.
 *
 * Páginas del ancho completo con scroll-snap: al soltar cae en la fotografía
 * más cercana, no a medio camino. El dedo lo hace solo el navegador; el ratón
 * necesita ayuda, y de ahí los pointer events.
 *
 * El detalle que decide si esto se siente bien o mal: un arrastre de más de
 * 8 px no cuenta como toque. Sin eso, deslizar para ver la siguiente foto abre
 * la ficha, y el gesto se vuelve una trampa.
 *
 * El indicador es una línea de 1 px que se llena. Una hilera de puntos serían
 * formas cerradas, y en este producto lo único cerrado es el botón.
 */
const UMBRAL_ARRASTRE = 8;

export function Gallery({
  photos,
  alt = "",
  aspect = "aspect-[4/5]",
  onOpen,
}: {
  photos: string[];
  alt?: string;
  aspect?: string;
  /** Se llama solo si fue un toque de verdad, no el final de un arrastre. */
  onOpen?: (index: number) => void;
}) {
  const pistaRef = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const arrastre = useRef({ activo: false, inicioX: 0, inicioScroll: 0, movido: 0 });

  const alScroll = useCallback(() => {
    const pista = pistaRef.current;
    if (!pista) return;
    const ancho = pista.clientWidth || 1;
    setActual(Math.round(pista.scrollLeft / ancho));
  }, []);

  useEffect(() => {
    const pista = pistaRef.current;
    if (!pista) return;
    pista.addEventListener("scroll", alScroll, { passive: true });
    return () => pista.removeEventListener("scroll", alScroll);
  }, [alScroll]);

  if (photos.length === 0) return null;

  function bajar(e: React.PointerEvent) {
    if (e.pointerType === "touch") return; // el dedo ya lo hace el navegador
    const pista = pistaRef.current;
    if (!pista) return;
    arrastre.current = { activo: true, inicioX: e.clientX, inicioScroll: pista.scrollLeft, movido: 0 };
    pista.setPointerCapture(e.pointerId);
  }

  function mover(e: React.PointerEvent) {
    const pista = pistaRef.current;
    if (!arrastre.current.activo || !pista) return;
    const delta = e.clientX - arrastre.current.inicioX;
    arrastre.current.movido = Math.max(arrastre.current.movido, Math.abs(delta));
    pista.scrollLeft = arrastre.current.inicioScroll - delta;
  }

  function soltar(e: React.PointerEvent) {
    const pista = pistaRef.current;
    if (pista?.hasPointerCapture(e.pointerId)) pista.releasePointerCapture(e.pointerId);
    arrastre.current.activo = false;
  }

  return (
    <div>
      <div
        ref={pistaRef}
        onPointerDown={bajar}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        className={`flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${aspect}`}
      >
        {photos.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              // Un arrastre no es un toque.
              if (arrastre.current.movido > UMBRAL_ARRASTRE) return;
              onOpen?.(i);
            }}
            className="w-full shrink-0 snap-center bg-surface-raised"
            tabIndex={onOpen ? 0 : -1}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={alt} draggable={false} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="mt-bloque h-px bg-border">
          <div
            className="h-full bg-accent transition-[width] duration-300 ease-curato"
            style={{ width: `${((actual + 1) / photos.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
