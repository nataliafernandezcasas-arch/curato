import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { enlaceIcs, firmaCalendario, firmaValida } from "./calendar-enlaces";
import { eventoDeVisita, finDeVisita } from "./calendar";

describe("los enlaces de calendario", () => {
  const antes = process.env.CALENDAR_SECRET;
  beforeEach(() => {
    process.env.CALENDAR_SECRET = "secreto-de-prueba";
  });
  afterEach(() => {
    process.env.CALENDAR_SECRET = antes;
  });

  it("la firma vale para esa visita y ese lado, y para nada más", () => {
    const f = firmaCalendario("r1", "storyteller");
    expect(firmaValida("r1", "storyteller", f)).toBe(true);
    expect(firmaValida("r2", "storyteller", f)).toBe(false);
    expect(firmaValida("r1", "maison", f)).toBe(false);
    expect(firmaValida("r1", "storyteller", "inventada")).toBe(false);
  });

  it("el enlace lleva la visita, el lado y la firma", () => {
    const url = new URL(enlaceIcs("r1", "maison"));
    expect(url.pathname).toBe("/api/calendario/ics");
    expect(url.searchParams.get("r")).toBe("r1");
    expect(url.searchParams.get("p")).toBe("maison");
    expect(firmaValida("r1", "maison", url.searchParams.get("f") ?? "")).toBe(true);
  });
});

describe("el evento de una visita", () => {
  const base = {
    maison: "Maison Marceau",
    address: "1 rue X, Paris",
    storyteller: "Léa Martin",
    handle: "lea",
    slotStart: "2026-10-22T18:00:00.000Z",
    nights: null,
    partySize: 2,
  };

  it("dura dos horas, o las noches de un hotel", () => {
    const start = new Date(base.slotStart);
    expect(finDeVisita(start, null).getTime() - start.getTime()).toBe(2 * 3600000);
    expect(finDeVisita(start, 3).getTime() - start.getTime()).toBe(3 * 86400000);
  });

  it("el storyteller apunta la casa; la casa, a quién recibe y cuántos", () => {
    expect(eventoDeVisita({ ...base, lado: "storyteller" }).title).toBe("Curato · Maison Marceau");
    const casa = eventoDeVisita({ ...base, lado: "maison" });
    expect(casa.title).toBe("Curato · Léa Martin (2 personnes)");
    expect(casa.description).toContain("@lea");
  });
});
