"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";

/**
 * El botón.
 *
 * Es la única forma cerrada de todo el producto, y desde el 2026-09-10 es de
 * cristal: una píldora translúcida que deja ver la flor detrás. La eligió
 * Natalia comparándola con un metal líquido, con el dedo en su iPhone. El estilo
 * vive en `.boton-cristal`, en globals.css.
 *
 * Responde al dedo, no solo al ratón. En un teléfono no existe el hover, así
 * que al tocar se enciende `.pulsado`, y se mantiene un instante al soltar para
 * que un toque rápido llegue a verse entero.
 */

// iOS no aplica :active si la página no escucha el toque. Una escucha vacía y
// pasiva basta, y deja funcionar :active en las copias que no pasan por aquí.
if (typeof document !== "undefined") {
  document.addEventListener("touchstart", () => {}, { passive: true });
}

/** Encendido al tocar, apagado un instante después de soltar. */
export function usePulsado() {
  const [pulsado, setPulsado] = useState(false);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const encender = () => {
    if (espera.current) clearTimeout(espera.current);
    setPulsado(true);
  };
  const apagar = () => {
    espera.current = setTimeout(() => setPulsado(false), 260);
  };
  return {
    pulsado,
    eventos: {
      onPointerDown: encender,
      onPointerUp: apagar,
      onPointerCancel: apagar,
      onPointerLeave: apagar,
    },
  };
}

type Common = {
  children: React.ReactNode;
  /** Ocupa el ancho de su columna. En un móvil casi siempre sí. */
  full?: boolean;
  className?: string;
};

function clases(pulsado: boolean, full?: boolean, extra?: string) {
  return ["boton-cristal", pulsado && "pulsado", full && "w-full", extra].filter(Boolean).join(" ");
}

function Contenido({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span>{children}</span>
      <ArrowRight className="boton-cristal__flecha" aria-hidden />
    </>
  );
}

export function Button({
  full,
  className,
  children,
  ...button
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pulsado, eventos } = usePulsado();
  return (
    <button {...eventos} {...button} className={clases(pulsado, full, className)}>
      <Contenido>{children}</Contenido>
    </button>
  );
}

export function ButtonLink({
  href,
  full,
  className,
  children,
}: Common & { href: string }) {
  const { pulsado, eventos } = usePulsado();
  return (
    <Link href={href} {...eventos} className={clases(pulsado, full, className)}>
      <Contenido>{children}</Contenido>
    </Link>
  );
}

/**
 * Un botón que abre el selector de archivos. Es una etiqueta y no un botón
 * porque dentro del WebView de iOS el selector solo se abre de forma fiable
 * desde la asociación nativa label → input. Ver FilePicker.
 */
export function LabelButton({
  htmlFor,
  disabled,
  full,
  className,
  children,
}: Common & { htmlFor: string; disabled?: boolean }) {
  const { pulsado, eventos } = usePulsado();
  return (
    <label
      htmlFor={htmlFor}
      {...eventos}
      aria-disabled={disabled || undefined}
      className={clases(pulsado, full, className)}
    >
      <Contenido>{children}</Contenido>
    </label>
  );
}
