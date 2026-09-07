import type { CookieOptions } from "@supabase/ssr";

/**
 * Supabase writes its auth cookies with no expiry, which makes them session
 * cookies. A desktop browser keeps those until the tab closes, so nobody
 * noticed. The iOS WebView drops them the moment the app is killed from the app
 * switcher, so every relaunch asked for the password again. The session had not
 * expired: the cookie holding it had been thrown away.
 *
 * Giving those cookies an explicit lifetime makes them survive the app being
 * closed. The window rolls forward on every request the proxy touches, so
 * someone who opens Curato even once in three months is never asked again.
 */
const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export function persistentCookie(options: CookieOptions, value: string): CookieOptions {
  // Signing out clears the value, and Supabase sets its own past expiry to do
  // it. Extending that would keep people signed in when they asked to leave.
  if (!value) return options;
  // Never override a lifetime Supabase set deliberately.
  if (options?.maxAge !== undefined || options?.expires !== undefined) return options;
  return { ...options, maxAge: SESSION_MAX_AGE };
}
