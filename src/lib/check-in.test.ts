import { describe, expect, it } from "vitest";
import {
  codigoDelQR,
  contenidoDelQR,
  esCodigoDeVisita,
  mostrarCodigo,
  normalizarCodigo,
  nuevoCodigoDeVisita,
  visitaDeHoy,
  type ReservaParaVisita,
} from "./check-in";

describe("el código de la visita", () => {
  it("son seis signos sin los que se confunden", () => {
    for (let i = 0; i < 200; i++) {
      const codigo = nuevoCodigoDeVisita();
      expect(esCodigoDeVisita(codigo)).toBe(true);
      expect(codigo).not.toMatch(/[O0I1]/);
    }
    expect(nuevoCodigoDeVisita(() => 0)).toBe("AAAAAA");
    expect(nuevoCodigoDeVisita(() => 0.999)).toBe("999999");
  });

  it("acepta el código escrito de cualquier manera", () => {
    expect(normalizarCodigo("k7m 4qx")).toBe("K7M4QX");
    expect(normalizarCodigo(" K7M-4QX ")).toBe("K7M4QX");
    expect(esCodigoDeVisita(normalizarCodigo("k7m4qx"))).toBe(true);
    expect(esCodigoDeVisita("K7M4Q")).toBe(false);
    // Con O o 1 no es un código nuestro: nunca se generan.
    expect(esCodigoDeVisita("K7M4Q1")).toBe(false);
  });

  it("se enseña partido en dos", () => {
    expect(mostrarCodigo("K7M4QX")).toBe("K7M 4QX");
    expect(mostrarCodigo("raro")).toBe("raro");
  });

  it("el QR lleva el código y el Scanner lo vuelve a sacar", () => {
    expect(codigoDelQR(contenidoDelQR("K7M4QX"))).toBe("K7M4QX");
    // Tecleado a mano, sin prefijo, también vale.
    expect(codigoDelQR("k7m 4qx")).toBe("K7M4QX");
    // Un QR que no es de Curato no se confunde con un código.
    expect(codigoDelQR("https://example.com")).toBeNull();
    expect(codigoDelQR("CURATO-VISITE:XX")).toBeNull();
  });
});

describe("la visita de hoy", () => {
  const ahora = new Date("2026-10-22T18:00:00.000Z"); // jueves 22, 20:00 en París
  const r = (p: Partial<ReservaParaVisita>): ReservaParaVisita => ({
    id: "r",
    slot_start: "2026-10-22T17:30:00.000Z",
    slot_end: null,
    status: "confirmed",
    visited_at: null,
    ...p,
  });

  it("encuentra la reserva confirmada de hoy", () => {
    expect(visitaDeHoy([r({ id: "hoy" })], ahora)?.id).toBe("hoy");
  });

  it("no vale una reserva de ayer ni una pendiente o rechazada", () => {
    expect(visitaDeHoy([r({ slot_start: "2026-10-21T17:30:00.000Z" })], ahora)).toBeNull();
    expect(visitaDeHoy([r({ status: "pending_review" })], ahora)).toBeNull();
    expect(visitaDeHoy([r({ status: "declined" })], ahora)).toBeNull();
  });

  it("usa el día de París: las 00:30 del viernes en París aún no son jueves", () => {
    const viernesTemprano = new Date("2026-10-22T22:30:00.000Z"); // viernes 23, 00:30 en París
    expect(visitaDeHoy([r({})], viernesTemprano)).toBeNull();
  });

  it("un hotel vale desde la llegada hasta la salida", () => {
    const estancia = r({ id: "hotel", slot_start: "2026-10-20T13:00:00.000Z", slot_end: "2026-10-23T13:00:00.000Z" });
    expect(visitaDeHoy([estancia], ahora)?.id).toBe("hotel");
  });

  it("si ya estaba terminada, la encuentra para decir que estaba registrada", () => {
    const hecha = r({ id: "hecha", status: "completed", visited_at: "2026-10-22T17:40:00.000Z" });
    expect(visitaDeHoy([hecha], ahora)?.visited_at).toBe("2026-10-22T17:40:00.000Z");
  });

  it("entre dos del mismo día, prefiere la que aún no está registrada", () => {
    const registrada = r({ id: "a", visited_at: "2026-10-22T12:00:00.000Z", slot_start: "2026-10-22T11:00:00.000Z" });
    const pendiente = r({ id: "b", slot_start: "2026-10-22T17:30:00.000Z" });
    expect(visitaDeHoy([registrada, pendiente], ahora)?.id).toBe("b");
  });
});
