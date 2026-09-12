import { getCapacitor, getNativePlatform } from "@/lib/native/bridge";

/**
 * El modo claro y el oscuro (entrega 5, 10 terdecies: el modo claro rehecho
 * sobre la acuarela).
 *
 * La persona elige en Réglages: seguir a su teléfono, que es lo que viene por
 * defecto, o fijar un modo. La elección vive en este dispositivo, como el
 * idioma.
 *
 * El claro solo se aplica en las pantallas que ya saben pintarse sobre crema
 * (RUTAS_CLARAS). Las demás siguen en oscuro aunque la persona haya elegido
 * claro: mejor una pantalla oscura que una con texto blanco sobre papel. La
 * lista crece a medida que se pasan pantallas.
 *
 * Dentro de la app de iOS, la franja de la hora la pinta el contenedor nativo,
 * no la página. Hasta que la versión instalada sepa cambiarla (el mensaje
 * curatoTema de CuratoViewController), el claro no se ofrece ahí: la hora
 * quedaría en tinta oscura sobre una franja negra.
 */

export type Preferencia = "sistema" | "claro" | "oscuro";

const CLAVE = "curato-tema";
const EVENTO = "curato-tema";

/** Las pantallas que ya están listas para el papel claro. */
export const RUTAS_CLARAS = /^\/dashboard\/storyteller(\/|$)/;

/** El papel sin foto: themeColor, la franja nativa y los rebotes del scroll. */
const PAPEL = { claro: "#EDEAE1", oscuro: "#1E1E1E" } as const;

type ConMensajes = Window & {
  webkit?: { messageHandlers?: { curatoTema?: { postMessage: (color: string) => void } } };
};

function mensajeIos() {
  if (typeof window === "undefined") return null;
  return (window as ConMensajes).webkit?.messageHandlers?.curatoTema ?? null;
}

export function leerPreferencia(): Preferencia {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === "claro" || v === "oscuro" ? v : "sistema";
  } catch {
    return "sistema";
  }
}

export function guardarPreferencia(p: Preferencia) {
  try {
    if (p === "sistema") localStorage.removeItem(CLAVE);
    else localStorage.setItem(CLAVE, p);
  } catch {
    /* sin almacenamiento, la elección dura lo que la pestaña */
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function sistemaEnClaro(): boolean {
  return typeof window !== "undefined" && (window.matchMedia?.("(prefers-color-scheme: light)").matches ?? false);
}

/** Si este dispositivo puede enseñar el claro entero, cáscara incluida. */
export function claroDisponible(): boolean {
  return getNativePlatform() !== "ios" || mensajeIos() !== null;
}

/** Avisa cuando cambia la elección (aquí o en otra pestaña) o el modo del teléfono. */
export function suscribirTema(aviso: () => void): () => void {
  const mq = window.matchMedia?.("(prefers-color-scheme: light)");
  const alGuardar = (e: StorageEvent) => {
    if (e.key === CLAVE) aviso();
  };
  mq?.addEventListener("change", aviso);
  window.addEventListener(EVENTO, aviso);
  window.addEventListener("storage", alGuardar);
  return () => {
    mq?.removeEventListener("change", aviso);
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener("storage", alGuardar);
  };
}

let enCascara: boolean | null = null;

/**
 * Pone el papel en la página y en la cáscara nativa a la vez: el atributo del
 * <html>, themeColor, el estilo de la barra de estado y el fondo nativo de iOS.
 * Cambio instantáneo, sin transición: un fundido entre dos papeles enteros se
 * ve como un parpadeo sucio.
 */
export function aplicarTema(claro: boolean) {
  const html = document.documentElement;
  if (claro) html.setAttribute("data-theme", "light");
  else html.removeAttribute("data-theme");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", claro ? PAPEL.claro : PAPEL.oscuro);

  if (enCascara === claro) return;
  enCascara = claro;
  // Nombre engañoso de Capacitor: "LIGHT" es tinta oscura, para papel claro.
  getCapacitor()?.Plugins?.StatusBar?.setStyle({ style: claro ? "LIGHT" : "DARK" }).catch(() => {});
  mensajeIos()?.postMessage(claro ? PAPEL.claro : PAPEL.oscuro);
}

/**
 * La misma decisión, antes de la primera pintura: va en el <head> del layout.
 * Sin esto, quien tiene el claro vería un destello oscuro al abrir cada
 * pantalla. Repite a mano lo de arriba porque corre antes que cualquier módulo.
 */
export const SCRIPT_TEMA = `(function(){try{var p=localStorage.getItem("${CLAVE}");var c=p==="claro"||(p!=="oscuro"&&window.matchMedia("(prefers-color-scheme: light)").matches);var k=window.Capacitor,i=!!(k&&k.getPlatform&&k.getPlatform()==="ios");var w=window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.curatoTema;if(c&&(!i||w)&&/${RUTAS_CLARAS.source}/.test(location.pathname)){document.documentElement.setAttribute("data-theme","light");}}catch(e){}})();`;
