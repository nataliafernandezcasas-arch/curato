"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTema } from "@/lib/use-tema";
import { RUTAS_CLARAS, aplicarTema } from "@/lib/tema";

/**
 * Mantiene el papel al día después de la primera pintura: al cambiar de
 * pantalla (una lista para el claro, otra todavía no), al elegir en Réglages y
 * cuando el teléfono pasa de claro a oscuro. No pinta nada.
 */
export default function TemaSync() {
  const pathname = usePathname();
  const { claro, disponible } = useTema();

  useEffect(() => {
    aplicarTema(claro && disponible && RUTAS_CLARAS.test(pathname ?? ""));
  }, [claro, disponible, pathname]);

  return null;
}
