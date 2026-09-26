/**
 * Los avisos del teléfono, del lado de la app.
 *
 * Nada de aquí pide permiso al arrancar. Preguntar en frío, antes de que la
 * persona sepa de qué se le va a avisar, es la manera segura de recibir un "no"
 * definitivo (y Apple lo señala en la revisión). El arranque solo vuelve a
 * registrar un aparato que ya dijo que sí, porque el token de Apple cambia al
 * reinstalar o al restaurar una copia; `enablePushNotifications()` es el sí,
 * y está detrás de una fila en Réglages que explica qué se avisa.
 *
 * Cuatro avisos y ninguno más, y cada uno abre su pantalla: la ruta viaja en el
 * propio aviso (`ruta`), la pone el emisor en src/lib/push/avisos.ts.
 */

import { getCapacitor, type PluginListenerHandle, type PushNotificationEvent } from "./bridge";

const RECUERDO = "curato-push-token";

/** Guarda el token para poder retirarlo al cerrar sesión. */
function recordar(token: string | null) {
  try {
    if (token) localStorage.setItem(RECUERDO, token);
    else localStorage.removeItem(RECUERDO);
  } catch {
    /* sin almacenamiento, el token se vuelve a pedir en el próximo arranque */
  }
}

async function handleToken(token: string, platform: string) {
  try {
    const res = await fetch("/api/push/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, platform }),
    });
    if (!res.ok) {
      // Sin sesión todavía (401) es lo normal en la pantalla de entrada: al
      // volver a esta pantalla con la sesión abierta, el registro se repite.
      console.warn("[curato] token no guardado:", res.status);
      return;
    }
    recordar(token);
  } catch (err) {
    console.warn("[curato] token no guardado:", err);
  }
}

/** La pantalla que abre un aviso tocado, si trae una. */
function rutaDe(evento: PushNotificationEvent): string | null {
  const ruta = evento?.notification?.data?.ruta;
  // Solo una ruta interna: un aviso no puede sacar a nadie de la app.
  return typeof ruta === "string" && ruta.startsWith("/") && !ruta.startsWith("//") ? ruta : null;
}

/** Engancha las escuchas. Devuelve la función que las suelta. */
export async function attachPushListeners(navegar?: (ruta: string) => void): Promise<() => void> {
  const push = getCapacitor()?.Plugins?.PushNotifications;
  if (!push) return () => {};

  const platform = getCapacitor()?.getPlatform?.() ?? "unknown";
  const handles: PluginListenerHandle[] = [];

  try {
    handles.push(
      await push.addListener("registration", ({ value }) => void handleToken(value, platform))
    );
    handles.push(
      await push.addListener("registrationError", ({ error }) => {
        console.warn("[curato] push registration failed:", error);
      })
    );
    handles.push(
      await push.addListener("pushNotificationActionPerformed", (evento) => {
        const ruta = rutaDe(evento);
        if (!ruta) return;
        if (navegar) navegar(ruta);
        else window.location.assign(ruta);
      })
    );
  } catch (err) {
    console.warn("[curato] could not attach push listeners:", err);
  }

  return () => handles.forEach((handle) => handle?.remove?.());
}

/**
 * Vuelve a registrar un aparato que ya dio permiso, lo que refresca un token
 * que puede haber cambiado desde el último arranque. Nunca pregunta.
 */
export async function syncPushRegistration(): Promise<void> {
  const push = getCapacitor()?.Plugins?.PushNotifications;
  if (!push) return;

  try {
    const { receive } = await push.checkPermissions();
    if (receive === "granted") await push.register();
  } catch (err) {
    console.warn("[curato] push permission check failed:", err);
  }
}

/** Si este aparato ya dijo que sí, que no, o si todavía no se le ha preguntado. */
export async function estadoDeLosAvisos(): Promise<"granted" | "denied" | "prompt" | null> {
  const push = getCapacitor()?.Plugins?.PushNotifications;
  if (!push) return null;
  try {
    const { receive } = await push.checkPermissions();
    return receive === "granted" ? "granted" : receive === "denied" ? "denied" : "prompt";
  } catch {
    return null;
  }
}

/**
 * Pide permiso y registra. Se llama desde la fila de Réglages, después de decir
 * de qué se avisa. Devuelve true si el aparato queda registrado.
 */
export async function enablePushNotifications(): Promise<boolean> {
  const push = getCapacitor()?.Plugins?.PushNotifications;
  if (!push) return false;

  try {
    const current = await push.checkPermissions();
    const { receive } =
      current.receive === "granted" ? current : await push.requestPermissions();

    if (receive !== "granted") return false;
    await push.register();
    return true;
  } catch (err) {
    console.warn("[curato] enabling push failed:", err);
    return false;
  }
}

/**
 * Retira este aparato. Se llama al cerrar sesión: quien entre después en el
 * mismo teléfono no debe leer en la pantalla apagada el nombre de las casas que
 * visita quien entró antes.
 */
export async function olvidarEsteAparato(): Promise<void> {
  let token: string | null = null;
  try {
    token = localStorage.getItem(RECUERDO);
  } catch {
    return;
  }
  if (!token) return;
  recordar(null);
  try {
    await fetch("/api/push/register", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    /* el token se queda huérfano; el primer envío fallido lo borra */
  }
}
