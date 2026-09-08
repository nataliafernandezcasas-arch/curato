"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NavLink } from "@/app/dashboard/dashboard-nav";

/**
 * La barra de destinos, abajo.
 *
 * Dos cosas hacían que esto pareciese una web y no una app: que todo se
 * recorriese hacia abajo, y que la navegación viviese arriba, detrás de un
 * menú. El pulgar no llega arriba del todo en un teléfono, y abrir un menú para
 * cambiar de sitio son dos gestos donde debería haber uno.
 *
 * Abajo, siempre visible, sin iconos: tres palabras en capital y la activa en
 * champagne. Sin caja, sin subrayado y sin píldora. Solo en el teléfono: en un
 * portátil los destinos siguen en la barra de arriba, que ahí sí se alcanzan.
 */
export function TabBar({ links }: { links: NavLink[] }) {
  const [offline, setOffline] = useState(false);

  // Sin conexión se dice aquí, en una palabra, y deja de ser una pantalla
  // entera que tapaba lo que la persona estaba mirando.
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (links.length === 0) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 backdrop-blur-sm sm:hidden"
      style={{
        backgroundColor: "rgba(30,30,30,0.72)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {offline && (
        <p className="py-etiqueta text-center text-capitale uppercase tracking-capitale text-copper">
          Hors ligne
        </p>
      )}
      <div className="flex items-stretch justify-around">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={l.active ? "page" : undefined}
            className={`flex min-h-14 flex-1 items-center justify-center px-2 text-center text-capitale uppercase tracking-capitale transition-colors duration-200 ease-curato ${
              l.active ? "text-accent" : "text-text-secondary"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/**
 * El hueco que la barra deja debajo del contenido, para que la última fila de
 * una pantalla no quede tapada por ella.
 */
export function TabBarSpacer() {
  return (
    <div
      aria-hidden
      className="sm:hidden"
      style={{ height: "calc(56px + env(safe-area-inset-bottom, 0px))" }}
    />
  );
}
