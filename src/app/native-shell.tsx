"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCapacitor, getNativePlatform } from "@/lib/native/bridge";
import { attachPushListeners, syncPushRegistration } from "@/lib/native/push";

/**
 * Native-only behaviour, mounted once from the root layout.
 *
 * The iOS/Android app loads this very site in a WebView, so this component also
 * renders for web visitors. Every branch below is behind a native guard and is
 * a no-op in a normal browser. Renders nothing.
 */
export default function NativeShell() {
  const pathname = usePathname();
  const router = useRouter();

  // The marketing home explains what Curato is to someone who has never heard
  // of it. Whoever is holding the app was invited, so that page has nothing to
  // say to them and should never be a place the app can end up. Every link that
  // used to lead here now points at /dashboard; this is the net underneath, so
  // a link added later cannot quietly reopen the door.
  useEffect(() => {
    if (!getNativePlatform()) return;
    if (pathname === "/") router.replace("/dashboard");
  }, [pathname, router]);

  useEffect(() => {
    const platform = getNativePlatform();
    if (!platform) return;

    // Lets CSS target the app without touching the website. See the
    // [data-native] safe-area rules in globals.css.
    document.documentElement.dataset.native = platform;

    let disposed = false;
    const cleanups: Array<() => void> = [];
    // Listeners resolve asynchronously, so one may land after unmount.
    const track = (remove: () => void) => {
      if (disposed) remove();
      else cleanups.push(remove);
    };

    const cap = getCapacitor();

    // "DARK" means light text, which is what reads over the #1A1A1A shell.
    cap?.Plugins?.StatusBar?.setStyle({ style: "DARK" }).catch(() => {});

    if (platform === "android") {
      const app = cap?.Plugins?.App;
      app
        ?.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            // On the first screen, drop to the launcher like every other
            // Android app. Capacitor's default is to exit outright, which
            // would tear down the WebView and the user's place in it.
            app.minimizeApp().catch(() => {});
          }
        })
        .then((handle) => track(() => handle.remove()))
        .catch(() => {});
    }

    attachPushListeners().then(track).catch(() => {});
    void syncPushRegistration();

    return () => {
      disposed = true;
      cleanups.forEach((remove) => remove());
    };
  }, []);

  return null;
}
