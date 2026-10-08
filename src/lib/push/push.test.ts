import { describe, expect, it, beforeAll } from "vitest";
import { generateKeyPairSync, verify } from "node:crypto";
import { AVISOS } from "./avisos";

/**
 * La firma de Apple y el texto de los seis avisos.
 *
 * La firma es lo único de este rincón que no se puede comprobar mirando: si el
 * JWT sale mal, APNs contesta 403 y no dice más. Aquí se firma con una clave de
 * mentira, de la misma curva que la de Apple, y se verifica el resultado.
 */

let jwtDeApns: () => string;
let publica: string;

beforeAll(async () => {
  const par = generateKeyPairSync("ec", { namedCurve: "P-256" });
  publica = par.publicKey.export({ type: "spki", format: "pem" }).toString();
  process.env.APNS_KEY_ID = "ABCD123456";
  process.env.APNS_TEAM_ID = "P76GMA4YCZ";
  process.env.APNS_PRIVATE_KEY = par.privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString()
    // Como llega desde Vercel: con los saltos de línea escapados.
    .replace(/\n/g, "\\n");
  ({ jwtDeApns } = await import("./apns"));
});

const lee = (parte: string) => JSON.parse(Buffer.from(parte, "base64url").toString());

describe("el JWT de APNs", () => {
  it("va firmado en ES256 con la clave y el equipo", () => {
    const [cabeza, cuerpo, firma] = jwtDeApns().split(".");
    expect(lee(cabeza)).toEqual({ alg: "ES256", kid: "ABCD123456" });
    expect(lee(cuerpo).iss).toBe("P76GMA4YCZ");
    expect(lee(cuerpo).iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
    // La firma en crudo (r|s) que pide Apple, no el DER de Node.
    expect(Buffer.from(firma, "base64url")).toHaveLength(64);
    const valida = verify(
      "SHA256",
      Buffer.from(`${cabeza}.${cuerpo}`),
      { key: publica, dsaEncoding: "ieee-p1363" },
      Buffer.from(firma, "base64url")
    );
    expect(valida).toBe(true);
  });

  it("no se vuelve a firmar en cada envío: Apple no lo admite más de una vez cada veinte minutos", () => {
    expect(jwtDeApns()).toBe(jwtDeApns());
  });
});

describe("la cifra del icono", () => {
  it("la nueva demanda lleva cuántas esperan respuesta", () => {
    expect(AVISOS.nuevaDemanda("Tereza Kovač", "jeudi", "r4", 3).insignia).toBe(3);
  });

  it("la puesta al día no tiene texto: solo cambia el número, sin sonar", () => {
    const aviso = AVISOS.insignia(0);
    expect(aviso.titulo).toBe("");
    expect(aviso.insignia).toBe(0);
  });
});

describe("los seis avisos", () => {
  const todos = [
    AVISOS.visitaConfirmada("Maison Marceau", "jeudi 22 octobre à 19:30", "r1"),
    AVISOS.visitaRechazada("Maison Lauriston", "le jeudi 22 octobre", "r2"),
    AVISOS.seisHoras("Maison Marceau", 6, "r3"),
    AVISOS.nuevaDemanda("Tereza Kovač", "jeudi 22 octobre à 19:30", "r4", 2),
    AVISOS.derechosSieteDias("Tereza Kovač", "mercredi 21 janvier", "r5"),
    AVISOS.derechosFin("Tereza Kovač", "r5"),
  ];

  it("dicen la cosa, no la app", () => {
    for (const aviso of todos) {
      expect(aviso.titulo).not.toMatch(/notification|Curato/i);
      expect(aviso.cuerpo).not.toMatch(/notification/i);
      // Lo que cabe en una pantalla apagada sin quedar cortado a la mitad.
      expect(aviso.titulo.length).toBeLessThanOrEqual(40);
      expect(aviso.cuerpo.length).toBeLessThanOrEqual(120);
    }
  });

  it("cada uno abre una pantalla de dentro, y solo de dentro", () => {
    for (const aviso of todos) {
      expect(aviso.ruta.startsWith("/dashboard/")).toBe(true);
      expect(aviso.agrupar!.length).toBeLessThanOrEqual(64);
    }
  });

  it("el aviso confirmado dice dónde y cuándo; el rechazo, lo que no se ha perdido", () => {
    expect(todos[0].cuerpo).toBe("Maison Marceau vous attend jeudi 22 octobre à 19:30.");
    expect(todos[1].cuerpo).toContain("Votre crédit est intact");
    expect(todos[2].titulo).toBe("Il vous reste six heures");
  });

  it("el fin de la exclusividad informa y no pide borrar", () => {
    expect(todos[4].cuerpo).toContain("mercredi 21 janvier");
    for (const aviso of todos.slice(4)) {
      expect(aviso.cuerpo).not.toMatch(/supprim|effac/i);
      expect(aviso.ruta).toBe("/dashboard/business?section=visitors");
    }
  });
});
