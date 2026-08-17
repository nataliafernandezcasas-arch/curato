/**
 * Push notifications for the native shell.
 *
 * Nothing here fires a permission prompt on launch. Asking cold, before the
 * person knows what Curato would notify them about, is the reliable way to get
 * a permanent "no" (and Apple flags it in review). The launch path only
 * re-registers a device that already said yes; `enablePushNotifications()` is
 * the opt-in, meant to be wired to a real control in the dashboard.
 *
 * Delivery credentials are NOT configured yet: APNs needs an Apple Developer
 * account and Android needs a Firebase google-services.json. Until then
 * registration fails harmlessly and we log why. See NATALIA_TODO_XCODE.md.
 */

import { getCapacitor, type PluginListenerHandle } from "./bridge";

/**
 * TODO(push-backend): persist the token so we can actually send anything.
 * Needs a `device_tokens` table (user_id, token, platform, updated_at) plus an
 * endpoint to upsert it, then a sender that talks to APNs/FCM. Out of scope
 * until the Apple Developer account and Firebase project exist.
 */
function handleToken(token: string, platform: string) {
  console.info(`[curato] push token (${platform}):`, token);
}

/** Attaches the push listeners. Returns a cleanup function. */
export async function attachPushListeners(): Promise<() => void> {
  const push = getCapacitor()?.Plugins?.PushNotifications;
  if (!push) return () => {};

  const platform = getCapacitor()?.getPlatform?.() ?? "unknown";
  const handles: PluginListenerHandle[] = [];

  try {
    handles.push(
      await push.addListener("registration", ({ value }) => handleToken(value, platform))
    );
    handles.push(
      await push.addListener("registrationError", ({ error }) => {
        // Expected until APNs/FCM credentials exist. Logged, never surfaced.
        console.warn("[curato] push registration failed:", error);
      })
    );
    handles.push(
      await push.addListener("pushNotificationActionPerformed", (event) => {
        // TODO(push-backend): route to the screen named in the payload once we
        // define one, e.g. a new reservation opens /dashboard/business.
        console.info("[curato] notification tapped:", event);
      })
    );
  } catch (err) {
    console.warn("[curato] could not attach push listeners:", err);
  }

  return () => handles.forEach((handle) => handle.remove());
}

/**
 * Re-registers a device that already granted permission, which refreshes a
 * token that may have rotated since the last launch. Never prompts.
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

/**
 * Asks for permission and registers. Call this from an explicit opt-in, after
 * explaining what we'd notify about. Resolves true if the device is registered.
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
