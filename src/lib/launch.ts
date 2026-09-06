// Public launch gate for the storyteller catalogue.
// Before this date, accepted storytellers see a "coming soon" screen instead of
// the selected addresses. See canBypassLaunchGate() for who gets in early.
import { getNativePlatform } from "./native/bridge";

// No public date yet. `null` keeps the gate shut for the website for as long as
// it takes, and the "coming soon" screen drops the sentence that would have
// named a day. Set a Date here to announce one (write the Paris offset: +02:00
// during CEST, +01:00 once it ends in late October).
//
// The pilot does not need a date set: that cohort is the TestFlight tester list
// and it comes in through the app, see canBypassLaunchGate() below.
export const LAUNCH_AT: Date | null = null;

export function isBeforeLaunch(): boolean {
  return LAUNCH_AT === null || Date.now() < LAUNCH_AT.getTime();
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
