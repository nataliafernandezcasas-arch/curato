import { describe, expect, it } from "vitest";
import { SCRIPT_TEMA } from "./tema";

/**
 * El script que decide el papel antes de la primera pintura. No se puede
 * probar abriendo la app sin una sesión, así que se corre aquí con un
 * navegador de mentira: lo que guardó la persona, lo que hace su teléfono, la
 * ruta y si está dentro de la app de iOS.
 */
function papel({
  ruta,
  guardado = null,
  telefonoClaro = false,
  ios = false,
  mensajeNativo = false,
}: {
  ruta: string;
  guardado?: string | null;
  telefonoClaro?: boolean;
  ios?: boolean;
  mensajeNativo?: boolean;
}): string | null {
  const atributos: Record<string, string> = {};
  const localStorage = { getItem: (clave: string) => (clave === "curato-tema" ? guardado : null) };
  const location = { pathname: ruta };
  const document = { documentElement: { setAttribute: (k: string, v: string) => (atributos[k] = v) } };
  const window = {
    matchMedia: () => ({ matches: telefonoClaro }),
    Capacitor: ios ? { getPlatform: () => "ios" } : undefined,
    webkit: mensajeNativo ? { messageHandlers: { curatoTema: {} } } : undefined,
  };
  new Function("window", "localStorage", "location", "document", SCRIPT_TEMA)(window, localStorage, location, document);
  return atributos["data-theme"] ?? null;
}

describe("el papel antes de pintar", () => {
  // El modo claro de la entrega 5 queda retirado y el de la entrega 7 todavía
  // no existe, así que RUTAS_CLARAS no casa con nada y el script no debe poner
  // el atributo en ninguna pantalla, elija lo que elija la persona. Cuando la
  // piel nueva llegue, estos casos vuelven a esperar "light" en su lista.
  const rutas = [
    "/dashboard/storyteller",
    "/dashboard/storyteller/visits",
    "/dashboard/storyteller/maison/abc/reserver",
    "/dashboard/business",
    "/dashboard/business/reglages",
    "/dashboard/business/qr",
    "/dashboard/recruiter",
    "/auth/sign-in",
  ];

  it("hoy no enciende el claro en ninguna pantalla", () => {
    for (const ruta of rutas) {
      expect(papel({ ruta, guardado: "claro", telefonoClaro: true })).toBeNull();
      expect(papel({ ruta, telefonoClaro: true })).toBeNull();
      expect(papel({ ruta, guardado: "oscuro" })).toBeNull();
    }
  });

  it("la fontanería sigue entera: ni el teléfono ni la app de iOS lo encienden", () => {
    expect(papel({ ruta: "/dashboard/storyteller", guardado: "claro", ios: true })).toBeNull();
    expect(papel({ ruta: "/dashboard/storyteller", guardado: "claro", ios: true, mensajeNativo: true })).toBeNull();
  });
});
