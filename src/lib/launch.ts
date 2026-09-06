// Public launch gate for the storyteller catalogue.
// Before this date, accepted storytellers see a "coming soon" screen instead of
// the selected addresses. See canBypassLaunchGate() for who gets in early.
import { getNativePlatform } from "./native/bridge";

// Monday 3 November, the public opening. Paris has left CEST by then, so +01:00.
// The 15 September to 15 October pilot does NOT move this date: that cohort is
// the TestFlight tester list, and it comes in through the app (see below).
export const LAUNCH_AT = new Date("2026-11-03T00:00:00+01:00");

export function isBeforeLaunch(): boolean {
  return Date.now() < LAUNCH_AT.getTime();
}

/**
 * Who gets through the gate before LAUNCH_AT. Browser only, so call it from an
 * effect and never during render on the server.
 *
 * Two ways in. `?preview=1` is the internal one. The other is being inside the
 * iOS/Android app: TestFlight decides who has the app, so the test cohort is
 * the tester list rather than a flag on every creator row. The website stays
 * shut until LAUNCH_AT while testers already browse the carnet.
 *
 * Neither is a security boundary. A user agent is trivially faked and so is a
 * query string, which is fine here: signed maisons are already public through
 * RLS, so the gate only controls when the catalogue is *presented*.
 */
export function canBypassLaunchGate(): boolean {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).has("preview")) return true;
  return Boolean(getNativePlatform());
}
