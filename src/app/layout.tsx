import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import NativeShell from "./native-shell";
import TemaSync from "./tema-sync";
import { SCRIPT_TEMA } from "@/lib/tema";

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
//
// Sin zoom (Natalia, 2026-10-09). Al tocar un campo con letra de menos de 16 px,
// el iPhone ampliaba la página él solo y no la devolvía: desde ahí la pantalla
// se arrastraba de lado, la cabecera y la barra de abajo se movían y los
// márgenes parecían otros. Una app no se amplía; el tamaño de la letra lo pone
// el ajuste de texto del iPhone, que sí se respeta.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // Un solo negro. La cáscara nativa pintaba #1A1A1A detrás de una página
  // #1E1E1E, y el segundo negro asomaba en los rebotes del scroll.
  themeColor: "#1E1E1E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // El script del tema pone data-theme en el <html> antes de la primera
    // pintura, así que el atributo no coincide con lo que renderiza React.
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <head>
        {/* Inline y en el <head>, no con next/script: beforeInteractive corre
            cuando carga el runtime de Next, después de pintar, y quien tiene el
            claro vería un destello oscuro. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full antialiased">
        <NativeShell />
        <TemaSync />
        {/* La página solo se mueve en vertical. El recorte va en esta caja y no
            solo en html y body: en el iPhone, WebKit deja arrastrar la pantalla
            de lado aunque html y body lleven overflow-x, porque el de la raíz
            pasa a la ventana y la ventana se sigue pudiendo desplazar. En una
            caja normal el recorte es de verdad. «clip» y no «hidden», para que
            las barras sticky sigan pegándose; las fixed no se ven afectadas. */}
        <div className="min-h-full overflow-x-clip">
          <LanguageProvider>{children}</LanguageProvider>
        </div>
      </body>
    </html>
  );
}
