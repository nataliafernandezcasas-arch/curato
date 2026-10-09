/**
 * Thin typed access to the Capacitor runtime.
 *
 * The native app loads the live site inside a WebView, so every module here
 * also runs for ordinary web visitors. Capacitor injects `window.Capacitor`
 * only inside the app, which is what every guard below keys off.
 *
 * We deliberately call plugins through that injected global instead of
 * importing the `@capacitor/*` packages. The packages stay in package.json so
 * `npx cap sync` installs the native halves, but keeping them out of the web
 * bundle means curatocollective.com ships byte-for-byte the same JavaScript to
 * people browsing from a laptop.
 */

export type NativePlatform = "ios" | "android";

export interface StatusBarPlugin {
  setStyle(options: { style: "DARK" | "LIGHT" | "DEFAULT" }): Promise<void>;
}

/** La pantalla de carga con las flores, la de LaunchScreen.storyboard. */
export interface SplashScreenPlugin {
  hide(options?: { fadeOutDuration?: number }): Promise<void>;
}

export interface PluginListenerHandle {
  remove: () => void;
}

/**
 * Lo que devuelve addListener.
 *
 * Dos formas, y hay que aceptar las dos: el puente nativo de iOS devuelve el
 * manejador tal cual, y los paquetes de JavaScript devuelven una promesa. Un
 * `.then` a secas sobre esto rompía la app entera al arrancar, porque la
 * excepción salía dentro del primer efecto y se llevaba la página. Con este
 * tipo, `.then` ya no compila: hay que usar await, que vale para las dos.
 */
export type Alta = Promise<PluginListenerHandle> | PluginListenerHandle;

export interface AppPlugin {
  addListener(
    event: "backButton",
    handler: (event: { canGoBack: boolean }) => void
  ): Alta;
  /** Un enlace de curatocollective.com abierto desde fuera de la app. */
  addListener(
    event: "appUrlOpen",
    handler: (event: { url: string }) => void
  ): Alta;
  minimizeApp(): Promise<void>;
}

export type PushPermission = "prompt" | "prompt-with-rationale" | "granted" | "denied";

/** Un aviso tocado. `data` trae lo que puso el emisor, entre ello `ruta`. */
export interface PushNotificationEvent {
  notification?: {
    title?: string;
    body?: string;
    data?: Record<string, unknown> | null;
  } | null;
}

export interface PushNotificationsPlugin {
  checkPermissions(): Promise<{ receive: PushPermission }>;
  requestPermissions(): Promise<{ receive: PushPermission }>;
  register(): Promise<void>;
  addListener(
    event: "registration",
    handler: (token: { value: string }) => void
  ): Alta;
  addListener(
    event: "registrationError",
    handler: (error: { error: string }) => void
  ): Alta;
  addListener(
    event: "pushNotificationReceived" | "pushNotificationActionPerformed",
    handler: (event: PushNotificationEvent) => void
  ): Alta;
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: {
    StatusBar?: StatusBarPlugin;
    SplashScreen?: SplashScreenPlugin;
    App?: AppPlugin;
    PushNotifications?: PushNotificationsPlugin;
  };
}

declare global {
  interface Window {
    Capacitor?: CapacitorGlobal;
  }
}

/**
 * Espera un alta de escucha, venga como venga, y no lanza nunca.
 *
 * Es la única forma correcta de recoger lo que devuelve addListener: iOS da el
 * manejador tal cual y los paquetes de JavaScript dan una promesa. Un `.then`
 * sobre el primero lanza, y como estas altas se piden dentro del primer efecto
 * de la cáscara, esa excepción dejaba la app en blanco con "This page couldn't
 * load" en todas las pantallas.
 */
export async function esperaEscucha(alta: Alta | undefined | null): Promise<PluginListenerHandle | null> {
  try {
    const escucha = await alta;
    return typeof escucha?.remove === "function" ? escucha : null;
  } catch {
    return null;
  }
}

/** The Capacitor bridge, or null when running as a plain website. */
export function getCapacitor(): CapacitorGlobal | null {
  if (typeof window === "undefined") return null;
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  return cap;
}

/** Which native shell we're in, or null on the web. */
export function getNativePlatform(): NativePlatform | null {
  const platform = getCapacitor()?.getPlatform?.();
  return platform === "ios" || platform === "android" ? platform : null;
}
