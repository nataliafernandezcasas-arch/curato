import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
