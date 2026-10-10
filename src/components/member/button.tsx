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

/**
 * Por dónde enseña cada botón la foto de las flores. Son recortes elegidos a
 * ojo, todos con una flor dentro (la foto es negra en buena parte). Cada texto
 * cae siempre en el mismo, así el mismo botón sale siempre igual y dos botones
 * distintos casi nunca coinciden.
 */
const RECORTES: Array<[string, string]> = [
  ["70%", "15%"], ["100%", "15%"], ["0%", "35%"], ["70%", "35%"], ["100%", "35%"], ["0%", "55%"],
  ["70%", "55%"], ["100%", "55%"], ["0%", "75%"], ["70%", "75%"], ["100%", "75%"],
];

function recorte(children: React.ReactNode): React.CSSProperties {
  const texto = typeof children === "string" || typeof children === "number" ? String(children) : "";
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  const [x, y] = RECORTES[(h >>> 0) % RECORTES.length];
  return { ["--recorte-x" as string]: x, ["--recorte-y" as string]: y };
}

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
    <button {...eventos} {...button} className={clases(pulsado, full, className)} style={{ ...recorte(children), ...button.style }}>
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
    <Link href={href} {...eventos} className={clases(pulsado, full, className)} style={recorte(children)}>
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
      style={recorte(children)}
    >
      <Contenido>{children}</Contenido>
    </label>
  );
}
