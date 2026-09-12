"use client";

/**
 * Un interruptor de cristal (entrega 5, 18 · Réglages): carril translúcido con
 * canto de luz y una bolita que pasa a la derecha al encenderse. La fila entera
 * es el objetivo táctil, 52 px, no solo el carril. El estilo vive en
 * `.interruptor`, en globals.css, con su versión clara.
 */
export function Interruptor({
  children,
  activo,
  onChange,
}: {
  children: React.ReactNode;
  activo: boolean;
  onChange: (activo: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => onChange(!activo)}
      className="grid min-h-[52px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-fila text-left"
    >
      <span className="text-champ text-text-primary">{children}</span>
      <span aria-hidden className="interruptor">
        <span className="interruptor__bolita" />
      </span>
    </button>
  );
}
