import { Body, Head, Html, Img, Preview } from "@react-email/components";

/**
 * La cáscara de todos los correos de Curato (entrega 4, 10 sexies).
 *
 * El correo no es la app en un rectángulo: es papel. 600 px, fondo #1E1E1E,
 * una fotografía a sangre solo cuando hay algo que celebrar, y un enlace
 * subrayado en vez de un botón. Firmado por Curato y por nadie más.
 *
 * Lo que sostiene esto en los clientes de correo:
 *   · Tablas, nunca flexbox ni grid: Outlook pinta con el motor de Word.
 *   · Todo estilo en línea y colores sólidos, sin transparencias.
 *   · color-scheme y bgcolor en cada tabla: sin eso Gmail invierte un correo
 *     que ya es oscuro y sale gris sobre gris.
 *   · Cormorant por @import y Georgia detrás. Gmail y Outlook caen a Georgia.
 *     El diseño pedía 17 px de cuerpo; Natalia lo vio grande y lo bajamos 5
 *     (2026-09-11): titular 23, cuerpo 12, y nada por debajo de 12 salvo las
 *     capitales, a 11 como en la app.
 *   · Ninguna capital depende del interletrado: Outlook lo ignora.
 */

export const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://curatocollective.com";
const ASSET = "https://www.curatocollective.com";
// La foto oscurecida de fondo. El diseño lo dejaba liso, y Natalia lo vio
// plano (2026-09-11): vuelve la fotografía detrás, como antes. Outlook ignora
// el fondo y cae al bgcolor, que es el mismo tono.
const FONDO_FOTO = `${ASSET}/email-bg-dark.jpg`;

export const FONT = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";

// Colores sólidos: la tinta al 65 % de la app, calculada sobre el fondo.
export const COLOR = {
  fondo: "#1E1E1E",
  tinta: "#F5EFE4",
  secundaria: "#AAA69F",
  champagne: "#CBB78F",
  sauge: "#6FBF8B",
  copper: "#E6A455",
  brume: "#A3BAC0",
  filete: "#3A3733",
};

export function Shell({
  preview,
  hero,
  children,
}: {
  /** La línea que enseña la bandeja de entrada junto al asunto. */
  preview: string;
  /** Una fotografía a sangre, solo cuando hay algo que celebrar. */
  hero?: { src: string; alt: string } | null;
  children: React.ReactNode;
}) {
  return (
    <Html lang="fr">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&display=swap');
:root { color-scheme: light dark; supported-color-schemes: light dark; }`}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: COLOR.fondo, fontFamily: FONT }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} {...{ bgcolor: COLOR.fondo }} style={{ backgroundColor: COLOR.fondo }}>
          <tbody>
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width="600"
                  cellPadding={0}
                  cellSpacing={0}
                  {...{ bgcolor: COLOR.fondo, background: FONDO_FOTO }}
                  style={{
                    width: "100%",
                    maxWidth: 600,
                    backgroundColor: COLOR.fondo,
                    backgroundImage: `url('${FONDO_FOTO}')`,
                    backgroundPosition: "center top",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: "44px 40px 36px" }}>
                        {/* El logotipo es un PNG alojado con su alt: la mitad de
                            los clientes bloquean imágenes y el nombre tiene que
                            leerse igual. */}
                        <Img
                          src={`${ASSET}/logo-curato-simple.png`}
                          alt="Curato"
                          height="20"
                          style={{ display: "block", height: 20, width: "auto", border: 0 }}
                        />
                      </td>
                    </tr>
                    {hero && (
                      <tr>
                        <td>
                          <Img src={hero.src} alt={hero.alt} width="600" style={{ display: "block", width: "100%", height: "auto", border: 0 }} />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ padding: "40px 40px 8px" }}>{children}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "40px 40px 48px" }}>
                        <p style={{ margin: 0, fontFamily: FONT, fontSize: 12, color: COLOR.secundaria }}>Curato · Paris</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}

/** La capital: qué tipo de correo es. Champagne, o el color del estado. */
export function Capital({ children, color = COLOR.champagne }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{ margin: "0 0 14px", fontFamily: FONT, fontSize: 11, lineHeight: 1.4, letterSpacing: "0.28em", textTransform: "uppercase", color }}>
      {children}
    </p>
  );
}

/** El titular. En mayúscula cuando es un nombre propio, como en la app. */
export function Titre({ children, mayusculas = false }: { children: React.ReactNode; mayusculas?: boolean }) {
  return (
    <h1
      style={{
        margin: "0 0 20px",
        fontFamily: FONT,
        fontSize: mayusculas ? 27 : 23,
        fontWeight: 400,
        lineHeight: 1.2,
        letterSpacing: mayusculas ? "0.08em" : "0.01em",
        textTransform: mayusculas ? "uppercase" : "none",
        color: COLOR.tinta,
      }}
    >
      {children}
    </h1>
  );
}

export function Corps({ children, color = COLOR.tinta }: { children: React.ReactNode; color?: string }) {
  return <p style={{ margin: "0 0 14px", fontFamily: FONT, fontSize: 12, lineHeight: 1.65, color }}>{children}</p>;
}

/** Lo que se lee al margen: en tinta secundaria y en cursiva. */
export function Nota({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 14px", fontFamily: FONT, fontSize: 12, lineHeight: 1.65, fontStyle: "italic", color: COLOR.secundaria }}>
      {children}
    </p>
  );
}

/**
 * El enlace, nunca el botón: subrayado en champagne. Un botón con borde en un
 * correo exige VML para Outlook y no compensa.
 */
export function Enlace({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <p style={{ margin: "6px 0 20px", fontFamily: FONT, fontSize: 12, lineHeight: 1.65 }}>
      <a
        href={href}
        style={{ color: COLOR.champagne, textDecoration: "underline", textUnderlineOffset: "4px", textDecorationThickness: "1px" }}
      >
        {children}
      </a>
    </p>
  );
}

/** Un bloque con su capital: "Ce que la maison attend", "Si elle signe". */
export function Bloque({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div style={{ margin: "32px 0 0" }}>
      <Capital>{etiqueta}</Capital>
      {children}
    </div>
  );
}

/**
 * Filas entre dos líneas: el único sitio donde una regla enmarca algo, porque
 * se lee como una tabla de cuentas.
 */
export function Filas({ filas }: { filas: [string, React.ReactNode][] }) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      {...{ bgcolor: COLOR.fondo }}
      style={{ margin: "24px 0", backgroundColor: COLOR.fondo, borderTop: `1px solid ${COLOR.filete}`, borderBottom: `1px solid ${COLOR.filete}` }}
    >
      <tbody>
        {filas.map(([etiqueta, valor], i) => (
          <tr key={i}>
            <td style={{ padding: "10px 0", fontFamily: FONT, fontSize: 12, color: COLOR.secundaria, verticalAlign: "top" }}>{etiqueta}</td>
            <td align="right" style={{ padding: "10px 0", fontFamily: FONT, fontSize: 12, color: COLOR.tinta, verticalAlign: "top" }}>
              {valor}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
