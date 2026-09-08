import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import NativeShell from "./native-shell";

export const metadata: Metadata = {
  title: "Curato — París",
  description: "Un ecosistema curado donde creators y comercios construyen algo juntos. Invitation only. París.",
  metadataBase: new URL("https://curato.co"),
  openGraph: {
    title: "Curato",
    description: "Un ecosistema curado donde creators y comercios construyen algo juntos.",
    url: "https://curato.co",
    siteName: "Curato",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Curato" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Curato",
    description: "Experiencias reales. Contenido auténtico.",
    images: ["/api/og"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

// `viewportFit: "cover"` lets the page paint under the notch and the home
// indicator, which is what makes env(safe-area-inset-*) report real values.
// The [data-native] rules in globals.css then pad the content back out. We
// leave pinch-zoom alone on purpose, capping it would hurt accessibility.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Un solo negro. La cáscara nativa pintaba #1A1A1A detrás de una página
  // #1E1E1E, y el segundo negro asomaba en los rebotes del scroll.
  themeColor: "#1E1E1E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full antialiased">
        <NativeShell />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
