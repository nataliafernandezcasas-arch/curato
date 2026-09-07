"use client";

import { useEffect, useState } from "react";
import { getNativePlatform, type NativePlatform } from "./bridge";

/**
 * Which native shell we're in, or null on the web.
 *
 * Capacitor injects its bridge into the page, so the answer only exists after
 * mounting. Returning null on the first render is deliberate: the server and
 * the browser agree on the website's markup, and the app corrects itself a beat
 * later. Never gate anything a member needs on this alone.
 */
export function useNativePlatform(): NativePlatform | null {
  const [platform, setPlatform] = useState<NativePlatform | null>(null);
  useEffect(() => setPlatform(getNativePlatform()), []);
  return platform;
}
