/**
 * El SDK de Phyllo Connect, del lado del navegador. Lo usan el botón de
 * Instagram de la app y la página /instagram/conectar, que es donde se conecta
 * desde el iPhone (ver connect-instagram.tsx).
 */
const SDK_SRC = "https://cdn.getphyllo.com/connect/v2/phyllo-connect.js";

// Tiene que coincidir con el entorno de las claves de Phyllo (PHYLLO_API_URL).
// Staging devuelve cifras de prueba, no las de la cuenta real: para producción,
// NEXT_PUBLIC_PHYLLO_ENV=production en Vercel.
export const PHYLLO_ENV = process.env.NEXT_PUBLIC_PHYLLO_ENV || "staging";

export function cargarSdkDePhyllo(): Promise<void> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).PhylloConnect) return resolve();
    const existing = document.querySelector(`script[src="${SDK_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("sdk")));
      return;
    }
    const s = document.createElement("script");
    s.src = SDK_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("sdk"));
    document.body.appendChild(s);
  });
}

type Eventos = {
  conectada: () => void;
  salida: () => void;
  fallo: () => void;
};

/** Abre la ventana de Phyllo para conectar la cuenta. */
export async function abrirPhyllo(userId: string, token: string, eventos: Eventos, entorno = PHYLLO_ENV) {
  await cargarSdkDePhyllo();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pc = (window as any).PhylloConnect.initialize({
    environment: entorno,
    userId,
    token,
    clientDisplayName: "Curato",
  });
  // Phyllo comprueba cuántos parámetros declara cada función: hay que
  // declararlos todos aunque no se usen (accountConnected 3, exit 2…).
  /* eslint-disable @typescript-eslint/no-unused-vars */
  pc.on("accountConnected", (_a: string, _w: string, _u: string) => eventos.conectada());
  pc.on("accountDisconnected", (_a: string, _w: string, _u: string) => {});
  pc.on("tokenExpired", (_u: string) => {});
  pc.on("exit", (_r: string, _u: string) => eventos.salida());
  pc.on("connectionFailure", (_r: string, _w: string, _u: string) => eventos.fallo());
  /* eslint-enable @typescript-eslint/no-unused-vars */
  pc.open();
}
