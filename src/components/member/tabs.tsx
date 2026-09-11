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
 * Desde el 2026-09-11 son píldoras de cristal, como el botón (`.filtro-cristal`,
 * en globals.css): la activa lleva más luz y la palabra en tinta plena.
 */
export function Tabs({ tabs, className }: { tabs: Tab[]; className?: string }) {
  return (
    <nav className={`flex flex-wrap gap-bloque ${className ?? ""}`}>
      {tabs.map((tab) => {
        const classes = "filtro-cristal text-capitale uppercase tracking-capitale";

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
