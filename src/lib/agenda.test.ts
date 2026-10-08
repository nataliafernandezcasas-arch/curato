import { describe, expect, it } from "vitest";
import { agendaDe, estanciaImposible, sumarDias, HOTEL } from "./agenda";

describe("el tipo de agenda", () => {
  it("sin guardar nada, un hotel va por fechas y el resto por horas", () => {
    expect(agendaDe(null, HOTEL).modo).toBe("dates");
    expect(agendaDe(null, "otra").modo).toBe("horaires");
  });

  it("lo que eligió la casa manda sobre su categoría", () => {
    expect(agendaDe({ modo: "horaires" }, HOTEL).modo).toBe("horaires");
  });

  it("el máximo de noches nunca queda por debajo del mínimo", () => {
    const a = agendaDe({ modo: "dates", minNoches: 4, maxNoches: 2 }, HOTEL);
    expect(a.minNoches).toBe(4);
    expect(a.maxNoches).toBe(4);
  });
});

describe("una estancia de hotel", () => {
  // Llegadas de domingo (0) a jueves (4), de una a tres noches.
  const agenda = agendaDe({ modo: "dates", llegadas: [0, 1, 2, 3, 4], minNoches: 1, maxNoches: 3 }, HOTEL);

  it("se puede llegar un martes", () => {
    expect(estanciaImposible("2026-10-20", 2, agenda, [])).toBeNull();
  });

  it("no un sábado, si el hotel no recibe llegadas ese día", () => {
    expect(estanciaImposible("2026-10-24", 1, agenda, [])).toBe("dia");
  });

  it("ni más noches de las que ofrece", () => {
    expect(estanciaImposible("2026-10-20", 4, agenda, [])).toBe("noches");
  });

  it("una noche cerrada en medio de la estancia la hace imposible, no solo la de llegada", () => {
    expect(estanciaImposible("2026-10-20", 3, agenda, [{ date: "2026-10-21" }])).toBe("cerrada");
    // El día de salida no es una noche: puede estar cerrado.
    expect(estanciaImposible("2026-10-20", 2, agenda, [{ date: "2026-10-22" }])).toBeNull();
  });

  it("sumar días cruza meses y el cambio de hora sin desfasarse", () => {
    expect(sumarDias("2026-10-31", 1)).toBe("2026-11-01");
    expect(sumarDias("2026-10-24", 2)).toBe("2026-10-26");
  });
});
