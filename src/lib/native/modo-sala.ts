"use client";

import { useEffect, useState } from "react";
import { getCapacitor } from "./bridge";

/**
 * El modo sala de la pantalla del QR: brillo al máximo al entrar y devuelto al
 * salir, y la pantalla despierta mientras está abierta. Responde a que el
 * teléfono se apague a mitad de gesto, en una sala con prisa y con mala luz.
 *
 * Dentro de la app lo hacen dos plugins de Capacitor (screen-brightness y
 * keep-awake), llamados por el global que inyecta la envoltura nativa, como el
 * resto de src/lib/native. Una app instalada antes de la versión que los trae
 * no los tiene: entonces, igual que en la web, la pantalla se mantiene
 * despierta con la Wake Lock API del navegador y el brillo se pide con una
 * frase.
 */

interface ScreenBrightnessPlugin {
  getBrightness(): Promise<{ brightness: number }>;
  setBrightness(options: { brightness: number }): Promise<void>;
}

interface KeepAwakePlugin {
  keepAwake(): Promise<void>;
  allowSleep(): Promise<void>;
}

type WakeLockSentinelLike = { release: () => Promise<void> };

export type ModoSala = {
  /** El brillo lo ha subido la app. Si no, la pantalla pide que se suba. */
  brillo: boolean;
  /** La pantalla no se apagará mientras esta página esté abierta. */
  despierta: boolean;
};

export function useModoSala(): ModoSala {
  const [modo, setModo] = useState<ModoSala>({ brillo: false, despierta: false });

  useEffect(() => {
    let vivo = true;
    let brilloPrevio: number | null = null;
    let wakeLock: WakeLockSentinelLike | null = null;

    const plugins = getCapacitor()?.Plugins as Record<string, unknown> | undefined;
    const pantalla = plugins?.ScreenBrightness as ScreenBrightnessPlugin | undefined;
    const despierta = plugins?.KeepAwake as KeepAwakePlugin | undefined;

    async function pedirWakeLock() {
      const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinelLike> } };
      if (!nav.wakeLock) return false;
      try {
        wakeLock = await nav.wakeLock.request("screen");
        return true;
      } catch {
        return false;
      }
    }

    (async () => {
      let brillo = false;
      if (pantalla) {
        try {
          brilloPrevio = (await pantalla.getBrightness()).brightness;
          await pantalla.setBrightness({ brightness: 1 });
          brillo = true;
        } catch {
          brillo = false;
        }
      }
      let ok = false;
      if (despierta) {
        try {
          await despierta.keepAwake();
          ok = true;
        } catch {
          ok = false;
        }
      }
      if (!ok) ok = await pedirWakeLock();
      if (vivo) setModo({ brillo, despierta: ok });
    })();

    // El navegador suelta el Wake Lock al cambiar de pestaña: se vuelve a pedir
    // al volver.
    const alVolver = () => {
      if (document.visibilityState === "visible" && !despierta) pedirWakeLock();
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", alVolver);
      if (pantalla && brilloPrevio !== null) pantalla.setBrightness({ brightness: brilloPrevio }).catch(() => {});
      despierta?.allowSleep().catch(() => {});
      wakeLock?.release().catch(() => {});
    };
  }, []);

  return modo;
}
