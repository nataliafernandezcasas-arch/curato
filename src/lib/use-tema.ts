import { useCallback, useSyncExternalStore } from "react";
import {
  claroDisponible,
  guardarPreferencia,
  leerPreferencia,
  sistemaEnClaro,
  suscribirTema,
  type Preferencia,
} from "@/lib/tema";

const sinPreferencia = (): Preferencia => "sistema";
const no = () => false;

/**
 * El modo de la persona: lo que eligió, lo que hace su teléfono y, de las dos
 * cosas, si la pantalla va en claro. En el servidor no hay nada que leer, así
 * que se pinta como si siguiera al teléfono en oscuro.
 */
export function useTema() {
  const preferencia = useSyncExternalStore(suscribirTema, leerPreferencia, sinPreferencia);
  const sistemaClaro = useSyncExternalStore(suscribirTema, sistemaEnClaro, no);
  const disponible = useSyncExternalStore(suscribirTema, claroDisponible, no);
  const claro = preferencia === "claro" || (preferencia === "sistema" && sistemaClaro);
  const elegir = useCallback((p: Preferencia) => guardarPreferencia(p), []);
  return { preferencia, sistemaClaro, claro, disponible, elegir };
}
