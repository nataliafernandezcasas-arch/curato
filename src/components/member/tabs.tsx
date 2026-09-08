"use client";

import Link from "next/link";

export type Tab = {
  label: string;
  active?: boolean;
  /** Una sección con dirección propia. Preferido: el botón de atrás funciona. */
  href?: string;
  onClick?: () => void;
};

/**
 * Las pestañas de una pantalla.
 *
 * Envuelven a dos líneas, porque cinco pestañas en francés no caben en 375 px
 * y esa fila es hoy lo que arrastra la página hacia la derecha.
 *
 * La activa se marca en champagne. Sin fondo, sin subrayado y sin recuadro: el
 * color ya dice dónde estás.
 */
export function Tabs({ tabs, className }: { tabs: Tab[]; className?: string }) {
  return (
    <nav className={`flex flex-wrap gap-x-fila gap-y-bloque ${className ?? ""}`}>
      {tabs.map((tab) => {
        const tone = tab.active ? "text-accent" : "text-text-secondary hover:text-accent";
        const classes = `inline-flex min-h-11 items-center text-capitale uppercase tracking-capitale transition-colors duration-200 ease-curato ${tone}`;

        return tab.href ? (
          <Link key={tab.label} href={tab.href} className={classes} aria-current={tab.active ? "page" : undefined}>
            {tab.label}
          </Link>
        ) : (
          <button key={tab.label} type="button" onClick={tab.onClick} className={classes} aria-current={tab.active ? "page" : undefined}>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
