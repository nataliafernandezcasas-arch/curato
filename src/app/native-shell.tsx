"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { esperaEscucha, getCapacitor, getNativePlatform, type Alta } from "@/lib/native/bridge";
import { attachPushListeners, syncPushRegistration } from "@/lib/native/push";

// El dominio que la app reclama en App.entitlements. Un enlace de otro sitio
// se queda en el navegador, que es donde debe quedarse.
const NUESTRO = /^(www\.)?curatocollective\.com$/;

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

    // La pantalla de carga se queda hasta aquí: la página ya está montada. Dos
    // fotogramas más, para que se vea pintada y no un fondo vacío debajo. Se
    // desvanece despacio, casi un segundo, y deja ver la página por debajo
    // (Natalia, 2026-10-10). En la entrada da igual: debajo está la intro, que
    // empieza siendo la misma imagen.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        cap?.Plugins?.SplashScreen?.hide({ fadeOutDuration: 900 }).catch(() => {});
      })
    );

    // Engancha una escucha venga como venga, promesa u objeto, y apunta cómo
    // soltarla. Aquí es donde estaba el fallo que dejaba la app en blanco: un
    // .then sobre algo que en iOS no es una promesa lanza, y la excepción salía
    // en el primer efecto, antes de pintar nada.
    const enganchar = async (alta: Alta | undefined) => {
      const escucha = await esperaEscucha(alta);
      if (escucha) track(() => escucha.remove());
    };

    // El estilo de la barra de estado lo pone TemaSync (src/lib/tema.ts), que
    // sabe si la pantalla va en claro o en oscuro.

    // Un enlace de Curato abierto desde el correo o desde un mensaje entra por
    // aquí en vez de saltar al navegador: así el enlace de restablecer la
    // contraseña deja la sesión dentro de la app y no fuera. Lo permite
    // com.apple.developer.associated-domains, y lo confirma el archivo que
    // sirve /.well-known/apple-app-site-association.
    void enganchar(
      cap?.Plugins?.App?.addListener("appUrlOpen", ({ url }) => {
        try {
          const destino = new URL(url);
          if (!NUESTRO.test(destino.hostname)) return;
          // Navegación completa, no router.replace. /auth/callback es una ruta
          // de servidor, no una página: el router de Next la pedía como
          // navegación de cliente y luego la volvía a cargar entera, así que el
          // token de un solo uso del correo se gastaba en la primera petición y
          // la segunda caía en /auth/sign-in.
          window.location.replace(`${destino.pathname}${destino.search}${destino.hash}`);
        } catch {
          /* una URL que no se puede leer no lleva a ninguna parte */
        }
      })
    );

    if (platform === "android") {
      const app = cap?.Plugins?.App;
      void enganchar(
        app?.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            // On the first screen, drop to the launcher like every other
            // Android app. Capacitor's default is to exit outright, which
            // would tear down the WebView and the user's place in it.
            app.minimizeApp().catch(() => {});
          }
        })
      );
    }

    attachPushListeners((ruta) => router.push(ruta)).then(track).catch(() => {});
    void syncPushRegistration();

    return () => {
      disposed = true;
      cleanups.forEach((remove) => remove());
    };
  }, [router]);

  return null;
}
