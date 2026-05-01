import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Midi Pass",
  description: "Experiencias reales. Contenido auténtico. El programa exclusivo de beneficios para influencers de Midi.",
  metadataBase: new URL("https://pass.midi.io"),
  openGraph: {
    title: "Midi Pass",
    description: "Experiencias reales. Contenido auténtico. El programa que conecta influencers con los mejores comercios de LATAM.",
    url: "https://pass.midi.io",
    siteName: "Midi Pass",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Midi Pass" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Midi Pass",
    description: "Experiencias reales. Contenido auténtico.",
    images: ["/api/og"],
  },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
