import { describe, expect, it, vi } from "vitest";
import { esperaEscucha } from "./bridge";

/**
 * Las dos formas en que Capacitor devuelve un alta de escucha.
 *
 * Esto existe por un fallo que dejó la app en blanco: el puente nativo de iOS
 * devuelve el manejador tal cual, no una promesa, y un `.then` encima lanzaba
 * dentro del primer efecto de la cáscara. La app entera se caía con "This page
 * couldn't load" en todas las pantallas, mientras la web iba bien.
 */
describe("esperar un alta de escucha", () => {
  it("acepta el manejador tal cual, que es lo que da iOS", async () => {
    const remove = vi.fn();
    const escucha = await esperaEscucha({ remove });
    escucha?.remove();
    expect(remove).toHaveBeenCalledOnce();
  });

  it("acepta una promesa, que es lo que dan los paquetes de JavaScript", async () => {
    const remove = vi.fn();
    const escucha = await esperaEscucha(Promise.resolve({ remove }));
    expect(escucha?.remove).toBe(remove);
  });

  it("un plugin que no está no rompe nada", async () => {
    expect(await esperaEscucha(undefined)).toBeNull();
    expect(await esperaEscucha(null)).toBeNull();
  });

  it("un alta que falla tampoco: se pierde la escucha, no la pantalla", async () => {
    expect(await esperaEscucha(Promise.reject(new Error("sin plugin")))).toBeNull();
    // Algo que dice ser un manejador pero no sabe soltarse.
    expect(await esperaEscucha({} as never)).toBeNull();
  });
});
