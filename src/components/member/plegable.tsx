"use client";

import { useId, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";

/**
 * Una sección que se abre al tocar su título, con la flecha a la derecha.
 * Cerrada por defecto: en Réglages se ve de un vistazo qué hay (Langue, Votre
 * compte, Notifications…) y solo se despliega lo que se quiere cambiar.
 */
export function Plegable({
  titulo,
  children,
  abierta = false,
}: {
  titulo: React.ReactNode;
  children: React.ReactNode;
  abierta?: boolean;
}) {
  const [open, setOpen] = useState(abierta);
  const id = useId();
  return (
    <section className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="flex min-h-14 w-full items-center justify-between gap-fila text-left"
      >
        <span className="text-capitale uppercase tracking-capitale text-accent">{titulo}</span>
        <CaretDown
          size={14}
          className={`shrink-0 text-text-muted transition-transform duration-300 ease-curato ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div id={id} className="pb-rango">
          {children}
        </div>
      )}
    </section>
  );
}
