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
  it("sigue al teléfono cuando la persona no ha elegido", () => {
    expect(papel({ ruta: "/dashboard/storyteller", telefonoClaro: true })).toBe("light");
    expect(papel({ ruta: "/dashboard/storyteller", telefonoClaro: false })).toBeNull();
  });

  it("lo elegido en Réglages manda sobre el teléfono", () => {
    expect(papel({ ruta: "/dashboard/storyteller/visits", guardado: "claro", telefonoClaro: false })).toBe("light");
    expect(papel({ ruta: "/dashboard/storyteller/visits", guardado: "oscuro", telefonoClaro: true })).toBeNull();
  });

  it("solo aplica en las pantallas que ya están listas", () => {
    expect(papel({ ruta: "/dashboard/business", guardado: "claro" })).toBeNull();
    expect(papel({ ruta: "/auth/sign-in", guardado: "claro" })).toBeNull();
    expect(papel({ ruta: "/dashboard/storytellers", guardado: "claro" })).toBeNull();
    expect(papel({ ruta: "/dashboard/storyteller/maison/abc/reserver", guardado: "claro" })).toBe("light");
  });

  it("en la app de iOS, solo si la versión sabe pintar su franja", () => {
    expect(papel({ ruta: "/dashboard/storyteller", guardado: "claro", ios: true })).toBeNull();
    expect(papel({ ruta: "/dashboard/storyteller", guardado: "claro", ios: true, mensajeNativo: true })).toBe("light");
  });
});
