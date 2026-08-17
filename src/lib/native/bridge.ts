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

export interface PluginListenerHandle {
  remove: () => void;
}

export interface AppPlugin {
  addListener(
    event: "backButton",
    handler: (event: { canGoBack: boolean }) => void
  ): Promise<PluginListenerHandle>;
  minimizeApp(): Promise<void>;
}

export type PushPermission = "prompt" | "prompt-with-rationale" | "granted" | "denied";

export interface PushNotificationsPlugin {
  checkPermissions(): Promise<{ receive: PushPermission }>;
  requestPermissions(): Promise<{ receive: PushPermission }>;
  register(): Promise<void>;
  addListener(
    event: "registration",
    handler: (token: { value: string }) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    event: "registrationError",
    handler: (error: { error: string }) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    event: "pushNotificationReceived" | "pushNotificationActionPerformed",
    handler: (event: unknown) => void
  ): Promise<PluginListenerHandle>;
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: {
    StatusBar?: StatusBarPlugin;
    App?: AppPlugin;
    PushNotifications?: PushNotificationsPlugin;
  };
}

declare global {
  interface Window {
    Capacitor?: CapacitorGlobal;
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
