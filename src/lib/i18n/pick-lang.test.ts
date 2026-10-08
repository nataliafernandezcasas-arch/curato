import { describe, expect, it } from "vitest";
import { pickLang } from "./pick-lang";

describe("pickLang", () => {
  it("devuelve el idioma pedido cuando existe", () => {
    expect(pickLang({ fr: "Bonjour", en: "Hello", es: "Hola" }, "es")).toBe("Hola");
    expect(pickLang({ fr: "Bonjour", en: "Hello", es: "Hola" }, "en")).toBe("Hello");
  });

  it("cae al francés antes que al inglés o al español", () => {
    expect(pickLang({ fr: "Bonjour", en: "Hello", es: "Hola" }, "fr")).toBe("Bonjour");
    expect(pickLang({ fr: "Bonjour", en: null, es: "Hola" }, "en")).toBe("Bonjour");
    expect(pickLang({ fr: "Bonjour", es: null }, "es")).toBe("Bonjour");
  });

  it("sin francés, prueba el inglés y luego el español", () => {
    expect(pickLang({ fr: null, en: "Hello", es: "Hola" }, "fr")).toBe("Hello");
    expect(pickLang({ fr: "", en: "  ", es: "Hola" }, "en")).toBe("Hola");
  });

  it("sin ningún texto, devuelve una cadena vacía", () => {
    expect(pickLang({}, "fr")).toBe("");
  });
});
