// Public launch gate for the storyteller catalogue.
// Before this date, accepted storytellers see a "coming soon" screen instead of
// the selected addresses. Append ?preview=1 to the dashboard URL to bypass it
// (used for internal preview/testing — the catalogue is not security-sensitive,
// signed maisons are already public via RLS).
//
// Launch is planned for 15 September. Until then, accepted storytellers see the
// "coming soon" screen and cannot browse or reserve.
// Paris is on CEST (+02:00) on 15 September.
export const LAUNCH_AT = new Date("2026-09-15T00:00:00+02:00");

export function isBeforeLaunch(): boolean {
  return Date.now() < LAUNCH_AT.getTime();
}
