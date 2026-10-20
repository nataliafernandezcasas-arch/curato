import type { Icon } from "@/components/member/iconos";

/**
 * El título de una sección de ficha, con su icono delante: la ficha de una
 * casa se recorre de un vistazo, sección a sección (revisión de diseño,
 * 2026-10-20).
 */
export function TituloSeccion({ icono: Icono, children, className = "" }: { icono: Icon; children: React.ReactNode; className?: string }) {
  return (
    <p className={`mb-3 flex items-center gap-2 text-capitale uppercase tracking-capitale text-accent ${className}`}>
      <Icono size={17} aria-hidden className="shrink-0" />
      {children}
    </p>
  );
}
