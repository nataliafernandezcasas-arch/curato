import type { CapacitorConfig } from "@capacitor/cli";

// Curato native shell (iOS + Android) via Capacitor.
//
// Curato is a server-rendered Next.js app (SSR + Supabase auth), so it can't be
// exported to static files. Instead, the native app loads the live production
// site inside a native WebView (server.url) and adds native capabilities on top
// (push notifications, splash screen, status bar, safe-area insets).
//
// `webDir` (mobile/www) is only a local fallback bundle; the app actually runs
// the hosted site. When we move to bundling assets locally, point webDir at the
// real build output and drop server.url.
const config: CapacitorConfig = {
  appId: "com.curatocollective.app",
  appName: "Curato",
  webDir: "mobile/www",
  backgroundColor: "#1E1E1E",
  server: {
    // The app opens on /dashboard, never on the marketing home. Curato is
    // invitation-only, so someone holding the app is already a member and does
    // not need the pages that explain what Curato is.
    //
    // /dashboard is a server route that decides: a live session goes straight
    // to that member's own space by role (storyteller, maison, recruiter), and
    // no session lands on /auth/sign-in. Pointing at the sign-in screen itself
    // would show the login form to members who are already signed in.
    url: "https://www.curatocollective.com/dashboard",
    cleartext: false,
    // Any top-level navigation to a host that isn't listed here gets handed to
    // Safari (Capacitor cancels it in the WebView), which would silently break
    // sign-in: the access-code flow navigates to the Supabase verify endpoint,
    // which then redirects back to the site to set the session cookie. If those
    // hops leave the WebView the session lands in Safari and the app stays
    // logged out. Keep the apex here too, some auth links redirect via it
    // before Vercel forwards them to www.
    allowNavigation: [
      "curatocollective.com",
      "www.curatocollective.com",
      "*.supabase.co",
    ],
    // Shown when the hosted site can't be reached (no signal, site down).
    // Without this the WebView just renders a blank white page on failure.
    // Resolves against webDir, so it points at mobile/www/index.html.
    errorPath: "index.html",
  },
  ios: {
    contentInset: "always",
  },
  plugins: {
    PushNotifications: {
      // How a notification behaves while the app is in the foreground.
      presentationOptions: ["badge", "sound", "alert"],
    },
    StatusBar: {
      // Counter-intuitive name: "DARK" means light text, which is what we need
      // over the #1E1E1E background. Android 15+ forces edge-to-edge, so the
      // bar always overlays the WebView and the safe-area CSS does the spacing.
      style: "DARK",
    },
  },
};

export default config;
