import { createSign } from "node:crypto";
import http2 from "node:http2";

/**
 * El emisor de avisos a los iPhone (APNs).
 *
 * Apple no acepta una clave de API en una cabecera: pide un JWT firmado con
 * curva elíptica P-256 con la clave .p8 que se descarga una sola vez del portal
 * de desarrolladores. El mismo JWT sirve una hora y no se puede renovar más de
 * una vez cada veinte minutos, así que se guarda en memoria.
 *
 * El diálogo es HTTP/2 puro, sin biblioteca: son cuarenta líneas y una
 * dependencia menos que mantener al día con las claves de una empresa.
 *
 * Sin claves configuradas, esto no hace nada y lo dice una vez. Así la app
 * funciona igual en local y en una rama de vista previa, donde nadie ha
 * instalado la app nativa.
 *
 * Apple tiene dos canales, y un aparato pertenece a uno solo. Xcode decide cuál
 * según cómo firme: una app instalada por cable desde Xcode queda en el canal de
 * pruebas, y la que baja de TestFlight o de la App Store, en el de verdad. Aquí
 * se prueba primero el de verdad y, si Apple dice que ese aparato no es de los
 * suyos, se reintenta en el de pruebas. Sin eso, un teléfono con la app puesta a
 * mano no recibiría nada y su token se daría por muerto.
 */

const PRODUCCION = "https://api.push.apple.com";
const PRUEBAS = "https://api.sandbox.push.apple.com";

// Se lee en cada envío y no al cargar el módulo: así una clave añadida en
// Vercel entra en la siguiente petición, sin esperar a un despliegue.
function claves() {
  return {
    host: process.env.APNS_HOST || PRODUCCION,
    bundleId: process.env.APNS_BUNDLE_ID || "com.curatocollective.app",
    teamId: process.env.APNS_TEAM_ID || "P76GMA4YCZ",
    keyId: process.env.APNS_KEY_ID || "",
    // En Vercel el salto de línea de la clave viaja escapado.
    key: (process.env.APNS_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  };
}

/** Un aviso, tal como lo lee quien mira la pantalla apagada. */
export type Aviso = {
  /** La cosa que pasó. Nunca "Vous avez une nouvelle notification". */
  titulo: string;
  cuerpo: string;
  /** La pantalla que abre al tocarlo. Ahí muere: no hay bandeja. */
  ruta: string;
  /** Dos avisos con la misma marca se sustituyen en vez de acumularse. */
  agrupar?: string;
  /**
   * La cifra del icono de la app. Sin título, el aviso solo cambia esa cifra:
   * no suena ni aparece en la pantalla.
   */
  insignia?: number;
};

export function apnsConfigurado(): boolean {
  const { keyId, key } = claves();
  return Boolean(keyId && key);
}

const base64url = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");

let enMemoria: { jwt: string; nacido: number } | null = null;

/** El JWT que firma cada envío. Exportado para poder probar la firma. */
export function jwtDeApns(): string {
  // Cuarenta minutos: dentro de la hora que Apple acepta y lejos de los veinte
  // que impone entre renovaciones.
  if (enMemoria && Date.now() - enMemoria.nacido < 40 * 60 * 1000) return enMemoria.jwt;

  const { keyId, teamId, key } = claves();
  const cabeza = base64url({ alg: "ES256", kid: keyId });
  const cuerpo = base64url({ iss: teamId, iat: Math.floor(Date.now() / 1000) });
  const firma = createSign("SHA256")
    .update(`${cabeza}.${cuerpo}`)
    // Apple quiere la firma en crudo (r|s), no el DER que Node da por defecto.
    .sign({ key, dsaEncoding: "ieee-p1363" })
    .toString("base64url");

  const jwt = `${cabeza}.${cuerpo}.${firma}`;
  enMemoria = { jwt, nacido: Date.now() };
  return jwt;
}

let avisadoSinClaves = false;

/**
 * Manda un aviso a una lista de aparatos y devuelve los que Apple da por
 * muertos, para que quien llama los borre. Nunca lanza: un aviso perdido no
 * puede tumbar una reserva.
 */
export async function enviarAPNs(tokens: string[], aviso: Aviso): Promise<string[]> {
  if (!tokens.length) return [];
  if (!apnsConfigurado()) {
    if (!avisadoSinClaves) {
      console.info("[curato] APNs sin configurar: no se envían avisos al teléfono.");
      avisadoSinClaves = true;
    }
    return [];
  }

  let jwt: string;
  try {
    jwt = jwtDeApns();
  } catch (err) {
    console.error("[curato] la clave de APNs no se pudo firmar:", err);
    return [];
  }

  const cuerpo = JSON.stringify({
    aps: {
      ...(aviso.titulo ? { alert: { title: aviso.titulo, body: aviso.cuerpo }, sound: "default" } : {}),
      ...(aviso.insignia !== undefined ? { badge: aviso.insignia } : {}),
    },
    ruta: aviso.ruta,
  });

  const { host } = claves();
  const conTitulo = Boolean(aviso.titulo);
  const desconocidos = await tanda(host, tokens, jwt, cuerpo, aviso.agrupar, conTitulo);
  if (!desconocidos.length || host !== PRODUCCION) return desconocidos;

  // Los que el canal de verdad no reconoce pueden ser de una app instalada por
  // cable. Se vuelven a probar en el de pruebas, y solo mueren si tampoco allí.
  return tanda(PRUEBAS, desconocidos, jwt, cuerpo, aviso.agrupar, conTitulo);
}

/** Una vuelta contra un canal. Devuelve los aparatos que ese canal no conoce. */
async function tanda(
  host: string,
  tokens: string[],
  jwt: string,
  cuerpo: string,
  agrupar?: string,
  titulo = true
): Promise<string[]> {
  const { bundleId } = claves();
  const sesion = http2.connect(host);
  sesion.on("error", (err) => console.error("[curato] APNs no responde:", err.message));
  const muertos: string[] = [];

  try {
    await Promise.all(
      tokens.map(
        (token) =>
          new Promise<void>((listo) => {
            let estado = 0;
            let respuesta = "";
            const peticion = sesion.request({
              ":method": "POST",
              ":path": `/3/device/${token}`,
              authorization: `bearer ${jwt}`,
              "apns-topic": bundleId,
              "apns-push-type": "alert",
              // Solo la cifra del icono no tiene prisa: Apple pide prioridad 5.
              "apns-priority": titulo ? "10" : "5",
              "content-type": "application/json",
              "content-length": Buffer.byteLength(cuerpo),
              ...(agrupar ? { "apns-collapse-id": agrupar.slice(0, 64) } : {}),
            });
            peticion.setEncoding("utf8");
            peticion.setTimeout(8000, () => peticion.close());
            peticion.on("response", (cabeceras) => {
              estado = Number(cabeceras[":status"]) || 0;
            });
            peticion.on("data", (trozo) => (respuesta += trozo));
            peticion.on("error", (err) => {
              console.error("[curato] aviso no enviado:", err.message);
              listo();
            });
            peticion.on("close", () => {
              // 410 es un aparato que ya no tiene la app. BadDeviceToken es un
              // aparato que este canal no conoce, que puede ser del otro.
              if (estado === 410 || (estado === 400 && respuesta.includes("BadDeviceToken"))) {
                muertos.push(token);
              } else if (estado && estado !== 200) {
                console.error(`[curato] APNs ${estado} (${host}):`, respuesta);
              }
              listo();
            });
            peticion.end(cuerpo);
          })
      )
    );
  } finally {
    sesion.close();
  }

  return muertos;
}
